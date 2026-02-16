<!-- src/components/dependencias/DependenciaFormDialog.vue -->
<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <q-card style="width: 700px; max-width: 80vw">
      <q-card-section>
        <div class="text-h6">
          {{ isEditing ? "Editar Dependencia" : "Nueva Dependencia" }}
        </div>
      </q-card-section>

      <q-form @submit.prevent="handleSave" class="q-gutter-md">
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-select
                dense
                v-model="formData.id_categoria"
                :options="categoriaOptions"
                option-value="id_categoria"
                option-label="nombre"
                label="Categoría"
                emit-value
                map-options
                :rules="validationRules.id_categoria"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                dense
                v-model="formData.nombre_dependencia"
                label="Nombre Dependencia"
                :rules="validationRules.nombre_dependencia"
                counter
                maxlength="100"
                hint="Solo letras, números, espacios y guiones"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                dense
                v-model="formData.codigo"
                label="Código"
                :rules="validationRules.codigo"
                counter
                maxlength="20"
                hint="Mayúsculas, números y guiones (opcional)"
                @update:model-value="
                  (val) => (formData.codigo = val?.toUpperCase())
                "
              />
            </div>
            <div class="col-12 col-md-6">
              <q-select
                dense
                v-model="formData.tipo_venta"
                :options="['INSTITUCIONAL', 'VENTA', 'AMBOS']"
                label="Tipo de Solicitud"
                :rules="validationRules.tipo_venta"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-select
                dense
                v-model="formData.tipo_acceso_menu"
                :options="['ESTANDAR', 'SEGURIDAD', 'ALMACEN', 'OPERACIONES']"
                label="Tipo de Acceso Menú"
                hint="Define qué módulos ve esta dependencia"
              />
            </div>
            <div class="col-12 col-md-6" v-if="isEditing">
              <q-select
                dense
                v-model="formData.estatus"
                :options="['ACTIVO', 'INACTIVO']"
                label="Estatus"
              />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn flat label="Guardar" type="submit" color="primary" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue";
import { useQuasar } from "quasar";
import { useCategoriaStore } from "../../stores/categoriaStore.js";
import { storeToRefs } from "pinia";
import socket from "../../services/socket.js";
import { useDependenciaForm } from "./composables/useDependenciaForm.js";

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
  isEditing: Boolean,
});

const emit = defineEmits(["update:modelValue", "save", "dataUpdated"]);
const $q = useQuasar();

// Store de categorías para el select
const categoriaStore = useCategoriaStore();
const { rows: categoriaOptions } = storeToRefs(categoriaStore);

// Composable del formulario
const { formData, validationRules, handleSave } = useDependenciaForm(
  props,
  emit,
);

// Cargar categorías al montar
onMounted(() => {
  categoriaStore.fetchCategorias();

  // Listeners de Socket.io para sincronización en tiempo real
  socket.on("dependencia:creado", (data) => {
    emit("dataUpdated", data);
  });

  socket.on("dependencia:actualizado", (data) => {
    // Notificación de edición concurrente
    if (
      props.isEditing &&
      props.initialData?.id_dependencia === data.id_dependencia
    ) {
      $q.notify({
        type: "warning",
        message: "⚠️ Esta dependencia fue actualizada por otro usuario",
        icon: "warning",
        position: "top",
        timeout: 4000,
        actions: [
          {
            label: "Recargar",
            color: "white",
            handler: () => {
              emit("dataUpdated", data);
            },
          },
        ],
      });
    }
    emit("dataUpdated", data);
  });
});

onUnmounted(() => {
  socket.off("dependencia:creado");
  socket.off("dependencia:actualizado");
});
</script>

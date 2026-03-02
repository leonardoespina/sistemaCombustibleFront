<!-- src/components/categoria/CategoriaFormDialog.vue -->
<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <q-card style="width: 700px; max-width: 80vw">
      <q-card-section>
        <div class="text-h6">
          {{ isEditing ? "Editar Categoría" : "Nueva Categoría" }}
        </div>
      </q-card-section>

      <q-form @submit.prevent="handleSave" class="q-gutter-md">
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-input
                dense
                v-model="formData.nombre"
                label="Nombre de la Categoría"
                :rules="validationRules.nombre"
                counter
                maxlength="50"
                hint="Solo letras, números, espacios y guiones"
              />
            </div>
            <div class="col-12" v-if="isEditing">
              <q-select
                dense
                v-model="formData.estado"
                :options="['ACTIVO', 'INACTIVO']"
                label="Estado"
                :rules="validationRules.estado"
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
import socket from "../../services/socket.js";
import { useCategoriaForm } from "./composables/useCategoriaForm.js";

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
  isEditing: Boolean,
});

const emit = defineEmits(["update:modelValue", "save", "dataUpdated"]);
const $q = useQuasar();

// Composable del formulario
const { formData, validationRules, handleSave } = useCategoriaForm(
  props,
  emit
);

// Listeners de Socket.io para sincronización en tiempo real
onMounted(() => {
  socket.on("categoria:creado", (data) => {
    emit("dataUpdated", data);
    // Notificación solo si NO es el usuario actual quien creó
    // (el store ya notifica al creador)
  });

  socket.on("categoria:actualizado", (data) => {
    // Notificación de edición concurrente
    if (
      props.isEditing &&
      props.initialData?.id_categoria === data.id_categoria
    ) {
      $q.notify({
        type: "warning",
        message: "⚠️ Esta categoría fue actualizada por otro usuario",
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
  socket.off("categoria:creado");
  socket.off("categoria:actualizado");
});
</script>

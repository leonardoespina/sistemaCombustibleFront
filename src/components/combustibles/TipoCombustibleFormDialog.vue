<!-- src/components/combustibles/TipoCombustibleFormDialog.vue -->
<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <q-card style="width: 600px; max-width: 80vw">
      <q-card-section>
        <div class="text-h6">
          {{ isEditing ? "Editar Tipo de Combustible" : "Nuevo Tipo de Combustible" }}
        </div>
      </q-card-section>

      <q-form @submit.prevent="handleSave" class="q-gutter-md">
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-input
                dense
                v-model="formData.nombre"
                label="Nombre del Tipo de Combustible"
                :rules="validationRules.nombre"
                counter
                maxlength="100"
                hint="Solo letras, números, espacios y guiones"
              />
            </div>
            <div class="col-12">
              <q-input
                dense
                v-model="formData.descripcion"
                label="Descripción (opcional)"
                type="textarea"
                rows="3"
                :rules="validationRules.descripcion"
                counter
                maxlength="500"
                hint="Descripción detallada del tipo de combustible"
              />
            </div>
            <div class="col-12" v-if="isEditing">
              <q-toggle
                v-model="formData.activo"
                label="Activo"
                color="positive"
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
import { useTipoCombustibleStore } from "../../stores/tipoCombustibleStore.js";
import { useTipoCombustibleForm } from "./composables/useTipoCombustibleForm.js";

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
  isEditing: Boolean,
});

const emit = defineEmits(["update:modelValue", "dataUpdated"]);
const $q = useQuasar();
const store = useTipoCombustibleStore();

// Composable del formulario
const { formData, validationRules, handleSave } = useTipoCombustibleForm(
  props,
  emit,
  store
);

// Listeners de Socket.io para sincronización en tiempo real
onMounted(() => {
  socket.on("tipo_combustible:creado", (data) => {
    emit("dataUpdated", data);
  });

  socket.on("tipo_combustible:actualizado", (data) => {
    // Notificación de edición concurrente
    if (
      props.isEditing &&
      props.initialData?.id_tipo_combustible === data.id_tipo_combustible
    ) {
      $q.notify({
        type: "warning",
        message: "⚠️ Este tipo de combustible fue actualizado por otro usuario",
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
  socket.off("tipo_combustible:creado");
  socket.off("tipo_combustible:actualizado");
});
</script>

<!-- src/components/management/ManagementFormDialog.vue -->
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

      <q-form @submit.prevent="onSave" class="q-gutter-md">
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-input
                dense
                v-model="formData.nombre"
                label="Nombre de la Categoría"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>
            <div class="col-12" v-if="isEditing">
              <q-select
                dense
                v-model="formData.estado"
                :options="['ACTIVO', 'INACTIVO']"
                label="Estado"
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
import { ref, watch, onMounted, onUnmounted } from "vue";
import socket from "../../services/socket.js";

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
  isEditing: Boolean,
});

const emit = defineEmits(["update:modelValue", "save", "dataUpdated"]);

const formData = ref({});

// Listeners de Socket.io
onMounted(() => {
  socket.on("categoria:creado", (data) => {
    emit("dataUpdated", data);
  });

  socket.on("categoria:actualizado", (data) => {
    // Si estamos editando ESTE registro, podríamos avisar al usuario
    if (props.isEditing && props.initialData?.id_categoria === data.id_categoria) {
       // Opcional: Mostrar notificación
    }
    emit("dataUpdated", data);
  });
});

onUnmounted(() => {
  socket.off("categoria:creado");
  socket.off("categoria:actualizado");
});

watch(
  () => props.modelValue,
  (isNowOpen) => {
    if (isNowOpen) {
      formData.value = {
        nombre: props.initialData?.nombre || "",
        estado: props.initialData?.estado || "ACTIVO",
      };
    }
  }
);

function onSave() {
  emit("save", formData.value);
}
</script>

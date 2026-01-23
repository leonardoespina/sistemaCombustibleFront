<!-- src/components/vehicles/BrandFormDialog.vue -->
<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">
          {{ isEditing ? "Editar Marca" : "Nueva Marca" }}
        </div>
      </q-card-section>

      <q-form @submit.prevent="onSave">
        <q-card-section class="q-gutter-md">
          <q-input
            dense
            v-model="formData.nombre"
            label="Nombre de la Marca"
            autofocus
            :rules="[(val) => !!val || 'El nombre es requerido']"
          />
          <q-select
            v-if="isEditing"
            dense
            v-model="formData.estado"
            :options="['ACTIVO', 'INACTIVO']"
            label="Estado"
          />
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
import { ref, watch } from "vue";

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
  isEditing: Boolean,
});

const emit = defineEmits(["update:modelValue", "save"]);

const formData = ref({});

watch(
  () => props.modelValue,
  (isNowOpen) => {
    if (isNowOpen) {
      // Renombramos 'nombre' a 'nombre_marca' para ser consistentes
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

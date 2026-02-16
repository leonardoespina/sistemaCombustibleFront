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

      <q-form @submit.prevent="handleSave">
        <q-card-section class="q-gutter-md">
          <q-input
            dense
            outlined
            v-model="formData.nombre"
            label="Nombre de la Marca"
            autofocus
            :rules="validationRules.nombre"
          />
          <q-select
            v-if="isEditing"
            dense
            outlined
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
import { useBrandForm } from "./composables/useBrandForm.js";

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
  isEditing: Boolean,
});

const emit = defineEmits(["update:modelValue", "save", "dataUpdated"]);

// Delegamos toda la lógica al composable dedicado
const { formData, validationRules, handleSave } = useBrandForm(props, emit);
</script>

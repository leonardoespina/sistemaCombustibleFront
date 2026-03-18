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

      <q-banner
        v-if="concurrentEditWarning"
        class="bg-warning text-white q-mx-md q-mb-sm"
        rounded
      >
        <template v-slot:avatar>
          <q-icon name="warning" />
        </template>
        ⚠️ Esta categoría fue modificada por otro usuario mientras la editabas.
      </q-banner>

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
import { useCategoriaForm } from "./composables/useCategoriaForm.js";

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
  isEditing: Boolean,
  concurrentEditWarning: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "save"]);

// Composable del formulario — única responsabilidad del componente
const { formData, validationRules, handleSave } = useCategoriaForm(
  props,
  emit
);
</script>

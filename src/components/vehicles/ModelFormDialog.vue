<!-- src/components/vehicles/ModelFormDialog.vue -->
<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">
          {{ isEditing ? "Editar Modelo" : "Nuevo Modelo" }}
        </div>
      </q-card-section>

      <q-form @submit.prevent="handleSave">
        <q-card-section class="q-gutter-md">
          <!-- === SELECT DE MARCA CON LÓGICA DE FILTRADO === -->
          <q-select
            dense
            filled
            v-model="formData.id_marca"
            use-input
            label="Marca del Vehículo"
            :options="filteredBrandOptions"
            @filter="filterBrandFn"
            :rules="validationRules.id_marca"
            option-value="id_marca"
            option-label="nombre"
            emit-value
            map-options
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey">
                  No hay resultados
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <q-input
            dense
            outlined
            v-model="formData.nombre"
            label="Nombre del Modelo"
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
import { useModelForm } from "./composables/useModelForm.js";

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
  isEditing: Boolean,
  brands: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue", "save", "dataUpdated"]);

const {
  formData,
  validationRules,
  filteredBrandOptions,
  filterBrandFn,
  handleSave,
} = useModelForm(props, emit);
</script>

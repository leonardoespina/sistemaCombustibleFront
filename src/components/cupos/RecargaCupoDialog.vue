<!-- src/components/cupos/RecargaCupoDialog.vue -->
<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <q-card style="width: 500px; max-width: 80vw">
      <!-- HEADER -->
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Recarga Extra de Cupo</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <!-- INFO DEL CUPO -->
      <q-card-section class="q-pt-sm">
        <div class="text-subtitle2 text-primary" v-if="cupo">
          {{ cupo.CupoBase?.Categoria?.nombre }} -
          {{ cupo.CupoBase?.Dependencia?.nombre_dependencia }}
        </div>
        <div class="text-caption text-grey" v-if="cupo">
          Saldo Actual: <strong>{{ cupo.cantidad_disponible }} L</strong>
        </div>
      </q-card-section>

      <!-- FORMULARIO -->
      <q-form @submit.prevent="handleSave">
        <q-card-section class="q-gutter-md">
          <!-- Cantidad a Recargar -->
          <q-input
            dense
            v-model.number="formData.cantidad"
            type="number"
            label="Cantidad a Recargar (Litros)"
            suffix="L"
            autofocus
            :rules="validationRules.cantidad"
            hint="Litros adicionales que se agregarán al cupo actual"
            counter
          />

          <!-- Motivo de la Recarga -->
          <q-input
            dense
            v-model="formData.motivo"
            type="textarea"
            label="Motivo de la Recarga"
            rows="3"
            :rules="validationRules.motivo"
            hint="Justificación detallada de por qué se requiere la recarga extra"
            counter
            maxlength="500"
          />
        </q-card-section>

        <!-- ACCIONES -->
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            flat
            label="Confirmar Recarga"
            type="submit"
            color="primary"
            :loading="loading"
            icon="add_card"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
// ============================================
// IMPORTS
// ============================================
import { useCupoStore } from "../../stores/cupoStore";
import { useRecargaCupoForm } from "./composables/useRecargaCupoForm.js";

// ============================================
// PROPS & EMITS
// ============================================
const props = defineProps({
  modelValue: Boolean,
  cupo: Object, // El registro de CupoActual con toda la info anidada
  loading: Boolean,
});

const emit = defineEmits(["update:modelValue"]);

// ============================================
// COMPOSABLES & STORES
// ============================================
const cupoStore = useCupoStore();

// Composable del formulario de recarga (maneja estado, validaciones, y guardado)
const { formData, validationRules, handleSave } = useRecargaCupoForm(
  props,
  emit,
  cupoStore
);
</script>


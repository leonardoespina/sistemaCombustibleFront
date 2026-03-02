<template>
  <q-dialog v-model="visible" persistent>
    <q-card style="min-width: 400px">
      <q-card-section class="row items-center">
        <div class="text-h6">
          {{ isEdit ? "Editar Llenadero" : "Nuevo Llenadero" }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit="handleSave" class="q-gutter-md">
          <q-input
            v-model="formData.nombre_llenadero"
            label="Nombre del Llenadero / Operario *"
            outlined
            dense
            :rules="validationRules.nombre_llenadero"
          />

          <q-input
            v-model="formData.capacidad"
            label="Capacidad (litros)"
            outlined
            dense
            type="number"
            step="0.01"
            min="0"
            :rules="validationRules.capacidad"
          />

          <q-input
            v-model="formData.disponibilidadActual"
            label="Disponibilidad Actual (litros)"
            outlined
            dense
            type="number"
            step="0.01"
            min="0"
            :rules="validationRules.disponibilidadActual"
          />

          <q-select
            v-model="formData.id_combustible"
            :options="tipoCombustibleOptions"
            option-label="nombre"
            option-value="id_tipo_combustible"
            label="Tipo de Combustible"
            outlined
            dense
            emit-value
            map-options
            :loading="loadingTipoCombustible"
          />

          <q-toggle
            v-if="isEdit"
            v-model="formData.estado"
            label="Activo"
            true-value="ACTIVO"
            false-value="INACTIVO"
            dense
          />

          <div class="row justify-end q-mt-md">
            <q-btn
              label="Cancelar"
              color="negative"
              flat
              v-close-popup
              class="q-mr-sm"
            />
            <q-btn
              :label="isEdit ? 'Actualizar' : 'Guardar'"
              type="submit"
              color="primary"
              :loading="loading"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from "vue";
import { useLlenaderoForm } from "./composables/useLlenaderoForm";

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
});

const emit = defineEmits(["update:modelValue"]);

// ============================================
// COMPOSABLE
// ============================================

const {
  formData,
  loading,
  loadingTipoCombustible,
  isEdit,
  tipoCombustibleOptions,
  validationRules,
  handleSave,
} = useLlenaderoForm(props, emit);

// ============================================
// COMPUTED
// ============================================

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});
</script>

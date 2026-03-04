<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <q-card style="width: 800px; max-width: 95vw">
      <q-card-section>
        <div class="text-h6">Registrar Medición Física</div>
      </q-card-section>

      <q-form @submit.prevent="onSave">
        <q-card-section class="q-pt-none scroll" style="max-height: 70vh">
          <div class="row q-col-gutter-md">
            <!-- 1. DATOS GENERALES -->
            <div class="col-12 col-md-6">
              <q-input
                dense
                v-model="formData.fecha"
                type="date"
                label="Fecha Medición"
                :readonly="isReadOnly"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                dense
                v-model="formData.hora"
                type="time"
                label="Hora Medición"
                :readonly="isReadOnly"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-select
                dense
                filled
                v-model="formData.id_llenadero"
                :options="llenaderosList"
                option-value="id_llenadero"
                option-label="nombre_llenadero"
                label="Seleccionar Llenadero"
                emit-value
                map-options
                :readonly="isReadOnly || isEditing"
                @update:model-value="onLlenaderoSelect"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-select
                dense
                filled
                v-model="formData.id_tanque"
                :options="tanksList"
                option-value="id_tanque"
                :option-label="(opt) => `${opt.codigo} - ${opt.nombre}`"
                label="Seleccionar Tanque"
                emit-value
                map-options
                :disable="!formData.id_llenadero"
                :readonly="isReadOnly || isEditing"
                :rules="[(val) => !!val || 'Requerido']"
                @update:model-value="onTankSelect"
              />
            </div>

            <q-separator class="col-12 q-my-sm" />

            <!-- 2. MEDICIÓN Y CÁLCULOS -->
            <div class="col-12 text-subtitle2 text-primary">
              Datos de Medición
            </div>

            <!-- CAMPO CONDICIONAL: AFORO vs FORMULA vs MANUAL -->
            <div v-if="!isManualMode" class="col-12 col-md-6">
              <q-input
                dense
                filled
                v-model.number="formData.medida_vara"
                :label="
                  isFormulaMode
                    ? 'Altura de Vara (Fórmula)'
                    : 'Altura de Vara (Aforo)'
                "
                type="number"
                :suffix="currentTankDetail?.unidad_medida || 'CM'"
                :disable="!formData.id_tanque"
                :readonly="isReadOnly"
                :rules="[
                  (val) =>
                    isManualMode ||
                    (val !== null && val !== '') ||
                    'La medida de vara es requerida',
                ]"
                @update:model-value="calculate"
              />
              <div class="text-caption text-grey-7 q-pl-sm">
                {{
                  isFormulaMode ? "Volumen Calculado:" : "Volumen según Tabla:"
                }}
                <strong>{{ liters.real }} Lts</strong>
              </div>
            </div>

            <div v-else class="col-12">
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <q-input
                    dense
                    filled
                    v-model.number="formData.medida_vara"
                    label="Altura de Vara (Referencia)"
                    type="number"
                    :suffix="currentTankDetail?.unidad_medida || 'CM'"
                    :disable="!formData.id_tanque"
                    hint="Medida de referencia (opcional)"
                    @update:model-value="calculate"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <q-input
                    dense
                    filled
                    v-model.number="formData.litros_manuales_ingresados"
                    label="Litros Reales (Manual)"
                    type="number"
                    suffix="Lts"
                    :disable="!formData.id_tanque"
                    :rules="[
                      (val) =>
                        !isManualMode ||
                        (val !== null && val !== '') ||
                        'Los litros son requeridos en modo manual',
                    ]"
                    @update:model-value="calculate"
                  />
                </div>
                <div class="col-12">
                  <div class="text-caption text-grey-7">
                    El tanque no tiene tabla de aforo. Ingrese la medida de vara
                    como referencia y los litros reales medidos.
                  </div>
                </div>
              </div>
            </div>

            <!-- LÓGICA DE EVAPORACIÓN -->
            <div class="col-12 col-md-6">
              <div class="row items-center no-wrap">
                <q-input
                  class="col-grow"
                  dense
                  filled
                  v-model.number="formData.litros_evaporacion"
                  label="Merma por Evaporación"
                  type="number"
                  suffix="Lts"
                  :disable="autoEvaporacion"
                  :readonly="isReadOnly"
                  @update:model-value="calculate"
                />
                <!-- CHECKBOX AUTOMÁTICO (Solo Gasolina) -->
                <q-checkbox
                  v-if="isGasolina && !isReadOnly"
                  v-model="autoEvaporacion"
                  dense
                  label="Auto (0.25%)"
                  class="q-ml-sm"
                  @update:model-value="calculate"
                >
                  <q-tooltip
                    >Aplicar fórmula: (0.25 * Medición) / 100</q-tooltip
                  >
                </q-checkbox>
              </div>
            </div>

            <!-- 3. RESULTADOS PREVIOS -->
            <div class="col-12 q-mt-md">
              <q-card flat bordered class="bg-grey-1">
                <q-card-section class="row q-col-gutter-md text-center">
                  <!-- SISTEMA (NO EDITABLE) -->
                  <div class="col-4">
                    <div class="text-caption text-grey-8">
                      Sistema (Teórico)
                    </div>
                    <div class="text-h6">
                      {{ currentTankDetail?.nivel_actual || 0 }} L
                    </div>
                  </div>

                  <!-- REAL (EDITABLE) -->
                  <div class="col-4">
                    <div class="text-caption text-grey-8">Real (Vara)</div>

                    <!-- Modo Visualización -->
                    <div
                      v-if="!editing.real"
                      class="text-h6 text-primary text-weight-bold"
                      :class="{ 'editable-field': !isReadOnly }"
                      @click="!isReadOnly && startEdit('real')"
                    >
                      {{ liters.real }} L
                      <q-icon
                        v-if="!isReadOnly"
                        name="edit"
                        size="xs"
                        class="edit-icon q-ml-xs"
                      />
                      <q-tooltip v-if="!isReadOnly"
                        >Click para editar</q-tooltip
                      >
                    </div>

                    <!-- Modo Edición -->
                    <q-input
                      v-else
                      ref="inputReal"
                      v-model.number="liters.real"
                      type="number"
                      dense
                      borderless
                      input-class="text-center text-h6 text-primary text-weight-bold"
                      class="inline-edit-input"
                      @blur="finishEdit('real')"
                      @keyup.enter="finishEdit('real')"
                      @keyup.escape="cancelEdit('real')"
                    >
                      <template v-slot:append>
                        <span class="text-h6 text-primary">L</span>
                      </template>
                    </q-input>
                  </div>

                  <!-- DIFERENCIA (EDITABLE) -->
                  <div class="col-4">
                    <div class="text-caption text-grey-8">Diferencia Neta</div>

                    <!-- Modo Visualización -->
                    <div
                      v-if="!editing.diferencia"
                      class="text-h6"
                      :class="[
                        parseFloat(liters.diferencia) > 0
                          ? 'text-negative'
                          : 'text-positive',
                        { 'editable-field': !isReadOnly },
                      ]"
                      @click="!isReadOnly && startEdit('diferencia')"
                    >
                      {{ liters.diferencia }} L
                      <q-icon
                        v-if="!isReadOnly"
                        name="edit"
                        size="xs"
                        class="edit-icon q-ml-xs"
                      />
                      <q-tooltip v-if="!isReadOnly"
                        >Click para editar</q-tooltip
                      >
                    </div>

                    <!-- Modo Edición -->
                    <q-input
                      v-else
                      ref="inputDiferencia"
                      v-model.number="liters.diferencia"
                      type="number"
                      dense
                      borderless
                      input-class="text-center text-h6"
                      :input-style="{
                        color:
                          parseFloat(liters.diferencia) > 0
                            ? '#C10015'
                            : '#21BA45',
                      }"
                      class="inline-edit-input"
                      @blur="finishEdit('diferencia')"
                      @keyup.enter="finishEdit('diferencia')"
                      @keyup.escape="cancelEdit('diferencia')"
                    >
                      <template v-slot:append>
                        <span
                          class="text-h6"
                          :style="{
                            color:
                              parseFloat(liters.diferencia) > 0
                                ? '#C10015'
                                : '#21BA45',
                          }"
                          >L</span
                        >
                      </template>
                    </q-input>

                    <div class="text-xs text-grey-6">
                      {{
                        parseFloat(liters.diferencia) > 0
                          ? "Faltante"
                          : "Sobrante"
                      }}
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12">
              <q-input
                dense
                v-model="formData.observacion"
                type="textarea"
                label="Observaciones"
                rows="2"
                :readonly="isReadOnly"
              />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cerrar" v-close-popup />
          <q-btn
            v-if="!isReadOnly"
            :label="isEditing ? 'Guardar Cambios' : 'Registrar Medición'"
            type="submit"
            color="primary"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useMeasurementForm } from "./composables/useMeasurementForm.js";

const props = defineProps({
  modelValue: Boolean,
  llenaderosList: { type: Array, default: () => [] },
  tanksList: { type: Array, default: () => [] },
  currentTankDetail: { type: Object, default: null },
  isEditing: { type: Boolean, default: false },
  isReadOnly: { type: Boolean, default: false },
  initialData: { type: Object, default: null },
});

const emit = defineEmits([
  "update:modelValue",
  "save",
  "llenadero-changed",
  "tank-changed",
]);

const {
  formData,
  autoEvaporacion,
  editing,
  liters,
  inputReal,
  inputDiferencia,
  isGasolina,
  isFormulaMode,
  isManualMode,
  calculate,
  startEdit,
  finishEdit,
  cancelEdit,
  onLlenaderoSelect,
  onTankSelect,
  onSave,
} = useMeasurementForm(props, emit);
</script>

<style scoped>
/* Estilo para campos editables */
.editable-field {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  position: relative;
}

.editable-field:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

/* Icono de editar - oculto por defecto, visible en hover */
.edit-icon {
  opacity: 0;
  transition: opacity 0.2s ease;
  font-size: 14px;
}

.editable-field:hover .edit-icon {
  opacity: 0.6;
}

/* Input inline que mantiene el mismo estilo */
.inline-edit-input {
  max-width: 150px;
  margin: 0 auto;
}

.inline-edit-input :deep(.q-field__control) {
  height: auto;
  min-height: unset;
  padding: 4px 8px;
  background-color: rgba(25, 118, 210, 0.08);
  border-radius: 4px;
  border: 2px solid #1976d2;
}

.inline-edit-input :deep(.q-field__native) {
  padding: 0;
  min-height: unset;
}

.inline-edit-input :deep(.q-field__append) {
  padding-left: 0;
}

/* Animación suave al entrar/salir del modo edición */
.inline-edit-input {
  animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>

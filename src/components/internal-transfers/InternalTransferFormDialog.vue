<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <q-card style="width: 800px; max-width: 95vw">
      <q-card-section>
        <div class="text-h6">Registrar Transferencia Interna leo</div>
      </q-card-section>

      <q-form @submit.prevent="onSave">
        <q-card-section class="q-pt-none scroll" style="max-height: 75vh">
          <div class="row q-col-gutter-md">
            <!-- 1. DATOS GENERALES -->
            <div class="col-12 col-md-4">
              <q-input
                dense
                v-model="formData.fecha"
                type="date"
                label="Fecha"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                dense
                v-model="formData.hora"
                type="time"
                label="Hora Inicio"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-select
                dense
                filled
                use-input
                v-model="formData.id_almacenista"
                label="Almacenista"
                :options="filteredWarehousemen"
                @filter="filterWarehousemen"
                option-value="id_almacenista"
                :option-label="(opt) => `${opt.nombre} ${opt.apellido}`"
                emit-value
                map-options
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>

            <q-separator class="col-12 q-my-sm" />

            <!-- 2. TANQUES -->
            <div class="col-12 col-md-6">
              <q-select
                dense
                filled
                v-model="formData.id_tanque_origen"
                :options="tanksList"
                option-value="id_tanque"
                :option-label="
                  (opt) =>
                    `${opt.codigo} - ${opt.nombre} (${opt.tipo_combustible})`
                "
                label="Tanque Origen"
                emit-value
                map-options
                :rules="[(val) => !!val || 'Requerido']"
                @update:model-value="onSourceTankSelect"
              />
              <div
                v-if="sourceTankDetail"
                class="text-caption text-grey-8 q-ml-sm"
              >
                Nivel Actual:
                <strong>{{ sourceTankDetail.nivel_actual }} L</strong>
              </div>
            </div>

            <div class="col-12 col-md-6">
              <q-select
                dense
                filled
                v-model="formData.id_tanque_destino"
                :options="tanksList"
                option-value="id_tanque"
                :option-label="
                  (opt) =>
                    `${opt.codigo} - ${opt.nombre} (${opt.tipo_combustible})`
                "
                label="Tanque Destino"
                emit-value
                map-options
                :rules="[
                  (val) => !!val || 'Requerido',
                  (val) =>
                    val !== formData.id_tanque_origen ||
                    'Debe ser diferente al origen',
                ]"
                @update:model-value="onDestinationTankSelect"
              />
              <div
                v-if="destinationTankDetail"
                class="text-caption text-grey-8 q-ml-sm"
              >
                Nivel Actual:
                <strong>{{ destinationTankDetail.nivel_actual }} L</strong>
              </div>
            </div>

            <!-- 3. DETALLES DE TRANSFERENCIA -->
            <div class="col-12 text-subtitle2 text-primary q-mt-md">
              Detalles de la Transferencia
            </div>

            <div class="col-12 q-mb-sm">
              <q-btn-toggle
                v-model="calculationMode"
                spread
                class="my-custom-toggle"
                no-caps
                rounded
                unelevated
                toggle-color="primary"
                color="grey-3"
                text-color="primary"
                :options="[
                  {
                    label: 'Por Medición Final (Vara/Total)',
                    value: 'final',
                  },
                  { label: 'Por Cantidad a Transferir', value: 'amount' },
                ]"
                @update:model-value="onCalculationModeChange"
              />
            </div>

            <!-- MODO FINAL (VARA O MANUAL FINAL) -->
            <template v-if="calculationMode === 'final'">
              <div class="col-12 col-md-6">
                <q-input
                  dense
                  filled
                  v-model.number="formData.medida_vara_destino"
                  :label="
                    tieneAforo || isFormulaMode
                      ? 'Medida Vara Final (cm)'
                      : 'Medida Vara (Referencial)'
                  "
                  type="number"
                  :rules="[
                    (val) =>
                      !tieneAforo || val >= 0 || 'Requerido si tiene Aforo',
                  ]"
                  :disable="!formData.id_tanque_destino"
                  @update:model-value="calculateLitrosDestino"
                />
              </div>

              <div class="col-12 col-md-6">
                <div class="text-caption text-grey-7 q-pl-sm">
                  {{
                    tieneAforo || isFormulaMode
                      ? "Volumen Calculado:"
                      : "Volumen Final Manual:"
                  }}

                  <div class="text-xs text-negative" v-if="isFormulaMode">
                    DEBUG: h={{ debugInfo.h }} m, L={{ debugInfo.l }} m, R={{
                      debugInfo.r
                    }}
                    m, U={{ debugInfo.u }}
                  </div>

                  <strong
                    v-if="!editingLitros"
                    class="editable-value"
                    :class="{ 'was-edited': litersWereEdited }"
                    @click="startEdit"
                  >
                    {{ litersFinales }} L
                    <q-icon name="edit" size="xs" class="edit-icon q-ml-xs" />
                    <q-tooltip>Click para editar manualmente</q-tooltip>
                  </strong>

                  <q-input
                    v-else
                    ref="inputLitros"
                    v-model.number="litersFinales"
                    type="number"
                    dense
                    borderless
                    input-class="text-weight-bold inline-input-text"
                    class="inline-edit-small"
                    @blur="finishEdit"
                    @keyup.enter="finishEdit"
                    @keyup.escape="cancelEdit"
                  >
                    <template v-slot:append>
                      <span class="text-weight-bold">L</span>
                    </template>
                  </q-input>
                </div>
              </div>
            </template>

            <!-- MODO CANTIDAD (TRANSFERIR X LITROS) -->
            <template v-if="calculationMode === 'amount'">
              <div class="col-12 col-md-6">
                <q-input
                  dense
                  filled
                  v-model.number="litersToTransfer"
                  label="Cantidad a Transferir"
                  type="number"
                  suffix="Lts"
                  :rules="[(val) => val > 0 || 'Debe ser mayor a 0']"
                  :disable="!formData.id_tanque_destino"
                  @update:model-value="calculateFinalFromAmount"
                />
              </div>
              <div class="col-12 col-md-6 flex items-center">
                <div class="text-caption text-grey-8">
                  Nivel Final Estimado: <strong>{{ litersFinales }} L</strong>
                </div>
              </div>
            </template>

            <!-- 4. RESULTADOS -->
            <div class="col-12 q-mt-md">
              <q-banner rounded class="bg-blue-1 text-primary">
                <div class="text-subtitle1 text-weight-bold">
                  Resumen de Transferencia
                </div>
                <div class="row">
                  <div class="col-6">
                    Transferido:
                    <strong>{{ computedLitersTransferidos }} L</strong>
                  </div>
                  <div class="col-6 text-right">
                    Nuevo Nivel Origen:
                    <strong>{{ litersOrigenDespues }} L</strong>
                  </div>
                </div>
                <div
                  v-if="parseFloat(computedLitersTransferidos) <= 0"
                  class="text-caption text-negative"
                >
                  * El nivel final del destino debe ser mayor a su nivel actual.
                </div>
                <div
                  v-if="parseFloat(litersOrigenDespues) < 0"
                  class="text-caption text-negative"
                >
                  * Insuficiente combustible en origen.
                </div>
              </q-banner>
            </div>

            <div class="col-12">
              <q-input
                dense
                v-model="formData.observacion"
                type="textarea"
                label="Observaciones"
                rows="2"
              />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            label="Registrar"
            type="submit"
            color="primary"
            :disable="
              parseFloat(computedLitersTransferidos) <= 0 ||
              parseFloat(litersOrigenDespues) < 0
            "
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, reactive, computed, nextTick } from "vue";
import { date } from "quasar";
import { calcularVolumenTanque } from "../measurements/formula.js";

const props = defineProps({
  modelValue: Boolean,
  tanksList: { type: Array, default: () => [] },
  warehousemenList: { type: Array, default: () => [] },
  sourceTankDetail: { type: Object, default: null },
  destinationTankDetail: { type: Object, default: null },
  destinationTankAforo: { type: Object, default: () => ({}) },
});

const emit = defineEmits([
  "update:modelValue",
  "save",
  "source-tank-changed",
  "destination-tank-changed",
]);

const formData = ref({});
const filteredWarehousemen = ref([]);

// Modos de cálculo
const calculationMode = ref("final"); // 'final' | 'amount'
const litersToTransfer = ref(null);

// Estados de edición manual de litros
const editingLitros = ref(false);
const litersWereEdited = ref(false);
const originalLitersValue = ref(0);
const inputLitros = ref(null);

const litersFinales = ref(0); // v-model para el display/input
const debugInfo = ref({ h: 0, l: 0, r: 0, u: "" });

// Watchers
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      const now = new Date();
      formData.value = {
        fecha: date.formatDate(now, "YYYY-MM-DD"),
        hora: date.formatDate(now, "HH:mm"),
        id_almacenista: null,
        id_tanque_origen: null,
        id_tanque_destino: null,
        medida_vara_destino: null,
        observacion: "",
      };
      filteredWarehousemen.value = props.warehousemenList;
      resetEditState();
    }
  }
);

watch(
  () => props.destinationTankDetail,
  () => {
    if (!litersWereEdited.value && calculationMode.value === "final") {
      calculateLitrosDestino();
    }
  }
);

watch(
  () => props.destinationTankAforo,
  () => {
    if (!litersWereEdited.value && calculationMode.value === "final") {
      calculateLitrosDestino();
    }
  }
);

// Computed
const tieneAforo = computed(() => {
  const aforo = props.destinationTankAforo || {};
  return aforo && typeof aforo === "object" && Object.keys(aforo).length > 0;
});

const isFormulaMode = computed(() => {
  const t = props.destinationTankDetail;
  if (!t) return false;

  if (tieneAforo.value) return false;

  // Verificar dimensiones según tipo
  if (t.tipo_tanque === "RECTANGULAR" || t.tipo_tanque === "CUADRADO") {
    return t.largo > 0 && t.ancho > 0 && t.alto > 0;
  } else {
    // Por defecto CILINDRICO
    return t.largo > 0 && t.radio > 0;
  }
});

const computedLitersTransferidos = computed(() => {
  if (!props.destinationTankDetail) return "0.00";
  const antes = parseFloat(props.destinationTankDetail.nivel_actual) || 0;
  const despues = parseFloat(litersFinales.value) || 0;
  return (despues - antes).toFixed(2);
});

const litersOrigenDespues = computed(() => {
  if (!props.sourceTankDetail) return "0.00";
  const origenAntes = parseFloat(props.sourceTankDetail.nivel_actual) || 0;
  const transferido = parseFloat(computedLitersTransferidos.value);
  return (origenAntes - transferido).toFixed(2);
});

// Métodos
function resetEditState() {
  litersFinales.value = 0;
  editingLitros.value = false;
  litersWereEdited.value = false;
  calculationMode.value = "final";
  litersToTransfer.value = null;
}

function onSourceTankSelect(val) {
  emit("source-tank-changed", val);
}

function onDestinationTankSelect(val) {
  emit("destination-tank-changed", val);
  formData.value.medida_vara_destino = null;
  resetEditState();
}

function filterWarehousemen(val, update) {
  if (val === "") {
    update(() => {
      filteredWarehousemen.value = props.warehousemenList;
    });
    return;
  }
  update(() => {
    const needle = val.toLowerCase();
    filteredWarehousemen.value = props.warehousemenList.filter((w) =>
      w.nombre.toLowerCase().includes(needle)
    );
  });
}

function onCalculationModeChange(mode) {
  if (mode === "amount") {
    // Si cambiamos a amount, reseteamos la vara y calculamos desde 0 o desde la dif actual
    formData.value.medida_vara_destino = null;
    litersToTransfer.value = null;
  } else {
    // Si cambiamos a final, limpiamos amount
    litersToTransfer.value = null;
    litersWereEdited.value = false; // Permitimos recalcular por aforo/vara
    calculateLitrosDestino();
  }
}

function calculateFinalFromAmount() {
  if (calculationMode.value !== "amount") return;
  const current = parseFloat(props.destinationTankDetail?.nivel_actual || 0);
  const amount = parseFloat(litersToTransfer.value || 0);
  litersFinales.value = (current + amount).toFixed(2);
  litersWereEdited.value = true; // Marcamos como editado para que el backend sepa que es manual
}

function calculateLitrosDestino() {
  if (litersWereEdited.value || calculationMode.value !== "final") return;

  const vara = parseFloat(formData.value.medida_vara_destino);

  if (tieneAforo.value) {
    const aforo = props.destinationTankAforo || {};
    litersFinales.value =
      aforo[String(vara)] !== undefined ? parseFloat(aforo[String(vara)]) : 0;
  } else if (isFormulaMode.value && !isNaN(vara)) {
    const t = props.destinationTankDetail;
    const unidad = t.unidad_medida || "CM";

    let h_calc = 0;
    if (unidad === "PULGADAS") {
      h_calc = vara * 0.0254;
    } else {
      h_calc = vara / 100;
    }

    if (t.tipo_tanque === "RECTANGULAR" || t.tipo_tanque === "CUADRADO") {
      // CORRECCIÓN: Para rectangulares usamos las dimensiones directas
      const largo_m = parseFloat(t.largo);
      const ancho_m = parseFloat(t.ancho);
      const alto_m = parseFloat(t.alto);
      debugInfo.value = { h: h_calc, l: largo_m, r: ancho_m, u: unidad };
      const calc = calcularVolumenTanque(
        h_calc,
        largo_m,
        ancho_m,
        t.tipo_tanque,
        alto_m
      );
      litersFinales.value = parseFloat(calc.toFixed(2));
    } else {
      // CORRECCIÓN: Para cilíndricos usamos las dimensiones directas
      const largo_m = parseFloat(t.largo);
      const radio_m = parseFloat(t.radio);
      debugInfo.value = { h: h_calc, l: largo_m, r: radio_m, u: unidad };
      const calc = calcularVolumenTanque(
        h_calc,
        largo_m,
        radio_m,
        "CILINDRICO"
      );
      litersFinales.value = parseFloat(calc.toFixed(2));
    }
  } else {
    // Modo Manual puro (sin aforo, sin formula)
  }
}

// Edición Manual
async function startEdit() {
  originalLitersValue.value = litersFinales.value;
  editingLitros.value = true;
  await nextTick();
  if (inputLitros.value) {
    inputLitros.value.focus();
    inputLitros.value.select();
  }
}

function finishEdit() {
  editingLitros.value = false;
  if (
    litersFinales.value === null ||
    litersFinales.value === "" ||
    isNaN(litersFinales.value)
  ) {
    litersFinales.value = 0;
  }
  litersFinales.value = parseFloat(parseFloat(litersFinales.value).toFixed(2));

  if (litersFinales.value !== originalLitersValue.value) {
    litersWereEdited.value = true;
  }
}

function cancelEdit() {
  litersFinales.value = originalLitersValue.value;
  editingLitros.value = false;
}

async function onSave() {
  const payload = { ...formData.value };
  payload.litros_destino_manual = litersFinales.value;
  // Si estamos en modo 'amount', implícitamente es edición manual
  payload.litros_editados_manualmente =
    litersWereEdited.value || calculationMode.value === "amount";

  emit("save", payload);
}
</script>

<style scoped>
/* Estilos replicados de CisternLoad */
.editable-value {
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 3px;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
}
.editable-value:hover {
  background-color: rgba(25, 118, 210, 0.1);
  color: #1976d2;
}
.editable-value.was-edited {
  background-color: rgba(255, 152, 0, 0.15);
  border-bottom: 2px dashed #ff9800;
}
.edit-icon {
  opacity: 0;
  transition: opacity 0.2s ease;
  font-size: 12px;
  color: #1976d2;
}
.editable-value:hover .edit-icon {
  opacity: 0.7;
}
.inline-edit-small {
  display: inline-flex;
  max-width: 120px;
  vertical-align: middle;
  animation: fadeIn 0.15s ease-out;
}
.inline-edit-small :deep(.q-field__control) {
  height: auto;
  min-height: unset;
  padding: 2px 6px;
  background-color: rgba(25, 118, 210, 0.1);
  border-radius: 3px;
  border: 1px solid #1976d2;
}
.inline-edit-small :deep(.q-field__native) {
  padding: 0;
  min-height: unset;
  font-size: inherit;
}
.inline-input-text {
  font-size: inherit !important;
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

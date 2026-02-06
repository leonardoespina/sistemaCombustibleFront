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
                :suffix="
                  isFormulaMode ? 'm' : currentTankDetail?.unidad_medida || 'cm'
                "
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
                    :suffix="currentTankDetail?.unidad_medida || 'cm'"
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
import { ref, watch, nextTick, reactive, computed } from "vue";
import { date } from "quasar";
import { calcularVolumenTanque } from "./formula.js";

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

const formData = ref({});
const autoEvaporacion = ref(false);

// Referencias a los inputs para hacer focus
const inputReal = ref(null);
const inputDiferencia = ref(null);

// Estado de edición
const editing = reactive({
  real: false,
  diferencia: false,
});

// Flag persistente de edición manual
const manualEdit = reactive({
  real: false,
  diferencia: false,
});

// Valores originales para cancelar
const originalValues = reactive({
  real: 0,
  diferencia: 0,
});

const liters = reactive({
  real: 0,
  diferencia: 0,
});

// --- FUNCIONES DE EDICIÓN INLINE ---
async function startEdit(field) {
  // Guardar valor original por si se cancela
  originalValues[field] = liters[field];
  editing[field] = true;

  await nextTick();

  // Hacer focus en el input correspondiente
  if (field === "real" && inputReal.value) {
    inputReal.value.focus();
    inputReal.value.select();
  } else if (field === "diferencia" && inputDiferencia.value) {
    inputDiferencia.value.focus();
    inputDiferencia.value.select();
  }
}

function finishEdit(field) {
  editing[field] = false;

  // Asegurar que el valor sea número válido
  if (liters[field] === null || liters[field] === "" || isNaN(liters[field])) {
    liters[field] = 0;
  }

  // Formatear a 2 decimales
  const finalVal = parseFloat(parseFloat(liters[field]).toFixed(2));
  liters[field] = finalVal;

  // Marcar como editado manualmente si cambió respecto al original
  // o si simplemente se confirmó la edición (para asegurar comportamiento manual)
  if (finalVal !== originalValues[field] || true) {
    manualEdit[field] = true;
  }

  // Si se editó 'real', recalcular diferencia automáticamente (si la diferencia no es manual)
  if (field === "real") {
    // Si la diferencia NO ha sido fijada manualmente, la recalculamos basada en el nuevo real
    if (!manualEdit.diferencia) {
      recalculateDiferencia();
    }
  }
}

function cancelEdit(field) {
  // Restaurar valor original
  liters[field] = originalValues[field];
  editing[field] = false;
}

// Recalcular diferencia basado en el nuevo valor real
function recalculateDiferencia() {
  const sistema = parseFloat(props.currentTankDetail?.nivel_actual || 0);
  const evap = parseFloat(formData.value.litros_evaporacion || 0);
  const esperado = sistema - evap;
  liters.diferencia = parseFloat((esperado - liters.real).toFixed(2));
}

// Computed para saber si el tanque seleccionado es de gasolina
const isGasolina = computed(() => {
  return props.currentTankDetail?.tipo_combustible === "GASOLINA";
});

// Computed para detectar si aplica fórmula (Sin tabla pero con dimensiones)
const isFormulaMode = computed(() => {
  const t = props.currentTankDetail;
  if (!t) return false;

  const aforoData = t.aforo || t.tabla_aforo;
  const hasAforo = Array.isArray(aforoData)
    ? aforoData.length > 0
    : aforoData && Object.keys(aforoData).length > 0;

  if (hasAforo) return false;

  // Verificar dimensiones según tipo
  if (t.tipo_tanque === "RECTANGULAR" || t.tipo_tanque === "CUADRADO") {
    return t.largo > 0 && t.ancho > 0 && t.alto > 0;
  } else {
    // Por defecto CILINDRICO
    return t.largo > 0 && t.radio > 0;
  }
});

// Computed para detectar el modo de medición basado en el tanque actual
const isManualMode = computed(() => {
  if (!props.currentTankDetail) return false;
  const t = props.currentTankDetail;

  const aforoData = t.aforo || t.tabla_aforo;
  const hasAforo = Array.isArray(aforoData)
    ? aforoData.length > 0
    : aforoData && Object.keys(aforoData).length > 0;

  if (hasAforo) return false;
  if (isFormulaMode.value) return false;
  return true;
});

// --- INICIALIZACIÓN ---
function initializeForm() {
  const now = new Date();
  const init = props.initialData || {};

  formData.value = {
    fecha: init.fecha_medicion || date.formatDate(now, "YYYY-MM-DD"),
    hora: init.hora_medicion || date.formatDate(now, "HH:mm"),
    id_llenadero: init.Tanque?.id_llenadero || null,
    id_tanque: init.id_tanque || null,
    medida_vara: init.medida_vara || null,
    litros_manuales_ingresados: null, // Podría inferirse si es necesario
    litros_evaporacion: init.merma_evaporacion || 0,
    observacion: init.observaciones || "",
  };

  if (props.isEditing || props.isReadOnly) {
    liters.real = parseFloat(init.volumen_real || 0);
    liters.diferencia = parseFloat(init.diferencia || 0);
    // Marcamos como manual para que no se pisen al cargar el tanque
    manualEdit.real = true;
    manualEdit.diferencia = true;
  } else {
    liters.real = 0;
    liters.diferencia = 0;
    manualEdit.real = false;
    manualEdit.diferencia = false;
  }

  autoEvaporacion.value = false;
  autoEvaporacion.value = false;
  resetCalculos();
  // Resetear estados de edición
  editing.real = false;
  editing.diferencia = false;
}

watch(
  () => props.modelValue,
  (isNowOpen) => {
    if (isNowOpen) {
      initializeForm();
    }
  },
);

function onLlenaderoSelect(llenaderoId) {
  formData.value.id_tanque = null;
  emit("llenadero-changed", llenaderoId);
  resetCalculos();
}

function onTankSelect(tankId) {
  emit("tank-changed", tankId);
  formData.value.medida_vara = null;
  formData.value.litros_manuales_ingresados = null;
  formData.value.litros_evaporacion = 0;
  autoEvaporacion.value = false;
  resetCalculos();
}

function resetCalculos() {
  liters.real = 0;
  liters.diferencia = 0;
  manualEdit.real = false;
  manualEdit.diferencia = false;
}

// --- MOTOR DE CÁLCULO ---
function calculate() {
  if (!props.currentTankDetail) return;

  const sistema = parseFloat(props.currentTankDetail.nivel_actual || 0);
  let volReal = liters.real;

  // 1. Determinar Volumen Real (SOLO SI NO ES MANUAL)
  if (!manualEdit.real) {
    if (isManualMode.value) {
      const litrosManuales = parseFloat(
        formData.value.litros_manuales_ingresados,
      );
      volReal = isNaN(litrosManuales) ? 0 : litrosManuales;
    } else if (isFormulaMode.value) {
      const medida = parseFloat(formData.value.medida_vara);
      if (!isNaN(medida)) {
        const t = props.currentTankDetail;
        const unidad = t.unidad_medida || "CM";
        let h_m;

        if (unidad === "PULGADAS") {
          h_m = medida * 0.0254;
        } else {
          // Asumimos CM por defecto
          h_m = medida / 100;
        }

        // Determinar dimensiones según el tipo
        let dimension3 = 0;
        let hMax = null;

        if (t.tipo_tanque === "RECTANGULAR" || t.tipo_tanque === "CUADRADO") {
          // CORRECCIÓN: Para rectangulares usamos las dimensiones directas
          const largo_m = parseFloat(t.largo);
          const ancho_m = parseFloat(t.ancho);
          const alto_m = parseFloat(t.alto);

          const calc = calcularVolumenTanque(
            h_m,
            largo_m,
            ancho_m,
            t.tipo_tanque,
            alto_m,
          );
          volReal = parseFloat(calc.toFixed(2));
        } else {
          // PARA CILÍNDRICOS: CORRECCIÓN DE DIMENSIONES
          // Si el usuario guardó radio=2 queriendo decir 2 metros, pero la unidad es CM...
          // el problema es de data entry. Pero si asumimos que radio está en metros siempre:

          const largo_m = parseFloat(t.largo);
          const radio_m = parseFloat(t.radio);

          // Si el radio es muy pequeño (ej < 10) y la unidad es CM, es probable que esté en Metros
          // pero si el usuario dice que todo es en CM, entonces radio 2 es 2 cm.
          // Vamos a probar SIN el factor de 0.01 para las dimensiones, asumiendo que
          // el usuario ya las ingresó en la escala correcta para la fórmula (metros).

          const calc = calcularVolumenTanque(
            h_m,
            largo_m,
            radio_m,
            "CILINDRICO",
          );
          volReal = parseFloat(calc.toFixed(2));
        }
      } else {
        volReal = 0;
      }
    } else {
      const aforoData =
        props.currentTankDetail.aforo ||
        props.currentTankDetail.tabla_aforo ||
        [];
      const medida = parseFloat(formData.value.medida_vara);

      if (Array.isArray(aforoData)) {
        // Formato array de objetos: [{"altura": 1, "volumen": 93}, ...]
        const entry = aforoData.find((e) => parseFloat(e.altura) === medida);
        volReal = entry ? parseFloat(entry.volumen) : 0;
      } else {
        // Formato objeto: {"1": 93, "2": 180}
        volReal = aforoData[String(medida)] || 0;
      }
    }
    liters.real = volReal;
  } else {
    // Si es manual, usamos el valor que ya tiene liters.real
    volReal = liters.real;
  }

  // 2. Calcular Evaporación Automática (Si aplica)
  // Solo recalcular evaporación si no fue fijada manualmente (aunque evap no tiene flag manual específico,
  // se calcula en base a volReal, así que si volReal es manual, evap se actualiza acorde)
  if (isGasolina.value && autoEvaporacion.value) {
    const evapCalc = (0.25 * volReal) / 100;
    formData.value.litros_evaporacion = parseFloat(evapCalc.toFixed(2));
  }

  // 3. Calcular Diferencia (SOLO SI NO ES MANUAL)
  if (!manualEdit.diferencia) {
    const evap = parseFloat(formData.value.litros_evaporacion || 0);
    const esperado = sistema - evap;
    liters.diferencia = parseFloat((esperado - volReal).toFixed(2));
  }
}

async function onSave() {
  await nextTick();

  const payload = {
    id_medicion: props.initialData?.id_medicion,
    id_tanque: formData.value.id_tanque,
    fecha_medicion: formData.value.fecha,
    hora_medicion: formData.value.hora,
    medida_vara: formData.value.medida_vara,
    volumen_real: liters.real,
    merma_evaporacion: formData.value.litros_evaporacion,
    observaciones: formData.value.observacion,
  };

  if (isManualMode.value) {
    payload.litros_manuales_ingresados = parseFloat(
      payload.litros_manuales_ingresados,
    );
    if (payload.medida_vara !== null && payload.medida_vara !== "") {
      payload.medida_vara = parseFloat(payload.medida_vara);
    }
  } else {
    payload.medida_vara = parseFloat(payload.medida_vara);
    delete payload.litros_manuales_ingresados;
  }

  payload.litros_evaporacion = parseFloat(payload.litros_evaporacion || 0);

  emit("save", payload);
}
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

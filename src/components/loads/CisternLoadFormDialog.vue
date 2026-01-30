<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <q-card style="width: 1000px; max-width: 95vw">
      <q-card-section>
        <div class="text-h6">
          {{ isEditing ? "Editar Carga" : "Registrar Carga de Cisterna" }}
        </div>
        <div v-if="isEditing" class="text-caption text-negative">
          Solo edición administrativa. Los volúmenes ya están en inventario.
        </div>
      </q-card-section>

      <q-form @submit.prevent="onSave">
        <q-card-section class="q-pt-none scroll" style="max-height: 75vh">
          <div class="row q-col-gutter-md">
            <!-- === 1. DATOS GUÍA Y TRANSPORTE === -->
            <div class="col-12 text-subtitle2 text-primary">
              Documentación y Transporte
            </div>

            <div class="col-12 col-md-3">
              <div class="row items-center no-wrap">
                <q-input
                  class="col-grow"
                  dense
                  v-model="formData.numero_guia"
                  label="N° Guía"
                  :rules="[(val) => !!val || 'Requerido']"
                  :disable="isInternalCistern"
                />
                <q-checkbox
                  v-model="isInternalCistern"
                  dense
                  size="sm"
                  class="q-ml-sm q-mb-md"
                  color="primary"
                >
                  <q-tooltip>Cisterna Interna</q-tooltip>
                </q-checkbox>
              </div>
            </div>
            <div class="col-12 col-md-3">
              <q-input
                dense
                v-model="formData.fecha_emision"
                type="date"
                label="Fecha Emisión"
              />
            </div>
            <div class="col-8 col-md-3">
              <q-input
                dense
                v-model="formData.fecha_recepcion"
                type="date"
                label="Fecha Recepción"
              />
            </div>
            <div class="col-12 col-md-3">
              <q-input
                dense
                v-model.number="formData.litros_segun_guia"
                type="number"
                label="Litros según Guía"
                suffix="Lts"
                :rules="[(val) => val > 0 || 'Requerido']"
                :disable="isEditing"
                @update:model-value="onGuiaChange"
              />
            </div>

            <div class="col-12 col-md-4">
              <q-input
                dense
                v-model="formData.fecha"
                type="date"
                label="Fecha Llegada"
                :rules="[(val) => !!val || 'Requerido']"
                :disable="isEditing"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                dense
                v-model="formData.hora"
                type="time"
                label="Hora Llegada"
                :rules="[(val) => !!val || 'Requerido']"
                :disable="isEditing"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                dense
                v-model="tipoCombustible"
                label="Tipo Combustible"
                readonly
                filled
                bg-color="grey-3"
              />
            </div>

            <div class="col-12 col-md-4">
              <q-select
                dense
                filled
                use-input
                v-model="formData.id_vehiculo"
                label="Cisterna"
                :options="filteredVehicles"
                @filter="filterVehicles"
                option-value="id_vehiculo"
                :option-label="getVehicleLabel"
                emit-value
                map-options
                :rules="[(val) => !!val || 'Requerido']"
                :disable="isEditing"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-select
                dense
                filled
                use-input
                v-model="formData.id_chofer"
                label="Chofer"
                :options="filteredDrivers"
                @filter="filterDrivers"
                option-value="id_chofer"
                :option-label="(opt) => `${opt.nombre} ${opt.apellido}`"
                emit-value
                map-options
              />
            </div>
            <div class="col-12 col-md-4">
              <q-select
                dense
                filled
                use-input
                v-model="formData.id_almacenista"
                label="Almacenista Receptor"
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

            <!-- === 2. MEDICIÓN FÍSICA (VARA) === -->
            <div class="col-12 text-subtitle2 text-primary">
              Medición de Tanque
            </div>

            <div class="col-12">
              <q-select
                dense
                filled
                v-model="formData.id_tanque"
                :options="tanksList"
                option-value="id_tanque"
                :option-label="
                  (opt) =>
                    `${opt.codigo} - ${opt.nombre} (${opt.tipo_combustible})`
                "
                label="Tanque Receptor"
                emit-value
                map-options
                :rules="[(val) => !!val || 'Requerido']"
                :disable="isEditing"
                @update:model-value="onTankSelect"
              />
            </div>

            <!-- MEDIDA INICIAL -->
            <div class="col-12 col-md-6">
              <q-input
                dense
                filled
                v-model.number="formData.medida_inicial"
                :label="
                  tieneAforo || isFormulaMode
                    ? 'Medida Inicial (Vara)'
                    : 'Litros Iniciales'
                "
                type="number"
                :suffix="
                  tieneAforo || isFormulaMode
                    ? currentTankDetail?.unidad_medida || 'cm'
                    : 'Lts'
                "
                :rules="[(val) => val >= 0 || '>= 0']"
                :disable="isEditing || !formData.id_tanque"
                @update:model-value="calculateLitros"
              />

              <!-- Volumen Inicial - EDITABLE -->
              <div
                v-if="tieneAforo || isFormulaMode"
                class="text-caption text-grey-7 q-pl-sm"
              >
                {{ isFormulaMode ? "Volumen Calculado:" : "Volumen Tabla:" }}

                <!-- Modo Visualización -->
                <strong
                  v-if="!editing.inicial"
                  class="editable-value"
                  :class="{ 'was-edited': litersWereEdited.inicial }"
                  @click="startEdit('inicial')"
                >
                  {{ liters.inicial }} L
                  <q-icon name="edit" size="xs" class="edit-icon q-ml-xs" />
                  <q-tooltip>Click para editar</q-tooltip>
                </strong>

                <!-- Modo Edición -->
                <q-input
                  v-else
                  ref="inputInicial"
                  v-model.number="liters.inicial"
                  type="number"
                  dense
                  borderless
                  input-class="text-weight-bold inline-input-text"
                  class="inline-edit-small"
                  @blur="finishEdit('inicial')"
                  @keyup.enter="finishEdit('inicial')"
                  @keyup.escape="cancelEdit('inicial')"
                >
                  <template v-slot:append>
                    <span class="text-weight-bold">L</span>
                  </template>
                </q-input>
              </div>
            </div>

            <!-- MEDIDA FINAL -->
            <div class="col-12 col-md-6">
              <q-input
                dense
                filled
                v-model.number="formData.medida_final"
                :label="
                  tieneAforo || isFormulaMode
                    ? 'Medida Final (Vara)'
                    : 'Litros Finales'
                "
                type="number"
                :suffix="
                  tieneAforo || isFormulaMode
                    ? currentTankDetail?.unidad_medida || 'cm'
                    : 'Lts'
                "
                :rules="[
                  (val) =>
                    val > formData.medida_inicial || 'Debe ser mayor a inicial',
                ]"
                :disable="isEditing || !formData.id_tanque"
                @update:model-value="calculateLitros"
              />

              <!-- Volumen Final - EDITABLE -->
              <div
                v-if="tieneAforo || isFormulaMode"
                class="text-caption text-grey-7 q-pl-sm"
              >
                {{ isFormulaMode ? "Volumen Calculado:" : "Volumen Tabla:" }}

                <!-- Modo Visualización -->
                <strong
                  v-if="!editing.final"
                  class="editable-value"
                  :class="{ 'was-edited': litersWereEdited.final }"
                  @click="startEdit('final')"
                >
                  {{ liters.final }} L
                  <q-icon name="edit" size="xs" class="edit-icon q-ml-xs" />
                  <q-tooltip>Click para editar</q-tooltip>
                </strong>

                <!-- Modo Edición -->
                <q-input
                  v-else
                  ref="inputFinal"
                  v-model.number="liters.final"
                  type="number"
                  dense
                  borderless
                  input-class="text-weight-bold inline-input-text"
                  class="inline-edit-small"
                  @blur="finishEdit('final')"
                  @keyup.enter="finishEdit('final')"
                  @keyup.escape="cancelEdit('final')"
                >
                  <template v-slot:append>
                    <span class="text-weight-bold">L</span>
                  </template>
                </q-input>
              </div>
            </div>

            <q-separator class="col-12 q-my-sm" />

            <!-- === 3. DATOS DE PESAJE Y TIEMPOS === -->
            <div class="col-12 text-subtitle2 text-primary">
              Datos de Pesaje y Descarga
            </div>

            <div class="col-6 col-md-3">
              <q-input
                dense
                v-model.number="formData.peso_entrada"
                type="number"
                label="Peso Entrada"
                suffix="Kg"
                @update:model-value="calcularPesoNeto"
              />
            </div>
            <div class="col-6 col-md-3">
              <q-input
                dense
                v-model.number="formData.peso_salida"
                type="number"
                label="Peso Salida"
                suffix="Kg"
                @update:model-value="calcularPesoNeto"
              />
            </div>
            <div class="col-6 col-md-3">
              <q-input
                dense
                v-model="formData.hora_inicio_descarga"
                type="time"
                label="Inicio Descarga"
              />
            </div>
            <div class="col-6 col-md-3">
              <q-input
                dense
                v-model="formData.hora_fin_descarga"
                type="time"
                label="Fin Descarga"
              />
            </div>

            <!-- Resultado del peso neto -->
            <div v-if="pesoNeto !== null" class="col-12">
              <q-banner dense class="bg-grey-2">
                Peso Neto: <strong>{{ pesoNeto.toFixed(2) }} Kg</strong>
              </q-banner>
            </div>

            <q-separator class="col-12 q-my-sm" />

            <!-- === 4. RESULTADOS === -->
            <div class="col-12 text-subtitle2 text-primary">
              Análisis de Volúmenes
              <q-badge
                v-if="litersWereEdited.inicial || litersWereEdited.final"
                color="orange"
                class="q-ml-sm"
              >
                Valores editados manualmente
              </q-badge>
            </div>

            <div class="col-12">
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-4">
                  <q-card flat bordered class="bg-blue-1">
                    <q-card-section class="q-py-sm text-center">
                      <div
                        class="text-caption text-blue-9 text-uppercase text-weight-bold"
                      >
                        Recibido Real
                      </div>
                      <div
                        class="text-h4 text-primary text-weight-bold q-my-xs"
                      >
                        {{ liters.recibido }}
                        <span class="text-body1">Lts</span>
                      </div>
                      <q-separator class="q-my-xs bg-blue-2" />
                      <div class="row justify-between items-center q-px-sm">
                        <span class="text-caption text-grey-8">Dif. Guía:</span>
                        <q-badge
                          :color="
                            parseFloat(liters.faltante) > 0
                              ? 'negative'
                              : 'positive'
                          "
                          class="q-pa-xs"
                        >
                          {{ liters.faltante }} L
                        </q-badge>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>

                <div class="col-12 col-md-4">
                  <q-card flat bordered>
                    <q-card-section class="q-py-sm text-center">
                      <div class="text-caption text-grey-7 text-uppercase">
                        Flujómetro (Opcional)
                      </div>
                      <div class="q-my-sm">
                        <q-input
                          dense
                          outlined
                          v-model.number="formData.litros_flujometro"
                          type="number"
                          suffix="Lts"
                          placeholder="---"
                          input-class="text-center"
                          :disable="isEditing"
                          @update:model-value="onFlujometroChange"
                        />
                      </div>
                      <q-separator class="q-my-xs" />
                      <div
                        v-if="formData.litros_flujometro"
                        class="row justify-between items-center q-px-sm"
                      >
                        <span class="text-caption text-grey-8"
                          >Desviación:</span
                        >
                        <span
                          class="text-weight-bold"
                          :class="
                            Math.abs(parseFloat(liters.dif_flujo)) > 50
                              ? 'text-negative'
                              : 'text-grey-8'
                          "
                        >
                          {{ liters.dif_flujo }} L
                        </span>
                      </div>
                      <div v-else class="text-caption text-grey-5 q-py-xs">
                        Sin lectura
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </div>

            <div class="col-12 q-mt-md">
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
          <q-btn label="Registrar Carga" type="submit" color="primary" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, nextTick, reactive, computed } from "vue";
import { date } from "quasar";
import { calcularVolumenTanque } from "../measurements/formula.js";

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
  isEditing: Boolean,
  tanksList: { type: Array, default: () => [] },
  vehiclesList: { type: Array, default: () => [] },
  driversList: { type: Array, default: () => [] },
  warehousemenList: { type: Array, default: () => [] },
  currentTankAforo: { type: Object, default: () => ({}) },
  currentTankDetail: { type: Object, default: null },
});

const emit = defineEmits(["update:modelValue", "save", "tank-changed"]);

const formData = ref({});
const isInternalCistern = ref(false); // Checkbox para cisterna interna
const filteredVehicles = ref([]);
const filteredDrivers = ref([]);
const filteredWarehousemen = ref([]);
const tipoCombustible = ref("");
const pesoNeto = ref(null);

// Referencias a los inputs para hacer focus
const inputInicial = ref(null);
const inputFinal = ref(null);

// Estado de edición activa (mientras el usuario está escribiendo)
const editing = reactive({
  inicial: false,
  final: false,
});

// Valores originales para cancelar edición
const originalValues = reactive({
  inicial: 0,
  final: 0,
});

// ⭐ FLAG PERSISTENTE: indica que los litros fueron editados manualmente
// Este flag persiste hasta que se cierre el diálogo o se cambie de tanque
const litersWereEdited = reactive({
  inicial: false,
  final: false,
});

const liters = reactive({
  inicial: 0,
  final: 0,
  recibido: "0.00",
  faltante: "0.00",
  dif_flujo: "0.00",
});

// ============================================
// WATCHERS REACTIVOS PARA RECÁLCULO EN VIVO
// ============================================

// Watcher para liters.inicial - recalcula en tiempo real mientras editas
watch(
  () => liters.inicial,
  () => {
    // Recalcular siempre que cambie, si estamos editando o si fue editado
    if (
      editing.inicial ||
      editing.final ||
      litersWereEdited.inicial ||
      litersWereEdited.final
    ) {
      recalculateFromLiters();
    }
  }
);

// Watcher para liters.final - recalcula en tiempo real mientras editas
watch(
  () => liters.final,
  () => {
    if (
      editing.inicial ||
      editing.final ||
      litersWereEdited.inicial ||
      litersWereEdited.final
    ) {
      recalculateFromLiters();
    }
  }
);

// Watcher para checkbox de cisterna interna
watch(isInternalCistern, (val) => {
  if (val) {
    formData.value.numero_guia = "cisterna interna";
  } else {
    // Si se desmarca y tiene el valor automático, limpiar el campo
    if (formData.value.numero_guia === "cisterna interna") {
      formData.value.numero_guia = "";
    }
  }
});

// ============================================
// FUNCIONES DE EDICIÓN INLINE
// ============================================

async function startEdit(field) {
  // Guardar valor original por si se cancela
  originalValues[field] = liters[field];
  editing[field] = true;

  await nextTick();

  // Hacer focus en el input correspondiente
  if (field === "inicial" && inputInicial.value) {
    inputInicial.value.focus();
    inputInicial.value.select();
  } else if (field === "final" && inputFinal.value) {
    inputFinal.value.focus();
    inputFinal.value.select();
  }
}

function finishEdit(field) {
  editing[field] = false;

  // Asegurar que el valor sea número válido
  if (liters[field] === null || liters[field] === "" || isNaN(liters[field])) {
    liters[field] = 0;
  }

  // Formatear a 2 decimales
  liters[field] = parseFloat(parseFloat(liters[field]).toFixed(2));

  // ⭐ MARCAR COMO EDITADO PERMANENTEMENTE (hasta reset)
  // Solo marcar si el valor cambió respecto al original
  if (liters[field] !== originalValues[field]) {
    litersWereEdited[field] = true;
  }

  // Recalcular una última vez con el valor formateado
  recalculateFromLiters();
}

function cancelEdit(field) {
  // Restaurar valor original
  liters[field] = originalValues[field];
  editing[field] = false;

  // Recalcular con valor restaurado
  recalculateFromLiters();
}

// ============================================
// FUNCIÓN DE RECÁLCULO DESDE LITROS EDITADOS
// ============================================

function recalculateFromLiters() {
  const guia = parseFloat(formData.value.litros_segun_guia) || 0;
  const flujo = formData.value.litros_flujometro;

  // Obtener valores actuales
  const ini = parseFloat(liters.inicial) || 0;
  const fin = parseFloat(liters.final) || 0;

  // Calcular recibido (siempre positivo o cero)
  const recibido = fin - ini > 0 ? fin - ini : 0;
  liters.recibido = recibido.toFixed(2);

  // Calcular faltante (guía - recibido)
  const recibidoNum = parseFloat(liters.recibido);
  liters.faltante = (guia - recibidoNum).toFixed(2);

  // Calcular diferencia con flujómetro
  if (flujo !== null && flujo !== "" && !isNaN(parseFloat(flujo))) {
    liters.dif_flujo = (recibidoNum - parseFloat(flujo)).toFixed(2);
  } else {
    liters.dif_flujo = "0.00";
  }
}

// ============================================
// HANDLERS PARA CAMBIOS EN GUÍA Y FLUJÓMETRO
// ============================================

function onGuiaChange() {
  // Si los litros fueron editados, solo recalcular derivados
  if (litersWereEdited.inicial || litersWereEdited.final) {
    recalculateFromLiters();
  } else {
    calculateLitros();
  }
}

function onFlujometroChange() {
  // Si los litros fueron editados, solo recalcular derivados
  if (litersWereEdited.inicial || litersWereEdited.final) {
    recalculateFromLiters();
  } else {
    calculateLitros();
  }
}

// ============================================
// COMPUTED PROPERTIES
// ============================================

const tieneAforo = computed(() => {
  const aforo = props.currentTankAforo || {};
  return aforo && typeof aforo === "object" && Object.keys(aforo).length > 0;
});

const isFormulaMode = computed(() => {
  const t = props.currentTankDetail;
  if (!t) return false;
  const hasAforo =
    t.tabla_aforo &&
    typeof t.tabla_aforo === "object" &&
    Object.keys(t.tabla_aforo).length > 0;

  if (hasAforo) return false;

  // Verificar dimensiones según tipo
  if (t.tipo_tanque === "RECTANGULAR" || t.tipo_tanque === "CUADRADO") {
    return t.largo > 0 && t.ancho > 0 && t.alto > 0;
  } else {
    // Por defecto CILINDRICO
    return t.largo > 0 && t.radio > 0;
  }
});

const isManualMode = computed(() => {
  if (!props.currentTankDetail) return false;
  const t = props.currentTankDetail;
  const hasAforo =
    t.tabla_aforo &&
    typeof t.tabla_aforo === "object" &&
    Object.keys(t.tabla_aforo).length > 0;

  if (hasAforo) return false;
  if (isFormulaMode.value) return false;
  return true;
});

// ============================================
// WATCHERS PRINCIPALES
// ============================================

watch(
  () => props.modelValue,
  (isNowOpen) => {
    if (isNowOpen) {
      const now = new Date();

      formData.value = {
        numero_guia: props.initialData?.numero_guia || "",
        fecha_emision:
          props.initialData?.fecha_emision ||
          date.formatDate(now, "YYYY-MM-DD"),
        fecha_recepcion:
          props.initialData?.fecha_recepcion ||
          date.formatDate(now, "YYYY-MM-DD"),
        fecha: props.initialData?.fecha_hora_llegada
          ? date.formatDate(props.initialData.fecha_hora_llegada, "YYYY-MM-DD")
          : date.formatDate(now, "YYYY-MM-DD"),
        hora: props.initialData?.fecha_hora_llegada
          ? date.formatDate(props.initialData.fecha_hora_llegada, "HH:mm")
          : date.formatDate(now, "HH:mm"),

        id_vehiculo: props.initialData?.id_vehiculo || null,
        id_chofer: props.initialData?.id_chofer || null,
        id_almacenista: props.initialData?.id_almacenista || null,
        id_tanque: props.initialData?.id_tanque || null,

        medida_inicial: props.initialData?.medida_inicial || null,
        medida_final: props.initialData?.medida_final || null,
        litros_segun_guia: props.initialData?.litros_segun_guia || null,
        litros_flujometro: props.initialData?.litros_flujometro || null,

        peso_entrada: props.initialData?.peso_entrada || null,
        peso_salida: props.initialData?.peso_salida || null,
        hora_inicio_descarga:
          props.initialData?.hora_inicio_descarga || "08:00",
        hora_fin_descarga: props.initialData?.hora_fin_descarga || "09:00",

        observacion: props.initialData?.observacion || "",
      };

      // Inicializar estado del checkbox según el valor de numero_guia
      isInternalCistern.value =
        formData.value.numero_guia === "cisterna interna";

      filteredVehicles.value = props.vehiclesList;
      filteredDrivers.value = props.driversList;
      filteredWarehousemen.value = props.warehousemenList;

      if (formData.value.id_tanque) {
        emit("tank-changed", formData.value.id_tanque);
      }

      // ⭐ RESET COMPLETO al abrir el diálogo
      resetAllStates();
      calcularPesoNeto();
    }
  }
);

watch(
  () => props.currentTankDetail,
  (newDetail) => {
    if (newDetail) {
      tipoCombustible.value = newDetail.tipo_combustible || "";
      // ⭐ Solo recalcular desde fórmula/aforo si NO fueron editados manualmente
      if (!litersWereEdited.inicial && !litersWereEdited.final) {
        nextTick(() => {
          calculateLitros();
        });
      }
    }
  }
);

watch(
  () => props.currentTankAforo,
  () => {
    // ⭐ Solo recalcular desde aforo si NO fueron editados manualmente
    if (!litersWereEdited.inicial && !litersWereEdited.final) {
      nextTick(() => {
        calculateLitros();
      });
    }
  }
);

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

function resetAllStates() {
  // Reset valores de litros
  liters.inicial = 0;
  liters.final = 0;
  liters.recibido = "0.00";
  liters.faltante = "0.00";
  liters.dif_flujo = "0.00";

  // Reset estados de edición
  editing.inicial = false;
  editing.final = false;

  // ⭐ Reset flags de edición manual
  litersWereEdited.inicial = false;
  litersWereEdited.final = false;
}

function onTankSelect(tankId) {
  emit("tank-changed", tankId);
  formData.value.medida_inicial = null;
  formData.value.medida_final = null;

  // ⭐ Reset completo al cambiar de tanque
  resetAllStates();
}

function calculateLitros() {
  // ⭐ NO sobrescribir si los valores fueron editados manualmente
  if (props.isEditing) return;

  const medIni = formData.value.medida_inicial;
  const medFin = formData.value.medida_final;
  const guia = formData.value.litros_segun_guia || 0;
  const flujo = formData.value.litros_flujometro;

  let l_ini = 0;
  let l_fin = 0;

  if (tieneAforo.value) {
    const aforo = props.currentTankAforo || {};
    l_ini =
      aforo[String(medIni)] !== undefined
        ? parseFloat(aforo[String(medIni)])
        : 0;
    l_fin =
      aforo[String(medFin)] !== undefined
        ? parseFloat(aforo[String(medFin)])
        : 0;
  } else if (isFormulaMode.value) {
    const t = props.currentTankDetail;
    const medidaIni = parseFloat(medIni);
    const medidaFin = parseFloat(medFin);
    const unidad = (t.unidad_medida || "CM").toUpperCase();

    if (!isNaN(medidaIni)) {
      let h_m_ini =
        unidad === "PULGADAS" ? medidaIni * 0.0254 : medidaIni / 100;

      if (t.tipo_tanque === "RECTANGULAR" || t.tipo_tanque === "CUADRADO") {
        // CORRECCIÓN: Usamos dimensiones directas
        const calc = calcularVolumenTanque(
          h_m_ini,
          parseFloat(t.largo),
          parseFloat(t.ancho),
          t.tipo_tanque,
          parseFloat(t.alto)
        );
        l_ini = parseFloat(calc.toFixed(2));
      } else {
        // CORRECCIÓN: Para cilíndricos usamos las dimensiones directas
        const calc_directo = calcularVolumenTanque(
          h_m_ini,
          parseFloat(t.largo),
          parseFloat(t.radio),
          "CILINDRICO"
        );
        l_ini = parseFloat(calc_directo.toFixed(2));
      }
    }

    if (!isNaN(medidaFin)) {
      let h_m_fin =
        unidad === "PULGADAS" ? medidaFin * 0.0254 : medidaFin / 100;

      if (t.tipo_tanque === "RECTANGULAR" || t.tipo_tanque === "CUADRADO") {
        // CORRECCIÓN: Usamos dimensiones directas
        const calc = calcularVolumenTanque(
          h_m_fin,
          parseFloat(t.largo),
          parseFloat(t.ancho),
          t.tipo_tanque,
          parseFloat(t.alto)
        );
        l_fin = parseFloat(calc.toFixed(2));
      } else {
        // CORRECCIÓN: Para cilíndricos usamos las dimensiones directas
        const calc_directo = calcularVolumenTanque(
          h_m_fin,
          parseFloat(t.largo),
          parseFloat(t.radio),
          "CILINDRICO"
        );
        l_fin = parseFloat(calc_directo.toFixed(2));
      }
    }
  } else {
    l_ini = parseFloat(medIni) || 0;
    l_fin = parseFloat(medFin) || 0;
  }

  // ⭐ Solo actualizar los valores que NO fueron editados manualmente
  if (!litersWereEdited.inicial) {
    liters.inicial = l_ini;
  }
  if (!litersWereEdited.final) {
    liters.final = l_fin;
  }

  // Siempre recalcular los derivados con los valores actuales
  const ini = parseFloat(liters.inicial) || 0;
  const fin = parseFloat(liters.final) || 0;
  const recibido = fin - ini > 0 ? fin - ini : 0;
  liters.recibido = recibido.toFixed(2);

  const recibidoNum = parseFloat(liters.recibido);
  liters.faltante = (guia - recibidoNum).toFixed(2);

  if (flujo !== null && flujo !== "") {
    liters.dif_flujo = (recibidoNum - parseFloat(flujo)).toFixed(2);
  } else {
    liters.dif_flujo = "0.00";
  }
}

function calcularPesoNeto() {
  const entrada = parseFloat(formData.value.peso_entrada) || 0;
  const salida = parseFloat(formData.value.peso_salida) || 0;
  pesoNeto.value = entrada && salida ? entrada - salida : null;
}

function getVehicleLabel(opt) {
  const marca = opt.nombre_marca || opt.Marca?.nombre || "";
  return `${opt.placa} - ${marca}`.trim();
}

function filterVehicles(val, update) {
  if (val === "") {
    update(() => {
      filteredVehicles.value = props.vehiclesList;
    });
    return;
  }
  update(() => {
    const needle = val.toLowerCase();
    filteredVehicles.value = props.vehiclesList.filter((v) =>
      v.placa.toLowerCase().includes(needle)
    );
  });
}

function filterDrivers(val, update) {
  if (val === "") {
    update(() => {
      filteredDrivers.value = props.driversList;
    });
    return;
  }
  update(() => {
    const needle = val.toLowerCase();
    filteredDrivers.value = props.driversList.filter(
      (d) =>
        d.nombre.toLowerCase().includes(needle) ||
        d.apellido.toLowerCase().includes(needle)
    );
  });
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

async function onSave() {
  await nextTick();

  const payload = { ...formData.value };

  // ⭐ Siempre usar los valores actuales de liters (editados o calculados)
  payload.litros_iniciales = parseFloat(liters.inicial);
  payload.litros_finales = parseFloat(liters.final);
  payload.litros_recibidos = parseFloat(liters.recibido);
  payload.diferencia_guia = parseFloat(liters.faltante);

  // Flag para indicar si fueron editados manualmente
  payload.litros_editados_manualmente =
    litersWereEdited.inicial || litersWereEdited.final;

  emit("save", payload);
}
</script>

<style scoped>
/* Estilo para valores editables inline */
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

/* ⭐ Indicador visual de que fue editado manualmente */
.editable-value.was-edited {
  background-color: rgba(255, 152, 0, 0.15);
  border-bottom: 2px dashed #ff9800;
}

.editable-value.was-edited:hover {
  background-color: rgba(255, 152, 0, 0.25);
}

/* Icono de editar */
.edit-icon {
  opacity: 0;
  transition: opacity 0.2s ease;
  font-size: 12px;
  color: #1976d2;
}

.editable-value:hover .edit-icon {
  opacity: 0.7;
}

/* Input inline pequeño */
.inline-edit-small {
  display: inline-flex;
  max-width: 120px;
  vertical-align: middle;
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

.inline-edit-small :deep(.q-field__append) {
  padding-left: 2px;
}

.inline-input-text {
  font-size: inherit !important;
}

.inline-edit-small {
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

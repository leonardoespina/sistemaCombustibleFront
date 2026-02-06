<!-- src/components/dispatches/RequestFormDialog.vue - REFACTORIZADO -->
<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="bg-grey-2 overflow-hidden column no-wrap">
      <!-- Cabecera -->
      <q-bar class="bg-primary text-white q-py-md">
        <q-icon name="local_gas_station" />
        <div class="text-weight-bold text-subtitle1">
          Nueva Solicitud de Combustible
        </div>
        <q-space />
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Cerrar Ventana</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section class="col q-pa-md scroll">
        <q-form @submit.prevent="handleSubmit">
          <div class="row q-col-gutter-md items-stretch">
            <!-- SECCIÓN IZQUIERDA -->
            <div class="col-12 col-md-7 column q-gutter-y-md">
              <!-- Configuración -->
              <RequestConfigSection
                :model-value="{
                  selectedSubdependencia,
                  selectedCombustible,
                  id_llenadero: formData.id_llenadero,
                }"
                :filtered-subdependencia-options="filteredSubdependenciaOptions"
                :combustible-options="combustibleOptions"
                :llenadero-options="llenaderoOptions"
                :loading-subdependencias="requestStore.loadingAuxiliar"
                :loading-llenaderos="requestStore.loadingAuxiliar"
                @update:selected-subdependencia="onSubdependenciaChange"
                @update:selected-combustible="onCombustibleChange"
                @update:llenadero="formData.id_llenadero = $event"
                @filter:subdependencias="handleFilterSubdependencias"
              />

              <!-- Vehículos -->
              <RequestVehicleSection
                :vehicle-options="filteredVehicleOptions"
                :selected-vehicle="selectedVehicle"
                :filter-placa="filterPlaca"
                :get-fuel-color="getFuelColor"
                @select:vehicle="selectedVehicle = $event"
                @update:filter-placa="handleFilterPlaca"
              />

              <!-- Acciones - Mover al final para pantallas pequeñas -->
              <RequestActionsSection
                v-if="$q.screen.gt.sm"
                :can-submit="canSubmit"
                :loading="loading"
                @submit="handleSubmit"
                @reset="handleReset"
                @note="showNoteDialog = true"
                @close="emit('update:modelValue', false)"
              />
            </div>

            <!-- SECCIÓN DERECHA -->
            <div class="col-12 col-md-5 column q-gutter-y-md">
              <!-- Datos de Control -->
              <RequestControlSection
                :form-data="formData"
                :available-modalities="availableModalities"
                :precio-options="precioOptions"
                :selected-precio-obj="selectedPrecioObj"
                :calculated-total="calculatedTotal"
                :solicitante-name="solicitanteName"
                :current-date="currentDate"
                :current-time="currentTime"
                @update:cantidad-litros="formData.cantidad_litros = $event"
                @update:tipo-solicitud="onTipoSolicitudChange"
                @update:precio-obj="selectedPrecioObj = $event"
                @update:tipo-suministro="formData.tipo_suministro = $event"
              />

              <!-- Cupo Mensual -->
              <RequestQuotaSection
                :quota-info="quotaInfo"
                :format-volume="formatVolume"
              />

              <!-- Acciones - Solo visible en pantallas pequeñas -->
              <RequestActionsSection
                v-if="$q.screen.lt.md"
                :can-submit="canSubmit"
                :loading="loading"
                @submit="handleSubmit"
                @reset="handleReset"
                @note="showNoteDialog = true"
                @close="emit('update:modelValue', false)"
              />
            </div>
          </div>
        </q-form>
      </q-card-section>
    </q-card>

    <!-- Diálogo de Nota -->
    <q-dialog v-model="showNoteDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Agregar Nota</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="noteText"
            outlined
            type="textarea"
            label="Nota"
            rows="3"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="primary" v-close-popup />
          <q-btn
            flat
            label="Guardar"
            color="primary"
            @click="saveNote"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useQuasar } from "quasar";
import api from "../../api";

// Stores
import { useRequestStore } from "../../stores/requestStore";
import { useVehicleStore } from "../../stores/vehicleStore";
import { useTipoCombustibleStore } from "../../stores/tipoCombustibleStore";
import { useCupoStore } from "../../stores/cupoStore";

// Composables
import { useRequestForm } from "./composables/useRequestForm";
import { useRequestQuota } from "./composables/useRequestQuota";
import { useRequestFilters } from "./composables/useRequestFilters";

// Secciones
import RequestConfigSection from "./request-sections/RequestConfigSection.vue";
import RequestVehicleSection from "./request-sections/RequestVehicleSection.vue";
import RequestControlSection from "./request-sections/RequestControlSection.vue";
import RequestQuotaSection from "./request-sections/RequestQuotaSection.vue";
import RequestActionsSection from "./request-sections/RequestActionsSection.vue";

// Props & Emits
const props = defineProps({
  modelValue: Boolean,
});

const emit = defineEmits(["update:modelValue", "save"]);
const $q = useQuasar();

// Stores
const requestStore = useRequestStore();
const vehicleStore = useVehicleStore();
const tipoCombustibleStore = useTipoCombustibleStore();
const cupoStore = useCupoStore();

// Composables
const {
  loading,
  formData,
  selectedCombustible,
  selectedVehicle,
  selectedSubdependencia,
  selectedPrecioObj,
  solicitanteName,
  currentDate,
  currentTime,
  availableModalities,
  calculatedTotal,
  canSubmit,
  initializeForm,
  resetForm,
  onTipoSolicitudChange,
  onSave,
} = useRequestForm(emit, requestStore);

const { quotaInfo, fetchQuotaInfo, formatVolume } = useRequestQuota(
  cupoStore,
  selectedSubdependencia,
  selectedCombustible,
);

const {
  filterPlaca,
  filteredSubdependenciaOptions,
  filteredVehicleOptions,
  filterSubdependencias,
  triggerFilterVehicles,
  fetchVehicles,
  getFuelColor,
  resetFilters,
} = useRequestFilters(vehicleStore);

// State local
const combustibleOptions = ref([]);
const llenaderoOptions = ref([]);
const precioOptions = ref([]);
const showNoteDialog = ref(false);
const noteText = ref("");

// Watchers
watch(
  () => props.modelValue,
  async (newVal) => {
    if (newVal) {
      resetForm();
      resetFilters();
      await loadInitialData();
    }
  },
);

// Lifecycle
onMounted(() => {
  if (props.modelValue) {
    loadInitialData();
  }
  initializeForm();
});

// Methods
async function loadInitialData() {
  try {
    // Cargar subdependencias autorizadas
    await requestStore.fetchSubdependenciasAutorizadas();
    filteredSubdependenciaOptions.value =
      requestStore.subdependenciasAutorizadas;

    // Auto-seleccionar si solo hay una subdependencia
    if (requestStore.subdependenciasAutorizadas.length === 1) {
      selectedSubdependencia.value =
        requestStore.subdependenciasAutorizadas[0].id_subdependencia;
      await onSubdependenciaChange(selectedSubdependencia.value);
    }

    // Cargar tipos de combustible
    if (tipoCombustibleStore.rows.length === 0) {
      await tipoCombustibleStore.fetchTiposCombustible();
    }
    combustibleOptions.value = tipoCombustibleStore.rows;
  } catch (error) {
    console.error("Error cargando datos iniciales:", error);
    $q.notify({
      type: "negative",
      message: "Error al cargar datos iniciales",
    });
  }
}

async function onSubdependenciaChange(subId) {
  // IMPORTANTE: Actualizar el valor seleccionado primero
  selectedSubdependencia.value = subId;
  
  selectedVehicle.value = null;

  // Actualizar modalidad según subdependencia
  const sub = requestStore.subdependenciasAutorizadas.find(
    (s) => s.id_subdependencia === subId,
  );

  if (sub?.cobra_venta) {
    formData.value.tipo_solicitud = "VENTA";
  } else {
    formData.value.tipo_solicitud = "INSTITUCIONAL";
  }

  // Cargar vehículos y cupo si hay combustible seleccionado
  if (subId && selectedCombustible.value) {
    await fetchVehicles(subId, selectedCombustible.value);
    await fetchQuotaInfo();
  }
}

async function onCombustibleChange(combId) {
  // IMPORTANTE: Actualizar el valor seleccionado primero
  selectedCombustible.value = combId;
  
  formData.value.id_llenadero = null;
  selectedVehicle.value = null;
  selectedPrecioObj.value = null;
  precioOptions.value = [];

  if (!combId) {
    llenaderoOptions.value = [];
    return;
  }

  // Cargar llenaderos
  await requestStore.fetchLlenaderosPorCombustible(combId);
  llenaderoOptions.value = requestStore.llenaderosPorCombustible;

  // Cargar vehículos y cupo si hay subdependencia seleccionada
  if (selectedSubdependencia.value) {
    await fetchVehicles(selectedSubdependencia.value, combId);
    await fetchQuotaInfo();
  }

  // Cargar precios
  await loadPrecios(combId);
}

function formatAmount(amount) {
  const val = Number(amount);
  if (isNaN(val)) return amount;

  // Si tiene 2 decimales o menos (ej: 1.2000 -> 1.2)
  if (Math.abs(val * 100 - Math.round(val * 100)) < 0.001) {
    return val.toFixed(2);
  }
  // Si tiene más decimales (ej: 0.0250 -> 0.025)
  return parseFloat(val.toFixed(4)).toString();
}

async function loadPrecios(idTipoCombustible) {
  if (!idTipoCombustible) return;
  try {
    const response = await api.get(`/precios/combustible/${idTipoCombustible}`);
    precioOptions.value = response.data.map((p) => {
      const precioFmt = formatAmount(p.precio);
      return {
        ...p,
        etiqueta_precio: `${p.Moneda?.nombre}: ${precioFmt} x Lto`,
        precio_formateado: precioFmt,
      };
    });
  } catch (error) {
    console.error("Error cargando precios:", error);
  }
}

function handleFilterSubdependencias(val, update) {
  filterSubdependencias(val, update, requestStore.subdependenciasAutorizadas);
}

function handleFilterPlaca(val) {
  filterPlaca.value = val;
  triggerFilterVehicles(val);
}

async function handleSubmit() {
  await onSave();
}

function handleReset() {
  resetForm();
  resetFilters();
  llenaderoOptions.value = [];
  precioOptions.value = [];
}

function saveNote() {
  if (noteText.value.trim()) {
    $q.notify({
      type: "info",
      message: `Nota guardada: ${noteText.value}`,
    });
    noteText.value = "";
  }
}
</script>

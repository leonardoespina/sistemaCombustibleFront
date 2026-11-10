<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
    transition-show="scale"
    transition-hide="scale"
  >
    <q-card style="width: 850px; max-width: 95vw;" class="column no-wrap">
      <!-- Barra Superior -->
      <q-bar class="bg-primary text-white q-py-md">
        <q-icon name="alt_route" size="sm" />
        <div class="text-subtitle1 text-weight-bold q-ml-xs">
          Distribución Interna - Ticket Maestro: {{ ticketData?.codigo_ticket || '...' }}
        </div>
        <q-space />
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Cerrar</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section class="col scroll q-pa-md q-gutter-y-md">
        <!-- 1. Cabecera y Resumen de Balance -->
        <q-card flat bordered class="bg-grey-1">
          <q-card-section class="q-pa-sm">
            <div class="row items-center justify-between q-col-gutter-sm">
              <div class="col-12 col-sm-7">
                <div class="text-caption text-grey-7">Dependencia solicitante:</div>
                <div class="text-body2 text-weight-bolder text-grey-9">
                  {{ ticketData?.Dependencia?.nombre_dependencia || 'N/A' }}
                  <span v-if="ticketData?.Subdependencia">
                    - {{ ticketData.Subdependencia.nombre }}
                  </span>
                </div>
              </div>

              <div class="col-12 col-sm-5 text-right">
                <q-chip
                  :color="badgeColor"
                  text-color="white"
                  class="text-weight-bold"
                  icon="inventory_2"
                >
                  {{ resumen.estado_rendicion || 'PENDIENTE' }}
                </q-chip>
              </div>
            </div>

            <q-separator class="q-my-sm" />

            <!-- Métricas de Balance -->
            <div class="row q-col-gutter-sm text-center">
              <div class="col-4">
                <div class="text-caption text-grey-7">Despachado en Surtidor</div>
                <div class="text-h6 text-weight-bolder text-grey-9">
                  {{ formatNum(resumen.litros_despachados) }} L
                </div>
              </div>
              <div class="col-4">
                <div class="text-caption text-grey-7">Rendido / Distribuido</div>
                <div class="text-h6 text-weight-bolder text-primary">
                  {{ formatNum(resumen.total_distribuido) }} L
                </div>
              </div>
              <div class="col-4">
                <div class="text-caption text-grey-7">Saldo por Rendir</div>
                <div
                  class="text-h6 text-weight-bolder"
                  :class="resumen.litros_pendientes > 0 ? 'text-amber-9' : 'text-positive'"
                >
                  {{ formatNum(resumen.litros_pendientes) }} L
                </div>
              </div>
            </div>

            <!-- Barra de Progreso -->
            <div class="q-mt-sm">
              <q-linear-progress
                :value="progressRatio"
                :color="progressColor"
                size="12px"
                rounded
                class="q-mt-xs"
              />
              <div class="text-right text-caption text-grey-8 q-mt-xs">
                Avance: {{ resumen.porcentaje_distribuido || 0 }}%
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- 2. Formulario de Carga Rápida (Solo si queda saldo) -->
        <q-card v-if="resumen.litros_pendientes > 0" flat bordered class="bg-amber-1" style="border: 1px dashed #d97706;">
          <q-card-section class="q-pa-sm">
            <div class="text-subtitle2 text-weight-bold text-amber-10 q-mb-xs">
              <q-icon name="add_circle" class="q-mr-xs" /> Registrar Entrega a Equipo / Generador
            </div>

            <div class="row q-col-gutter-sm items-center">
              <!-- Selector de Equipo -->
              <div class="col-12 col-md-5">
                <div class="text-caption text-weight-bold text-grey-8">Equipo Receptor:</div>
                <q-select
                  v-model="newItem.id_vehiculo"
                  :options="filteredVehiculos"
                  option-value="id_vehiculo"
                  option-label="etiqueta"
                  emit-value
                  map-options
                  use-input
                  fill-input
                  hide-selected
                  @filter="filterVehiculos"
                  dense
                  outlined
                  square
                  bg-color="white"
                  placeholder="Buscar por placa, modelo o generador..."
                  :loading="loadingVehiculos"
                >
                  <template v-slot:no-option>
                    <q-item>
                      <q-item-section class="text-grey">
                        No se encontraron equipos activos
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>

              <!-- Litros a Asignar -->
              <div class="col-12 col-sm-6 col-md-3">
                <div class="text-caption text-weight-bold text-grey-8">Litros Entregados:</div>
                <q-input
                  v-model.number="newItem.cantidad_litros"
                  type="number"
                  dense
                  outlined
                  square
                  bg-color="white"
                  :max="resumen.litros_pendientes"
                  min="0.01"
                  step="0.01"
                  placeholder="Ej: 450"
                />
              </div>

              <!-- Observaciones -->
              <div class="col-12 col-sm-6 col-md-4">
                <div class="text-caption text-weight-bold text-grey-8">Frente / Ubicación / Nota:</div>
                <q-input
                  v-model="newItem.observaciones"
                  dense
                  outlined
                  square
                  bg-color="white"
                  placeholder="Ej: Frente Sur Nivel 4"
                  maxlength="200"
                />
              </div>
            </div>

            <div class="row justify-end q-mt-sm">
              <q-btn
                label="Asignar Combustible"
                icon="add"
                color="primary"
                dense
                unelevated
                class="q-px-md"
                :loading="saving"
                :disable="!canAddItem"
                @click="onAddItem"
              />
            </div>
          </q-card-section>
        </q-card>

        <q-banner v-else class="bg-positive text-white rounded-borders" dense>
          <template v-slot:avatar>
            <q-icon name="check_circle" size="md" />
          </template>
          El 100% del combustible de este ticket maestro ha sido distribuido y rendido en su totalidad.
        </q-banner>

        <!-- 3. Tabla de Distribuciones Realizadas -->
        <q-table
          title="Historial de Entregas Realizadas"
          :rows="distribuciones"
          :columns="columns"
          row-key="id_distribucion"
          dense
          flat
          bordered
          :loading="loading"
          no-data-label="No hay entregas registradas para este ticket"
          :pagination="{ rowsPerPage: 10 }"
        >
          <template v-slot:body-cell-vehiculo="props">
            <q-td :props="props">
              <div class="text-weight-bold text-grey-9">
                {{ props.row.Vehiculo?.placa || 'N/A' }}
              </div>
              <div class="text-caption text-grey-7">
                {{ props.row.Vehiculo?.marca }} {{ props.row.Vehiculo?.modelo }}
                <q-badge
                  v-if="props.row.Vehiculo?.es_generador"
                  color="purple"
                  label="GENERADOR"
                  class="q-ml-xs"
                />
                <q-badge
                  v-else-if="props.row.Vehiculo?.es_planta"
                  color="indigo"
                  label="PLANTA"
                  class="q-ml-xs"
                />
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-litros="props">
            <q-td :props="props" class="text-right">
              <span class="text-weight-bolder text-primary">
                {{ formatNum(props.row.cantidad_litros) }} L
              </span>
            </q-td>
          </template>

          <template v-slot:body-cell-fecha="props">
            <q-td :props="props">
              {{ formatFecha(props.row.fecha_distribucion) }}
            </q-td>
          </template>

          <template v-slot:body-cell-acciones="props">
            <q-td :props="props" class="text-right">
              <q-btn
                icon="delete"
                color="negative"
                dense
                round
                flat
                size="sm"
                @click="onDeleteItem(props.row)"
              >
                <q-tooltip>Eliminar asignación</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card-section>

      <!-- Pie de Diálogo -->
      <q-separator />
      <q-card-actions align="right" class="q-pa-sm bg-grey-2">
        <q-btn flat label="Cerrar" color="grey-8" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useQuasar } from "quasar";
import api from "../../api";

const props = defineProps({
  modelValue: Boolean,
  solicitudId: {
    type: [Number, String],
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "changed"]);
const $q = useQuasar();

// State
const loading = ref(false);
const loadingVehiculos = ref(false);
const saving = ref(false);

const ticketData = ref(null);
const resumen = ref({
  litros_despachados: 0,
  total_distribuido: 0,
  litros_pendientes: 0,
  porcentaje_distribuido: 0,
  estado_rendicion: "PENDIENTE",
});
const distribuciones = ref([]);
const vehiculosOptions = ref([]);
const filteredVehiculos = ref([]);

const newItem = ref({
  id_vehiculo: null,
  cantidad_litros: null,
  observaciones: "",
});

const columns = [
  { name: "vehiculo", label: "Equipo / Generador", align: "left" },
  { name: "litros", label: "Litros Entregados", align: "right" },
  { name: "observaciones", label: "Observaciones / Frente", field: "observaciones", align: "left" },
  { name: "fecha", label: "Fecha Asignación", align: "left" },
  {
    name: "registrador",
    label: "Registrado Por",
    field: (r) => r.Registrador?.nombre || "N/A",
    align: "left",
  },
  { name: "acciones", label: "Acciones", align: "right" },
];

// Computed
const canAddItem = computed(() => {
  return (
    newItem.value.id_vehiculo &&
    newItem.value.cantidad_litros > 0 &&
    newItem.value.cantidad_litros <= resumen.value.litros_pendientes
  );
});

const progressRatio = computed(() => {
  return Math.min(1, Math.max(0, (resumen.value.porcentaje_distribuido || 0) / 100));
});

const progressColor = computed(() => {
  if (resumen.value.porcentaje_distribuido >= 100) return "positive";
  if (resumen.value.porcentaje_distribuido > 0) return "primary";
  return "amber-9";
});

const badgeColor = computed(() => {
  switch (resumen.value.estado_rendicion) {
    case "COMPLETO":
      return "positive";
    case "EN_REPARTO":
      return "primary";
    default:
      return "amber-9";
  }
});

// Watcher de apertura
watch(
  () => props.modelValue,
  async (newVal) => {
    if (newVal && props.solicitudId) {
      resetNewItem();
      await cargarDatos();
      await cargarVehiculos();
    }
  }
);

// Helpers de formateo
function formatNum(val) {
  return new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);
}

function formatFecha(f) {
  if (!f) return "N/A";
  return new Date(f).toLocaleString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resetNewItem() {
  newItem.value = {
    id_vehiculo: null,
    cantidad_litros: null,
    observaciones: "",
  };
}

// Cargar Balance y Detalle
async function cargarDatos() {
  if (!props.solicitudId) return;
  loading.value = true;
  try {
    const res = await api.get(`/solicitudes/${props.solicitudId}/distribucion`);
    if (res.data?.success && res.data.data) {
      ticketData.value = res.data.data.solicitud;
      resumen.value = res.data.data.resumen;
      distribuciones.value = res.data.data.distribuciones || [];
    }
  } catch (error) {
    console.error("Error al cargar distribución:", error);
    $q.notify({
      type: "negative",
      message: error.response?.data?.msg || "Error al cargar datos de distribución.",
    });
  } finally {
    loading.value = false;
  }
}

// Cargar catálogo de vehículos de la gerencia
async function cargarVehiculos() {
  if (!props.solicitudId) return;
  loadingVehiculos.value = true;
  try {
    const res = await api.get(`/solicitudes/${props.solicitudId}/distribucion/vehiculos`);
    if (res.data?.success) {
      vehiculosOptions.value = res.data.data || [];
      filteredVehiculos.value = [...vehiculosOptions.value];
    }
  } catch (error) {
    console.error("Error al cargar vehículos:", error);
  } finally {
    loadingVehiculos.value = false;
  }
}

function filterVehiculos(val, update) {
  if (!val) {
    update(() => {
      filteredVehiculos.value = vehiculosOptions.value;
    });
    return;
  }
  const needle = val.toLowerCase();
  update(() => {
    filteredVehiculos.value = vehiculosOptions.value.filter(
      (v) =>
        v.placa.toLowerCase().includes(needle) ||
        v.marca.toLowerCase().includes(needle) ||
        v.modelo.toLowerCase().includes(needle) ||
        v.etiqueta.toLowerCase().includes(needle)
    );
  });
}

// Registrar Asignación
async function onAddItem() {
  if (!canAddItem.value) return;
  saving.value = true;
  try {
    const payload = {
      items: [
        {
          id_vehiculo: newItem.value.id_vehiculo,
          cantidad_litros: newItem.value.cantidad_litros,
          observaciones: newItem.value.observaciones,
        },
      ],
    };
    const res = await api.post(`/solicitudes/${props.solicitudId}/distribucion`, payload);
    if (res.data?.success) {
      $q.notify({
        type: "positive",
        message: "Asignación registrada exitosamente.",
      });
      resetNewItem();
      await cargarDatos();
      emit("changed");
    }
  } catch (error) {
    console.error("Error guardando asignación:", error);
    $q.notify({
      type: "negative",
      message: error.response?.data?.msg || "Error al guardar la asignación.",
    });
  } finally {
    saving.value = false;
  }
}

// Eliminar Asignación
function onDeleteItem(item) {
  $q.dialog({
    title: "Confirmar Eliminación",
    message: `¿Desea eliminar la asignación de ${item.cantidad_litros} L al equipo ${item.Vehiculo?.placa || ''}?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      const res = await api.delete(`/solicitudes/distribucion/${item.id_distribucion}`);
      if (res.data?.success) {
        $q.notify({
          type: "info",
          message: "Asignación eliminada.",
        });
        await cargarDatos();
        emit("changed");
      }
    } catch (error) {
      $q.notify({
        type: "negative",
        message: error.response?.data?.msg || "Error al eliminar la asignación.",
      });
    }
  });
}
</script>

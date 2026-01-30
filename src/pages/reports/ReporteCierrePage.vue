<template>
  <q-page class="q-pa-md page-background">
    <!-- HEADER -->
    <div class="row items-center q-mb-lg">
      <div class="col">
        <div class="text-h4 text-weight-bold">Historial de Cierres</div>
        <div class="text-subtitle1 text-grey-7">
          Consulta de actas de cierre de inventario por rango de fechas
        </div>
      </div>
    </div>

    <!-- FILTROS -->
    <q-card class="q-mb-md filter-card">
      <q-card-section>
        <div class="row q-col-gutter-md items-center">
          <div class="col-12 col-md-3">
            <q-input
              filled
              v-model="filtro.fechaInicio"
              label="Fecha Inicio"
              type="date"
              stack-label
            />
          </div>
          <div class="col-12 col-md-3">
            <q-input
              filled
              v-model="filtro.fechaFin"
              label="Fecha Fin"
              type="date"
              stack-label
            />
          </div>
          <div class="col-12 col-md-auto">
            <q-btn
              color="primary"
              icon="search"
              label="Buscar Actas"
              @click="fetchHistorial"
              :loading="loading"
              unelevated
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- TABLA DE ACTAS -->
    <q-card class="table-card">
      <q-table
        flat
        :rows="actas"
        :columns="columnsActas"
        row-key="grupo_cierre_uuid"
        :loading="loading"
        no-data-label="No se encontraron actas en el rango seleccionado"
        :pagination="paginationActas"
      >
        <template #body-cell-acciones="props">
          <q-td :props="props" class="text-center">
            <q-btn
              flat
              round
              color="primary"
              icon="visibility"
              @click="verDetalle(props.row)"
            >
              <q-tooltip>Ver Despachos</q-tooltip>
            </q-btn>
          </q-td>
        </template>

        <template #body-cell-fecha_cierre="props">
          <q-td :props="props">
            {{ formatDate(props.row.fecha_cierre) }}
          </q-td>
        </template>

        <template #body-cell-turno="props">
          <q-td :props="props">
            <q-chip
              dense
              :color="props.row.turno === 'DIURNO' ? 'orange-2' : 'indigo-2'"
              :text-color="
                props.row.turno === 'DIURNO' ? 'orange-9' : 'indigo-9'
              "
              :icon="props.row.turno === 'DIURNO' ? 'wb_sunny' : 'nights_stay'"
            >
              {{ props.row.turno }}
            </q-chip>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- DIALOGO DETALLE DESPACHOS -->
    <q-dialog v-model="showModal" full-width>
      <q-card class="column full-height" style="max-height: 90vh">
        <q-card-section class="row items-center q-pb-none bg-grey-2">
          <div class="text-h6">Detalle de Despachos</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-sm bg-grey-2">
          <div class="row q-gutter-sm text-subtitle2">
            <div>
              Fecha Acta:
              <span class="text-weight-bold">{{
                formatDate(selectedActa?.fecha_cierre)
              }}</span>
            </div>
            <div>
              Turno:
              <span class="text-weight-bold">{{ selectedActa?.turno }}</span>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="col q-pa-none scroll">
          <q-table
            flat
            :rows="despachos"
            :columns="columnsDespachos"
            row-key="id_despacho"
            :loading="loadingDetalle"
            :pagination="paginationDespachos"
            class="sticky-header-table"
          >
            <template #body-cell-fecha_hora="props">
              <q-td :props="props">
                {{ formatDateTime(props.row.fecha_hora) }}
              </q-td>
            </template>

            <template #body-cell-cantidad="props">
              <q-td :props="props" class="text-right">
                <span class="text-weight-bold">{{
                  formatNumber(props.value)
                }}</span>
                Lts
              </q-td>
            </template>

            <template #body-cell-tipo_combustible="props">
              <q-td :props="props">
                <q-badge
                  :color="props.value === 'GASOLINA' ? 'amber' : 'deep-purple'"
                >
                  {{ props.value }}
                </q-badge>
              </q-td>
            </template>

            <template #bottom-row>
              <q-tr class="bg-grey-2 text-weight-bold">
                <q-td colspan="6" class="text-right">Total Despachado:</q-td>
                <q-td class="text-right"
                  >{{ formatNumber(totalLitrosDespachados) }} Lts</q-td
                >
                <q-td></q-td>
              </q-tr>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { date, useQuasar } from "quasar";
import api from "../../api/index.js";

const $q = useQuasar();

// ESTADO
const loading = ref(false);
const loadingDetalle = ref(false);
const showModal = ref(false);
const actas = ref([]);
const despachos = ref([]);
const selectedActa = ref(null);

const filtro = ref({
  fechaInicio: "",
  fechaFin: "",
});

const paginationActas = ref({
  rowsPerPage: 10,
});

const paginationDespachos = ref({
  rowsPerPage: 0, // Mostrar todos por defecto en el modal
});

// COLUMNAS
const columnsActas = [
  {
    name: "fecha_cierre",
    label: "Fecha Cierre",
    field: "fecha_cierre",
    sortable: true,
    align: "left",
  },
  {
    name: "turno",
    label: "Turno",
    field: "turno",
    sortable: true,
    align: "center",
  },
  {
    name: "tanques_involucrados",
    label: "Tanques",
    field: "tanques_involucrados",
    align: "center",
  },
  { name: "acciones", label: "Acciones", align: "center" },
];

const columnsDespachos = [
  {
    name: "fecha_hora",
    label: "Hora",
    field: "fecha_hora",
    sortable: true,
    align: "left",
  },
  { name: "ticket", label: "Ticket", field: "ticket", align: "left" },
  { name: "placa", label: "Placa", field: "placa", align: "left" },
  { name: "vehiculo", label: "Vehículo", field: "vehiculo", align: "left" },
  {
    name: "tipo_combustible",
    label: "Combustible",
    field: "tipo_combustible",
    sortable: true,
    align: "center",
  },
  {
    name: "dispensador",
    label: "Dispensador",
    field: "dispensador",
    align: "center",
  },
  {
    name: "cantidad",
    label: "Cantidad",
    field: "cantidad",
    sortable: true,
    align: "right",
  },
  { name: "usuario", label: "Despachador", field: "usuario", align: "left" },
];

// COMPUTED
const totalLitrosDespachados = computed(() => {
  return despachos.value.reduce(
    (acc, d) => acc + parseFloat(d.cantidad || 0),
    0
  );
});

// MÉTODOS
const formatDate = (val) => {
  return val ? date.formatDate(val, "DD/MM/YYYY") : "-";
};

const formatDateTime = (val) => {
  return val ? date.formatDate(val, "DD/MM/YYYY HH:mm") : "-";
};

const formatNumber = (val) => {
  return new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2 }).format(
    val
  );
};

// Cargar Historial
const fetchHistorial = async () => {
  if (!filtro.value.fechaInicio || !filtro.value.fechaFin) {
    $q.notify({ type: "warning", message: "Seleccione ambas fechas" });
    return;
  }

  loading.value = true;
  try {
    const params = {
      fechaInicio: filtro.value.fechaInicio,
      fechaFin: filtro.value.fechaFin,
    };
    const response = await api.get("/reportes/historial-cierres", { params });
    actas.value = response.data;
  } catch (error) {
    console.error(error);
    $q.notify({ type: "negative", message: "Error al cargar historial" });
    actas.value = [];
  } finally {
    loading.value = false;
  }
};

// Ver Detalle
const verDetalle = async (acta) => {
  selectedActa.value = acta;
  showModal.value = true;
  loadingDetalle.value = true;
  despachos.value = [];

  try {
    const response = await api.get(
      `/reportes/historial-cierres/${acta.grupo_cierre_uuid}/despachos`
    );
    despachos.value = response.data;
  } catch (error) {
    console.error(error);
    $q.notify({
      type: "negative",
      message: "Error al cargar detalles del acta",
    });
  } finally {
    loadingDetalle.value = false;
  }
};

// Inicializar fechas por defecto (Mes actual)
onMounted(() => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  filtro.value.fechaInicio = date.formatDate(firstDay, "YYYY-MM-DD");
  filtro.value.fechaFin = date.formatDate(today, "YYYY-MM-DD");
  // Opcional: Cargar automáticamente al entrar
  // fetchHistorial();
});
</script>

<style lang="scss" scoped>
.page-background {
  background: #f5f7fa;
  min-height: 100vh;
}
.filter-card,
.table-card {
  border-radius: 12px;
}
.sticky-header-table {
  /* Altura máxima para el scroll dentro del modal */
  max-height: 60vh;

  :deep(thead tr th) {
    position: sticky;
    top: 0;
    z-index: 1;
    background: #fff;
  }
}
</style>

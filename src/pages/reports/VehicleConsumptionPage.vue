<template>
  <q-page class="q-pa-md bg-grey-2">
    <div class="q-gutter-y-md">
      <!-- Header -->
      <div class="row items-center q-mb-md">
        <div class="col">
          <h4 class="text-h4 q-my-none text-weight-bold text-primary">
            <q-icon name="directions_car" class="q-mr-sm" />
            Consumo por Vehículo
          </h4>
          <p class="text-grey-7 q-mb-none">
            Reporte detallado de consumo de combustible por unidad
          </p>
        </div>
      </div>

      <!-- Filtros -->
      <q-card flat bordered class="shadow-2">
        <q-card-section class="bg-primary text-white q-py-sm">
          <div class="text-subtitle1">
            <q-icon name="filter_alt" class="q-mr-xs" />
            Filtros de Búsqueda
          </div>
        </q-card-section>

        <q-card-section>
          <div class="row q-col-gutter-md items-end">
            <div class="col-12 col-md-3">
              <q-input
                outlined
                v-model="fechaInicio"
                type="date"
                label="Fecha Desde"
                dense
              >
                <template v-slot:prepend>
                  <q-icon name="event" color="primary" />
                </template>
              </q-input>
            </div>
            <div class="col-12 col-md-3">
              <q-input
                outlined
                v-model="fechaFin"
                type="date"
                label="Fecha Hasta"
                dense
              >
                <template v-slot:prepend>
                  <q-icon name="event" color="primary" />
                </template>
              </q-input>
            </div>
            <div class="col-12 col-md-3">
              <q-select
                outlined
                v-model="placa"
                use-input
                input-debounce="0"
                label="Placa (Opcional)"
                :options="vehiculosOptions"
                @filter="filterVehiculos"
                option-value="placa"
                option-label="placa"
                emit-value
                map-options
                dense
                clearable
              >
                <template v-slot:prepend>
                  <q-icon name="directions_car" color="primary" />
                </template>
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      No se encontraron resultados
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
            <div class="col-12 col-md-3">
              <div class="row q-gutter-sm">
                <q-btn
                  color="primary"
                  icon="search"
                  label="Consultar"
                  @click="handleSearch"
                  :loading="loading"
                  class="col"
                  unelevated
                />
                <q-btn
                  flat
                  color="grey-7"
                  icon="refresh"
                  @click="resetFiltros"
                  :disable="loading"
                >
                  <q-tooltip>Limpiar filtros</q-tooltip>
                </q-btn>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Cards Resumen (Solo si hay datos) -->
      <!-- Nota: Los totales aquí solo reflejan la página actual si es paginado servidor -->
      <!-- Para totales globales se requeriría otro endpoint o calcularlo diferente -->
      <div class="row q-col-gutter-md" v-if="reportData.length > 0">
        <div class="col-12 col-md-3">
          <q-card flat bordered class="bg-blue-1">
            <q-card-section>
              <div class="row items-center no-wrap">
                <div class="col">
                  <div class="text-grey-8">Total Vehículos (Pág)</div>
                  <div class="text-h4 text-primary text-weight-bold">
                    {{ reportData.length }}
                  </div>
                </div>
                <q-icon
                  name="directions_car"
                  size="2.5rem"
                  color="primary"
                  class="q-ml-md"
                />
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-3">
          <q-card flat bordered class="bg-green-1">
            <q-card-section>
              <div class="row items-center no-wrap">
                <div class="col">
                  <div class="text-grey-8">Total Gasolina (Pág)</div>
                  <div class="text-h5 text-green-8 text-weight-bold">
                    {{ formatNumber(totalGasolina) }} L
                  </div>
                </div>
                <q-icon
                  name="local_gas_station"
                  size="2.5rem"
                  color="green-8"
                  class="q-ml-md"
                />
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-3">
          <q-card flat bordered class="bg-amber-1">
            <q-card-section>
              <div class="row items-center no-wrap">
                <div class="col">
                  <div class="text-grey-8">Total Gasoil (Pág)</div>
                  <div class="text-h5 text-amber-9 text-weight-bold">
                    {{ formatNumber(totalGasoil) }} L
                  </div>
                </div>
                <q-icon
                  name="oil_barrel"
                  size="2.5rem"
                  color="amber-9"
                  class="q-ml-md"
                />
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-3">
          <q-card flat bordered class="bg-grey-1">
            <q-card-section>
              <div class="row items-center no-wrap">
                <div class="col">
                  <div class="text-grey-8">Total General (Pág)</div>
                  <div class="text-h5 text-grey-9 text-weight-bold">
                    {{ formatNumber(totalGeneral) }} L
                  </div>
                </div>
                <q-icon
                  name="functions"
                  size="2.5rem"
                  color="grey-8"
                  class="q-ml-md"
                />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Tabla de Datos -->
      <q-card flat bordered class="shadow-2" v-if="hasSearched">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6 text-grey-8">
            <q-icon name="table_chart" class="q-mr-sm" color="primary" />
            Resultados
          </div>
          <q-btn
            flat
            color="primary"
            icon="download"
            label="Exportar CSV (Página Actual)"
            @click="exportarDatos"
            :disable="reportData.length === 0"
          />
        </q-card-section>

        <q-separator />

        <q-table
          flat
          :rows="reportData"
          :columns="columns"
          row-key="placa"
          v-model:pagination="pagination"
          @request="onRequest"
          :loading="loading"
          binary-state-sort
        >
          <!-- Filtro removido porque la paginación es servidor -->

          <template v-slot:body-cell-placa="props">
            <q-td :props="props">
              <q-badge color="primary" :label="props.value" />
            </q-td>
          </template>

          <template v-slot:body-cell-gasolina="props">
            <q-td :props="props" class="text-green-8 text-weight-medium">
              {{ formatNumber(props.value) }}
            </q-td>
          </template>

          <template v-slot:body-cell-gasoil="props">
            <q-td :props="props" class="text-amber-9 text-weight-medium">
              {{ formatNumber(props.value) }}
            </q-td>
          </template>

          <template v-slot:body-cell-total="props">
            <q-td :props="props" class="text-weight-bold">
              {{ formatNumber(props.value) }}
            </q-td>
          </template>
        </q-table>
      </q-card>

      <!-- Banner sin datos -->
      <q-banner
        v-else-if="hasSearched && !loading && reportData.length === 0"
        class="bg-orange-1 text-orange-9 rounded-borders"
        rounded
      >
        <template v-slot:avatar>
          <q-icon name="info" color="orange" />
        </template>
        No se encontraron vehículos con consumo para los filtros seleccionados.
      </q-banner>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import api from "../../api/index.js";
import { date, exportFile, useQuasar } from "quasar";

const $q = useQuasar();

// Fechas por defecto: mes actual
const today = new Date();
const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

const fechaInicio = ref(date.formatDate(firstDay, "YYYY-MM-DD"));
const fechaFin = ref(date.formatDate(today, "YYYY-MM-DD"));
const placa = ref("");
const vehiculosOptions = ref([]);
const vehiculos = ref([]);

const loading = ref(false);
const hasSearched = ref(false);
const reportData = ref([]);

const pagination = ref({
  sortBy: "placa",
  descending: false,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 10, // specify this to enable server-side pagination
});

const columns = [
  {
    name: "placa",
    label: "Placa",
    field: "placa",
    align: "left",
    sortable: false, // Sort server side not implemented in controller yet fully (default order by placa)
  },
  {
    name: "vehiculo",
    label: "Vehículo",
    field: "vehiculo",
    align: "left",
    sortable: false,
  },
  {
    name: "gasolina",
    label: "Gasolina (L)",
    field: "gasolina",
    align: "right",
    sortable: false,
  },
  {
    name: "gasoil",
    label: "Gasoil (L)",
    field: "gasoil",
    align: "right",
    sortable: false,
  },
  {
    name: "total",
    label: "Total (L)",
    field: "total",
    align: "right",
    sortable: false,
  },
  {
    name: "cantidad_despachos",
    label: "# Despachos",
    field: "cantidad_despachos",
    align: "center",
    sortable: false,
  },
];

const totalGasolina = computed(() =>
  reportData.value.reduce((acc, curr) => acc + curr.gasolina, 0)
);
const totalGasoil = computed(() =>
  reportData.value.reduce((acc, curr) => acc + curr.gasoil, 0)
);
const totalGeneral = computed(() =>
  reportData.value.reduce((acc, curr) => acc + curr.total, 0)
);

function formatNumber(num) {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function resetFiltros() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  fechaInicio.value = date.formatDate(firstDay, "YYYY-MM-DD");
  fechaFin.value = date.formatDate(today, "YYYY-MM-DD");
  placa.value = "";
  reportData.value = [];
  hasSearched.value = false;
  pagination.value.page = 1;
  pagination.value.rowsNumber = 0;
}

onMounted(async () => {
  try {
    // Cargar lista de vehículos para el autocomplete
    const res = await api.get("/vehiculos/lista");
    vehiculos.value = res.data; // Se asume que devuelve array de objetos con propiedad 'placa'
    vehiculosOptions.value = vehiculos.value;
  } catch (error) {
    console.error("Error al cargar lista de vehículos", error);
  }
});

function filterVehiculos(val, update) {
  if (val === "") {
    update(() => {
      vehiculosOptions.value = vehiculos.value;
    });
    return;
  }

  update(() => {
    const needle = val.toLowerCase();
    vehiculosOptions.value = vehiculos.value.filter(
      (v) => v.placa.toLowerCase().indexOf(needle) > -1
    );
  });
}

// Handler para el botón de búsqueda
function handleSearch() {
  pagination.value.page = 1;
  onRequest({
    pagination: pagination.value,
    filter: undefined,
  });
}

// Función principal de carga de datos (Paginación Servidor)
async function onRequest(props) {
  if (!fechaInicio.value || !fechaFin.value) {
    $q.notify({ type: "warning", message: "Debe seleccionar fechas" });
    return;
  }

  const { page, rowsPerPage } = props.pagination;

  loading.value = true;
  hasSearched.value = true;

  try {
    const params = {
      fechaInicio: fechaInicio.value,
      fechaFin: fechaFin.value,
      page: page,
      limit: rowsPerPage,
    };
    if (placa.value.trim()) {
      params.placa = placa.value.trim();
    }

    const response = await api.get("/reportes/consumo-vehiculo", { params });

    // API devuelve { data: [...], pagination: { totalItems, totalPages, currentPage, limit } }
    reportData.value = response.data.data;

    // Actualizar paginación local
    pagination.value.page = response.data.pagination.currentPage;
    pagination.value.rowsNumber = response.data.pagination.totalItems;
    pagination.value.rowsPerPage = response.data.pagination.limit;

    // No notificamos cada vez que cambia página para no molestar, solo si es búsqueda inicial y hay datos
    if (page === 1 && reportData.value.length > 0) {
      $q.notify({
        type: "positive",
        message: `Se encontraron ${response.data.pagination.totalItems} registros`,
        timeout: 1000,
      });
    }
  } catch (error) {
    console.error(error);
    $q.notify({ type: "negative", message: "Error al consultar reporte" });
    reportData.value = [];
  } finally {
    loading.value = false;
  }
}

function exportarDatos() {
  const BOM = "\uFEFF";
  const header = [
    "Placa",
    "Vehículo",
    "Gasolina",
    "Gasoil",
    "Total",
    "Despachos",
  ];
  const rows = reportData.value.map((r) => [
    r.placa,
    r.vehiculo,
    r.gasolina.toFixed(2),
    r.gasoil.toFixed(2),
    r.total.toFixed(2),
    r.cantidad_despachos,
  ]);

  // Totales row (de la página actual)
  rows.push([
    "TOTALES (PÁG)",
    "",
    totalGasolina.value.toFixed(2),
    totalGasoil.value.toFixed(2),
    totalGeneral.value.toFixed(2),
    "",
  ]);

  const content =
    BOM + [header, ...rows].map((row) => row.join(";")).join("\n");
  const fileName = `consumo-vehiculos-${fechaInicio.value}-a-${fechaFin.value}.csv`;

  const status = exportFile(fileName, content, "text/csv;charset=utf-8");
  if (!status) {
    $q.notify({ type: "negative", message: "Error al exportar archivo" });
  }
}
</script>

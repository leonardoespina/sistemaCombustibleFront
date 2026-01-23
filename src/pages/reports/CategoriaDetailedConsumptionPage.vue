<template>
  <q-page class="q-pa-md bg-grey-2">
    <div class="q-gutter-y-md">
      <!-- Header -->
      <div class="row items-center q-mb-md">
        <div class="col">
          <h4 class="text-h4 q-my-none text-weight-bold text-primary">
            <q-icon name="analytics" class="q-mr-sm" />
            Reporte Detallado por Gerencia/Entes
          </h4>
          <p class="text-grey-7 q-mb-none">
            Consumo desglosado de Gasolina y Gasoil por Gerencia/Entes
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
                v-model="selectedGerencia"
                :options="gerenciaOptions"
                option-value="id_gerencia"
                option-label="nombre"
                label="Filtrar por Gerencia (Opcional)"
                dense
                clearable
                emit-value
                map-options
                use-input
                input-debounce="300"
                @filter="filterGerencias"
              >
                <template v-slot:prepend>
                  <q-icon name="business" color="primary" />
                </template>
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      Sin resultados
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
                  @click="consultar"
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

      <!-- Cards de resumen -->
      <div class="row q-col-gutter-md" v-if="chartData.length > 0">
        <!-- Total Gasolina -->
        <div class="col-12 col-md-3">
          <q-card flat bordered class="bg-green-1">
            <q-card-section>
              <div class="row items-center no-wrap">
                <div class="col">
                  <div class="text-grey-8">Total Gasolina</div>
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

        <!-- Total Gasoil -->
        <div class="col-12 col-md-3">
          <q-card flat bordered class="bg-amber-1">
            <q-card-section>
              <div class="row items-center no-wrap">
                <div class="col">
                  <div class="text-grey-8">Total Gasoil</div>
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

        <!-- Total General -->
        <div class="col-12 col-md-3">
          <q-card flat bordered class="bg-blue-1">
            <q-card-section>
              <div class="row items-center no-wrap">
                <div class="col">
                  <div class="text-grey-8">Total General</div>
                  <div class="text-h5 text-primary text-weight-bold">
                    {{ formatNumber(totalGeneral) }} L
                  </div>
                </div>
                <q-icon
                  name="functions"
                  size="2.5rem"
                  color="primary"
                  class="q-ml-md"
                />
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Mayor Consumidor -->
        <div class="col-12 col-md-3">
          <q-card flat bordered class="bg-orange-1">
            <q-card-section>
              <div class="row items-center no-wrap">
                <div class="col">
                  <div class="text-grey-8">Mayor Consumidor</div>
                  <div
                    class="text-h6 text-orange-8 text-weight-bold ellipsis"
                    :title="mayorConsumidor"
                  >
                    {{ mayorConsumidor }}
                  </div>
                </div>
                <q-icon
                  name="trending_up"
                  size="2.5rem"
                  color="orange-8"
                  class="q-ml-md"
                />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Gráfico -->
      <q-card flat bordered class="shadow-2" v-if="chartData.length > 0">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6 text-grey-8">
            <q-icon name="bar_chart" class="q-mr-sm" color="primary" />
            Comparativa de Consumo
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div ref="chartRef" style="width: 100%; height: 450px"></div>
        </q-card-section>
      </q-card>

      <!-- Tabla de datos -->
      <q-card flat bordered class="shadow-2" v-if="chartData.length > 0">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6 text-grey-8">
            <q-icon name="table_chart" class="q-mr-sm" color="primary" />
            Detalle por Gerencia
          </div>
          <q-btn
            flat
            color="primary"
            icon="download"
            label="Exportar"
            @click="exportarDatos"
          />
        </q-card-section>

        <q-separator />

        <q-table
          flat
          :rows="chartData"
          :columns="columns"
          row-key="id_gerencia"
          :pagination="{ rowsPerPage: 10 }"
          class="my-sticky-header-table"
        >
          <template v-slot:body-cell-gerencia="props">
            <q-td :props="props">
              <span class="text-weight-medium">{{ props.row.nombre }}</span>
            </q-td>
          </template>

          <template v-slot:body-cell-gasolina="props">
            <q-td :props="props">
              <q-badge
                color="green-1"
                text-color="green-9"
                class="text-weight-bold"
              >
                {{ formatNumber(props.row.gasolina) }} L
              </q-badge>
            </q-td>
          </template>

          <template v-slot:body-cell-gasoil="props">
            <q-td :props="props">
              <q-badge
                color="amber-1"
                text-color="amber-9"
                class="text-weight-bold"
              >
                {{ formatNumber(props.row.gasoil) }} L
              </q-badge>
            </q-td>
          </template>

          <template v-slot:body-cell-total="props">
            <q-td :props="props">
              <div class="text-weight-bold text-primary">
                {{ formatNumber(props.row.total) }} L
              </div>
            </q-td>
          </template>
        </q-table>
      </q-card>

      <!-- Banner sin datos -->
      <q-banner
        v-else-if="hasSearched && !loading"
        class="bg-orange-1 text-orange-9 rounded-borders"
        rounded
      >
        <template v-slot:avatar>
          <q-icon name="info" color="orange" />
        </template>
        No se encontraron datos para los filtros seleccionados.
      </q-banner>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onBeforeUnmount } from "vue";
import * as echarts from "echarts";
import api from "../../api/index.js";
import { date, exportFile, useQuasar } from "quasar";

const $q = useQuasar();

// --- STATE ---
const today = new Date();
const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

const fechaInicio = ref(date.formatDate(firstDay, "YYYY-MM-DD"));
const fechaFin = ref(date.formatDate(today, "YYYY-MM-DD"));
const selectedGerencia = ref(null);
const gerenciaOptions = ref([]);
const allGerencias = ref([]); // Para cachear la lista completa

const loading = ref(false);
const chartData = ref([]);
const hasSearched = ref(false);
const chartRef = ref(null);
let myChart = null;

// --- COLUMNS ---
const columns = [
  {
    name: "gerencia",
    label: "Gerencia",
    field: "nombre",
    align: "left",
    sortable: true,
  },
  {
    name: "gasolina",
    label: "Gasolina",
    field: "gasolina",
    align: "center",
    sortable: true,
  },
  {
    name: "gasoil",
    label: "Gasoil",
    field: "gasoil",
    align: "center",
    sortable: true,
  },
  {
    name: "total",
    label: "Total General",
    field: "total",
    align: "center",
    sortable: true,
  },
];

// --- COMPUTED ---
const totalGasolina = computed(() => {
  return chartData.value.reduce((sum, item) => sum + item.gasolina, 0);
});

const totalGasoil = computed(() => {
  return chartData.value.reduce((sum, item) => sum + item.gasoil, 0);
});

const totalGeneral = computed(() => {
  return chartData.value.reduce((sum, item) => sum + item.total, 0);
});

const mayorConsumidor = computed(() => {
  if (chartData.value.length === 0) return "-";
  // Asumimos que viene ordenado por total descendente desde el backend
  return chartData.value[0].nombre;
});

// --- METHODS ---
function formatNumber(num) {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

// Cargar lista de gerencias para el filtro
async function loadGerencias() {
  try {
    // Pedimos un límite alto para llenar el combo
    const response = await api.get("/gerencias", {
      params: { limit: 1000, sortBy: "nombre", descending: false },
    });
    allGerencias.value = response.data.data;
    gerenciaOptions.value = allGerencias.value;
  } catch (error) {
    console.error("Error cargando gerencias", error);
  }
}

// Filtro local para el q-select
function filterGerencias(val, update) {
  if (val === "") {
    update(() => {
      gerenciaOptions.value = allGerencias.value;
    });
    return;
  }
  update(() => {
    const needle = val.toLowerCase();
    gerenciaOptions.value = allGerencias.value.filter(
      (v) => v.nombre.toLowerCase().indexOf(needle) > -1
    );
  });
}

function resetFiltros() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  fechaInicio.value = date.formatDate(firstDay, "YYYY-MM-DD");
  fechaFin.value = date.formatDate(today, "YYYY-MM-DD");
  selectedGerencia.value = null;
  chartData.value = [];
  hasSearched.value = false;
  disposeChart();

  $q.notify({
    type: "info",
    message: "Filtros restablecidos",
    position: "top",
    timeout: 1000,
  });
}

async function consultar() {
  if (!fechaInicio.value || !fechaFin.value) {
    $q.notify({
      type: "warning",
      message: "Por favor seleccione un rango de fechas",
      position: "top",
    });
    return;
  }

  if (new Date(fechaInicio.value) > new Date(fechaFin.value)) {
    $q.notify({
      type: "negative",
      message: "La fecha de inicio no puede ser mayor que la fecha fin",
      position: "top",
    });
    return;
  }

  loading.value = true;
  hasSearched.value = true;
  chartData.value = [];

  try {
    const params = {
      fechaInicio: fechaInicio.value,
      fechaFin: fechaFin.value,
    };
    if (selectedGerencia.value) {
      params.id_gerencia = selectedGerencia.value;
    }

    const response = await api.get("/reportes/consumo-detallado-gerencia", {
      params,
    });
    chartData.value = response.data;

    if (chartData.value.length > 0) {
      await nextTick();
      initChart();
      $q.notify({
        type: "positive",
        message: `Reporte generado con ${chartData.value.length} registros`,
        position: "top",
        timeout: 2000,
      });
    } else {
      disposeChart();
    }
  } catch (error) {
    console.error("Error generando reporte", error);
    $q.notify({
      type: "negative",
      message: "Error al consultar los datos",
      position: "top",
    });
  } finally {
    loading.value = false;
  }
}

function initChart() {
  if (!chartRef.value) return;
  if (myChart) myChart.dispose();

  myChart = echarts.init(chartRef.value);

  const gerencias = chartData.value.map((item) => item.nombre);
  const dataGasolina = chartData.value.map((item) => item.gasolina);
  const dataGasoil = chartData.value.map((item) => item.gasoil);

  const option = {
    title: {
      text: "Consumo por Combustible",
      left: "center",
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
    },
    legend: {
      data: ["Gasolina", "Gasoil"],
      bottom: 0,
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: gerencias,
      axisLabel: {
        rotate: gerencias.length > 5 ? 30 : 0,
        interval: 0,
      },
    },
    yAxis: {
      type: "value",
      name: "Litros",
    },
    series: [
      {
        name: "Gasolina",
        type: "bar",
        stack: "total",
        barMaxWidth: 60,
        emphasis: { focus: "series" },
        data: dataGasolina,
        itemStyle: { color: "#4CAF50" }, // Verde
      },
      {
        name: "Gasoil",
        type: "bar",
        stack: "total",
        barMaxWidth: 60,
        emphasis: { focus: "series" },
        data: dataGasoil,
        itemStyle: { color: "#FF9800" }, // Naranja
      },
    ],
  };

  myChart.setOption(option);
}

function disposeChart() {
  if (myChart) {
    myChart.dispose();
    myChart = null;
  }
}

function exportarDatos() {
  const BOM = "\uFEFF";
  const content =
    BOM +
    [
      ["Gerencia", "Gasolina (L)", "Gasoil (L)", "Total (L)"],
      ...chartData.value.map((item) => [
        item.nombre,
        item.gasolina.toFixed(2),
        item.gasoil.toFixed(2),
        item.total.toFixed(2),
      ]),
      [],
      [
        "TOTALES",
        totalGasolina.value.toFixed(2),
        totalGasoil.value.toFixed(2),
        totalGeneral.value.toFixed(2),
      ],
    ]
      .map((row) => row.join(";"))
      .join("\n");

  const fileName = `consumo-detallado-${fechaInicio.value}-a-${fechaFin.value}.csv`;
  const status = exportFile(fileName, content, "text/csv;charset=utf-8");

  if (status) {
    $q.notify({ type: "positive", message: "Exportado correctamente" });
  } else {
    $q.notify({ type: "negative", message: "Error al exportar" });
  }
}

const resizeHandler = () => {
  if (myChart) myChart.resize();
};

onMounted(() => {
  loadGerencias();
  window.addEventListener("resize", resizeHandler);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeHandler);
  disposeChart();
});
</script>

<style scoped>
.my-sticky-header-table {
  max-height: 400px;
}
.my-sticky-header-table thead tr:first-child th {
  background-color: white;
  z-index: 1;
}
</style>

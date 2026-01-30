<template>
  <q-page class="q-pa-md bg-grey-2">
    <div class="q-gutter-y-md">
      <!-- Header mejorado -->
      <div class="row items-center q-mb-md">
        <div class="col">
          <h4 class="text-h4 q-my-none text-weight-bold text-primary">
            <q-icon name="analytics" class="q-mr-sm" />
            Consumo por Gerencia/Entes
          </h4>
          <p class="text-grey-7 q-mb-none">
            Análisis de consumo de combustible por área
          </p>
        </div>
      </div>

      <!-- Filtros con mejor diseño -->
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
                v-model="tipoCombustible"
                :options="fuelOptions"
                label="Tipo Combustible"
                dense
                emit-value
                map-options
              >
                <template v-slot:prepend>
                  <q-icon
                    :name="
                      tipoCombustible === 'GASOLINA'
                        ? 'local_gas_station'
                        : 'oil_barrel'
                    "
                    :color="tipoCombustible === 'GASOLINA' ? 'green' : 'amber'"
                  />
                </template>

                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <q-icon
                        :name="
                          scope.opt.value === 'GASOLINA'
                            ? 'local_gas_station'
                            : 'oil_barrel'
                        "
                        :color="
                          scope.opt.value === 'GASOLINA' ? 'green' : 'amber'
                        "
                      />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ scope.opt.label }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>

                <template v-slot:selected-item="scope">
                  <q-chip
                    dense
                    :color="
                      scope.opt.value === 'GASOLINA' ? 'green-2' : 'amber-2'
                    "
                    :text-color="
                      scope.opt.value === 'GASOLINA' ? 'green-9' : 'amber-9'
                    "
                  >
                    <q-icon
                      :name="
                        scope.opt.value === 'GASOLINA'
                          ? 'local_gas_station'
                          : 'oil_barrel'
                      "
                      size="xs"
                      class="q-mr-xs"
                    />
                    {{ scope.opt.label }}
                  </q-chip>
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
        <!-- Card tipo combustible -->
        <div class="col-12 col-md-3">
          <q-card
            flat
            bordered
            :class="
              tipoCombustible === 'GASOLINA' ? 'bg-green-1' : 'bg-amber-1'
            "
          >
            <q-card-section>
              <div class="row items-center no-wrap">
                <div class="col">
                  <div class="text-grey-8">Combustible</div>
                  <div
                    class="text-h5 text-weight-bold"
                    :class="
                      tipoCombustible === 'GASOLINA'
                        ? 'text-green-8'
                        : 'text-amber-9'
                    "
                  >
                    {{ tipoCombustible }}
                  </div>
                </div>
                <q-icon
                  :name="
                    tipoCombustible === 'GASOLINA'
                      ? 'local_gas_station'
                      : 'oil_barrel'
                  "
                  size="2.5rem"
                  :color="
                    tipoCombustible === 'GASOLINA' ? 'green-8' : 'amber-9'
                  "
                  class="q-ml-md"
                />
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Total Gerencias -->
        <div class="col-12 col-md-3">
          <q-card flat bordered class="bg-blue-1">
            <q-card-section>
              <div class="row items-center no-wrap">
                <div class="col">
                  <div class="text-grey-8">Total Gerencias</div>
                  <div class="text-h4 text-primary text-weight-bold">
                    {{ chartData.length }}
                  </div>
                </div>
                <q-icon
                  name="business"
                  size="2.5rem"
                  color="primary"
                  class="q-ml-md"
                />
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Consumo Total -->
        <div class="col-12 col-md-3">
          <q-card flat bordered class="bg-teal-1">
            <q-card-section>
              <div class="row items-center no-wrap">
                <div class="col">
                  <div class="text-grey-8">Consumo Total</div>
                  <div class="text-h5 text-teal-8 text-weight-bold">
                    {{ formatNumber(totalConsumo) }} L
                  </div>
                </div>
                <q-icon
                  name="speed"
                  size="2.5rem"
                  color="teal-8"
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
                  <div class="text-h6 text-orange-8 text-weight-bold ellipsis">
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

      <!-- Gráfico mejorado -->
      <q-card flat bordered class="shadow-2" v-if="chartData.length > 0">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6 text-grey-8">
            <q-icon name="bar_chart" class="q-mr-sm" color="primary" />
            Distribución de Consumo
            <q-chip
              dense
              :color="tipoCombustible === 'GASOLINA' ? 'green' : 'amber'"
              text-color="white"
              class="q-ml-sm"
            >
              <q-icon
                :name="
                  tipoCombustible === 'GASOLINA'
                    ? 'local_gas_station'
                    : 'oil_barrel'
                "
                size="xs"
                class="q-mr-xs"
              />
              {{ tipoCombustible }}
            </q-chip>
          </div>
          <q-btn-group flat>
            <q-btn
              flat
              :color="chartType === 'bar' ? 'primary' : 'grey'"
              icon="bar_chart"
              @click="changeChartType('bar')"
            >
              <q-tooltip>Barras</q-tooltip>
            </q-btn>
            <q-btn
              flat
              :color="chartType === 'pie' ? 'primary' : 'grey'"
              icon="pie_chart"
              @click="changeChartType('pie')"
            >
              <q-tooltip>Circular</q-tooltip>
            </q-btn>
          </q-btn-group>
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
          row-key="gerencia"
          :pagination="{ rowsPerPage: 10 }"
          class="my-sticky-header-table"
        >
          <template v-slot:body-cell-gerencia="props">
            <q-td :props="props">
              <div class="row items-center no-wrap">
                <div
                  class="q-mr-sm"
                  :style="{
                    width: '12px',
                    height: '12px',
                    borderRadius: '3px',
                    backgroundColor: getColorForIndex(props.rowIndex),
                  }"
                ></div>
                <span class="text-weight-medium">{{ props.value }}</span>
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-total="props">
            <q-td :props="props">
              <q-badge
                :color="getBadgeColor(props.value)"
                :label="formatNumber(props.value) + ' L'"
                class="text-weight-bold"
              />
            </q-td>
          </template>

          <template v-slot:body-cell-porcentaje="props">
            <q-td :props="props">
              <div class="row items-center no-wrap" style="min-width: 150px">
                <q-linear-progress
                  :value="props.row.total / maxConsumo"
                  :color="tipoCombustible === 'GASOLINA' ? 'green' : 'amber'"
                  class="q-mr-sm col"
                  rounded
                  size="8px"
                />
                <span class="text-caption text-grey-7" style="min-width: 45px">
                  {{ ((props.row.total / totalConsumo) * 100).toFixed(1) }}%
                </span>
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
        No se encontraron datos para el rango de fechas seleccionado.
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

// 🎨 PALETA DE COLORES VIBRANTE
const colorPalette = [
  "#5470C6", // Azul
  "#91CC75", // Verde
  "#FAC858", // Amarillo
  "#EE6666", // Rojo
  "#73C0DE", // Celeste
  "#3BA272", // Verde oscuro
  "#FC8452", // Naranja
  "#9A60B4", // Morado
  "#EA7CCC", // Rosa
  "#48CFAD", // Turquesa
  "#AC92EC", // Lavanda
  "#4FC1E9", // Azul claro
  "#A0D468", // Lima
  "#FFCE54", // Dorado
  "#ED5565", // Coral
];

// 🎨 Colores temáticos por tipo de combustible
const fuelColors = {
  GASOLINA: {
    primary: "#4CAF50",
    gradient: ["#66BB6A", "#388E3C"],
    light: "#E8F5E9",
  },
  GASOIL: {
    primary: "#FF9800",
    gradient: ["#FFB74D", "#F57C00"],
    light: "#FFF3E0",
  },
};

// Computed para obtener el color actual del combustible
const currentFuelColor = computed(() => {
  return fuelColors[tipoCombustible.value] || fuelColors.GASOLINA;
});

// Función para obtener color por índice
function getColorForIndex(index) {
  return colorPalette[index % colorPalette.length];
}

// Fechas por defecto
const today = new Date();
const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

const fechaInicio = ref(date.formatDate(firstDay, "YYYY-MM-DD"));
const fechaFin = ref(date.formatDate(today, "YYYY-MM-DD"));
const tipoCombustible = ref("GASOLINA");

const fuelOptions = [
  { label: "Gasolina", value: "GASOLINA" },
  { label: "Gasoil", value: "GASOIL" },
];

const loading = ref(false);
const chartData = ref([]);
const hasSearched = ref(false);
const chartRef = ref(null);
const chartType = ref("bar");
let myChart = null;

// Columnas de la tabla
const columns = [
  {
    name: "gerencia",
    label: "Gerencia",
    field: "gerencia",
    align: "left",
    sortable: true,
  },
  {
    name: "total",
    label: "Consumo (L)",
    field: "total",
    align: "center",
    sortable: true,
  },
  {
    name: "porcentaje",
    label: "Distribución",
    field: "total",
    align: "left",
  },
];

// Computados
const totalConsumo = computed(() => {
  return chartData.value.reduce((sum, item) => sum + item.total, 0);
});

const maxConsumo = computed(() => {
  if (chartData.value.length === 0) return 1;
  return Math.max(...chartData.value.map((item) => item.total));
});

const mayorConsumidor = computed(() => {
  if (chartData.value.length === 0) return "-";
  return chartData.value[0].gerencia;
});

// Formatear números
function formatNumber(num) {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

// Color del badge según valor
function getBadgeColor(value) {
  const percent = value / maxConsumo.value;
  if (percent > 0.7) return "red";
  if (percent > 0.4) return "orange";
  return "green";
}

// Función para resetear filtros
function resetFiltros() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  fechaInicio.value = date.formatDate(firstDay, "YYYY-MM-DD");
  fechaFin.value = date.formatDate(today, "YYYY-MM-DD");
  tipoCombustible.value = "GASOLINA";
  chartData.value = [];
  hasSearched.value = false;
  disposeChart();

  $q.notify({
    type: "info",
    message: "Filtros restablecidos",
    position: "top",
    timeout: 1500,
  });
}

async function consultar() {
  if (!fechaInicio.value || !fechaFin.value || !tipoCombustible.value) {
    $q.notify({
      type: "warning",
      message:
        "Por favor complete todos los campos (Fechas y Tipo Combustible)",
      position: "top",
    });
    return;
  }

  // Validar que fecha inicio no sea mayor que fecha fin
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
    const response = await api.get("/reportes/consumo-gerencia", {
      params: {
        fechaInicio: fechaInicio.value,
        fechaFin: fechaFin.value,
        tipoCombustible: tipoCombustible.value,
      },
    });
    chartData.value = response.data;

    if (chartData.value.length > 0) {
      await nextTick();
      initChart();

      $q.notify({
        type: "positive",
        message: `Se encontraron ${chartData.value.length} gerencias`,
        position: "top",
        timeout: 2000,
      });
    } else {
      disposeChart();
    }
  } catch (error) {
    console.error("Error fetching consumption data", error);
    $q.notify({
      type: "negative",
      message: "Error al consultar los datos",
      position: "top",
    });
  } finally {
    loading.value = false;
  }
}

function changeChartType(type) {
  chartType.value = type;
  initChart();
}

function initChart() {
  if (!chartRef.value) return;

  if (myChart) {
    myChart.dispose();
  }

  myChart = echarts.init(chartRef.value);

  const gerencias = chartData.value.map((item) => item.gerencia);
  const totales = chartData.value.map((item) => item.total);

  let option;

  if (chartType.value === "bar") {
    // 📊 GRÁFICO DE BARRAS CON COLORES INDIVIDUALES
    option = {
      title: {
        text: `Consumo Total de ${tipoCombustible.value} por Gerencia`,
        subtext: `Período: ${formatDateDisplay(
          fechaInicio.value
        )} al ${formatDateDisplay(fechaFin.value)}`,
        left: "center",
        textStyle: {
          fontSize: 16,
          fontWeight: "bold",
          color: "#333",
        },
        subtextStyle: {
          fontSize: 12,
          color: "#666",
        },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderColor: "#ccc",
        borderWidth: 1,
        textStyle: {
          color: "#333",
        },
        formatter: function (params) {
          const data = params[0];
          const percent = ((data.value / totalConsumo.value) * 100).toFixed(1);
          return `
            <div style="font-weight: bold; margin-bottom: 5px;">${
              data.name
            }</div>
            <div>Consumo: <strong>${formatNumber(data.value)} L</strong></div>
            <div>Porcentaje: <strong>${percent}%</strong></div>
          `;
        },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "15%",
        top: "15%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: gerencias,
        axisLabel: {
          interval: 0,
          rotate: gerencias.length > 5 ? 30 : 0,
          fontSize: 11,
          color: "#666",
        },
        axisLine: {
          lineStyle: {
            color: "#ccc",
          },
        },
      },
      yAxis: {
        type: "value",
        name: "Litros",
        nameTextStyle: {
          color: "#666",
          fontSize: 12,
        },
        axisLabel: {
          formatter: (value) => {
            if (value >= 1000) {
              return (value / 1000).toFixed(1) + "K";
            }
            return value;
          },
          color: "#666",
        },
        axisLine: {
          lineStyle: {
            color: "#ccc",
          },
        },
        splitLine: {
          lineStyle: {
            color: "#eee",
          },
        },
      },
      series: [
        {
          name: "Consumo",
          type: "bar",
          barMaxWidth: 60,
          data: totales.map((value, index) => ({
            value,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: colorPalette[index % colorPalette.length] },
                {
                  offset: 1,
                  color: adjustColor(
                    colorPalette[index % colorPalette.length],
                    -40
                  ),
                },
              ]),
              borderRadius: [6, 6, 0, 0],
            },
          })),
          label: {
            show: true,
            position: "top",
            formatter: (params) => formatNumber(params.value),
            fontSize: 10,
            color: "#666",
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 15,
              shadowColor: "rgba(0,0,0,0.3)",
            },
          },
          animationDuration: 1000,
          animationEasing: "elasticOut",
        },
      ],
    };
  } else {
    // 🥧 GRÁFICO CIRCULAR
    option = {
      title: {
        text: `Distribución de Consumo de ${tipoCombustible.value}`,
        subtext: `Período: ${formatDateDisplay(
          fechaInicio.value
        )} al ${formatDateDisplay(fechaFin.value)}`,
        left: "center",
        textStyle: {
          fontSize: 16,
          fontWeight: "bold",
          color: "#333",
        },
        subtextStyle: {
          fontSize: 12,
          color: "#666",
        },
      },
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderColor: "#ccc",
        borderWidth: 1,
        textStyle: {
          color: "#333",
        },
        formatter: function (params) {
          return `
            <div style="font-weight: bold; margin-bottom: 5px;">${
              params.name
            }</div>
            <div>Consumo: <strong>${formatNumber(params.value)} L</strong></div>
            <div>Porcentaje: <strong>${params.percent}%</strong></div>
          `;
        },
      },
      legend: {
        orient: "vertical",
        left: "left",
        top: "middle",
        textStyle: {
          fontSize: 11,
        },
      },
      series: [
        {
          name: "Consumo",
          type: "pie",
          radius: ["40%", "70%"],
          center: ["60%", "55%"],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 8,
            borderColor: "#fff",
            borderWidth: 3,
          },
          label: {
            show: true,
            formatter: "{b}: {d}%",
            fontSize: 11,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: "bold",
            },
            itemStyle: {
              shadowBlur: 15,
              shadowColor: "rgba(0,0,0,0.3)",
            },
          },
          data: chartData.value.map((item, index) => ({
            value: item.total,
            name: item.gerencia,
            itemStyle: {
              color: colorPalette[index % colorPalette.length],
            },
          })),
          animationType: "scale",
          animationEasing: "elasticOut",
          animationDuration: 1000,
        },
      ],
    };
  }

  myChart.setOption(option);
}

// Formatear fecha para mostrar
function formatDateDisplay(dateStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

// Función para oscurecer/aclarar colores (para gradientes)
function adjustColor(color, amount) {
  const clamp = (num) => Math.min(255, Math.max(0, num));

  let hex = color.replace("#", "");
  let r = parseInt(hex.substr(0, 2), 16);
  let g = parseInt(hex.substr(2, 2), 16);
  let b = parseInt(hex.substr(4, 2), 16);

  r = clamp(r + amount);
  g = clamp(g + amount);
  b = clamp(b + amount);

  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function disposeChart() {
  if (myChart) {
    myChart.dispose();
    myChart = null;
  }
}

// Exportar datos a CSV
function exportarDatos() {
  const BOM = "\uFEFF"; // Para caracteres especiales en Excel
  const content =
    BOM +
    [
      ["Gerencia", "Consumo (L)", "Porcentaje"],
      ...chartData.value.map((item) => [
        item.gerencia,
        item.total.toFixed(2),
        ((item.total / totalConsumo.value) * 100).toFixed(2) + "%",
      ]),
      [], // Línea vacía
      ["Total", totalConsumo.value.toFixed(2), "100%"],
    ]
      .map((row) => row.join(";")) // Usar ; para mejor compatibilidad con Excel
      .join("\n");

  const fileName = `consumo-gerencia-${tipoCombustible.value}-${fechaInicio.value}-a-${fechaFin.value}.csv`;

  const status = exportFile(fileName, content, "text/csv;charset=utf-8");

  if (status) {
    $q.notify({
      type: "positive",
      message: "Archivo exportado correctamente",
      position: "top",
      timeout: 2000,
    });
  } else {
    $q.notify({
      type: "negative",
      message: "Error al exportar el archivo",
      position: "top",
    });
  }
}

const resizeHandler = () => {
  if (myChart) myChart.resize();
};

onMounted(() => {
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

.my-sticky-header-table .q-table__top,
.my-sticky-header-table .q-table__bottom,
.my-sticky-header-table thead tr:first-child th {
  background-color: white;
}

.my-sticky-header-table thead tr th {
  position: sticky;
  z-index: 1;
  top: 0;
}

/* Animación suave para las cards */
.q-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.q-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Mejora visual del banner sin datos */
.q-banner {
  border-left: 4px solid #ff9800;
}
</style>

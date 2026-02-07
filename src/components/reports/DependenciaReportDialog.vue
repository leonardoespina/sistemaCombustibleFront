<template>
  <q-dialog
    v-model="isOpen"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="bg-grey-1">
      <!-- TOOLBAR -->
      <q-toolbar class="bg-primary text-white shadow-2">
        <q-btn flat round dense icon="arrow_back" v-close-popup>
          <q-tooltip>Volver a filtros</q-tooltip>
        </q-btn>
        <q-toolbar-title>Consumo Agregado por Dependencia</q-toolbar-title>
        <q-space />
        <q-btn
          flat
          label="Exportar CSV"
          icon="table_view"
          @click="exportToCsv"
          class="q-mr-sm"
        />
        <q-btn
          flat
          label="Imprimir PDF"
          icon="print"
          @click="printReport"
        />
      </q-toolbar>

      <q-card-section class="q-pa-lg scroll" style="height: calc(100vh - 50px)">
        <div
          id="print-section"
          class="bg-white q-pa-lg shadow-3 rounded-borders"
          style="max-width: 1200px; margin: 0 auto"
        >
          <!-- ENCABEZADO IMPRESIÓN -->
          <div class="row items-center q-mb-lg border-bottom q-pb-md">
            <div class="col-auto q-mr-md">
              <img src="/logo.png" style="height: 80px" alt="Logo" />
            </div>
            <div class="col text-center">
              <div class="text-h4 text-weight-bold text-uppercase text-primary">Resumen de Consumo por Dependencia</div>
              <div class="text-subtitle1 text-grey-8">
                Periodo:
                <span class="text-weight-bold">{{ formatDate(filters.fechaDesde) }}</span>
                -
                <span class="text-weight-bold">{{ formatDate(filters.fechaHasta) }}</span>
              </div>
            </div>
            <div class="col-auto" style="width: 80px"></div>
          </div>

          <!-- GRÁFICO ESTADÍSTICO -->
          <div class="q-mb-xl no-print">
            <div class="text-h6 q-mb-md text-grey-8">
               <q-icon name="bar_chart" color="primary" class="q-mr-sm" />
               Distribución de Consumo por Tipo de Combustible
            </div>
            <div ref="chartRef" style="width: 100%; height: 400px"></div>
          </div>

          <!-- TABLA DE DATOS -->
          <div class="text-h6 q-mb-sm text-grey-8">
             <q-icon name="list_alt" color="primary" class="q-mr-sm" />
             Detalle Estadístico
          </div>
          <q-table
            :rows="data"
            :columns="columns"
            row-key="id_dependencia"
            dense
            flat
            bordered
            :pagination="{ rowsPerPage: 0 }"
            hide-pagination
            class="print-table"
          >
            <template v-slot:body-cell-total_litros="props">
              <q-td :props="props" class="text-weight-bold">
                {{ props.value.toFixed(2) }} L
              </q-td>
            </template>
          </q-table>

          <div v-if="data.length === 0" class="text-center q-pa-xl text-grey">
            No se encontraron registros para los criterios seleccionados.
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { date, exportFile, useQuasar } from 'quasar';
import * as echarts from 'echarts';

const props = defineProps({
  modelValue: Boolean,
  data: {
    type: Array,
    required: true
  },
  filters: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:modelValue']);

const $q = useQuasar();
const chartRef = ref(null);
let myChart = null;

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

// Columnas Tabla
const columns = [
  { name: 'dependencia', label: 'Dependencia / Gerencia', field: 'dependencia', align: 'left', sortable: true },
  { name: 'tipo_combustible', label: 'Tipo de Combustible', field: 'tipo_combustible', align: 'center', sortable: true },
  { name: 'total_litros', label: 'Consumo Total (Lts)', field: 'total_litros', align: 'right', sortable: true },
];

// Re-inicializar gráfico cuando se abre el diálogo o cambian los datos
watch([isOpen, () => props.data], async ([open, data]) => {
  if (open && data.length > 0) {
    await nextTick();
    initChart();
  }
}, { deep: true });

function initChart() {
  if (!chartRef.value) return;
  if (myChart) myChart.dispose();
  
  myChart = echarts.init(chartRef.value);

  // Procesar datos para gráfico de barras agrupadas
  // Estructura esperada: [{dependencia: 'Gerencia A', tipo_combustible: 'GASOLINA', total_litros: 100}, ...]
  
  const dependenciasSet = [...new Set(props.data.map(d => d.dependencia))];
  const tiposSet = [...new Set(props.data.map(d => d.tipo_combustible))];

  const series = tiposSet.map(tipo => {
    return {
      name: tipo,
      type: 'bar',
      barMaxWidth: 40,
      data: dependenciasSet.map(dep => {
        const item = props.data.find(d => d.dependencia === dep && d.tipo_combustible === tipo);
        return item ? item.total_litros : 0;
      }),
      itemStyle: {
        borderRadius: [4, 4, 0, 0]
      }
    };
  });

  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: dependenciasSet,
      axisLabel: { interval: 0, rotate: dependenciasSet.length > 5 ? 30 : 0 }
    },
    yAxis: { type: 'value', name: 'Litros' },
    series: series,
    color: ['#4CAF50', '#FF9800', '#2196F3', '#9C27B0'] // Colores estándar (Gasolina, Gasoil, etc)
  };

  myChart.setOption(option);
}

function formatDate(fechaStr) {
  if (!fechaStr) return "";
  return date.formatDate(fechaStr.replace(/-/g, '/'), "DD/MM/YYYY");
}

function exportToCsv() {
  if (props.data.length === 0) return;

  let content = "REPORTE DE CONSUMO POR DEPENDENCIA\n";
  content += `Periodo: ${formatDate(props.filters.fechaDesde)} - ${formatDate(props.filters.fechaHasta)}\n\n`;

  content += columns.map(c => `"${c.label}"`).join(",") + "\n";

  props.data.forEach(row => {
    content += `"${row.dependencia}","${row.tipo_combustible}","${row.total_litros}"\n`;
  });

  const status = exportFile(
    `Consumo_Dependencia_${props.filters.fechaDesde}.csv`,
    content,
    "text/csv",
  );

  if (status !== true) {
    $q.notify({ message: "Error al descargar el archivo", color: "negative" });
  }
}

function printReport() {
  window.print();
}

const resizeHandler = () => { if (myChart) myChart.resize(); };

onMounted(() => { window.addEventListener('resize', resizeHandler); });
onBeforeUnmount(() => { 
  window.removeEventListener('resize', resizeHandler);
  if (myChart) myChart.dispose();
});
</script>

<style scoped>
@media print {
  body * { visibility: hidden; }
  #print-section, #print-section * { visibility: visible; }
  #print-section {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
  }
  .q-dialog__backdrop, .q-toolbar, .q-btn, .no-print { display: none !important; }
}
</style>

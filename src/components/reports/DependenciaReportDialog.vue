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
        <q-toolbar-title class="text-body1">Consumo por Dependencia</q-toolbar-title>
        <q-space />
        <!-- Botones completos en tablet+ -->
        <template v-if="$q.screen.gt.xs">
          <ExportExcelBtn
            :rows="data"
            :columns="columns"
            :filename="`Consumo_Dependencia_${filters.fechaDesde}`"
            sheet-name="Consumo"
            :meta="[
              'REPORTE DE CONSUMO POR DEPENDENCIA',
              `Periodo: ${formatDate(filters.fechaDesde)} - ${formatDate(filters.fechaHasta)}`,
            ]"
            label="Excel"
            flat
            color="white"
            class="q-mr-xs"
          />
          <q-btn flat icon="print" label="Imprimir" @click="printReport" />
        </template>
        <!-- Menú compacto en móvil -->
        <q-btn v-else flat round icon="more_vert">
          <q-menu>
            <q-list style="min-width: 160px">
              <q-item clickable v-close-popup @click="printReport">
                <q-item-section avatar><q-icon name="print" /></q-item-section>
                <q-item-section>Imprimir PDF</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>

      <q-card-section class="q-pa-sm q-pa-lg-lg scroll" style="height: calc(100vh - 50px)">
        <div
          id="print-section"
          class="bg-white q-pa-sm q-pa-lg-lg shadow-3 rounded-borders"
          style="max-width: 1200px; margin: 0 auto"
        >
          <!-- ENCABEZADO IMPRESIÓN RESPONSIVE -->
          <div class="column column-sm-row items-center q-mb-md q-pb-sm" style="border-bottom: 1px solid #e0e0e0">
            <div class="row justify-center q-mb-sm">
              <img src="/logo.png" style="height: 60px" alt="Logo" />
            </div>
            <div class="col text-center">
              <div :class="$q.screen.lt.sm ? 'text-subtitle1' : 'text-h5'" class="text-weight-bold text-uppercase text-primary">
                Resumen de Consumo por Dependencia
              </div>
              <div class="text-caption text-grey-8">
                Periodo:
                <span class="text-weight-bold">{{ formatDate(filters.fechaDesde) }}</span>
                al
                <span class="text-weight-bold">{{ formatDate(filters.fechaHasta) }}</span>
              </div>
            </div>
          </div>

          <!-- GRÁFICO ESTADÍSTICO -->
          <div class="q-mb-lg no-print">
            <div class="row items-center q-mb-sm">
              <q-icon name="bar_chart" color="primary" class="q-mr-xs" />
              <span class="text-subtitle2 text-grey-8">Distribución de Consumo por Tipo de Combustible</span>
              <!-- Toggle horizontal/vertical en móvil -->
              <q-space />
              <q-btn-toggle
                v-model="chartOrientation"
                :options="[{icon:'bar_chart', value:'vertical'}, {icon:'align_horizontal_left', value:'horizontal'}]"
                dense flat
                color="grey-7"
                toggle-color="primary"
                size="sm"
              />
            </div>
            <div ref="chartRef" :style="chartHeight" />
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
import { date, useQuasar } from 'quasar';
import * as echarts from 'echarts';
import ExportExcelBtn from '../common/ExportExcelBtn.vue';

const $q = useQuasar();

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

const chartRef = ref(null);
let myChart = null;

// Orientación del gráfico: en móvil por defecto horizontal
const chartOrientation = ref('vertical');

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

// Altura dinámica: en horizontal crece con la cantidad de dependencias
const chartHeight = computed(() => {
  const dependencias = [...new Set((props.data || []).map(d => d.dependencia))];
  if (chartOrientation.value === 'horizontal') {
    const h = Math.max(300, dependencias.length * 50);
    return `width: 100%; height: ${h}px`;
  }
  return 'width: 100%; height: 380px';
});

// Redibujar cuando cambia orientación
watch(chartOrientation, () => {
  nextTick(initChart);
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

  const dependenciasSet = [...new Set(props.data.map(d => d.dependencia))];
  const tiposSet = [...new Set(props.data.map(d => d.tipo_combustible))];
  const isHorizontal = chartOrientation.value === 'horizontal';

  // Truncar etiquetas largas
  const truncate = (str, max = 18) =>
    str && str.length > max ? str.slice(0, max) + '...' : str;

  const series = tiposSet.map(tipo => ({
    name: tipo,
    type: 'bar',
    barMaxWidth: isHorizontal ? 24 : 36,
    data: dependenciasSet.map(dep => {
      const item = props.data.find(d => d.dependencia === dep && d.tipo_combustible === tipo);
      return item ? item.total_litros : 0;
    }),
    itemStyle: {
      borderRadius: isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]
    },
    label: {
      show: isHorizontal,
      position: 'right',
      formatter: p => p.value > 0 ? `${p.value.toFixed(0)} L` : '',
      fontSize: 11,
    }
  }));

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        // Mostrar nombre completo en tooltip
        const dep = isHorizontal ? params[0]?.axisValue : params[0]?.axisValue;
        let html = `<b>${dep}</b><br/>`;
        params.forEach(p => {
          if (p.value > 0) html += `${p.marker} ${p.seriesName}: <b>${p.value.toFixed(2)} L</b><br/>`;
        });
        return html;
      }
    },
    legend: { bottom: 0, itemGap: 12 },
    grid: isHorizontal
      ? { left: '2%', right: '10%', top: '5%', bottom: '10%', containLabel: true }
      : { left: '3%', right: '4%', bottom: '18%', top: '8%',  containLabel: true },
    // Ejes se intercambian según orientación
    xAxis: isHorizontal
      ? { type: 'value', name: 'Litros', nameLocation: 'end', axisLabel: { formatter: v => `${v}L` } }
      : {
          type: 'category',
          data: dependenciasSet,
          axisLabel: {
            interval: 0,
            rotate: dependenciasSet.length > 4 ? 20 : 0,
            formatter: v => truncate(v, 14),
            fontSize: 11,
          }
        },
    yAxis: isHorizontal
      ? {
          type: 'category',
          data: dependenciasSet,
          axisLabel: { formatter: v => truncate(v, 20), fontSize: 11 }
        }
      : { type: 'value', name: 'Litros', axisLabel: { formatter: v => `${v}L` } },
    series,
    color: ['#4CAF50', '#FF9800', '#2196F3', '#9C27B0'],
  };

  myChart.setOption(option);
}

function formatDate(fechaStr) {
  if (!fechaStr) return "";
  return date.formatDate(fechaStr.replace(/-/g, '/'), "DD/MM/YYYY");
}

function printReport() { window.print(); }

const resizeHandler = () => {
  if (myChart) {
    myChart.resize();
  }
};

// Al abrir el diálogo: inicializar en horizontal si es móvil
watch(isOpen, async (open) => {
  if (open) {
    chartOrientation.value = $q.screen.lt.sm ? 'horizontal' : 'vertical';
    if (props.data?.length > 0) {
      await nextTick();
      initChart();
    }
  }
});

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

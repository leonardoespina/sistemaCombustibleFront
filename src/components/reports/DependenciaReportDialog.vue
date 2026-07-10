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

          <!-- GRÁFICO ESTADÍSTICO NATIVO -->
          <div class="q-mb-lg no-print">
            <div class="row items-center q-mb-md">
              <q-icon name="bar_chart" color="primary" class="q-mr-xs" size="sm" />
              <span class="text-subtitle1 text-weight-bold text-grey-9">Top Consumo por Dependencia</span>
            </div>

            <div class="column q-gutter-y-sm">
              <div v-for="(item, index) in chartData" :key="index" class="row items-center no-wrap">
                <!-- Label -->
                <div class="col-4 col-md-3 text-right q-pr-md text-caption text-weight-medium text-grey-8 ellipsis">
                  <q-tooltip>{{ item.name }}</q-tooltip>
                  {{ item.name }}
                </div>
                <!-- Bar -->
                <div class="col-8 col-md-9 row items-center no-wrap">
                  <div class="bg-grey-3 rounded-borders" style="width: 100%; height: 24px; position: relative; overflow: hidden;">
                    <div 
                      class="bg-green-6 absolute-left" 
                      style="transition: width 0.5s ease-in-out;"
                      :style="{ width: item.percentage + '%', height: '100%' }"
                    ></div>
                  </div>
                  <div class="q-ml-sm text-caption text-weight-bold" style="min-width: 80px;">
                    {{ item.total.toFixed(2) }} L
                  </div>
                </div>
              </div>
            </div>
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
import { computed } from 'vue';
import { date, useQuasar } from 'quasar';
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

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

// Lógica del Gráfico Nativo
const chartData = computed(() => {
  if (!props.data || props.data.length === 0) return [];

  const grouped = {};
  props.data.forEach(d => {
    const name = `${d.dependencia}${d.subdependencia && d.subdependencia !== 'General' ? ' - ' + d.subdependencia : ''}`;
    if (!grouped[name]) {
      grouped[name] = { name, total: 0 };
    }
    grouped[name].total += d.total_litros;
  });

  const sorted = Object.values(grouped).sort((a, b) => b.total - a.total);
  const maxTotal = sorted.length > 0 ? sorted[0].total : 1;

  return sorted.map(item => ({
    ...item,
    percentage: (item.total / maxTotal) * 100
  }));
});

// Columnas Tabla
const columns = [
  { name: 'dependencia', label: 'Dependencia / Gerencia', field: 'dependencia', align: 'left', sortable: true },
  { name: 'subdependencia', label: 'Subdependencia', field: 'subdependencia', align: 'left', sortable: true },
  { name: 'tipo_combustible', label: 'Tipo de Combustible', field: 'tipo_combustible', align: 'center', sortable: true },
  { name: 'total_litros', label: 'Consumo Total (Lts)', field: 'total_litros', align: 'right', sortable: true },
];

function formatDate(fechaStr) {
  if (!fechaStr) return "";
  return date.formatDate(fechaStr.replace(/-/g, '/'), "DD/MM/YYYY");
}

function printReport() { window.print(); }
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

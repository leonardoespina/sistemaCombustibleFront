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
        <q-toolbar-title class="text-body1">Reporte de Despachos</q-toolbar-title>
        <q-space />
        <template v-if="$q.screen.gt.xs">
          <ExportExcelBtn
            :rows="data" :columns="columns"
            :filename="`Despachos_${filters.fechaDesde}_${filters.fechaHasta}`"
            sheet-name="Despachos"
            :meta="['REPORTE DE DESPACHOS', `Desde: ${formatDate(filters.fechaDesde)} - Hasta: ${formatDate(filters.fechaHasta)}`]"
            label="Excel" color="white" flat class="q-mr-xs"
          />
          <q-btn flat icon="print" label="Imprimir" color="white" @click="printReport" />
        </template>
        <q-btn v-else flat round icon="more_vert">
          <q-menu>
            <q-list style="min-width: 150px">
              <q-item clickable v-close-popup @click="printReport">
                <q-item-section avatar><q-icon name="print" /></q-item-section>
                <q-item-section>Imprimir</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>

      <q-card-section class="q-pa-lg scroll" style="height: calc(100vh - 50px)">
        <div
          id="print-section"
          class="bg-white q-pa-lg shadow-3 rounded-borders"
          style="width: 100%; margin: 0 auto"
        >
          <!-- ENCABEZADO RESPONSIVE -->
          <div class="column items-center q-mb-md q-pb-sm" style="border-bottom: 1px solid #e0e0e0">
            <img src="/logo.png" style="height: 55px" alt="Logo" class="q-mb-xs" />
            <div class="text-center">
              <div :class="$q.screen.lt.sm ? 'text-subtitle1' : 'text-h5'" class="text-weight-bold text-uppercase">
                Reporte de Despachos
              </div>
              <div class="text-caption text-grey-8">
                Desde: <span class="text-weight-bold">{{ formatDate(filters.fechaDesde) }}</span>
                &nbsp;Hasta: <span class="text-weight-bold">{{ formatDate(filters.fechaHasta) }}</span>
              </div>
            </div>
          </div>

          <!-- TABLA -->
          <q-table
            :rows="data"
            :columns="columns"
            row-key="id"
            dense
            flat
            bordered
            :pagination="pagination"
            :loading="loading"
            @request="(p) => emit('request', p)"
            class="print-table"
          >
            <!-- PIE DE PÁGINA (TOTALIZADOR) -->
            <template v-slot:bottom-row>
              <q-tr class="bg-grey-2 text-weight-bold text-h6">
                <q-td colspan="9" class="text-right"
                  >TOTAL GENERAL DESPACHADO:</q-td
                >
                <q-td class="text-right text-primary">{{ total }}</q-td>
                <q-td></q-td>
              </q-tr>
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
import { computed } from "vue";
import { date } from "quasar";
import ExportExcelBtn from '../common/ExportExcelBtn.vue';

const props = defineProps({
  modelValue: Boolean,
  data: {
    type: Array,
    required: true,
  },
  total: {
    type: [Number, String],
    default: 0,
  },
  filters: {
    type: Object,
    required: true,
  },
  pagination: {
    type: Object,
    default: () => ({
      page: 1,
      rowsPerPage: 10,
      rowsNumber: 0,
    }),
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "request"]);

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const columns = [
  { name: "fecha",               label: "Fecha",            field: "fecha",               align: "left",  format: (val) => date.formatDate(val, "DD/MM/YYYY") },
  { name: "hora",                label: "Hora",             field: "hora",               align: "center" },
  { name: "codigo_ticket",       label: "Ticket #",         field: "codigo_ticket",       align: "center" },
  { name: "solicitante",         label: "Solicitante",      field: "solicitante",         align: "left" },
  { name: "aprobador",           label: "Aprobador",        field: "aprobador",           align: "left" },
  { name: "recibido",            label: "Recibido",         field: "recibido",            align: "left" },
  { name: "vehiculo",            label: "Vehículo",         field: "vehiculo",            align: "left" },
  { name: "placa",               label: "Placa",            field: "placa",               align: "left" },
  { name: "cantidad_aprobada",   label: "Cant. Aprobada",   field: "cantidad_aprobada",   align: "right", format: (val) => val ? parseFloat(val).toFixed(2) : "0.00" },
  { name: "cantidad_despachada", label: "Cant. Despachada", field: "cantidad_despachada", align: "right", format: (val) => val ? parseFloat(val).toFixed(2) : "0.00" },
];

function formatDate(fechaStr) {
  if (!fechaStr) return "";
  return date.formatDate(fechaStr.replace(/-/g, "/"), "DD/MM/YYYY");
}

function printReport() { window.print(); }
</script>

<style scoped>
@media print {
  body * {
    visibility: hidden;
  }
  #print-section,
  #print-section * {
    visibility: visible;
  }
  #print-section {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
  }
  .q-dialog__backdrop,
  .q-toolbar,
  .q-btn {
    display: none !important;
  }
}
</style>

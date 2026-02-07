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
        <q-toolbar-title>Resultados del Reporte de Despachos</q-toolbar-title>
        <q-space />
        <q-btn
          flat
          label="Exportar CSV"
          icon="table_view"
          @click="exportToCsv"
          class="q-mr-sm"
        />
        <q-btn flat label="Imprimir PDF" icon="print" @click="printReport" />
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
              <div class="text-h4 text-weight-bold text-uppercase">
                Reporte de Despachos
              </div>
              <div class="text-subtitle1 text-grey-8">
                Desde:
                <span class="text-weight-bold">{{
                  formatDate(filters.fechaDesde)
                }}</span>
                Hasta:
                <span class="text-weight-bold">{{
                  formatDate(filters.fechaHasta)
                }}</span>
              </div>
            </div>
            <div class="col-auto" style="width: 80px"></div>
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
                <q-td colspan="7" class="text-right"
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
import { date, exportFile, useQuasar } from "quasar";

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

const $q = useQuasar();

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const columns = [
  {
    name: "fecha",
    label: "Fecha",
    field: "fecha",
    align: "left",
    format: (val) => date.formatDate(val, "DD/MM/YYYY"),
  },
  {
    name: "hora",
    label: "Hora",
    field: "hora",
    align: "center",
  },
  {
    name: "codigo_ticket",
    label: "Ticket #",
    field: "codigo_ticket",
    align: "center",
  },
  {
    name: "solicitante",
    label: "Solicitante",
    field: "solicitante",
    align: "left",
  },
  {
    name: "vehiculo",
    label: "Nombre del Vehículo",
    field: "vehiculo",
    align: "left",
  },
  { name: "placa", label: "Placa", field: "placa", align: "left" },

  {
    name: "cantidad_aprobada",
    label: "Cant. Aprobada",
    field: "cantidad_aprobada",
    align: "right",
    format: (val) => (val ? parseFloat(val).toFixed(2) : "0.00"),
  },
  {
    name: "cantidad_despachada",
    label: "Cant. Despachada",
    field: "cantidad_despachada",
    align: "right",
    format: (val) => (val ? parseFloat(val).toFixed(2) : "0.00"),
  },
];

function formatDate(fechaStr) {
  if (!fechaStr) return "";
  // Ajuste para evitar desfase por zona horaria al formatear strings YYYY-MM-DD
  const fixedDate = fechaStr.replace(/-/g, "/");
  return date.formatDate(fixedDate, "DD/MM/YYYY");
}

function wrapCsvValue(val, formatFn) {
  let formatted = formatFn !== void 0 ? formatFn(val) : val;
  formatted =
    formatted === void 0 || formatted === null ? "" : String(formatted);
  formatted = formatted.split('"').join('""');
  return `"${formatted}"`;
}

function exportToCsv() {
  if (props.data.length === 0) return;

  let content = "REPORTE DE DESPACHOS\n";
  content += `Desde: ${formatDate(props.filters.fechaDesde)} - Hasta: ${formatDate(props.filters.fechaHasta)}\n\n`;

  content += columns.map((c) => wrapCsvValue(c.label)).join(",") + "\n";

  props.data.forEach((row) => {
    content +=
      columns.map((c) => wrapCsvValue(row[c.field], c.format)).join(",") + "\n";
  });

  content += `,,,,,,,TOTAL GENERAL,${props.total}\n`;

  const status = exportFile(
    `Despachos_${props.filters.fechaDesde}_${props.filters.fechaHasta}.csv`,
    content,
    "text/csv",
  );

  if (status !== true) {
    $q.notify({ message: "Navegador denegó la descarga", color: "negative" });
  }
}

function printReport() {
  window.print();
}
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

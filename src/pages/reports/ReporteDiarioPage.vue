<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-y-md">
      <!-- HEADER PRINCIPAL -->
      <div class="row items-center q-mb-md">
        <img src="/logo.png" style="height: 60px" class="q-mr-md" alt="Logo" />
        <div class="col">
          <h4 class="text-h4 q-my-none text-weight-bold text-primary">
            Reporte Diario de Combustible
          </h4>
          <p class="text-grey-7 q-mb-none">
            Generación y consulta de despachos
          </p>
        </div>
      </div>

      <!-- FILTROS -->
      <q-card flat bordered class="shadow-2 bg-grey-1">
        <q-card-section>
          <div class="text-h6 q-mb-md text-primary">
            <q-icon name="filter_alt" class="q-mr-sm" />
            Parámetros de Búsqueda
          </div>
          <div class="row q-col-gutter-md items-start">
            <!-- Selector de Llenadero -->
            <div class="col-12 col-md-5">
              <q-select
                outlined
                v-model="filters.id_llenadero"
                :options="llenaderosList"
                option-value="id_llenadero"
                option-label="nombre_llenadero"
                label="Seleccione Llenadero"
                emit-value
                map-options
                dense
                bg-color="white"
                :rules="[val => !!val || 'Requerido']"
              >
                <template v-slot:prepend>
                  <q-icon name="ev_station" color="primary" />
                </template>
              </q-select>
            </div>

            <!-- Selector de Fecha -->
            <div class="col-12 col-md-4">
              <q-input
                outlined
                v-model="filters.fecha"
                type="date"
                label="Fecha de Reporte"
                dense
                bg-color="white"
                :rules="[val => !!val || 'Requerida']"
              >
                <template v-slot:prepend>
                  <q-icon name="event" color="primary" />
                </template>
              </q-input>
            </div>

            <!-- Botón Buscar -->
            <div class="col-12 col-md-3">
              <q-btn
                color="primary"
                icon="search"
                label="Generar Reporte"
                class="full-width"
                unelevated
                @click="consultarReporte(1)"
                :loading="loading"
                :disable="!filters.id_llenadero || !filters.fecha"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- DIALOGO DE RESULTADOS -->
      <q-dialog v-model="showReportDialog" maximized transition-show="slide-up" transition-hide="slide-down">
        <q-card class="bg-grey-1">
          <!-- BARRA DE HERRAMIENTAS -->
          <q-toolbar class="bg-primary text-white shadow-2">
            <q-btn flat round dense icon="arrow_back" v-close-popup>
              <q-tooltip>Volver</q-tooltip>
            </q-btn>
            <q-toolbar-title>Vista de Reporte</q-toolbar-title>
            
            <q-space />

            <!-- Botones de Acción -->
            <q-btn flat label="Exportar CSV" icon="table_view" @click="exportToCsv" class="q-mr-sm" />
            <q-btn flat label="Imprimir PDF" icon="print" @click="printReport" />
          </q-toolbar>

          <q-card-section class="q-pa-lg scroll" style="height: calc(100vh - 50px)">
            <div id="print-section" class="bg-white q-pa-lg shadow-3 rounded-borders" style="max-width: 1200px; margin: 0 auto">
              
              <!-- ENCABEZADO DEL REPORTE IMPRESO -->
              <div class="row items-center q-mb-lg border-bottom q-pb-md">
                <div class="col-auto q-mr-md">
                   <img src="/logo.png" style="height: 80px" alt="Logo" />
                </div>
                <div class="col text-center">
                  <div class="text-h4 text-weight-bold text-uppercase">Reporte Diario de Combustible</div>
                  <div class="text-subtitle1 text-grey-8">
                    Fecha: <span class="text-weight-bold">{{ formatDate(filters.fecha) }}</span> 
                    | Llenadero: <span class="text-weight-bold">{{ getLlenaderoNombre(filters.id_llenadero) }}</span>
                  </div>
                </div>
                <div class="col-auto" style="width: 80px"></div> <!-- Spacer for center alignment -->
              </div>

              <div v-if="reporteData">
                
                <!-- SECCIÓN INSTITUCIONAL -->
                <div v-if="reporteData.institucional && reporteData.institucional.length > 0" class="q-mb-xl">
                  <div class="bg-teal text-white q-py-sm q-px-md text-h6 rounded-borders q-mb-sm">
                    DESPACHOS INSTITUCIONALES
                  </div>
                  
                  <q-table
                    :rows="reporteData.institucional"
                    :columns="columnsInstitucional"
                    row-key="id_solicitud"
                    dense
                    flat
                    bordered
                    :pagination="pagination"
                    :loading="loading"
                    @request="onRequest"
                    class="print-table"
                  >
                    <template v-slot:bottom-row>
                      <q-tr class="bg-grey-2 text-weight-bold">
                        <q-td colspan="6" class="text-right">Total Litros Institucional:</q-td>
                        <q-td class="text-right">{{ reporteData.totales.litros_institucional }}</q-td>
                      </q-tr>
                    </template>
                  </q-table>
                </div>

                <!-- SECCIÓN VENTA -->
                <div v-if="reporteData.venta && reporteData.venta.length > 0" class="q-mb-xl">
                  <div class="bg-orange-9 text-white q-py-sm q-px-md text-h6 rounded-borders q-mb-sm">
                    DESPACHOS VENTA
                  </div>

                  <q-table
                    :rows="reporteData.venta"
                    :columns="columnsVenta"
                    row-key="id_solicitud"
                    dense
                    flat
                    bordered
                    :pagination="pagination"
                    :loading="loading"
                    @request="onRequest"
                    class="print-table"
                  >
                    <template v-slot:bottom-row>
                      <q-tr class="bg-grey-2 text-weight-bold">
                        <q-td colspan="6" class="text-right">Totales Venta:</q-td>
                        <q-td class="text-right">{{ reporteData.totales.litros_venta }}</q-td>
                        <q-td class="text-right"></q-td>
                        <q-td class="text-right">{{ reporteData.totales.monto_venta }}</q-td>
                        <q-td class="text-right">-</q-td>
                        <q-td></q-td>
                      </q-tr>
                    </template>
                  </q-table>
                </div>

                <!-- RESUMEN FINAL -->
                <div class="row q-col-gutter-lg justify-center q-mt-lg">
                   <div class="col-12 col-md-8">
                      <q-markup-table flat bordered class="bg-blue-grey-1">
                        <tbody>
                          <tr>
                            <td class="text-left text-weight-bold">Total Litros Institucional</td>
                            <td class="text-right text-teal text-h6">{{ reporteData.totales.litros_institucional }} L</td>
                          </tr>
                          <tr>
                            <td class="text-left text-weight-bold">Total Litros Venta</td>
                            <td class="text-right text-orange-9 text-h6">{{ reporteData.totales.litros_venta }} L</td>
                          </tr>
                          <tr class="bg-grey-3">
                            <td class="text-left text-weight-bolder text-h6">TOTAL GENERAL LITROS</td>
                            <td class="text-right text-primary text-h5 text-weight-bolder">{{ reporteData.totales.total_litros }} L</td>
                          </tr>
                        </tbody>
                      </q-markup-table>
                   </div>
                </div>

                <!-- RESUMEN SALDOS A FAVOR -->
                <div v-if="reporteData.totales.resumen_saldos && reporteData.totales.resumen_saldos.length > 0" class="q-mt-xl">
                  <div class="text-h6 text-red-9 text-center q-mb-md border-bottom">REINTEGROS PENDIENTES (SALDOS A FAVOR)</div>
                  <div class="row justify-center q-gutter-lg">
                      <div v-for="saldo in reporteData.totales.resumen_saldos" :key="saldo.moneda" class="text-center border-all q-pa-md rounded-borders bg-red-1">
                        <div class="text-subtitle2 text-grey-8">Moneda: {{ saldo.moneda }}</div>
                        <div class="text-h4 text-red-9 text-weight-bolder">{{ saldo.total }}</div>
                      </div>
                  </div>
                </div>

              </div>
              
              <div v-else class="text-center q-pa-xl text-grey">
                No hay datos para mostrar.
              </div>

            </div>
          </q-card-section>
        </q-card>
      </q-dialog>

    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar, date, exportFile } from 'quasar';
import api from '../../api/index';

const $q = useQuasar();
const loading = ref(false);
const showReportDialog = ref(false);
const llenaderosList = ref([]);
const reporteData = ref(null);

const pagination = ref({
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0
});

const filters = ref({
  id_llenadero: null,
  fecha: date.formatDate(new Date(), 'YYYY-MM-DD')
});

const columnsInstitucional = [
  { name: 'solicitante', label: 'Solicitante', field: 'solicitante', align: 'left' },
  { name: 'vehiculo', label: 'Vehículo', field: 'vehiculo', align: 'left' },
  { name: 'placa', label: 'Placa', field: 'placa', align: 'left' },
  { name: 'dependencia', label: 'Dependencia', field: 'dependencia', align: 'left' },
  { name: 'subdependencia', label: 'Subdependencia', field: 'subdependencia', align: 'left' },
  { name: 'cant_solic', label: 'Cant. Solic', field: 'cant_solic', align: 'right' },
  { name: 'cant_desp', label: 'Cant. Desp', field: 'cant_desp', align: 'right' }
];

const columnsVenta = [
  ...columnsInstitucional,
  { name: 'precio', label: 'Precio', field: 'precio', align: 'right', format: val => val ? Number(val).toFixed(2) : '-' },
  { name: 'total_pagar', label: 'Total a Pagar', field: 'total_pagar', align: 'right', format: val => val ? Number(val).toFixed(2) : '-' },
  { name: 'saldo_favor', label: 'Saldo a Favor', field: 'saldo_favor', align: 'right', format: val => val > 0 ? Number(val).toFixed(2) : '-' },
  { name: 'moneda', label: 'Moneda', field: 'moneda', align: 'center' }
];

async function loadLlenaderos() {
  try {
    const response = await api.get('/llenaderos');
    llenaderosList.value = response.data.data || response.data;
  } catch (error) {
    console.error('Error cargando llenaderos:', error);
    $q.notify({ type: 'negative', message: 'Error al cargar lista de llenaderos' });
  }
}

async function consultarReporte(page = 1, limit = 20) {
  loading.value = true;
  if (page === 1) {
    reporteData.value = null;
  }

  try {
    const response = await api.get('/reportes/diario', {
      params: {
        id_llenadero: filters.value.id_llenadero,
        fecha: filters.value.fecha,
        page,
        limit
      }
    });
    reporteData.value = response.data;
    
    if (response.data.pagination) {
      pagination.value.rowsNumber = response.data.pagination.totalItems;
      pagination.value.page = response.data.pagination.currentPage;
      pagination.value.rowsPerPage = response.data.pagination.limit;
    }

    showReportDialog.value = true;
  } catch (error) {
    console.error('Error consultando reporte:', error);
    $q.notify({ type: 'negative', message: 'Error al generar el reporte' });
  } finally {
    loading.value = false;
  }
}

const onRequest = async (props) => {
  const { page, rowsPerPage } = props.pagination;
  await consultarReporte(page, rowsPerPage);
};

// --- EXPORT FUNCTIONS ---

function wrapCsvValue(val, formatFn) {
  let formatted = formatFn !== void 0 ? formatFn(val) : val;
  formatted = formatted === void 0 || formatted === null ? '' : String(formatted);
  formatted = formatted.split('"').join('""');
  return `"${formatted}"`;
}

function exportToCsv() {
  if (!reporteData.value) return;

  // Build CSV content
  let content = 'REPORTE DIARIO DE COMBUSTIBLE\n';
  content += `Fecha: ${formatDate(filters.value.fecha)}\n`;
  content += `Llenadero: ${getLlenaderoNombre(filters.value.id_llenadero)}\n\n`;

  // Institutional
  if (reporteData.value.institucional.length > 0) {
    content += 'INSTITUCIONAL\n';
    content += columnsInstitucional.map(c => wrapCsvValue(c.label)).join(',') + '\n';
    reporteData.value.institucional.forEach(row => {
      content += columnsInstitucional.map(c => wrapCsvValue(row[c.field])).join(',') + '\n';
    });
    content += '\n';
  }

  // Venta
  if (reporteData.value.venta.length > 0) {
    content += 'VENTA\n';
    content += columnsVenta.map(c => wrapCsvValue(c.label)).join(',') + '\n';
    reporteData.value.venta.forEach(row => {
      content += columnsVenta.map(c => wrapCsvValue(row[c.field])).join(',') + '\n';
    });
    content += '\n';
  }

  const status = exportFile(
    `Reporte_Combustible_${filters.value.fecha}.csv`,
    content,
    'text/csv'
  );

  if (status !== true) {
    $q.notify({
      message: 'Navegador denegó la descarga...',
      color: 'negative',
      icon: 'warning'
    });
  }
}

function printReport() {
  window.print();
}

function getLlenaderoNombre(id) {
  const llenadero = llenaderosList.value.find(l => l.id_llenadero === id);
  return llenadero ? llenadero.nombre_llenadero : 'Desconocido';
}

function formatDate(fechaStr) {
  return date.formatDate(fechaStr, 'DD/MM/YYYY');
}

onMounted(() => {
  loadLlenaderos();
});
</script>

<style scoped>
@media print {
  /* Ocultar todo lo que no sea el reporte */
  body * {
    visibility: hidden;
  }
  
  /* Mostrar solo el contenido del diálogo de reporte */
  #print-section, #print-section * {
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
  
  /* Ocultar barras de herramientas, botones, etc. */
  .q-dialog__backdrop, .q-toolbar, .q-btn {
    display: none !important;
  }
}
</style>

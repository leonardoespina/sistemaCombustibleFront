<template>
  <q-page :class="$q.screen.lt.sm ? 'q-pa-sm' : 'q-pa-md'">
    <div class="q-gutter-y-md">

      <!-- HEADER -->
      <div class="row items-center q-col-gutter-sm">
        <div class="col-auto">
          <q-icon name="receipt_long" size="2rem" color="primary" />
        </div>
        <div class="col">
          <div :class="$q.screen.lt.sm ? 'text-h6' : 'text-h5'" class="text-weight-bold text-primary q-mb-none">
            Reporte Recepción Combustibles
          </div>
          <div class="text-caption text-grey-7">Detalle de cisternas recibidas agrupadas por llenadero y combustible</div>
        </div>
      </div>

      <!-- FILTROS -->
      <q-card flat bordered class="bg-grey-1">
        <q-card-section :class="$q.screen.lt.sm ? 'q-pa-sm' : 'q-pa-md'">
          <div class="row q-col-gutter-md items-end">
            <div class="col-12 col-sm-3">
              <q-select
                outlined dense bg-color="white"
                v-model="store.filters.llenaderoId"
                :options="llenaderosList"
                option-label="nombre_llenadero"
                option-value="id_llenadero"
                emit-value map-options
                label="Llenadero (Opcional)"
                clearable
              >
                <template v-slot:prepend><q-icon name="ev_station" color="primary" /></template>
              </q-select>
            </div>
            <div class="col-12 col-sm-3">
              <q-select
                outlined dense bg-color="white"
                v-model="store.filters.fuelTypeId"
                :options="fuelTypeList"
                option-label="nombre"
                option-value="id_tipo_combustible"
                emit-value map-options
                label="Combustible (Opcional)"
                clearable
              >
                <template v-slot:prepend><q-icon name="local_gas_station" color="primary" /></template>
              </q-select>
            </div>
            <div class="col-12 col-sm-2">
              <q-input outlined dense bg-color="white" v-model="store.filters.fechaDesde" type="date" label="Desde" />
            </div>
            <div class="col-12 col-sm-2">
              <q-input outlined dense bg-color="white" v-model="store.filters.fechaHasta" type="date" label="Hasta" />
            </div>
            <div class="col-12 col-sm-2">
              <q-btn
                color="primary" icon="search" label="Generar"
                class="full-width" unelevated
                @click="generateReport"
                :loading="store.loading"
                :disable="!store.filters.fechaDesde || !store.filters.fechaHasta"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- RESULTADOS -->
      <div v-if="store.reportGroups.length > 0" class="q-gutter-y-lg">
        <!-- BOTONES DE ACCIÓN FLOTANTES O SUPERIORES -->
        <div class="row justify-end q-gutter-x-sm">
          <q-btn outline color="primary" icon="print" label="Imprimir PDF" @click="printReport" />
          <ExportExcelBtn
            :rows="flattenedData"
            :columns="excelColumns"
            :filename="`ReporteRecepcion_${store.filters.fechaDesde}_al_${store.filters.fechaHasta}`"
            sheet-name="Recepciones"
            :meta="[
              'REPORTE DE RECEPCIÓN DE COMBUSTIBLES',
              `Periodo: ${formatDate(store.filters.fechaDesde)} al ${formatDate(store.filters.fechaHasta)}`,
            ]"
            label="Exportar Excel"
            outline color="green-8"
          />
        </div>

        <div id="print-section">
          <!-- CABECERA PARA IMPRESIÓN -->
          <div class="print-only q-mb-md text-center">
            <div class="text-h5 text-weight-bold text-uppercase">Reporte Recepción Combustibles</div>
            <div class="text-subtitle1">Periodo: {{ formatDate(store.filters.fechaDesde) }} al {{ formatDate(store.filters.fechaHasta) }}</div>
          </div>

          <div v-for="(group, gIdx) in store.reportGroups" :key="gIdx" class="q-mb-xl">
            <!-- HEADER DEL GRUPO (ESTILO IMAGEN) -->
            <div class="bg-primary text-white q-pa-sm rounded-borders-top row items-center justify-between">
              <div class="text-subtitle1 text-weight-bold text-uppercase">
                {{ group.llenadero }} - {{ group.combustible }}
              </div>
              <div class="text-subtitle2">Total Litros: {{ group.total_litros }} L</div>
            </div>

            <!-- TABLA DEL GRUPO -->
            <q-table
              :rows="group.items"
              :columns="columns"
              row-key="id"
              dense flat bordered
              hide-pagination
              :pagination="{ rowsPerPage: 0 }"
              class="report-table"
            >
              <!-- Slot para el subtotal al final de cada tabla -->
              <template v-slot:bottom-row>
                <q-tr class="bg-grey-2 text-weight-bold">
                  <q-td colspan="6" class="text-right">SUBTOTAL {{ group.combustible }}:</q-td>
                  <q-td class="text-right text-primary text-h6">{{ group.total_litros }}</q-td>
                  <q-td></q-td>
                </q-tr>
              </template>
            </q-table>
          </div>
        </div>
      </div>

      <div v-else-if="!store.loading" class="text-center q-pa-xl text-grey-6">
        <q-icon name="info" size="4rem" />
        <div class="text-h6 q-mt-md">Selecciona un rango de fechas y presiona Generar</div>
      </div>

    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useReporteRecepcionStore } from '../../stores/reporteRecepcionStore';
import { date, useQuasar } from 'quasar';
import api from '../../api';
import ExportExcelBtn from '../../components/common/ExportExcelBtn.vue';

const store = useReporteRecepcionStore();
const $q = useQuasar();

const llenaderosList = ref([]);
const fuelTypeList = ref([]);

const columns = [
  { name: 'nro', label: 'N°', field: 'nro', align: 'center', style: 'width: 50px' },
  { name: 'placa', label: 'Placa Vehículo (Gandola)', field: 'placa', align: 'left', classes: 'text-weight-bold' },
  { name: 'factura', label: 'N° Factura', field: 'factura', align: 'left' },
  { name: 'fecha_factura', label: 'Fecha Factura', field: 'fecha_factura', align: 'center', format: v => date.formatDate(v, 'DD/MM/YYYY') },
  { name: 'combustible', label: 'Tipo Combustible', field: 'combustible', align: 'left' },
  { name: 'mes', label: 'MES', field: 'mes', align: 'center' },
  { name: 'litros', label: 'Litros Factura', field: 'litros', align: 'right', format: v => Number(v).toLocaleString('de-DE', { minimumFractionDigits: 3 }) },
  { name: 'destino', label: 'DESTINO', field: 'destino', align: 'left' },
];

const excelColumns = [
  { label: 'Llenadero', field: 'groupLlenadero' },
  { label: 'N°', field: 'nro' },
  { label: 'Placa Vehículo (Gandola)', field: 'placa' },
  { label: 'N° Factura', field: 'factura' },
  { label: 'Fecha Factura', field: 'fecha_factura', format: v => date.formatDate(v, 'DD/MM/YYYY') },
  { label: 'Tipo Combustible', field: 'combustible' },
  { label: 'MES', field: 'mes' },
  { label: 'Litros Factura', field: 'litros' },
  { label: 'DESTINO', field: 'destino' },
];

const flattenedData = computed(() => {
  const result = [];
  store.reportGroups.forEach(group => {
    group.items.forEach(item => {
      result.push({
        ...item,
        groupLlenadero: group.llenadero
      });
    });
  });
  return result;
});

const loadInitialData = async () => {
  try {
    const [resLlen, resFuel] = await Promise.all([
      api.get('/llenaderos'),
      api.get('/tipos-combustible')
    ]);
    llenaderosList.value = resLlen.data.data || resLlen.data;
    fuelTypeList.value = resFuel.data.data || resFuel.data;
  } catch (error) {
    console.error('Error loading catalog data:', error);
  }
};

const generateReport = async () => {
  try {
    await store.fetchReport();
    if (store.reportGroups.length === 0) {
      $q.notify({ type: 'warning', message: 'No se encontraron registros en el rango seleccionado.' });
    }
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Error al generar el reporte.' });
  }
};

const formatDate = (val) => date.formatDate(val, 'DD/MM/YYYY');

const printReport = () => {
  window.print();
};

onMounted(() => {
  store.clearReportData();
  loadInitialData();
});
</script>

<style scoped>
.rounded-borders-top {
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.report-table :deep(thead tr th) {
  background-color: #f5f5f5;
  font-weight: bold;
  text-transform: uppercase;
}

@media print {
  body * { visibility: hidden; }
  #print-section, #print-section * { visibility: visible; }
  #print-section { position: absolute; left: 0; top: 0; width: 100%; }
  .print-only { display: block !important; }
  .q-btn, .q-card, .q-header, .q-drawer { display: none !important; }
}

.print-only { display: none; }
</style>

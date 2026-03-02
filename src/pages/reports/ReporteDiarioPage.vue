<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-y-md">
      <!-- HEADER -->
      <div class="row items-center q-mb-md">
        <img src="/logo.png" style="height: 60px" class="q-mr-md" alt="Logo" />
        <div class="col">
          <h4 class="text-h4 q-my-none text-weight-bold text-primary">Reporte Diario de Combustible</h4>
          <p class="text-grey-7 q-mb-none">Generación y consulta de despachos</p>
        </div>
      </div>

      <!-- FILTROS -->
      <q-card flat bordered class="shadow-2 bg-grey-1">
        <q-card-section>
          <div class="text-h6 q-mb-md text-primary">
            <q-icon name="filter_alt" class="q-mr-sm" />Parámetros de Búsqueda
          </div>
          <div class="row q-col-gutter-md items-start">
            <div class="col-12 col-md-5">
              <q-select
                outlined v-model="store.filters.id_llenadero"
                :options="store.llenaderosList"
                option-value="id_llenadero" option-label="nombre_llenadero"
                label="Seleccione Llenadero" emit-value map-options dense bg-color="white"
                :rules="[val => !!val || 'Requerido']">
                <template v-slot:prepend><q-icon name="ev_station" color="primary" /></template>
              </q-select>
            </div>
            <div class="col-12 col-md-4">
              <q-input
                outlined v-model="store.filters.fecha" type="date"
                label="Fecha de Reporte" dense bg-color="white"
                :rules="[val => !!val || 'Requerida']">
                <template v-slot:prepend><q-icon name="event" color="primary" /></template>
              </q-input>
            </div>
            <div class="col-12 col-md-3">
              <q-btn
                color="primary" icon="search" label="Generar Reporte"
                class="full-width" unelevated
                @click="consultarReporte(1)"
                :loading="store.loading"
                :disable="!store.filters.id_llenadero || !store.filters.fecha"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- DIALOGO DE RESULTADOS -->
      <q-dialog v-model="showReportDialog" maximized transition-show="slide-up" transition-hide="slide-down">
        <q-card class="bg-grey-1">
          <q-toolbar class="bg-primary text-white shadow-2">
            <q-btn flat round dense icon="arrow_back" v-close-popup>
              <q-tooltip>Volver</q-tooltip>
            </q-btn>
            <q-toolbar-title>Vista de Reporte</q-toolbar-title>
            <q-space />
            <ExportExcelBtn
              :rows="store.reportData?.institucional || []"
              :columns="columnsInstitucional"
              :filename="`ReporteDiario_Institucional_${store.filters.fecha}`"
              sheet-name="Institucional"
              :meta="[
                'REPORTE DIARIO DE COMBUSTIBLE — INSTITUCIONAL',
                `Fecha: ${formatDate(store.filters.fecha)}`,
                `Llenadero: ${getLlenaderoNombre(store.filters.id_llenadero)}`,
              ]"
              label="Excel Institucional"
              flat
              class="q-mr-xs"
            />
            <ExportExcelBtn
              :rows="store.reportData?.venta || []"
              :columns="columnsVenta"
              :filename="`ReporteDiario_Venta_${store.filters.fecha}`"
              sheet-name="Venta"
              :meta="[
                'REPORTE DIARIO DE COMBUSTIBLE — VENTA',
                `Fecha: ${formatDate(store.filters.fecha)}`,
                `Llenadero: ${getLlenaderoNombre(store.filters.id_llenadero)}`,
              ]"
              label="Excel Venta"
              flat
              class="q-mr-sm"
            />
            <q-btn flat label="Imprimir PDF"  icon="print"      @click="printReport" />
          </q-toolbar>

          <q-card-section class="q-pa-lg scroll" style="height: calc(100vh - 50px)">
            <div id="print-section" class="bg-white q-pa-lg shadow-3 rounded-borders" style="max-width: 1200px; margin: 0 auto">

              <!-- ENCABEZADO IMPRESIÓN -->
              <div class="row items-center q-mb-lg border-bottom q-pb-md">
                <div class="col-auto q-mr-md"><img src="/logo.png" style="height: 80px" alt="Logo" /></div>
                <div class="col text-center">
                  <div class="text-h4 text-weight-bold text-uppercase">Reporte Diario de Combustible</div>
                  <div class="text-subtitle1 text-grey-8">
                    Fecha: <span class="text-weight-bold">{{ formatDate(store.filters.fecha) }}</span>
                    | Llenadero: <span class="text-weight-bold">{{ getLlenaderoNombre(store.filters.id_llenadero) }}</span>
                  </div>
                </div>
                <div class="col-auto" style="width: 80px"></div>
              </div>

              <div v-if="store.reportData">
                <!-- INSTITUCIONAL -->
                <div v-if="store.reportData.institucional?.length > 0" class="q-mb-xl">
                  <div class="bg-teal text-white q-py-sm q-px-md text-h6 rounded-borders q-mb-sm">DESPACHOS INSTITUCIONALES</div>
                  <q-table :rows="store.reportData.institucional" :columns="columnsInstitucional"
                    row-key="id_solicitud" dense flat bordered
                    :pagination="store.pagination" :loading="store.loading"
                    @request="onRequest" class="print-table">
                    <template v-slot:bottom-row>
                      <q-tr class="bg-grey-2 text-weight-bold">
                        <q-td colspan="6" class="text-right">Total Litros Institucional:</q-td>
                        <q-td class="text-right">{{ store.reportData.totales.litros_institucional }}</q-td>
                      </q-tr>
                    </template>
                  </q-table>
                </div>

                <!-- VENTA -->
                <div v-if="store.reportData.venta?.length > 0" class="q-mb-xl">
                  <div class="bg-orange-9 text-white q-py-sm q-px-md text-h6 rounded-borders q-mb-sm">DESPACHOS VENTA</div>
                  <q-table :rows="store.reportData.venta" :columns="columnsVenta"
                    row-key="id_solicitud" dense flat bordered
                    :pagination="store.pagination" :loading="store.loading"
                    @request="onRequest" class="print-table">
                    <template v-slot:bottom-row>
                      <q-tr class="bg-grey-2 text-weight-bold">
                        <q-td colspan="6" class="text-right">Totales Venta:</q-td>
                        <q-td class="text-right">{{ store.reportData.totales.litros_venta }}</q-td>
                        <q-td class="text-right"></q-td>
                        <q-td class="text-right">{{ store.reportData.totales.monto_venta }}</q-td>
                        <q-td class="text-right">-</q-td>
                        <q-td></q-td>
                      </q-tr>
                    </template>
                  </q-table>
                </div>

                <!-- RESUMEN -->
                <div class="row q-col-gutter-lg justify-center q-mt-lg">
                  <div class="col-12 col-md-8">
                    <q-markup-table flat bordered class="bg-blue-grey-1">
                      <tbody>
                        <tr><td class="text-left text-weight-bold">Total Litros Institucional</td><td class="text-right text-teal text-h6">{{ store.reportData.totales.litros_institucional }} L</td></tr>
                        <tr><td class="text-left text-weight-bold">Total Litros Venta</td><td class="text-right text-orange-9 text-h6">{{ store.reportData.totales.litros_venta }} L</td></tr>
                        <tr class="bg-grey-3"><td class="text-left text-weight-bolder text-h6">TOTAL GENERAL LITROS</td><td class="text-right text-primary text-h5 text-weight-bolder">{{ store.reportData.totales.total_litros }} L</td></tr>
                      </tbody>
                    </q-markup-table>
                  </div>
                </div>

                <!-- SALDOS A FAVOR -->
                <div v-if="store.reportData.totales.resumen_saldos?.length > 0" class="q-mt-xl">
                  <div class="text-h6 text-red-9 text-center q-mb-md border-bottom">REINTEGROS PENDIENTES (SALDOS A FAVOR)</div>
                  <div class="row justify-center q-gutter-lg">
                    <div v-for="saldo in store.reportData.totales.resumen_saldos" :key="saldo.moneda"
                      class="text-center border-all q-pa-md rounded-borders bg-red-1">
                      <div class="text-subtitle2 text-grey-8">Moneda: {{ saldo.moneda }}</div>
                      <div class="text-h4 text-red-9 text-weight-bolder">{{ saldo.total }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center q-pa-xl text-grey">No hay datos para mostrar.</div>
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>

    </div>
  </q-page>
</template>

<script setup>
import { useReporteDiarioPage } from '../../composables/useReporteDiarioPage';
import ExportExcelBtn from '../../components/common/ExportExcelBtn.vue';

const {
  store, showReportDialog,
  columnsInstitucional, columnsVenta,
  consultarReporte, onRequest,
  getLlenaderoNombre, formatDate,
  printReport,
} = useReporteDiarioPage();
</script>

<style scoped>
@media print {
  body * { visibility: hidden; }
  #print-section, #print-section * { visibility: visible; }
  #print-section { position: absolute; left: 0; top: 0; width: 100%; margin: 0 !important; padding: 0 !important; box-shadow: none !important; }
  .q-dialog__backdrop, .q-toolbar, .q-btn { display: none !important; }
}
</style>

<template>
  <q-page :class="$q.screen.lt.sm ? 'q-pa-sm' : 'q-pa-md'">
    <div class="q-gutter-y-md">

      <!-- HEADER RESPONSIVE -->
      <div class="row items-center q-col-gutter-sm">
        <div class="col-auto">
          <q-icon name="summarize" size="2rem" color="primary" />
        </div>
        <div class="col">
          <div :class="$q.screen.lt.sm ? 'text-h6' : 'text-h5'" class="text-weight-bold text-primary q-mb-none">
            Reporte Diario de Combustible
          </div>
          <div class="text-caption text-grey-7">Generación y consulta de despachos</div>
        </div>
      </div>

      <!-- FILTROS -->
      <q-card flat bordered class="bg-grey-1">
        <q-card-section :class="$q.screen.lt.sm ? 'q-pa-sm' : 'q-pa-md'">
          <div class="row items-center q-mb-sm">
            <q-icon name="filter_alt" color="primary" class="q-mr-xs" />
            <span class="text-subtitle2 text-primary text-weight-bold">Parámetros de Búsqueda</span>
          </div>
          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-5">
              <q-select
                outlined dense bg-color="white"
                v-model="store.filters.id_llenadero"
                :options="store.llenaderosList"
                option-value="id_llenadero"
                option-label="nombre_llenadero"
                label="Llenadero"
                emit-value map-options
                :rules="[val => !!val || 'Requerido']"
              >
                <template v-slot:prepend><q-icon name="ev_station" color="primary" /></template>
              </q-select>
            </div>
            <div class="col-12 col-sm-4">
              <q-input
                outlined dense bg-color="white"
                v-model="store.filters.fecha"
                type="date"
                label="Fecha de Reporte"
                :rules="[val => !!val || 'Requerida']"
              >
                <template v-slot:prepend><q-icon name="event" color="primary" /></template>
              </q-input>
            </div>
            <div class="col-12 col-sm-3">
              <q-btn
                color="primary" icon="search" label="Generar"
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
            <q-toolbar-title :class="$q.screen.lt.sm ? 'text-body2' : ''">Vista de Reporte</q-toolbar-title>
            <q-space />
            <template v-if="$q.screen.gt.xs">
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
                label="Institucional"
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
                label="Venta"
                flat
                class="q-mr-xs"
              />
              <q-btn flat icon="print" label="PDF" @click="printReport" />
            </template>
            <!-- Menú compacto en móvil -->
            <q-btn v-else flat round icon="more_vert">
              <q-menu>
                <q-list style="min-width: 180px">
                  <q-item clickable v-close-popup @click="printReport">
                    <q-item-section avatar><q-icon name="print" /></q-item-section>
                    <q-item-section>Imprimir PDF</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </q-toolbar>

          <q-card-section class="q-pa-sm q-pa-md-md scroll" style="height: calc(100vh - 50px)">
            <div id="print-section" class="bg-white q-pa-sm q-pa-lg-lg shadow-3 rounded-borders" style="max-width: 1200px; margin: 0 auto">

              <!-- ENCABEZADO IMPRESIÓN -->
              <div class="row items-center q-mb-md q-pb-sm" style="border-bottom: 1px solid #e0e0e0">
                <div class="col-auto q-mr-sm"><img src="/logo.png" style="height: 60px" alt="Logo" /></div>
                <div class="col text-center">
                  <div :class="$q.screen.lt.sm ? 'text-subtitle1' : 'text-h5'" class="text-weight-bold text-uppercase">
                    Reporte Diario de Combustible
                  </div>
                  <div class="text-caption text-grey-8">
                    Fecha: <span class="text-weight-bold">{{ formatDate(store.filters.fecha) }}</span>
                    · Llenadero: <span class="text-weight-bold">{{ getLlenaderoNombre(store.filters.id_llenadero) }}</span>
                  </div>
                </div>
              </div>

              <div v-if="store.reportData">
                <!-- INSTITUCIONAL -->
                <div v-if="store.reportData.institucional?.length > 0" class="q-mb-lg">
                  <q-banner dense class="bg-teal text-white rounded-borders q-mb-sm">
                    <template v-slot:avatar><q-icon name="business" /></template>
                    DESPACHOS INSTITUCIONALES
                  </q-banner>
                  <q-table
                    :rows="store.reportData.institucional"
                    :columns="columnsInstitucional"
                    row-key="id_solicitud"
                    dense flat bordered
                    :pagination="store.pagination"
                    :loading="store.loading"
                    @request="onRequest"
                    wrap-cells
                    class="print-table"
                  >
                    <template v-slot:bottom-row>
                      <q-tr class="bg-grey-2 text-weight-bold">
                        <q-td colspan="6" class="text-right">Total Litros Institucional:</q-td>
                        <q-td class="text-right">{{ store.reportData.totales.litros_institucional }}</q-td>
                      </q-tr>
                    </template>
                  </q-table>
                </div>

                <!-- VENTA -->
                <div v-if="store.reportData.venta?.length > 0" class="q-mb-lg">
                  <q-banner dense class="bg-orange-9 text-white rounded-borders q-mb-sm">
                    <template v-slot:avatar><q-icon name="sell" /></template>
                    DESPACHOS VENTA
                  </q-banner>
                  <q-table
                    :rows="store.reportData.venta"
                    :columns="columnsVenta"
                    row-key="id_solicitud"
                    dense flat bordered
                    :pagination="store.pagination"
                    :loading="store.loading"
                    @request="onRequest"
                    wrap-cells
                    class="print-table"
                  >
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
                <div class="row justify-center q-mt-md">
                  <div class="col-12 col-sm-8 col-md-6">
                    <q-markup-table flat bordered class="bg-blue-grey-1">
                      <tbody>
                        <tr>
                          <td class="text-left text-weight-bold">Total Litros Institucional</td>
                          <td class="text-right text-teal text-h6">{{ store.reportData.totales.litros_institucional }} L</td>
                        </tr>
                        <tr>
                          <td class="text-left text-weight-bold">Total Litros Venta</td>
                          <td class="text-right text-orange-9 text-h6">{{ store.reportData.totales.litros_venta }} L</td>
                        </tr>
                        <template v-for="(item, index) in store.reportData.totales.por_combustible" :key="index">
                          <tr>
                            <td class="text-left q-pl-md" style="border-top: 1px dashed #ccc">
                              <q-icon name="local_gas_station" class="q-mr-xs text-grey-6" />
                              <span class="text-weight-bold">{{ item.combustible }}</span>
                              <div class="text-caption text-grey-7">Inst: {{ item.institucional }} L · Venta: {{ item.venta }} L</div>
                            </td>
                            <td class="text-right text-h6" style="border-top: 1px dashed #ccc">{{ item.total }} L</td>
                          </tr>
                        </template>
                        <tr class="bg-grey-3">
                          <td class="text-left text-weight-bolder text-subtitle1">TOTAL GENERAL LITROS</td>
                          <td class="text-right text-primary text-h6 text-weight-bolder">{{ store.reportData.totales.total_litros }} L</td>
                        </tr>
                      </tbody>
                    </q-markup-table>
                  </div>
                </div>

                <!-- SALDOS A FAVOR -->
                <div v-if="store.reportData.totales.resumen_saldos?.length > 0" class="q-mt-lg">
                  <q-banner class="bg-red-1 text-red-9" rounded>
                    <template v-slot:avatar><q-icon name="warning" color="red-9" /></template>
                    <span class="text-weight-bold">REINTEGROS PENDIENTES (SALDOS A FAVOR)</span>
                  </q-banner>
                  <div class="row q-col-gutter-md q-mt-sm">
                    <div
                      v-for="saldo in store.reportData.totales.resumen_saldos"
                      :key="saldo.moneda"
                      class="col-6 col-sm-4 col-md-3"
                    >
                      <q-card flat bordered class="bg-red-1 text-center q-pa-sm">
                        <div class="text-caption text-grey-8">Moneda: {{ saldo.moneda }}</div>
                        <div class="text-h5 text-red-9 text-weight-bolder">{{ saldo.total }}</div>
                      </q-card>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center q-pa-xl text-grey">
                <q-icon name="info" size="3rem" /><div class="q-mt-sm">No hay datos para mostrar.</div>
              </div>
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

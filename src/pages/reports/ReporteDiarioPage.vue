<template>
  <q-page :class="$q.screen.lt.sm ? 'q-pa-sm' : 'q-pa-md'">
    <div class="q-gutter-y-md">
      <!-- HEADER RESPONSIVE -->
      <div class="row items-center q-col-gutter-sm">
        <div class="col-auto">
          <q-icon name="summarize" size="2rem" color="primary" />
        </div>
        <div class="col">
          <div
            :class="$q.screen.lt.sm ? 'text-h6' : 'text-h5'"
            class="text-weight-bold text-primary q-mb-none"
          >
            Reporte Diario de Combustible
          </div>
          <div class="text-caption text-grey-7">
            Generación y consulta de despachos
          </div>
        </div>
      </div>

      <!-- FILTROS -->
      <q-card flat bordered class="bg-grey-1">
        <q-card-section :class="$q.screen.lt.sm ? 'q-pa-sm' : 'q-pa-md'">
          <div class="row items-center q-mb-sm">
            <q-icon name="filter_alt" color="primary" class="q-mr-xs" />
            <span class="text-subtitle2 text-primary text-weight-bold"
              >Parámetros de Búsqueda</span
            >
          </div>
          <div class="row q-col-gutter-sm">
            <div class="col-12 col-md-3">
              <q-select
                outlined
                dense
                bg-color="white"
                v-model="store.filters.id_llenadero"
                :options="store.llenaderosList"
                option-value="id_llenadero"
                option-label="nombre_llenadero"
                label="Llenadero"
                emit-value
                map-options
                :rules="[(val) => !!val || 'Requerido']"
              >
                <template v-slot:prepend
                  ><q-icon name="ev_station" color="primary"
                /></template>
              </q-select>
            </div>
            <div class="col-12 col-sm-6 col-md-2">
              <q-input
                outlined
                dense
                bg-color="white"
                v-model="store.filters.fecha_desde"
                type="date"
                label="Desde"
                :rules="[(val) => !!val || 'Requerida']"
              >
                <template v-slot:prepend
                  ><q-icon name="event" color="primary"
                /></template>
              </q-input>
            </div>
            <div class="col-12 col-sm-6 col-md-2">
              <q-input
                outlined
                dense
                bg-color="white"
                v-model="store.filters.hora_desde"
                type="time"
                label="Hora Inicio"
              >
                <template v-slot:prepend
                  ><q-icon name="schedule" color="primary"
                /></template>
              </q-input>
            </div>
            <div class="col-12 col-sm-6 col-md-2">
              <q-input
                outlined
                dense
                bg-color="white"
                v-model="store.filters.fecha_hasta"
                type="date"
                label="Hasta"
                :rules="[(val) => !!val || 'Requerida']"
              >
                <template v-slot:prepend
                  ><q-icon name="event" color="primary"
                /></template>
              </q-input>
            </div>
            <div class="col-12 col-sm-6 col-md-2">
              <q-input
                outlined
                dense
                bg-color="white"
                v-model="store.filters.hora_hasta"
                type="time"
                label="Hora Fin"
              >
                <template v-slot:prepend
                  ><q-icon name="schedule" color="primary"
                /></template>
              </q-input>
            </div>
            <div class="col-12 col-md-1">
              <q-btn
                color="primary"
                icon="search"
                class="full-width"
                unelevated
                @click="consultarReporte(1)"
                :loading="store.loading"
                :disable="
                  !store.filters.id_llenadero ||
                  !store.filters.fecha_desde ||
                  !store.filters.fecha_hasta
                "
              >
                <q-tooltip>Generar</q-tooltip>
              </q-btn>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- DIALOGO DE RESULTADOS -->
      <q-dialog
        v-model="showReportDialog"
        maximized
        transition-show="slide-up"
        transition-hide="slide-down"
      >
        <q-card class="bg-grey-1">
          <q-toolbar class="bg-primary text-white shadow-2">
            <q-btn flat round dense icon="arrow_back" v-close-popup>
              <q-tooltip>Volver</q-tooltip>
            </q-btn>
            <q-toolbar-title :class="$q.screen.lt.sm ? 'text-body2' : ''"
              >Vista de Reporte</q-toolbar-title
            >
            <q-space />
            <template v-if="$q.screen.gt.xs">
              <ExportExcelBtn
                v-if="store.reportData?.institucional?.length > 0"
                :sheets="excelSheetsInstitucional"
                :filename="`ReporteDiario_Institucional_${store.filters.fecha_desde}_al_${store.filters.fecha_hasta}`"
                label="Inst. Excel"
                flat
                color="white"
                class="q-mr-xs"
              />

              <ExportExcelBtn
                v-if="store.reportData?.venta?.length > 0"
                :sheets="excelSheetsVenta"
                :filename="`ReporteDiario_Venta_${store.filters.fecha_desde}_al_${store.filters.fecha_hasta}`"
                label="Venta Excel"
                flat
                color="white"
                class="q-mr-xs"
              />

              <q-btn
                flat
                icon="print"
                label="Imprimir"
                color="white"
                @click="printReport"
              />
            </template>
            <!-- Menú compacto en móvil -->
            <q-btn v-else flat round icon="more_vert">
              <q-menu>
                <q-list style="min-width: 180px">
                  <q-item clickable v-close-popup @click="printReport">
                    <q-item-section avatar
                      ><q-icon name="print"
                    /></q-item-section>
                    <q-item-section>Imprimir PDF</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </q-toolbar>

          <q-card-section
            class="q-pa-sm q-pa-md-md scroll"
            style="height: calc(100vh - 50px)"
          >
            <div
              id="print-section"
              class="bg-white q-pa-sm q-pa-lg-lg shadow-3 rounded-borders"
              style="width: 100%; margin: 0 auto"
            >
              <!-- ENCABEZADO IMPRESIÓN -->
              <div
                class="row items-center q-mb-md q-pb-sm"
                style="border-bottom: 1px solid #e0e0e0"
              >
                <div class="col-auto q-mr-sm">
                  <img src="/logo.png" style="height: 60px" alt="Logo" />
                </div>
                <div class="col text-center">
                  <div
                    :class="$q.screen.lt.sm ? 'text-subtitle1' : 'text-h5'"
                    class="text-weight-bold text-uppercase"
                  >
                    Reporte Diario de Combustible
                  </div>
                  <div class="text-caption text-grey-8">
                    Periodo:
                    <span class="text-weight-bold"
                      >{{ formatDate(store.filters.fecha_desde) }} -
                      {{ formatDate(store.filters.fecha_hasta) }}</span
                    >
                    · Llenadero:
                    <span class="text-weight-bold">{{
                      getLlenaderoNombre(store.filters.id_llenadero)
                    }}</span>
                  </div>
                </div>
              </div>

              <div v-if="store.reportData">
                <!-- INSTITUCIONAL -->
                <div
                  v-if="store.reportData.institucional?.length > 0"
                  class="q-mb-lg"
                >
                  <q-banner
                    dense
                    class="bg-teal text-white rounded-borders q-mb-sm"
                  >
                    <template v-slot:avatar
                      ><q-icon name="business"
                    /></template>
                    DESPACHOS INSTITUCIONALES
                  </q-banner>
                  <q-table
                    :rows="store.reportData.institucional"
                    :columns="columnsInstitucional"
                    row-key="id_solicitud"
                    dense
                    flat
                    bordered
                    v-model:pagination="store.pagination"
                    :loading="store.loading"
                    @request="onRequest"
                    wrap-cells
                    class="print-table"
                  >
                    <!-- Personalización de filas con soporte para desglose de ticket maestro -->
                    <template v-slot:body="props">
                      <q-tr :props="props" :class="props.row.es_nodriza ? 'bg-purple-1' : ''">
                        <q-td v-for="col in props.cols" :key="col.name" :props="props">
                          <template v-if="col.name === 'vehiculo'">
                            <div class="row items-center no-wrap q-gutter-xs">
                              <q-badge
                                v-if="props.row.es_nodriza"
                                color="purple"
                                text-color="white"
                                label="MAESTRO"
                                class="q-mr-xs text-weight-bolder"
                              />
                              <span>{{ col.value }}</span>
                            </div>
                          </template>

                          <template v-else-if="col.name === 'estado_rendicion'">
                            <div v-if="props.row.es_nodriza" class="row items-center no-wrap q-gutter-xs">
                              <q-chip
                                dense
                                size="sm"
                                :color="props.row.saldo_pendiente <= 0.001 ? 'positive' : (props.row.total_distribuido > 0 ? 'warning' : 'grey-7')"
                                text-color="white"
                                icon="alt_route"
                              >
                                {{ props.row.estado_rendicion }}
                              </q-chip>
                              <q-btn
                                v-if="props.row.distribuciones?.length > 0"
                                flat
                                dense
                                round
                                size="xs"
                                color="purple"
                                :icon="props.expand ? 'expand_less' : 'expand_more'"
                                @click="props.expand = !props.expand"
                              >
                                <q-tooltip>{{ props.expand ? 'Ocultar entregas en campo' : 'Ver entregas en campo' }}</q-tooltip>
                              </q-btn>
                            </div>
                            <span v-else class="text-grey-5">-</span>
                          </template>

                          <template v-else>
                            {{ col.value }}
                          </template>
                        </q-td>
                      </q-tr>

                      <!-- Sub-tabla desplegable con detalle de entregas del ticket maestro -->
                      <q-tr v-show="props.expand" :props="props" class="bg-purple-1">
                        <q-td :colspan="props.cols.length" class="q-pa-sm">
                          <div class="q-pa-sm bg-white rounded-borders shadow-1">
                            <div class="row items-center justify-between q-mb-xs">
                              <div class="text-weight-bold text-purple-9 text-caption">
                                <q-icon name="alt_route" class="q-mr-xs" />
                                Detalle de Distribución Interna — Ticket Maestro: {{ props.row.codigo_ticket }}
                              </div>
                              <div class="text-caption text-grey-8">
                                Despachado: <b>{{ props.row.cant_desp }} L</b> |
                                Distribuido: <b class="text-primary">{{ props.row.total_distribuido }} L</b> |
                                Saldo: <b class="text-orange-9">{{ props.row.saldo_pendiente }} L</b>
                              </div>
                            </div>
                            <q-markup-table dense flat bordered separator="cell" class="text-caption">
                              <thead>
                                <tr class="bg-grey-2 text-weight-bold">
                                  <th class="text-left">Fecha / Hora Entrega</th>
                                  <th class="text-left">Equipo / Vehículo Receptor</th>
                                  <th class="text-left">Placa</th>
                                  <th class="text-right">Litros Asignados</th>
                                  <th class="text-left">Frente / Ubicación / Observación</th>
                                  <th class="text-left">Registrado Por</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr v-for="dist in props.row.distribuciones" :key="dist.id_distribucion">
                                  <td>{{ dist.fecha_hora }}</td>
                                  <td>{{ dist.vehiculo }}</td>
                                  <td><q-badge outline color="dark">{{ dist.placa }}</q-badge></td>
                                  <td class="text-right text-weight-bold text-teal">{{ Number(dist.litros).toFixed(2) }} L</td>
                                  <td>{{ dist.frente }}</td>
                                  <td>{{ dist.registrador }}</td>
                                </tr>
                              </tbody>
                            </q-markup-table>
                          </div>
                        </q-td>
                      </q-tr>
                    </template>

                    <template v-slot:bottom-row>
                      <q-tr class="bg-grey-2 text-weight-bold">
                        <q-td colspan="11" class="text-right"
                          >Total Litros Institucional:</q-td
                        >
                        <q-td class="text-right">{{
                          store.reportData.totales.litros_institucional
                        }}</q-td>
                        <q-td></q-td>
                      </q-tr>
                    </template>
                  </q-table>
                </div>

                <!-- VENTA -->
                <div v-if="store.reportData.venta?.length > 0" class="q-mb-lg">
                  <q-banner
                    dense
                    class="bg-orange-9 text-white rounded-borders q-mb-sm"
                  >
                    <template v-slot:avatar><q-icon name="sell" /></template>
                    DESPACHOS DE VENTA (S.C.)
                  </q-banner>
                  <q-table
                    :rows="store.reportData.venta"
                    :columns="columnsVenta"
                    row-key="id_solicitud"
                    dense
                    flat
                    bordered
                    v-model:pagination="store.pagination"
                    :loading="store.loading"
                    @request="onRequest"
                    wrap-cells
                    class="print-table"
                  >
                    <!-- Personalización de filas Venta -->
                    <template v-slot:body="props">
                      <q-tr :props="props" :class="props.row.es_nodriza ? 'bg-purple-1' : ''">
                        <q-td v-for="col in props.cols" :key="col.name" :props="props">
                          <template v-if="col.name === 'vehiculo'">
                            <div class="row items-center no-wrap q-gutter-xs">
                              <q-badge
                                v-if="props.row.es_nodriza"
                                color="purple"
                                text-color="white"
                                label="MAESTRO"
                                class="q-mr-xs text-weight-bolder"
                              />
                              <span>{{ col.value }}</span>
                            </div>
                          </template>

                          <template v-else-if="col.name === 'estado_rendicion'">
                            <div v-if="props.row.es_nodriza" class="row items-center no-wrap q-gutter-xs">
                              <q-chip
                                dense
                                size="sm"
                                :color="props.row.saldo_pendiente <= 0.001 ? 'positive' : (props.row.total_distribuido > 0 ? 'warning' : 'grey-7')"
                                text-color="white"
                                icon="alt_route"
                              >
                                {{ props.row.estado_rendicion }}
                              </q-chip>
                              <q-btn
                                v-if="props.row.distribuciones?.length > 0"
                                flat
                                dense
                                round
                                size="xs"
                                color="purple"
                                :icon="props.expand ? 'expand_less' : 'expand_more'"
                                @click="props.expand = !props.expand"
                              >
                                <q-tooltip>{{ props.expand ? 'Ocultar entregas en campo' : 'Ver entregas en campo' }}</q-tooltip>
                              </q-btn>
                            </div>
                            <span v-else class="text-grey-5">-</span>
                          </template>

                          <template v-else>
                            {{ col.value }}
                          </template>
                        </q-td>
                      </q-tr>

                      <!-- Sub-tabla desplegable con detalle de entregas del ticket maestro -->
                      <q-tr v-show="props.expand" :props="props" class="bg-purple-1">
                        <q-td :colspan="props.cols.length" class="q-pa-sm">
                          <div class="q-pa-sm bg-white rounded-borders shadow-1">
                            <div class="row items-center justify-between q-mb-xs">
                              <div class="text-weight-bold text-purple-9 text-caption">
                                <q-icon name="alt_route" class="q-mr-xs" />
                                Detalle de Distribución Interna — Ticket Maestro: {{ props.row.codigo_ticket }}
                              </div>
                              <div class="text-caption text-grey-8">
                                Despachado: <b>{{ props.row.cant_desp }} L</b> |
                                Distribuido: <b class="text-primary">{{ props.row.total_distribuido }} L</b> |
                                Saldo: <b class="text-orange-9">{{ props.row.saldo_pendiente }} L</b>
                              </div>
                            </div>
                            <q-markup-table dense flat bordered separator="cell" class="text-caption">
                              <thead>
                                <tr class="bg-grey-2 text-weight-bold">
                                  <th class="text-left">Fecha / Hora Entrega</th>
                                  <th class="text-left">Equipo / Vehículo Receptor</th>
                                  <th class="text-left">Placa</th>
                                  <th class="text-right">Litros Asignados</th>
                                  <th class="text-left">Frente / Ubicación / Observación</th>
                                  <th class="text-left">Registrado Por</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr v-for="dist in props.row.distribuciones" :key="dist.id_distribucion">
                                  <td>{{ dist.fecha_hora }}</td>
                                  <td>{{ dist.vehiculo }}</td>
                                  <td><q-badge outline color="dark">{{ dist.placa }}</q-badge></td>
                                  <td class="text-right text-weight-bold text-teal">{{ Number(dist.litros).toFixed(2) }} L</td>
                                  <td>{{ dist.frente }}</td>
                                  <td>{{ dist.registrador }}</td>
                                </tr>
                              </tbody>
                            </q-markup-table>
                          </div>
                        </q-td>
                      </q-tr>
                    </template>

                    <template v-slot:bottom-row>
                      <q-tr class="bg-grey-2 text-weight-bold">
                        <q-td
                          colspan="11"
                          class="text-right"
                          >Total Litros Venta:</q-td
                        >
                        <q-td class="text-right">{{
                          store.reportData.totales.litros_venta
                        }}</q-td>
                        <q-td
                          v-if="canViewFinancial"
                          colspan="5"
                          class="text-right"
                        >
                          Monto Total:
                          {{ store.reportData.totales.monto_venta }}
                        </q-td>
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
                          <td class="text-left text-weight-bold">
                            Total Litros Institucional
                          </td>
                          <td class="text-right text-teal text-h6">
                            {{
                              store.reportData.totales.litros_institucional
                            }}
                            L
                          </td>
                        </tr>
                        <tr>
                          <td class="text-left text-weight-bold">
                            Total Litros Venta (S.C.)
                          </td>
                          <td class="text-right text-orange-9 text-h6">
                            {{ store.reportData.totales.litros_venta }} L
                          </td>
                        </tr>

                        <template
                          v-for="(item, index) in store.reportData.totales
                            .por_combustible"
                          :key="index"
                        >
                          <tr>
                            <td
                              class="text-left q-pl-md"
                              style="border-top: 1px dashed #ccc"
                            >
                              <q-icon
                                name="local_gas_station"
                                class="q-mr-xs text-grey-6"
                              />
                              <span class="text-weight-bold">{{
                                item.combustible
                              }}</span>
                              <div class="text-caption text-grey-7">
                                Inst: {{ item.institucional }} L | Venta:
                                {{ item.venta }} L
                              </div>
                            </td>
                            <td
                              class="text-right text-h6"
                              style="border-top: 1px dashed #ccc"
                            >
                              {{ item.total }} L
                            </td>
                          </tr>
                        </template>
                        <tr class="bg-grey-3">
                          <td
                            class="text-left text-weight-bolder text-subtitle1"
                          >
                            TOTAL GENERAL LITROS
                          </td>
                          <td
                            class="text-right text-primary text-h6 text-weight-bolder"
                          >
                            {{ store.reportData.totales.total_litros }} L
                          </td>
                        </tr>
                      </tbody>
                    </q-markup-table>
                  </div>
                </div>

                <!-- SALDOS A FAVOR (Solo si tiene permiso de ventas) -->
                <div
                  v-if="
                    canViewFinancial &&
                    store.reportData.totales.resumen_saldos?.length > 0
                  "
                  class="q-mt-lg"
                >
                  <q-banner class="bg-red-1 text-red-9" rounded>
                    <template v-slot:avatar
                      ><q-icon name="warning" color="red-9"
                    /></template>
                    <span class="text-weight-bold"
                      >REINTEGROS PENDIENTES (SALDOS A FAVOR)</span
                    >
                  </q-banner>
                  <div class="row q-col-gutter-md q-mt-sm">
                    <div
                      v-for="saldo in store.reportData.totales.resumen_saldos"
                      :key="saldo.moneda"
                      class="col-6 col-sm-4 col-md-3"
                    >
                      <q-card
                        flat
                        bordered
                        class="bg-red-1 text-center q-pa-sm"
                      >
                        <div class="text-caption text-grey-8">
                          Moneda: {{ saldo.moneda }}
                        </div>
                        <div class="text-h5 text-red-9 text-weight-bolder">
                          {{ saldo.total }}
                        </div>
                      </q-card>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center q-pa-xl text-grey">
                <q-icon name="info" size="3rem" />
                <div class="q-mt-sm">No hay datos para mostrar.</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup>
import { useReporteDiarioPage } from "../../composables/useReporteDiarioPage";
import ExportExcelBtn from "../../components/common/ExportExcelBtn.vue";

const {
  store,
  showReportDialog,
  columnsInstitucional,
  columnsVenta,
  excelSheetsInstitucional,
  excelSheetsVenta,
  canViewFinancial,
  consultarReporte,
  onRequest,
  getLlenaderoNombre,
  formatDate,
  printReport,
} = useReporteDiarioPage();
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

<template>
  <q-page :class="$q.screen.lt.sm ? 'q-pa-sm' : 'q-pa-md'">
    <div class="q-gutter-y-md">

      <!-- ════════════════════════════════════════════
           ENCABEZADO
           ════════════════════════════════════════════ -->
      <div class="row items-start q-col-gutter-sm">
        <div class="col-auto">
          <q-icon name="local_gas_station" size="2.4rem" color="primary" />
        </div>
        <div class="col">
          <div :class="$q.screen.lt.sm ? 'text-h6' : 'text-h5'"
               class="text-weight-bold text-primary q-mb-none">
            Situación del Combustible
          </div>
          <div class="text-caption text-grey-7">
            Stock actual y consumo por llenadero y tipo de combustible
          </div>
        </div>
        <!-- Timestamp de última actualización -->
        <div v-if="generadoEn" class="col-auto text-right">
          <div class="text-caption text-grey-6">
            <q-icon name="schedule" size="xs" class="q-mr-xs" />
            Actualizado: {{ fmtTimestamp(generadoEn) }}
          </div>
        </div>
      </div>

      <!-- ════════════════════════════════════════════
           FILTROS
           ════════════════════════════════════════════ -->
      <q-card flat bordered class="bg-grey-1">
        <q-card-section :class="$q.screen.lt.sm ? 'q-pa-sm' : 'q-pa-md'">
          <div class="row items-center q-mb-sm">
            <q-icon name="filter_alt" color="primary" class="q-mr-xs" />
            <span class="text-subtitle2 text-primary text-weight-bold">
              Período de Consumo
            </span>
          </div>
          <div class="row q-col-gutter-sm items-center">

            <div class="col-12 col-sm-4">
              <q-input
                outlined dense bg-color="white"
                v-model="filters.fecha_desde"
                type="date"
                label="Desde"
              >
                <template v-slot:prepend>
                  <q-icon name="event" color="primary" />
                </template>
              </q-input>
            </div>

            <div class="col-12 col-sm-4">
              <q-input
                outlined dense bg-color="white"
                v-model="filters.fecha_hasta"
                type="date"
                label="Hasta"
              >
                <template v-slot:prepend>
                  <q-icon name="event_available" color="primary" />
                </template>
              </q-input>
            </div>

            <div class="col-12 col-sm-4">
              <q-btn
                color="primary" icon="refresh" label="Actualizar"
                class="full-width" unelevated
                id="btn-actualizar-situacion"
                @click="fetchReporte"
                :loading="loading"
              />
            </div>
          </div>

          <!-- Info: stock es tiempo real, consumo es del período -->
          <q-banner dense rounded class="bg-blue-1 text-blue-9 q-mt-sm">
            <template v-slot:avatar>
              <q-icon name="info" color="blue-7" />
            </template>
            El <strong>stock actual</strong> refleja el nivel en tiempo real.
            El <strong>consumo</strong> corresponde al período seleccionado.
          </q-banner>
        </q-card-section>
      </q-card>

      <!-- ════════════════════════════════════════════
           ERROR
           ════════════════════════════════════════════ -->
      <q-banner v-if="errorMsg" dense rounded class="bg-red-1 text-red-9">
        <template v-slot:avatar><q-icon name="error" color="red-7" /></template>
        {{ errorMsg }}
      </q-banner>

      <!-- ════════════════════════════════════════════
           VISUALIZACIÓN DE CILINDROS
           ════════════════════════════════════════════ -->
      <q-card v-if="reportData" flat bordered>
        <q-card-section>
          <TankGrid
            :datos="reportData.datos"
            :totales-por-combustible="reportData.totales_por_combustible"
            :cylinder-w="$q.screen.lt.sm ? 80 : 100"
            :cylinder-h="$q.screen.lt.sm ? 180 : 230"
          />
        </q-card-section>
      </q-card>

      <!-- Estado vacío (antes de primera consulta) -->
      <q-card v-if="!reportData && !loading" flat bordered class="bg-grey-1">
        <q-card-section class="column items-center q-pa-xl text-grey-6">
          <q-icon name="oil_barrel" size="4rem" color="grey-4" />
          <div class="q-mt-md text-subtitle2">
            Selecciona el período y pulsa <strong>Actualizar</strong>
          </div>
        </q-card-section>
      </q-card>

      <!-- ════════════════════════════════════════════
           TABLA RESUMEN
           ════════════════════════════════════════════ -->
      <template v-if="reportData">
        <div class="row items-center q-mt-md q-mb-xs">
          <q-icon name="table_chart" color="primary" class="q-mr-xs" />
          <span class="text-subtitle1 text-weight-bold text-primary">
            Tabla Resumen
          </span>
          <q-space />
          <ExportExcelBtn
            v-if="$q.screen.gt.xs"
            :rows="tablaResumen"
            :columns="columnsResumen"
            :filename="`SituacionCombustible_${filters.fecha_desde}_${filters.fecha_hasta}`"
            sheet-name="Situación"
            :meta="[
              'SITUACIÓN DEL COMBUSTIBLE',
              `Período: ${fmt(filters.fecha_desde)} al ${fmt(filters.fecha_hasta)}`,
              `Generado: ${fmtTimestamp(generadoEn)}`,
            ]"
            label="Exportar Excel"
            icon="file_download"
            color="green-8"
            flat
          />
        </div>

        <q-table
          :rows="tablaResumen"
          :columns="columnsResumen"
          row-key="llenadero"
          dense flat bordered
          :rows-per-page-options="[0]"
          hide-pagination
          class="situacion-table"
        >
          <!-- Colorear filas de totales -->
          <template v-slot:body="props">
            <q-tr
              :props="props"
              :class="props.row.esTotal ? 'total-row' : ''"
            >
              <q-td v-for="col in props.cols" :key="col.name" :props="props">
                <!-- Barra de progreso para columna stock% -->
                <template v-if="col.name === 'porcentaje_stock'">
                  <div class="row items-center no-wrap" style="min-width: 80px">
                    <q-linear-progress
                      :value="Number(col.value) / 100"
                      color="primary"
                      track-color="blue-1"
                      style="width: 60px; height: 6px; border-radius: 3px;"
                      class="q-mr-xs"
                    />
                    <span>{{ col.value }}%</span>
                  </div>
                </template>
                <template v-else>{{ col.value }}</template>
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </template>

    </div>
  </q-page>
</template>

<script setup>
import { useSituacionCombustible } from "../../composables/useSituacionCombustible.js";
import TankGrid    from "../../components/reports/TankGrid.vue";
import ExportExcelBtn from "../../components/common/ExportExcelBtn.vue";

const {
  filters, reportData, loading, generadoEn, errorMsg,
  tablaResumen,
  fetchReporte,
  fmt, fmtTimestamp, fmtNum,
} = useSituacionCombustible();

// Columnas de la tabla resumen
const columnsResumen = [
  { name: "llenadero",        label: "Llenadero",     field: "llenadero",        align: "left",  sortable: true },
  { name: "combustible",      label: "Combustible",   field: "combustible",      align: "left",  sortable: true },
  {
    name: "capacidad", label: "Capacidad (L)", field: "capacidad", align: "right", sortable: true,
    format: (v) => fmtNum(v),
  },
  {
    name: "stock",     label: "Stock Actual (L)", field: "stock",    align: "right", sortable: true,
    format: (v) => fmtNum(v),
  },
  {
    name: "consumido", label: "Consumido (L)",   field: "consumido", align: "right", sortable: true,
    format: (v) => fmtNum(v),
  },
  {
    name: "porcentaje_stock", label: "% Ocupación", field: "porcentaje_stock", align: "center", sortable: true,
  },
];
</script>

<style scoped>
:deep(.situacion-table .total-row) {
  background-color: #E3F2FD !important;
  font-weight: 700;
}
:deep(.situacion-table .total-row td) {
  color: #0D47A1;
  border-top: 2px solid #BBDEFB;
}
</style>

<template>
  <q-page padding class="bg-grey-2">
    <!-- Header y Tabs -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h5 text-weight-bold text-primary">
          Reporte Consolidado
        </div>
      </div>
      <q-tabs
        v-model="tipoReporte"
        dense
        class="text-grey"
        active-color="primary"
      >
        <q-tab name="DIARIO" icon="today" label="Día a Día" />
        <q-tab
          name="MENSUAL"
          icon="calendar_month"
          label="Consolidado Mensual"
        />
      </q-tabs>
    </div>

    <!-- Panel de Filtros -->
    <q-card flat bordered class="q-mb-lg bg-white">
      <q-card-section class="row q-col-gutter-md items-center">
        <!-- Rango de Fechas -->
        <div class="col-12 col-md-3">
          <DatePickerGlobal
            v-model="filtroFechas"
            :label="
              tipoReporte === 'DIARIO' ? 'Rango de Fechas' : 'Rango de Meses'
            "
            :default-view="tipoReporte === 'DIARIO' ? 'Calendar' : 'Months'"
          />
        </div>

        <!-- Filtro Múltiple de Sedes -->
        <div class="col-12 col-md-4">
          <q-select
            outlined
            dense
            v-model="sedesSeleccionadas"
            :options="llenaderos"
            option-label="nombre_llenadero"
            option-value="id_llenadero"
            multiple
            use-chips
            clearable
            label="Filtrar por Sedes (Todas por defecto)"
          />
        </div>

        <!-- Botones de Acción -->
        <div class="col-12 col-md-5 row q-gutter-sm justify-end">
          <q-btn
            color="primary"
            icon="search"
            label="Generar Consolidado"
            @click="cargarDatosKardex"
            :loading="cargando"
          />
          <q-btn
            v-if="datosKardex.length > 0"
            color="positive"
            icon="table_view"
            label="Exportar Excel"
            @click="exportarExcel"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Dashboard Gerencial -->
    <div class="row q-col-gutter-md q-mb-lg" v-if="dashboardData">
      <div class="col-12 col-md-3">
        <!-- Usando estilos nativos de Quasar -->
        <q-card class="bg-blue-8 text-white shadow-2">
          <q-card-section>
            <div class="text-overline text-blue-2">Stock Inicial</div>
            <div class="text-h5 text-weight-bolder">
              {{ format(dashboardData.stockInicialGlobal) }} L
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-3">
        <q-card class="bg-green-8 text-white shadow-2">
          <q-card-section>
            <div class="text-overline text-green-2">Total Recepciones</div>
            <div class="text-h5 text-weight-bolder">
              + {{ format(dashboardData.totalRecepciones) }} L
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-3">
        <q-card class="bg-red-8 text-white shadow-2">
          <q-card-section>
            <div class="text-overline text-red-2">Total Despachos</div>
            <div class="text-h5 text-weight-bolder">
              - {{ format(dashboardData.totalDespachos) }} L
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-3">
        <q-card class="bg-orange-9 text-white shadow-2">
          <q-card-section>
            <div class="text-overline text-orange-2">Stock Final</div>
            <div class="text-h5 text-weight-bolder">
              {{ format(dashboardData.stockFinalGlobal) }} L
            </div>
            <q-badge
              v-if="dashboardData.enProgreso"
              color="warning"
              class="absolute-top-right q-mt-sm q-mr-sm text-black"
            >
              <q-icon name="cached" spin class="q-mr-xs" /> Parcial
            </q-badge>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Tabla Principal -->
    <q-card flat bordered class="bg-white" v-if="datosKardex.length > 0">
      <q-table
        :rows="datosKardex"
        :columns="columnasKardex"
        :loading="cargando"
        flat
        bordered
        separator="cell"
        :pagination="{ rowsPerPage: 31 }"
      >
        <template v-slot:body-cell-periodo="props">
          <q-td
            :props="props"
            :class="props.row.estado === 'EN_PROGRESO' ? 'bg-yellow-1' : ''"
          >
            <span class="text-weight-bold">{{ props.value }}</span>
            <q-badge
              v-if="props.row.estado === 'EN_PROGRESO'"
              color="warning"
              class="q-ml-sm text-black"
              ><q-icon name="cached" spin /> Parcial</q-badge
            >
          </q-td>
        </template>
        <template v-slot:body-cell-recepcion="props">
          <q-td :props="props" class="text-green-8 text-weight-medium">
            {{ props.value > 0 ? "+" : "" }}{{ format(props.value) }}
          </q-td>
        </template>
        <template v-slot:body-cell-despacho="props">
          <q-td :props="props" class="text-red-8 text-weight-medium">
            {{ props.value > 0 ? "-" : "" }}{{ format(props.value) }}
          </q-td>
        </template>
        <template v-slot:body-cell-stock_inicial="props">
          <q-td :props="props">{{ format(props.value) }}</q-td>
        </template>
        <template v-slot:body-cell-stock_final="props">
          <q-td :props="props" class="bg-grey-2 text-weight-bold">{{
            format(props.value)
          }}</q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup>
import { computed } from "vue";
import { useKardex } from "../../composables/useKardex";
import DatePickerGlobal from "../../components/DatePickerGlobal.vue";
import { date } from "quasar";

// funcion que bloquea fechas mayores a HOY
const deshabilitarDiasFuturos = (fechaEvaluar) => {
  const hoy = date.formatDate(Date.now(), "YYYY/MM/DD");
  return fechaEvaluar <= hoy;
};

const {
  tipoReporte,
  cargando,
  datosKardex,
  filtroFechas,
  sedesSeleccionadas,
  llenaderos,
  dashboardData,
  columnasKardex,
  cargarDatosKardex,
  exportarExcel,
} = useKardex();

const format = (num) =>
  Number(num).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
</script>

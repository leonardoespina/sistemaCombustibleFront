<template>
  <q-page :class="$q.screen.lt.sm ? 'q-pa-sm' : 'q-pa-lg'">
    <!-- HEADER -->
    <div class="row items-center justify-between q-mb-md">
      <div class="col-12 col-md-auto">
        <h4 class="text-h4 q-my-none text-primary text-weight-bold">
          <q-icon name="compare_arrows" class="q-mr-sm" />
          Reporte de Desviaciones (Faltantes y Sobrantes)
        </h4>
        <div class="text-caption text-grey-7">
          Análisis de discrepancias de inventario en mediciones, cierres de
          turno y recepción de cisternas
        </div>
      </div>
      <div class="col-12 col-md-auto q-mt-sm q-mt-md-none">
        <ExportExcelBtn
          :rows="store.data"
          :columns="excelColumns"
          :filename="`ReporteDesviaciones_${store.filters.fechaDesde}_al_${store.filters.fechaHasta}`"
          sheet-name="Desviaciones"
          :meta="[
            'REPORTE DE DESVIACIONES (FALTANTES Y SOBRANTES)',
            `Periodo: ${store.filters.fechaDesde} al ${store.filters.fechaHasta}`,
          ]"
          label="Exportar a Excel"
          color="secondary"
          icon="download"
          unelevated
        />
      </div>
    </div>

    <!-- FILTROS -->
    <q-card flat bordered class="bg-white q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md items-end">
          <div class="col-12 col-sm-2">
            <q-select
              dense
              outlined
              bg-color="white"
              v-model="store.filters.llenaderoId"
              :options="llenaderosList"
              option-label="nombre_llenadero"
              option-value="id_llenadero"
              emit-value
              map-options
              clearable
              label="Llenadero"
            />
          </div>
          <div class="col-12 col-sm-2">
            <q-select
              dense
              outlined
              bg-color="white"
              v-model="store.filters.fuelTypeId"
              :options="fuelTypeList"
              option-label="nombre"
              option-value="id_tipo_combustible"
              emit-value
              map-options
              clearable
              label="Combustible"
            />
          </div>
          <div class="col-12 col-sm-2">
            <q-select
              dense
              outlined
              bg-color="white"
              v-model="store.filters.tipoDesviacion"
              :options="['Ambos', 'Faltantes', 'Sobrantes', 'Evaporación']"
              label="Tipo de Desviación"
            />
          </div>
          <div class="col-12 col-sm-2">
            <q-select
              dense
              outlined
              bg-color="white"
              v-model="store.filters.origen"
              :options="[
                'Todos',
                'Medición Ordinaria',
                'Cierre de Turno',
                'Recepción Cisterna',
              ]"
              label="Origen"
            />
          </div>
          <div class="col-12 col-sm-2">
            <q-input
              dense
              outlined
              bg-color="white"
              v-model="store.filters.fechaDesde"
              type="date"
              label="Desde"
            />
          </div>
          <div class="col-12 col-sm-2">
            <q-input
              dense
              outlined
              bg-color="white"
              v-model="store.filters.fechaHasta"
              type="date"
              label="Hasta"
            />
          </div>
          <div class="col-12 col-sm-2 row q-gutter-sm justify-end">
            <q-btn
              flat
              color="grey-7"
              label="Limpiar"
              @click="store.resetFilters()"
            />
            <q-btn
              color="primary"
              label="Filtrar"
              unelevated
              :loading="store.loading"
              @click="generateReport"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- WIDGETS DE RESUMEN -->
    <div class="row q-col-gutter-md q-mb-md" v-if="store.data.length > 0">
      <div class="col-12 col-sm-4">
        <q-card flat bordered class="bg-red-1 border-red text-center q-pa-md">
          <q-icon
            name="trending_down"
            size="2xl"
            color="red-7"
            class="q-mb-sm"
          />
          <div class="text-h5 text-weight-bold text-red-9">
            {{ totalFaltantes.toFixed(2) }} L
          </div>
          <div class="text-caption text-red-9">Total Faltantes (Pérdidas)</div>
        </q-card>
      </div>
      <div class="col-12 col-sm-4">
        <q-card
          flat
          bordered
          class="bg-green-1 border-green text-center q-pa-md"
        >
          <q-icon
            name="trending_up"
            size="2xl"
            color="green-7"
            class="q-mb-sm"
          />
          <div class="text-h5 text-weight-bold text-green-9">
            {{ Math.abs(totalSobrantes).toFixed(2) }} L
          </div>
          <div class="text-caption text-green-9">Total Sobrantes</div>
        </q-card>
      </div>
      <div class="col-12 col-sm-4">
        <q-card flat bordered class="bg-blue-1 border-blue text-center q-pa-md">
          <q-icon
            name="account_balance"
            size="2xl"
            color="blue-7"
            class="q-mb-sm"
          />
          <div class="text-h5 text-weight-bold text-blue-9">
            {{ balanceNeto.toFixed(2) }} L
          </div>
          <div class="text-caption text-blue-9">
            Balance Neto (Faltante Neto)
          </div>
        </q-card>
      </div>
    </div>

    <!-- TABLA DE DATOS -->
    <q-card flat bordered class="bg-white">
      <q-table
        :rows="store.data"
        :columns="columnas"
        row-key="id"
        flat
        :loading="store.loading"
        :pagination="{ rowsPerPage: 15 }"
        no-data-label="No hay registros de desviaciones para los filtros seleccionados"
      >
        <!-- Badge para el origen -->
        <template v-slot:body-cell-origen="props">
          <q-td :props="props">
            <q-badge :color="getColorOrigen(props.value)">
              {{ props.value }}
            </q-badge>
          </q-td>
        </template>

        <!-- Columna de estado (Faltante/Sobrante/Evaporación) -->
        <template v-slot:body-cell-tipo_desviacion="props">
          <q-td :props="props">
            <q-chip
              dense
              outline
              :color="
                props.row.tipo_desviacion === 'Sobrante'
                  ? 'green'
                  : props.row.tipo_desviacion === 'Evaporación'
                    ? 'orange'
                    : 'red'
              "
              :icon="
                props.row.tipo_desviacion === 'Sobrante'
                  ? 'arrow_upward'
                  : 'arrow_downward'
              "
            >
              {{ props.row.tipo_desviacion }}
            </q-chip>
          </q-td>
        </template>

        <!-- Columna de Cantidad -->
        <template v-slot:body-cell-cantidad="props">
          <q-td
            :props="props"
            class="text-weight-bold"
            :class="props.value > 0 ? 'text-red-7' : 'text-green-7'"
          >
            {{
              Math.abs(props.value).toLocaleString("de-DE", {
                minimumFractionDigits: 2,
              })
            }}
            L
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from "vue";
import { useReporteDesviacionesStore } from "../../stores/reporteDesviacionesStore";
import { date, useQuasar } from "quasar";
import api from "../../api";
import ExportExcelBtn from "../../components/common/ExportExcelBtn.vue";

const store = useReporteDesviacionesStore();
const $q = useQuasar();

const llenaderosList = ref([]);
const fuelTypeList = ref([]);

const columnas = [
  {
    name: "fecha",
    label: "Fecha",
    field: "fecha",
    align: "left",
    sortable: true,
    format: (v) => date.formatDate(v, "DD/MM/YYYY"),
  },
  {
    name: "llenadero",
    label: "Llenadero",
    field: "llenadero",
    align: "left",
    sortable: true,
  },
  {
    name: "tipo_combustible",
    label: "Combustible",
    field: "tipo_combustible",
    align: "left",
    sortable: true,
  },
  {
    name: "origen",
    label: "Origen",
    field: "origen",
    align: "center",
    sortable: true,
  },
  {
    name: "referencia",
    label: "Referencia / Detalle",
    field: "referencia",
    align: "left",
  },
  {
    name: "tipo_desviacion",
    label: "Tipo",
    field: "tipo_desviacion",
    align: "center",
  },
  {
    name: "cantidad",
    label: "Cantidad (Absoluta)",
    field: "cantidad",
    align: "right",
    sortable: true,
  },
];

const excelColumns = [
  {
    label: "Fecha",
    field: "fecha",
    format: (v) => date.formatDate(v, "DD/MM/YYYY"),
  },
  { label: "Llenadero", field: "llenadero" },
  { label: "Combustible", field: "tipo_combustible" },
  { label: "Origen", field: "origen" },
  { label: "Referencia", field: "referencia" },
  { label: "Tipo", field: "tipo_desviacion" },
  { label: "Cantidad", field: "cantidad" },
];

const totalFaltantes = computed(() => {
  return store.data
    .filter((d) => d.cantidad > 0)
    .reduce((sum, d) => sum + parseFloat(d.cantidad), 0);
});

const totalSobrantes = computed(() => {
  return store.data
    .filter((d) => d.cantidad < 0)
    .reduce((sum, d) => sum + parseFloat(d.cantidad), 0);
});

const balanceNeto = computed(() => {
  // Balance Neto = Faltantes (positivo) + Sobrantes (negativo)
  return store.data.reduce((sum, d) => sum + parseFloat(d.cantidad), 0);
});

const loadInitialData = async () => {
  try {
    const [resLlen, resFuel] = await Promise.all([
      api.get("/llenaderos"),
      api.get("/tipos-combustible"),
    ]);
    llenaderosList.value = resLlen.data.data || resLlen.data;
    fuelTypeList.value = resFuel.data.data || resFuel.data;
  } catch (error) {
    console.error("Error loading catalog data:", error);
    $q.notify({ type: "negative", message: "Error cargando catálogos." });
  }
};

const generateReport = async () => {
  try {
    await store.fetchReport();
    if (store.data.length === 0) {
      $q.notify({
        type: "info",
        message: "No se encontraron datos para estos filtros.",
      });
    }
  } catch (err) {
    $q.notify({ type: "negative", message: "Error al generar el reporte." });
  }
};

const getColorOrigen = (origen) => {
  if (origen === "Medición Ordinaria") return "blue-7";
  if (origen === "Cierre de Turno") return "orange-7";
  if (origen === "Recepción Cisterna") return "purple-7";
  return "grey";
};

onMounted(() => {
  loadInitialData();
});

onUnmounted(() => {
  store.resetFilters();
});
</script>

<style scoped>
.border-red {
  border-color: #ffcdd2 !important;
}
.border-green {
  border-color: #c8e6c9 !important;
}
.border-blue {
  border-color: #bbdefb !important;
}
</style>

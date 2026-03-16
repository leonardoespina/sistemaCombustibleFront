<template>
  <q-page :class="$q.screen.lt.sm ? 'q-pa-sm' : 'q-pa-md'" class="bg-grey-2">
    <div class="q-gutter-y-md">

      <!-- HEADER RESPONSIVE -->
      <div class="row items-center q-col-gutter-sm">
        <div class="col-auto">
          <q-icon name="analytics" size="2rem" color="primary" />
        </div>
        <div class="col">
          <div :class="$q.screen.lt.sm ? 'text-h6' : 'text-h5'" class="text-weight-bold text-primary q-mb-none">
            Consumo por Dependencia
          </div>
          <div class="text-caption text-grey-7">Análisis estadístico agregado por área y combustible</div>
        </div>
      </div>

      <!-- FILTROS -->
      <q-card flat bordered class="bg-grey-1">
        <q-expansion-item
          icon="filter_list"
          label="Criterios de Análisis"
          header-class="text-weight-medium"
          default-opened
        >
          <q-card-section :class="$q.screen.lt.sm ? 'q-pa-sm' : 'q-pa-md'">
            <div class="row q-col-gutter-sm items-end">
              <div class="col-6 col-sm-4">
                <q-input
                  dense outlined bg-color="white"
                  v-model="store.filters.fechaDesde"
                  type="date" label="Desde"
                />
              </div>
              <div class="col-6 col-sm-4">
                <q-input
                  dense outlined bg-color="white"
                  v-model="store.filters.fechaHasta"
                  type="date" label="Hasta"
                />
              </div>
              <div class="col-12 col-sm-4">
                <q-separator class="q-mb-sm gt-xs" />
                <div class="row q-gutter-sm justify-end">
                  <q-btn flat color="grey-7" label="Limpiar" @click="store.resetFilters" />
                  <q-btn
                    color="secondary" icon="analytics" label="Generar"
                    unelevated @click="handleSearch" :loading="store.loading"
                    :disable="!store.filters.fechaDesde || !store.filters.fechaHasta"
                  />
                </div>
              </div>
            </div>
          </q-card-section>
        </q-expansion-item>
      </q-card>

      <!-- EMPTY STATE inicial -->
      <div v-if="!hasSearched" class="text-center q-pa-xl text-grey-6">
        <q-icon name="query_stats" size="4rem" />
        <div :class="$q.screen.lt.sm ? 'text-subtitle2' : 'text-h6'" class="q-mt-sm">
          Seleccione un rango de fechas para generar el reporte estadístico.
        </div>
      </div>

      <!-- DIÁLOGO DE RESULTADOS -->
      <DependenciaReportDialog
        v-model="showDialog"
        :data="store.reportData"
        :filters="reportFilters"
      />

    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useReporteDependenciaStore } from '../../stores/reporteDependenciaStore';
import DependenciaReportDialog from '../../components/reports/DependenciaReportDialog.vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const store = useReporteDependenciaStore();

const showDialog = ref(false);
const hasSearched = ref(false);
const reportFilters = ref({});

const handleSearch = async () => {
  try {
    reportFilters.value = { ...store.filters };
    await store.fetchReport();
    hasSearched.value = true;
    if (store.reportData.length > 0) {
      showDialog.value = true;
    } else {
      $q.notify({ type: 'warning', message: 'No se encontraron consumos en el periodo seleccionado.', position: 'top' });
    }
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Error al generar el reporte.', position: 'top' });
  }
};

onMounted(() => {
  store.resetFilters();
  store.initSocket();
});

onUnmounted(() => {
  store.destroySocket();
});
</script>

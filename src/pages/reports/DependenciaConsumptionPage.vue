<template>
  <q-page class="q-pa-md bg-grey-2">
    <div class="q-gutter-y-md">
      <!-- HEADER -->
      <div class="row items-center q-mb-md">
        <img src="/logo.png" style="height: 60px" class="q-mr-md" alt="Logo" />
        <div class="col">
          <h4 class="text-h4 q-my-none text-weight-bold text-primary">
            Consumo por Dependencia
          </h4>
          <p class="text-grey-7 q-mb-none">
            Análisis estadístico agregado por área y combustible
          </p>
        </div>
      </div>

      <!-- FILTROS (ESTILO COMPACTO) -->
      <q-card flat bordered class="bg-grey-1">
        <q-expansion-item
          icon="filter_list"
          label="Criterios de Análisis"
          header-class="text-weight-medium"
          default-opened
        >
          <q-card-section>
            <div class="row q-col-gutter-md items-end">
              <div class="col-12 col-sm-4">
                <q-input 
                  dense 
                  outlined 
                  v-model="store.filters.fechaDesde" 
                  type="date" 
                  label="Desde" 
                  bg-color="white"
                />
              </div>
              <div class="col-12 col-sm-4">
                <q-input 
                  dense 
                  outlined 
                  v-model="store.filters.fechaHasta" 
                  type="date" 
                  label="Hasta" 
                  bg-color="white"
                />
              </div>
              
              <div class="col-12 col-sm-4 row q-gutter-sm justify-end">
                <q-btn 
                  flat 
                  color="grey-7" 
                  label="Limpiar" 
                  @click="store.resetFilters" 
                />
                <q-btn 
                  color="secondary" 
                  icon="analytics"
                  label="Generar Análisis" 
                  unelevated 
                  @click="handleSearch" 
                  :loading="store.loading"
                  :disable="!store.filters.fechaDesde || !store.filters.fechaHasta"
                />
              </div>
            </div>
          </q-card-section>
        </q-expansion-item>
      </q-card>

      <!-- SECCIÓN INFORMATIVA (EMPTY STATE) -->
      <div v-if="!hasSearched" class="text-center q-pa-xl text-grey-6">
        <q-icon name="query_stats" size="4rem" />
        <div class="text-h6">Seleccione un rango de fechas para generar el reporte estadístico.</div>
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
    // Guardar copia de filtros para el encabezado del reporte
    reportFilters.value = { ...store.filters };
    
    await store.fetchReport();
    hasSearched.value = true;
    
    if (store.reportData.length > 0) {
      showDialog.value = true;
    } else {
      $q.notify({
        type: 'warning',
        message: 'No se encontraron consumos en el periodo seleccionado.',
        position: 'top'
      });
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Error al generar el reporte.',
      position: 'top'
    });
  }
};

onMounted(() => {
  store.initSocket();
});

onUnmounted(() => {
  store.destroySocket();
});
</script>

<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-y-md">
      <!-- HEADER -->
      <div class="row items-center q-mb-md">
        <img src="/logo.png" style="height: 60px" class="q-mr-md" alt="Logo" />
        <div class="col">
          <h4 class="text-h4 q-my-none text-weight-bold text-primary">Mis Despachos</h4>
          <p class="text-grey-7 q-mb-none">
            Despachos de <strong>{{ userDependencia }}</strong> en el periodo seleccionado
          </p>
        </div>
      </div>

      <!-- FILTROS -->
      <q-card flat bordered class="bg-grey-1">
        <q-expansion-item
          icon="filter_list"
          label="Filtros de Búsqueda"
          header-class="text-weight-medium"
          default-opened
        >
          <q-card-section>
            <div class="row q-col-gutter-lg">
              <!-- Subdependencias (multi-select) -->
              <div class="col-12 col-md-4">
                <q-select
                  outlined
                  dense
                  v-model="store.filters.subdependencias"
                  :options="store.subdependenciasList"
                  option-label="nombre"
                  option-value="id_subdependencia"
                  emit-value
                  map-options
                  label="Subdependencias"
                  hint="Dejar vacío para ver todas"
                  bg-color="white"
                  clearable
                  multiple
                  use-chips
                >
                  <template v-slot:prepend>
                    <q-icon name="account_tree" />
                  </template>
                </q-select>
              </div>

              <!-- Tipo Combustible -->
              <div class="col-12 col-md-2">
                <q-select
                  outlined
                  dense
                  v-model="store.filters.id_tipo_combustible"
                  :options="fuelTypeOptions"
                  option-label="nombre"
                  option-value="id_tipo_combustible"
                  emit-value
                  map-options
                  label="Tipo Combustible"
                  bg-color="white"
                  clearable
                >
                  <template v-slot:prepend>
                    <q-icon name="local_gas_station" />
                  </template>
                </q-select>
              </div>

              <!-- Rango de fechas -->
              <div class="col-12 col-md-2">
                <q-input
                  outlined dense bg-color="white"
                  v-model="store.filters.fechaDesde"
                  type="date" label="Desde"
                />
              </div>
              <div class="col-12 col-md-2">
                <q-input
                  outlined dense bg-color="white"
                  v-model="store.filters.fechaHasta"
                  type="date" label="Hasta"
                />
              </div>

              <!-- Botones -->
              <div class="col-12 col-md-2 row items-end q-gutter-sm justify-end">
                <q-btn flat color="grey-7" label="Limpiar" @click="store.resetFilters" />
                <q-btn
                  color="secondary"
                  icon="search"
                  label="Filtrar"
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

      <!-- TABLA DE RESULTADOS -->
      <MisDespachosDialog
        v-model="showResultsDialog"
        :data="store.reportData"
        :total="store.totalGeneral"
        :filters="reportFilters"
        :pagination="store.pagination"
        :loading="store.loading"
        @request="onRequest"
      />
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useQuasar } from 'quasar';
import { useMisDespachosStore } from '../../stores/misDespachosStore';
import MisDespachosDialog from '../../components/dispatches/MisDespachosDialog.vue';
import api from '../../api';

const $q   = useQuasar();
const store = useMisDespachosStore();

const showResultsDialog = ref(false);
const reportFilters     = ref({});
const fuelTypeOptions   = ref([]);

// Dependencia del usuario logueado (para mostrar en el header)
const userDependencia = computed(() => {
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  return userData?.Dependencia?.nombre_dependencia || 'Mi Dependencia';
});

const loadFuelTypes = async () => {
  try {
    const { data } = await api.get('/tipos-combustible');
    fuelTypeOptions.value = Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error loading fuel types:', error);
  }
};

const handleSearch = async () => {
  try {
    reportFilters.value = { ...store.filters };
    await store.fetchReport(1, store.pagination.rowsPerPage);
    if (store.reportData.length > 0) {
      showResultsDialog.value = true;
    } else {
      $q.notify({ type: 'warning', message: 'No se encontraron registros para los filtros seleccionados.' });
    }
  } catch {
    $q.notify({ type: 'negative', message: 'Error al consultar los despachos.' });
  }
};

const onRequest = async ({ pagination: p }) => {
  await store.fetchReport(p.page, p.rowsPerPage);
};

onMounted(async () => {
  store.resetFilters();
  store.clearReportData();
  store.initSocket();
  await Promise.all([store.loadSubdependencias(), loadFuelTypes()]);
});

onUnmounted(() => {
  store.destroySocket();
});
</script>

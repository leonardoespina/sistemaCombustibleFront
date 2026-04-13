<template>
  <q-page :class="$q.screen.lt.sm ? 'q-pa-sm' : 'q-pa-md'">
    <div class="q-gutter-y-md">

      <!-- HEADER RESPONSIVE -->
      <div class="row items-center q-col-gutter-sm">
        <div class="col-auto">
          <q-icon name="local_gas_station" size="2rem" color="primary" />
        </div>
        <div class="col">
          <div :class="$q.screen.lt.sm ? 'text-h6' : 'text-h5'" class="text-weight-bold text-primary q-mb-none">
            Mis Despachos
          </div>
          <div class="text-caption text-grey-7">
            Despachos de <strong>{{ userDependencia }}</strong> en el periodo seleccionado
          </div>
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
          <q-card-section :class="$q.screen.lt.sm ? 'q-pa-sm' : 'q-pa-md'">
            <div class="row q-col-gutter-sm">

              <!-- Subdependencias -->
              <div class="col-12 col-sm-5">
                <q-select
                  outlined dense bg-color="white"
                  v-model="store.filters.subdependencias"
                  :options="store.subdependenciasList"
                  @filter="filterSub"
                  @virtual-scroll="onScrollSub"
                  option-label="nombre"
                  option-value="id_subdependencia"
                  label="Subdependencias"
                  hint="Vacío = todas"
                  clearable multiple use-chips
                  use-input
                  input-debounce="300"
                  :loading="store.subdepPagination.loading"
                >
                  <template v-slot:prepend><q-icon name="account_tree" /></template>
                </q-select>
              </div>

              <!-- Tipo Combustible -->
              <div class="col-12 col-sm-3">
                <q-select
                  outlined dense bg-color="white"
                  v-model="store.filters.id_tipo_combustible"
                  :options="fuelTypeOptions"
                  option-label="nombre"
                  option-value="id_tipo_combustible"
                  emit-value map-options
                  label="Combustible"
                  clearable
                >
                  <template v-slot:prepend><q-icon name="local_gas_station" /></template>
                </q-select>
              </div>

              <!-- Desde -->
              <div class="col-6 col-sm-2">
                <q-input outlined dense bg-color="white"
                  v-model="store.filters.fechaDesde"
                  type="date" label="Desde"
                />
              </div>

              <!-- Hasta -->
              <div class="col-6 col-sm-2">
                <q-input outlined dense bg-color="white"
                  v-model="store.filters.fechaHasta"
                  type="date" label="Hasta"
                />
              </div>

              <!-- Acciones -->
              <div class="col-12">
                <q-separator class="q-mb-sm" />
                <div class="row justify-end q-gutter-sm">
                  <q-btn flat color="grey-7" label="Limpiar" @click="store.resetFilters" />
                  <q-btn
                    color="secondary" icon="search" label="Filtrar" unelevated
                    @click="handleSearch" :loading="store.loading"
                    :disable="!store.filters.fechaDesde || !store.filters.fechaHasta"
                  />
                </div>
              </div>
            </div>
          </q-card-section>
        </q-expansion-item>
      </q-card>

      <!-- RESULTADOS -->
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

const filterSub = async (val, update) => {
  if (val === store.subdepPagination.search && store.subdependenciasList.length > 0) {
    update();
    return;
  }
  update(async () => {
    store.subdepPagination.search = val;
    await store.loadSubdependencias(false);
  });
};

const onScrollSub = ({ to }) => {
  const lastIndex = store.subdependenciasList.length - 1;
  if (!store.subdepPagination.loading && store.subdepPagination.hasMore && to === lastIndex) {
    store.loadSubdependencias(true);
  }
};

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

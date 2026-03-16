<template>
  <q-page :class="$q.screen.lt.sm ? 'q-pa-sm' : 'q-pa-md'">
    <div class="q-gutter-y-md">

      <!-- HEADER RESPONSIVE -->
      <div class="row items-center q-col-gutter-sm">
        <div class="col-auto">
          <q-icon name="local_shipping" size="2rem" color="primary" />
        </div>
        <div class="col">
          <div :class="$q.screen.lt.sm ? 'text-h6' : 'text-h5'" class="text-weight-bold text-primary q-mb-none">
            Reporte de Despachos
          </div>
          <div class="text-caption text-grey-7">Consulta detallada por dependencia y fecha</div>
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
            <div class="row q-col-gutter-md">
              <!-- Jerarquía organizacional -->
              <div class="col-12 col-md-4">
                <OrganizationalHierarchy
                  v-if="!isInitializing"
                  :key="mountKey"
                  v-model:categoryId="store.filters.categoryId"
                  v-model:dependencyId="store.filters.dependencyId"
                  v-model:subdependencyId="store.filters.subdependencyId"
                />
              </div>

              <!-- Otros filtros -->
              <div class="col-12 col-md-8">
                <div class="row q-col-gutter-sm">
                  <div class="col-12 col-sm-6">
                    <q-select
                      outlined dense bg-color="white"
                      v-model="store.filters.fuelTypeId"
                      :options="fuelTypeOptions"
                      option-label="nombre"
                      option-value="id_tipo_combustible"
                      emit-value map-options
                      label="Tipo de Combustible"
                      clearable
                    >
                      <template v-slot:prepend><q-icon name="local_gas_station" /></template>
                    </q-select>
                  </div>
                  <div class="col-12 col-sm-3">
                    <q-input outlined dense bg-color="white"
                      v-model="store.filters.fechaDesde"
                      type="date" label="Desde"
                    />
                  </div>
                  <div class="col-12 col-sm-3">
                    <q-input outlined dense bg-color="white"
                      v-model="store.filters.fechaHasta"
                      type="date" label="Hasta"
                    />
                  </div>

                  <!-- Acciones -->
                  <div class="col-12">
                    <q-separator class="q-my-sm" />
                    <div class="row justify-end q-gutter-x-sm">
                      <q-btn flat color="grey-7" label="Limpiar" @click="store.resetFilters" />
                      <q-btn
                        color="secondary" icon="search" label="Filtrar" unelevated
                        @click="handleSearch" :loading="store.loading"
                        :disable="!store.filters.dependencyId || !store.filters.fechaDesde || !store.filters.fechaHasta"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-expansion-item>
      </q-card>

      <!-- DIÁLOGO DE RESULTADOS -->
      <DispatchReportDialog
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
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { useReporteDespachoStore } from "../../stores/reporteDespachoStore";
import OrganizationalHierarchy from "../../components/OrganizationalHierarchy.vue";
import DispatchReportDialog from "../../components/dispatches/DispatchReportDialog.vue";
import { useQuasar } from "quasar";
import api from "../../api";

const store = useReporteDespachoStore();
const $q = useQuasar();
const showResultsDialog = ref(false);
const fuelTypeOptions = ref([]);
const mountKey = ref(0);
const isInitializing = ref(false);
const reportFilters = ref({});

const loadFuelTypes = async () => {
  try {
    const { data } = await api.get("/tipos-combustible");
    fuelTypeOptions.value = Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error("Error loading fuel types:", error);
  }
};

const handleSearch = async () => {
  await store.fetchReport(1, store.pagination.rowsPerPage);
  if (store.reportData.length > 0) {
    reportFilters.value = { ...store.filters };
    showResultsDialog.value = true;
    store.resetFilters();
  } else {
    $q.notify({ type: "warning", message: "No se encontraron registros." });
  }
};

const onRequest = async (props) => {
  const { page, rowsPerPage } = props.pagination;
  await store.fetchReport(page, rowsPerPage);
};

onMounted(async () => {
  store.resetFilters();
  store.clearReportData();
  mountKey.value++;
  isInitializing.value = true;
  store.initSocket();
  await loadFuelTypes();
  await nextTick();
  isInitializing.value = false;
});

onUnmounted(() => {
  store.destroySocket();
});
</script>

<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-y-md">
      <!-- HEADER -->
      <div class="row items-center q-mb-md">
        <img src="/logo.png" style="height: 60px" class="q-mr-md" alt="Logo" />
        <div class="col">
          <h4 class="text-h4 q-my-none text-weight-bold text-primary">
            Reporte de Despachos
          </h4>
          <p class="text-grey-7 q-mb-none">
            Consulta detallada por dependencia y fecha
          </p>
        </div>
      </div>

      <!-- SECCIÓN DE FILTROS (ESTILO MEASUREMENT) -->
      <q-card flat bordered class="bg-grey-1">
        <q-expansion-item
          icon="filter_list"
          label="Filtros de Búsqueda"
          header-class="text-weight-medium"
          default-opened
        >
          <q-card-section>
            <div class="row q-col-gutter-lg">
              <!-- COLUMNA 1: JERARQUÍA -->
              <div class="col-12 col-md-4 border-right-md">
                <OrganizationalHierarchy
                  v-if="!isInitializing"
                  v-model:categoryId="store.filters.categoryId"
                  v-model:dependencyId="store.filters.dependencyId"
                  v-model:subdependencyId="store.filters.subdependencyId"
                />
              </div>

              <!-- COLUMNA 2: OTROS FILTROS Y ACCIÓN -->
              <div class="col-12 col-md-8 column justify-between">
                <div class="row q-col-gutter-md">
                  <!-- Tipo Combustible -->
                  <div class="col-12 col-sm-6">
                    <q-select
                      outlined
                      dense
                      v-model="store.filters.fuelTypeId"
                      :options="fuelTypeOptions"
                      option-label="nombre"
                      option-value="id_tipo_combustible"
                      emit-value
                      map-options
                      label="Tipo de Combustible"
                      bg-color="white"
                      clearable
                    >
                      <template v-slot:prepend>
                        <q-icon name="local_gas_station" />
                      </template>
                    </q-select>
                  </div>

                  <!-- Rango de Fechas -->
                  <div class="col-12 col-sm-3">
                    <q-input
                      outlined
                      dense
                      v-model="store.filters.fechaDesde"
                      type="date"
                      label="Fecha Desde"
                      bg-color="white"
                    />
                  </div>
                  <div class="col-12 col-sm-3">
                    <q-input
                      outlined
                      dense
                      v-model="store.filters.fechaHasta"
                      type="date"
                      label="Fecha Hasta"
                      bg-color="white"
                    />
                  </div>
                </div>

                <!-- Botones de Acción -->
                <div class="row justify-end q-mt-md q-gutter-x-sm">
                  <q-btn
                    flat
                    color="grey-7"
                    label="Limpiar"
                    @click="store.resetFilters"
                  />
                  <q-btn
                    color="secondary"
                    icon="search"
                    label="Filtrar"
                    unelevated
                    @click="handleSearch"
                    :loading="store.loading"
                    :disable="
                      !store.filters.dependencyId ||
                      !store.filters.fechaDesde ||
                      !store.filters.fechaHasta
                    "
                  />
                </div>
              </div>
            </div>
          </q-card-section>
        </q-expansion-item>
      </q-card>

      <!-- DIALOGO DE RESULTADOS (Componente Externo) -->
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

// Flag de inicialización para evitar efectos secundarios en la jerarquía
const isInitializing = ref(false);

// Para mantener una copia de los filtros usados en la consulta (para el encabezado del diálogo)
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
    // Guardamos copia de filtros para el reporte ANTES de limpiar
    reportFilters.value = { ...store.filters };
    showResultsDialog.value = true;
    // Limpiamos filtros
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

<style scoped>
.border-right-md {
  border-right: 1px solid #e0e0e0;
}
@media (max-width: 1023px) {
  .border-right-md {
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 20px;
    margin-bottom: 20px;
  }
}
</style>

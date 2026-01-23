<template>
  <q-page class="q-pa-md">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
      <h4 class="text-h4 q-my-none">Gestión de Cupos</h4>
      <div class="q-gutter-sm">
        <q-btn
          color="secondary"
          icon="local_gas_station"
          label="Tipos de Combustible"
          to="/tipos-combustible"
          outline
        />
        <q-btn
          color="accent"
          icon="analytics"
          label="Estado Actual (Mes en Curso)"
          @click="openStatusDialog"
          outline
        />
        <q-btn
          color="primary"
          icon="add"
          label="Nueva Asignación"
          @click="openCreateDialog"
        />
      </div>
    </div>

    <!-- Table Configuración Cupos Base -->
    <q-table
      :rows="rowsBase"
      :columns="columnsBase"
      row-key="id_cupo_base"
      :loading="loadingBase"
      v-model:pagination="paginationBase"
      v-model:filter="filterBase"
      @request="onRequestBase"
      binary-state-sort
      title="Configuración de Cupos Mensuales"
    >
      <template v-slot:top-right>
        <q-input
          borderless
          dense
          debounce="300"
          v-model="filterBase"
          placeholder="Buscar..."
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>

      <template v-slot:body-cell-activo="props">
        <q-td :props="props">
          <q-chip
            :color="props.row.activo ? 'positive' : 'negative'"
            text-color="white"
            dense
          >
            {{ props.row.activo ? "Activo" : "Inactivo" }}
          </q-chip>
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props" class="q-gutter-sm">
          <q-btn
            dense
            round
            flat
            color="primary"
            icon="edit"
            @click="openEditDialog(props.row)"
          >
            <q-tooltip>Editar</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Dialog Estado Actual -->
    <q-dialog v-model="showStatusDialog" maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card>
        <q-bar class="bg-primary text-white">
          <q-icon name="analytics" />
          <div>Estado Actual de Cupos (Mes en Curso)</div>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip>Cerrar</q-tooltip>
          </q-btn>
        </q-bar>

        <q-card-section>
          <q-table
            :rows="rowsActual"
            :columns="columnsActual"
            row-key="id_cupo_actual"
            :loading="loadingActual"
            v-model:pagination="paginationActual"
            v-model:filter="filterActual"
            @request="onRequestActual"
            binary-state-sort
            flat
            bordered
          >
              <template v-slot:top-right>
                <q-input
                  borderless
                  dense
                  debounce="300"
                  v-model="filterActual"
                  placeholder="Buscar..."
                >
                  <template v-slot:append>
                    <q-icon name="search" />
                  </template>
                </q-input>
              </template>

              <template v-slot:body-cell-progreso="props">
                  <q-td :props="props">
                      <q-linear-progress 
                          size="25px" 
                          :value="props.row.cantidad_consumida / (parseFloat(props.row.cantidad_asignada) + parseFloat(props.row.cantidad_recargada))" 
                          color="primary"
                          track-color="grey-3"
                          class="q-mt-sm"
                      >
                          <div class="absolute-full flex flex-center">
                              <q-badge color="transparent" text-color="white" :label="`${((props.row.cantidad_consumida / (parseFloat(props.row.cantidad_asignada) + parseFloat(props.row.cantidad_recargada))) * 100).toFixed(1)}%`" />
                          </div>
                      </q-linear-progress>
                  </q-td>
              </template>

              <template v-slot:body-cell-estado="props">
                  <q-td :props="props">
                      <q-chip
                          :color="props.row.estado === 'ACTIVO' ? 'positive' : props.row.estado === 'AGOTADO' ? 'negative' : 'grey'"
                          text-color="white"
                          dense
                      >
                          {{ props.row.estado }}
                      </q-chip>
                  </q-td>
              </template>

              <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                  <q-btn
                    dense
                    round
                    flat
                    color="accent"
                    icon="bolt"
                    @click="openRecargaDialog(props.row)"
                  >
                    <q-tooltip>Recargar Cupo</q-tooltip>
                  </q-btn>
                </q-td>
              </template>
          </q-table>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Dialog -->
    <CupoFormDialog
      v-model="showDialog"
      :initial-data="selectedItem"
    />

    <RecargaCupoDialog
      v-model="showRecargaDialog"
      :cupo-info="selectedItem"
    />
  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useQuasar } from "quasar";
import { useCupoStore } from "../../stores/cupoStore";
import CupoFormDialog from "../../components/cupos/CupoFormDialog.vue";
import RecargaCupoDialog from "../../components/cupos/RecargaCupoDialog.vue";

const $q = useQuasar();
const store = useCupoStore();

// --- STATE BASE ---
const rowsBase = computed(() => store.rowsBase);
const loadingBase = computed(() => store.loadingBase);
const filterBase = computed({
  get: () => store.filterBase,
  set: (val) => (store.filterBase = val),
});
const paginationBase = computed({
  get: () => store.paginationBase,
  set: (val) => (store.paginationBase = val),
});

// --- STATE ACTUAL ---
const rowsActual = computed(() => store.rowsActual);
const loadingActual = computed(() => store.loadingActual);
const filterActual = computed({
  get: () => store.filterActual,
  set: (val) => (store.filterActual = val),
});
const paginationActual = computed({
  get: () => store.paginationActual,
  set: (val) => (store.paginationActual = val),
});

const showDialog = ref(false);
const showStatusDialog = ref(false);
const showRecargaDialog = ref(false);
const selectedItem = ref(null);

// --- COLUMNS ---
const columnsBase = [
  { name: "categoria", label: "Categoría", field: row => row.Categoria?.nombre, align: "left", sortable: true },
  { name: "dependencia", label: "Dependencia", field: row => row.Dependencia?.nombre_dependencia, align: "left", sortable: true },
  { name: "subdependencia", label: "Subdependencia", field: row => row.Subdependencia?.nombre || "N/A", align: "left", sortable: true },
  { name: "cantidad_mensual", label: "Cupo Mensual (L)", field: "cantidad_mensual", align: "center", sortable: true },
  { name: "activo", label: "Estado", field: "activo", align: "center", sortable: true },
  { name: "actions", label: "Acciones", align: "center" },
];

const columnsActual = [
  { name: "categoria", label: "Categoría", field: row => row.CupoBase?.Categoria?.nombre, align: "left", sortable: true },
  { name: "dependencia", label: "Dependencia", field: row => row.CupoBase?.Dependencia?.nombre_dependencia, align: "left", sortable: true },
  { name: "subdependencia", label: "Subdependencia", field: row => row.CupoBase?.Subdependencia?.nombre || "N/A", align: "left", sortable: true },
  { name: "disponible", label: "Disponible (L)", field: "cantidad_disponible", align: "center", sortable: true },
  { name: "consumida", label: "Consumido (L)", field: "cantidad_consumida", align: "center", sortable: true },
  { name: "progreso", label: "Progreso", align: "center" },
  { name: "estado", label: "Estado", field: "estado", align: "center", sortable: true },
  { name: "actions", label: "Acciones", align: "center" },
];

// --- HANDLERS ---

const onRequestBase = (props) => {
  store.paginationBase = props.pagination;
  store.filterBase = props.filter;
  store.fetchCuposBase();
};

const onRequestActual = (props) => {
  store.paginationActual = props.pagination;
  store.filterActual = props.filter;
  store.fetchCuposActuales();
};

const openCreateDialog = () => {
  selectedItem.value = null;
  showDialog.value = true;
};

const openEditDialog = (row) => {
  selectedItem.value = row;
  showDialog.value = true;
};

const openRecargaDialog = (row) => {
  selectedItem.value = row;
  showRecargaDialog.value = true;
};

const openStatusDialog = () => {
  store.fetchCuposActuales(); // Recargar datos al abrir
  showStatusDialog.value = true;
};

onMounted(() => {
  store.fetchCuposBase();
  store.fetchCuposActuales();
  store.initSocket();
});

onUnmounted(() => {
  store.cleanupSocket();
});
</script>

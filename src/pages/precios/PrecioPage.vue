<template>
  <q-page class="q-pa-md">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
      <h4 class="text-h4 q-my-none">Gestión de Precios</h4>
    </div>

    <div class="row q-gutter-md">
      <!-- Sección Izquierda: Monedas -->
      <div class="col-12 col-md-4">
        <q-card>
          <q-card-section class="row items-center justify-between">
            <div class="text-h6">Monedas/Unidades</div>
            <q-btn
              color="primary"
              icon="add"
              label="Nueva Moneda"
              size="sm"
              @click="openCreateMonedaDialog"
            />
          </q-card-section>

          <q-card-section class="q-pt-none">
            <!-- Lista de Monedas -->
            <q-table
              :rows="monedas"
              :columns="monedasColumns"
              row-key="id_moneda"
              :loading="loading"
              v-model:pagination="pagination"
              v-model:filter="filter"
              @request="onRequestMonedas"
              binary-state-sort
              dense
            >
              <template v-slot:top-left>
                <q-input
                  borderless
                  dense
                  debounce="300"
                  v-model="filter"
                  placeholder="Buscar monedas..."
                >
                  <template v-slot:append>
                    <q-icon name="search" />
                  </template>
                </q-input>
              </template>

              <template v-slot:body-cell-actions="props">
                <q-td :props="props" class="q-gutter-xs">
                  <q-btn
                    dense
                    round
                    flat
                    color="primary"
                    icon="edit"
                    size="sm"
                    @click="openEditMonedaDialog(props.row)"
                  >
                    <q-tooltip>Editar</q-tooltip>
                  </q-btn>
                  <q-btn
                    dense
                    round
                    flat
                    color="negative"
                    icon="delete"
                    size="sm"
                    @click="confirmDeleteMoneda(props.row)"
                  >
                    <q-tooltip>Eliminar</q-tooltip>
                  </q-btn>
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>

      <!-- Sección Derecha: Precios por Combustible -->
      <div class="col-12 col-md-8">
        <q-card>
          <q-card-section class="row items-center justify-between">
            <div class="text-h6">Precios por Combustible</div>
            <q-btn
              color="secondary"
              icon="refresh"
              label="Actualizar"
              size="sm"
              @click="actualizarPrecios"
            />
          </q-card-section>

          <q-card-section class="q-pt-none">
            <!-- Tabla de Precios Dinámicos -->
            <q-table
              :rows="preciosActuales"
              :columns="preciosColumns"
              row-key="id_tipo_combustible"
              :loading="loading"
              dense
            >
              <template v-slot:body-cell-precios="props">
                <q-td :props="props">
                  <div class="q-gutter-xs">
                    <q-chip
                      v-for="(valor, simbolo) in props.row.precios"
                      :key="simbolo"
                      color="primary"
                      text-color="white"
                      dense
                      size="sm"
                    >
                      {{ simbolo }}: {{ formatearNumero(valor) }}
                    </q-chip>
                    <q-chip
                      v-if="Object.keys(props.row.precios).length === 0"
                      color="grey"
                      text-color="white"
                      dense
                      size="sm"
                    >
                      Sin precios configurados
                    </q-chip>
                  </div>
                </q-td>
              </template>

              <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                  <q-btn
                    dense
                    round
                    flat
                    color="primary"
                    icon="edit"
                    @click="openEditPrecioDialog(props.row)"
                  >
                    <q-tooltip>Configurar Precios</q-tooltip>
                  </q-btn>
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Dialogs -->
    <MonedaFormDialog
      v-model="showMonedaDialog"
      :initial-data="selectedMoneda"
    />

    <PrecioFormDialog
      v-model="showPrecioDialog"
      :combustible-data="selectedCombustible"
    />
  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useQuasar } from "quasar";
import { usePrecioStore } from "../../stores/precioStore";
import MonedaFormDialog from "../../components/precios/MonedaFormDialog.vue";
import PrecioFormDialog from "../../components/precios/PrecioFormDialog.vue";

const $q = useQuasar();
const store = usePrecioStore();

const monedas = computed(() => store.monedas);
const preciosActuales = computed(() => store.preciosActuales);
const loading = computed(() => store.loading);

const filter = computed({
  get: () => store.filter,
  set: (val) => (store.filter = val),
});

const pagination = computed({
  get: () => store.pagination,
  set: (val) => (store.pagination = val),
});

const showMonedaDialog = ref(false);
const selectedMoneda = ref(null);
const showPrecioDialog = ref(false);
const selectedCombustible = ref(null);

// Columnas para tabla de monedas
const monedasColumns = [
  {
    name: "nombre",
    label: "Nombre",
    field: "nombre",
    sortable: true,
    align: "left",
  },
  {
    name: "simbolo",
    label: "Símbolo",
    field: "simbolo",
    sortable: true,
    align: "center",
  },
  { name: "actions", label: "Acciones", align: "center" },
];

// Columnas dinámicas para precios
const preciosColumns = computed(() => [
  {
    name: "nombre",
    label: "Combustible",
    field: "nombre",
    sortable: true,
    align: "left",
  },
  {
    name: "precios",
    label: "Precios",
    field: "precios",
    align: "left",
  },
  { name: "actions", label: "Acciones", align: "center" },
]);

// Métodos para Monedas
const onRequestMonedas = (props) => {
  store.pagination = props.pagination;
  store.filter = props.filter;
  store.fetchMonedas();
};

const openCreateMonedaDialog = () => {
  selectedMoneda.value = null;
  showMonedaDialog.value = true;
};

const openEditMonedaDialog = (row) => {
  selectedMoneda.value = row;
  showMonedaDialog.value = true;
};

const confirmDeleteMoneda = (row) => {
  $q.dialog({
    title: "Confirmar eliminación",
    message: `¿Estás seguro de eliminar la moneda "${row.nombre}" (${row.simbolo})?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    store.deleteMoneda(row.id_moneda);
  });
};

// Métodos para Precios
const openEditPrecioDialog = (row) => {
  selectedCombustible.value = row;
  showPrecioDialog.value = true;
};

const actualizarPrecios = () => {
  store.fetchPreciosActuales();
};

const formatearNumero = (valor) => {
  if (valor === null || valor === undefined) return "-";
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  }).format(valor);
};

onMounted(() => {
  store.fetchMonedas();
  store.fetchPreciosActuales();
  store.initSocket();
});

onUnmounted(() => {
  store.cleanupSocket();
  store.filter = "";
  store.pagination = {
    page: 1,
    rowsPerPage: 10,
    sortBy: "id_moneda",
    descending: false,
    rowsNumber: 0,
  };
});
</script>

<style scoped>
.q-chip {
  margin-bottom: 4px;
}
</style>
<!-- src/pages/precios/PrecioPage.vue -->
<template>
  <q-page class="q-pa-md">
    <!--
      PÁGINA DE GESTIÓN DE PRECIOS
      Sistema Multi-Moneda con Layout Split de 2 columnas

      Columna izq (4/12): Monedas/Unidades (CRUD completo + paginación)
      Columna der (8/12): Precios por Combustible (solo edición)
    -->

    <!-- HEADER -->
    <div class="row items-center justify-between q-mb-md">
      <h4 class="text-h4 q-my-none">Gestión de Precios</h4>
    </div>

    <!-- LAYOUT SPLIT: 2 COLUMNAS -->
    <div class="row q-gutter-md">
      <!-- ================================================ -->
      <!-- COLUMNA IZQUIERDA: TABLA DE MONEDAS           -->
      <!-- ================================================ -->
      <div class="col-12 col-md-4">
        <q-card>
          <!-- Header de la card de monedas -->
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

          <!-- Tabla de monedas con paginación y filtro -->
          <q-card-section class="q-pt-none">
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
              <!-- Buscador de monedas -->
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

              <!-- Acciones: Editar y Eliminar -->
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

      <!-- ================================================ -->
      <!-- COLUMNA DERECHA: TABLA DE PRECIOS             -->
      <!-- ================================================ -->
      <div class="col-12 col-md-8">
        <q-card>
          <!-- Header de la card de precios -->
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

          <!-- Tabla de precios dinámicos (sin paginación) -->
          <q-card-section class="q-pt-none">
            <q-table
              :rows="preciosActuales"
              :columns="preciosColumns"
              row-key="id_tipo_combustible"
              :loading="loading"
              dense
            >
              <!--
                COLUMNA DE PRECIOS: Chips dinámicos
                Muestra un chip por cada moneda configurada
                Ej: [Bs: 50.00] [USD: 1.20] [Au: 0.00025000]
              -->
              <template v-slot:body-cell-precios="props">
                <q-td :props="props">
                  <div class="q-gutter-xs">
                    <!-- Loop: Un chip por cada precio configurado -->
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
                    
                    <!-- Si no hay precios configurados -->
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

              <!-- Acciones: Configurar Precios -->
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

    <!-- DIÁLOGOS -->
    <MonedaFormDialog
      v-model="showMonedaDialog"
      :initial-data="selectedMoneda"
      @dataUpdated="store.fetchMonedas()"
    />

    <PrecioFormDialog
      v-model="showPrecioDialog"
      :combustible-data="selectedCombustible"
    />
  </q-page>
</template>

<script setup>
// ============================================
// IMPORTS
// ============================================
import { computed, onMounted, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { usePrecioStore } from "../../stores/precioStore";
import MonedaFormDialog from "../../components/precios/MonedaFormDialog.vue";
import PrecioFormDialog from "../../components/precios/PrecioFormDialog.vue";
import { usePrecioPage } from "./composables/usePrecioPage.js";

// ============================================
// COMPOSABLES & STORES
// ============================================
const store = usePrecioStore();

// Obtener toda la lógica del composable de página
const {
  // Estado de diálogos
  showMonedaDialog,
  showPrecioDialog,
  selectedMoneda,
  selectedCombustible,
  
  // Métodos de diálogos - Monedas
  openCreateMonedaDialog,
  openEditMonedaDialog,
  confirmDeleteMoneda,
  
  // Métodos de diálogos - Precios
  openEditPrecioDialog,
  
  // Helpers visuales
  formatearNumero,
  
  // Métodos auxiliares
  actualizarPrecios,
  
  // Socket.IO
  setupSocketListeners,
  cleanupSocketListeners,
} = usePrecioPage(store);

// ============================================
// COMPUTED - ESTADO DEL STORE
// ============================================

const { monedas, preciosActuales, loading } = storeToRefs(store);

const filter = computed({
  get: () => store.filter,
  set: (val) => (store.filter = val),
});

const pagination = computed({
  get: () => store.pagination,
  set: (val) => (store.pagination = val),
});

// ============================================
// DEFINICIÓN DE COLUMNAS
// ============================================

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

// ============================================
// HANDLERS DE TABLA
// ============================================

/**
 * Handler de paginación/ordenamiento de la tabla de monedas
 * Se ejecuta cuando el usuario cambia la página, ordena, o filtra
 */
const onRequestMonedas = (props) => {
  store.pagination = props.pagination;
  store.filter = props.filter;
  store.fetchMonedas();
};

// ============================================
// LIFECYCLE HOOKS
// ============================================

/**
 * Al montar el componente:
 * 1. Fetch de ambas tablas (monedas y precios)
 * 2. Configurar listeners de Socket.IO (3 eventos)
 */
onMounted(() => {
  store.fetchMonedas();
  store.fetchPreciosActuales();
  
  // Configurar listeners de Socket.IO (ver composable para detalles)
  setupSocketListeners();
});

/**
 * Al desmontar el componente:
 * 1. Limpiar listeners de Socket.IO (prevenir memory leaks)
 * 2. Resetear filtros y paginación
 */
onUnmounted(() => {
  // Limpiar Socket.IO
  cleanupSocketListeners();
  
  // Resetear estado de filtros y paginación
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
/* Estilos para chips de precios */
.q-chip {
  margin-bottom: 4px;
}
</style>

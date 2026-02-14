<!-- src/pages/cupos/CupoPage.vue -->
<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-y-md">
      <!-- HEADER -->
      <div class="row items-center justify-between">
        <h4 class="text-h4 q-my-none">Gestión de Cupos</h4>
        <q-chip
          outline
          color="primary"
          text-color="primary"
          icon="calendar_today"
        >
          Periodo Actual: {{ periodoActual }}
        </q-chip>
      </div>

      <!-- MAIN CARD -->
      <q-card flat bordered>
        <q-tabs
          v-model="tab"
          dense
          class="text-grey"
          active-color="primary"
          indicator-color="primary"
          align="justify"
          narrow-indicator
        >
          <q-tab
            name="actual"
            label="Estado Actual (Saldos)"
            icon="account_balance_wallet"
          />
          <q-tab
            name="base"
            label="Configuración Base (Mensual)"
            icon="settings"
          />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="tab" animated>
          <!-- PANEL: ESTADO ACTUAL -->
          <q-tab-panel name="actual" class="q-pa-none">
            <q-table
              flat
              :rows="cuposActuales"
              :columns="columnsActual"
              row-key="id_cupo_actual"
              :loading="loading"
              v-model:pagination="paginationActual"
              v-model:filter="filterActual"
              @request="onRequestActual"
              binary-state-sort
            >
              <template v-slot:top>
                <q-input
                  borderless
                  dense
                  outlined
                  debounce="500"
                  v-model="filterActual"
                  placeholder="Buscar dependencia..."
                  style="width: 300px"
                >
                  <template v-slot:append><q-icon name="search" /></template>
                </q-input>
                <q-space />
                <q-btn
                  v-if="isAdmin"
                  outline
                  color="negative"
                  icon="autorenew"
                  label="Reiniciar Mes"
                  @click="confirmarReinicio"
                  class="q-mr-sm"
                />
                <q-btn
                  color="primary"
                  icon="refresh"
                  flat
                  round
                  @click="cupoStore.fetchCuposActuales()"
                />
              </template>

              <template v-slot:body-cell-disponibilidad="props">
                <q-td :props="props">
                  <div class="column q-gutter-xs" style="min-width: 150px">
                    <div class="row items-center justify-between no-wrap">
                      <span class="text-weight-bold"
                        >{{ props.row.cantidad_disponible }} /
                        {{ props.row.cantidad_asignada }} L</span
                      >
                      <span class="text-caption text-grey-8"
                        >{{
                          Math.round(
                            (props.row.cantidad_disponible /
                              props.row.cantidad_asignada) *
                              100,
                          )
                        }}%</span
                      >
                    </div>
                    <q-linear-progress
                      rounded
                      size="10px"
                      :value="
                        props.row.cantidad_disponible /
                        props.row.cantidad_asignada
                      "
                      :color="
                        getProgressColor(
                          props.row.cantidad_disponible /
                            props.row.cantidad_asignada,
                        )
                      "
                    />
                  </div>
                </q-td>
              </template>

              <template v-slot:body-cell-estado="props">
                <q-td :props="props">
                  <q-chip
                    :color="getEstadoColor(props.row.estado)"
                    text-color="white"
                    dense
                    size="sm"
                    class="text-weight-bold"
                  >
                    {{ props.row.estado }}
                  </q-chip>
                </q-td>
              </template>

              <template v-slot:body-cell-actions="props">
                <q-td :props="props" class="q-gutter-xs">
                  <q-btn
                    dense
                    round
                    flat
                    color="secondary"
                    icon="add_card"
                    @click="openRecargaDialog(props.row)"
                  >
                    <q-tooltip>Recargar Cupo Extra</q-tooltip>
                  </q-btn>
                </q-td>
              </template>
            </q-table>
          </q-tab-panel>

          <!-- PANEL: CONFIGURACIÓN BASE -->
          <q-tab-panel name="base" class="q-pa-none">
            <q-table
              flat
              :rows="cuposBase"
              :columns="columnsBase"
              row-key="id_cupo_base"
              :loading="loading"
              v-model:pagination="paginationBase"
              v-model:filter="filterBase"
              @request="onRequestBase"
              binary-state-sort
            >
              <template v-slot:top>
                <q-input
                  borderless
                  dense
                  outlined
                  debounce="500"
                  v-model="filterBase"
                  placeholder="Buscar configuración..."
                  style="width: 300px"
                >
                  <template v-slot:append><q-icon name="search" /></template>
                </q-input>
                <q-space />
                <q-btn
                  color="primary"
                  icon="add"
                  label="Nueva Configuración"
                  @click="openAddDialog"
                />
              </template>

              <template v-slot:body-cell-activo="props">
                <q-td :props="props">
                  <q-icon
                    :name="props.row.activo ? 'check_circle' : 'cancel'"
                    :color="props.row.activo ? 'positive' : 'negative'"
                    size="sm"
                  />
                </q-td>
              </template>

              <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                  <q-btn
                    dense
                    round
                    flat
                    icon="edit"
                    @click="openEditDialog(props.row)"
                  />
                </q-td>
              </template>
            </q-table>
          </q-tab-panel>
        </q-tab-panels>
      </q-card>
    </div>

    <!-- DIÁLOGOS -->
    <CupoFormDialog
      :key="editingCupo?.id_cupo_base || 'new'"
      v-model="isFormDialogVisible"
      :initial-data="editingCupo"
      :is-editing="!!editingCupo"
      :loading="loading"
      @dataUpdated="cupoStore.fetchCuposBase(); cupoStore.fetchCuposActuales()"
    />

    <RecargaCupoDialog
      v-model="isRecargaDialogVisible"
      :cupo="selectedCupoActual"
      :loading="loading"
    />
  </q-page>
</template>

<script setup>
// ============================================
// IMPORTS
// ============================================
import { ref, onMounted, computed, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { useCupoStore } from "../../stores/cupoStore";
import { useUserStore } from "../../stores/userStore";
import { useQuasar, date } from "quasar";

import CupoFormDialog from "../../components/cupos/CupoFormDialog.vue";
import RecargaCupoDialog from "../../components/cupos/RecargaCupoDialog.vue";
import { useCupoPage } from "./composables/useCupoPage.js";

// ============================================
// COMPOSABLES & STORES
// ============================================
const $q = useQuasar();
const cupoStore = useCupoStore();
const userStore = useUserStore();

// Refs del store de cupos (estado reactivo de las 2 tablas)
const {
  loading,
  cuposActuales,      // Tabla 1: Saldos del mes actual
  paginationActual,   // Paginación tabla 1
  filterActual,       // Filtro de búsqueda tabla 1
  cuposBase,          // Tabla 2: Configuraciones base mensuales
  paginationBase,     // Paginación tabla 2
  filterBase,         // Filtro de búsqueda tabla 2
} = storeToRefs(cupoStore);

// Composable de la página (maneja diálogos, Socket.IO, helpers visuales)
const {
  isFormDialogVisible,
  isRecargaDialogVisible,
  editingCupo,
  selectedCupoActual,
  openAddDialog,
  openEditDialog,
  openRecargaDialog,
  confirmarReinicio,
  getProgressColor,
  getEstadoColor,
  setupSocketListeners,
  cleanupSocketListeners,
} = useCupoPage(cupoStore);

// ============================================
// ESTADO LOCAL
// ============================================

// Tab activo ('actual' para saldos, 'base' para configuración)
const tab = ref("actual");

// ============================================
// COMPUTED
// ============================================

/**
 * Periodo actual formateado (ej: "FEBRERO 2024")
 * Se muestra en el header para indicar el mes en curso
 */
const periodoActual = computed(() =>
  date.formatDate(Date.now(), "MMMM YYYY").toUpperCase()
);

/**
 * Verifica si el usuario actual es administrador
 * Solo ADMIN puede ejecutar el reinicio mensual
 */
const isAdmin = computed(() => userStore.user?.tipo_usuario === "ADMIN");

// ============================================
// DEFINICIÓN DE COLUMNAS
// ============================================

/**
 * TABLA 1: Columnas para Cupos Actuales (Estado de Saldos)
 * Muestra el estado real de los cupos en el mes actual
 */
const columnsActual = [
  {
    name: "dependencia",
    label: "Dependencia",
    field: (row) => row.CupoBase?.Dependencia?.nombre_dependencia || "N/A",
    align: "left",
    sortable: true,
  },
  {
    name: "subdependencia",
    label: "Subdependencia",
    field: (row) => row.CupoBase?.Subdependencia?.nombre || "-",
    align: "left",
  },
  {
    name: "categoria",
    label: "Categoría",
    field: (row) => row.CupoBase?.Categoria?.nombre || "N/A",
    align: "left",
  },
  {
    name: "combustible",
    label: "Tipo Combustible",
    field: (row) => row.CupoBase?.TipoCombustible?.nombre || "N/A",
    align: "center",
  },
  {
    name: "disponibilidad",
    label: "Disponibilidad Actual",
    align: "center",
    // Esta columna usa un template personalizado con progress bar
  },
  {
    name: "consumido",
    label: "Consumido",
    field: (row) => `${row.cantidad_consumida} L`,
    align: "center",
  },
  {
    name: "recargado",
    label: "Recargado Extra",
    field: (row) => `${row.cantidad_recargada} L`,
    align: "center",
  },
  { name: "estado", label: "Estado", field: "estado", align: "center" },
  { name: "actions", label: "Acciones", align: "right" },
];

/**
 * TABLA 2: Columnas para Cupos Base (Configuración Mensual)
 * Muestra las configuraciones que se usan para generar cupos cada mes
 */
const columnsBase = [
  {
    name: "dependencia",
    label: "Dependencia",
    field: (row) => row.Dependencia?.nombre_dependencia || "N/A",
    align: "left",
    sortable: true,
  },
  {
    name: "subdependencia",
    label: "Subdependencia",
    field: (row) => row.Subdependencia?.nombre || "-",
    align: "left",
  },
  {
    name: "combustible",
    label: "Tipo Combustible",
    field: (row) => row.TipoCombustible?.nombre || "N/A",
    align: "center",
  },
  {
    name: "mensual",
    label: "Asignación Mensual",
    field: (row) => `${row.cantidad_mensual} L`,
    align: "center",
  },
  { name: "activo", label: "Activo", field: "activo", align: "center" },
  { name: "actions", label: "Acciones", align: "right" },
];

// ============================================
// HANDLERS DE TABLA
// ============================================

/**
 * Handler de request para la tabla de cupos actuales
 * Se ejecuta al cambiar página, ordenar, o filtrar
 */
function onRequestActual(props) {
  paginationActual.value = props.pagination;
  filterActual.value = props.filter;
  cupoStore.fetchCuposActuales();
}

/**
 * Handler de request para la tabla de cupos base
 * Se ejecuta al cambiar página, ordenar, o filtrar
 */
function onRequestBase(props) {
  paginationBase.value = props.pagination;
  filterBase.value = props.filter;
  cupoStore.fetchCuposBase();
}

// ============================================
// LIFECYCLE HOOKS
// ============================================

/**
 * Al montar el componente:
 * 1. Cargar datos de ambas tablas
 * 2. Configurar listeners de Socket.IO (8 eventos diferentes)
 */
onMounted(() => {
  // Cargar ambas tablas en paralelo
  cupoStore.fetchCuposActuales();
  cupoStore.fetchCuposBase();
  
  // Configurar sincronización en tiempo real
  setupSocketListeners();
});

/**
 * Al desmontar el componente:
 * 1. Limpiar listeners de Socket.IO
 * 2. Resetear filtros y paginación de ambas tablas
 */
onUnmounted(() => {
  // Cleanup de Socket.IO (crítico para evitar memory leaks)
  cleanupSocketListeners();

  // Reset de la tabla de cupos actuales
  cupoStore.filterActual = "";
  cupoStore.paginationActual = {
    page: 1,
    rowsPerPage: 10,
    sortBy: "id_cupo_actual",
    descending: false,
    rowsNumber: 0,
  };

  // Reset de la tabla de cupos base
  cupoStore.filterBase = "";
  cupoStore.paginationBase = {
    page: 1,
    rowsPerPage: 10,
    sortBy: "id_cupo_base",
    descending: false,
    rowsNumber: 0,
  };
});
</script>


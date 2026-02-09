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
      @save="onFormSave"
    />

    <RecargaCupoDialog
      v-model="isRecargaDialogVisible"
      :cupo="selectedCupoActual"
      :loading="loading"
      @save="onRecargaSave"
    />
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { useCupoStore } from "../../stores/cupoStore";
import { useUserStore } from "../../stores/userStore";
import { useQuasar, date } from "quasar";

import CupoFormDialog from "../../components/cupos/CupoFormDialog.vue";
import RecargaCupoDialog from "../../components/cupos/RecargaCupoDialog.vue";

const $q = useQuasar();
const cupoStore = useCupoStore();
const userStore = useUserStore();

const {
  loading,
  cuposActuales,
  paginationActual,
  filterActual,
  cuposBase,
  paginationBase,
  filterBase,
} = storeToRefs(cupoStore);

const tab = ref("actual");
const isFormDialogVisible = ref(false);
const isRecargaDialogVisible = ref(false);
const editingCupo = ref(null);
const selectedCupoActual = ref(null);

const periodoActual = computed(() =>
  date.formatDate(Date.now(), "MMMM YYYY").toUpperCase(),
);
const isAdmin = computed(() => userStore.user?.tipo_usuario === "ADMIN");

// COLUMNAS TABLA ACTUAL
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

// COLUMNAS TABLA BASE
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

// HANDLERS
function onRequestActual(props) {
  paginationActual.value = props.pagination;
  filterActual.value = props.filter;
  cupoStore.fetchCuposActuales();
}

function onRequestBase(props) {
  paginationBase.value = props.pagination;
  filterBase.value = props.filter;
  cupoStore.fetchCuposBase();
}

function openAddDialog() {
  editingCupo.value = null;
  isFormDialogVisible.value = true;
}

function openEditDialog(row) {
  editingCupo.value = { ...row };
  isFormDialogVisible.value = true;
}

function openRecargaDialog(row) {
  selectedCupoActual.value = row;
  isRecargaDialogVisible.value = true;
}

async function onFormSave(formData) {
  let success;
  if (editingCupo.value) {
    success = await cupoStore.updateCupoBase(
      editingCupo.value.id_cupo_base,
      formData,
    );
  } else {
    success = await cupoStore.createCupoBase(formData);
  }
  if (success) isFormDialogVisible.value = false;
}

async function onRecargaSave(payload) {
  const success = await cupoStore.recargarCupo(payload);
  if (success) isRecargaDialogVisible.value = false;
}

function confirmarReinicio() {
  $q.dialog({
    title: "Confirmar Reinicio Mensual",
    message:
      "Esto cerrará los cupos del mes anterior y creará los nuevos basados en la configuración base. ¿Deseas continuar?",
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    await cupoStore.reiniciarMes();
  });
}

// HELPERS VISUALES
function getProgressColor(percent) {
  if (percent > 0.5) return "positive";
  if (percent > 0.2) return "warning";
  return "negative";
}

function getEstadoColor(estado) {
  switch (estado) {
    case "ACTIVO":
      return "positive";
    case "AGOTADO":
      return "negative";
    case "CERRADO":
      return "grey-7";
    default:
      return "primary";
  }
}

onMounted(() => {
  cupoStore.fetchCuposActuales();
  cupoStore.fetchCuposBase();
  cupoStore.initSocket();
});

onUnmounted(() => {
  cupoStore.cleanupSocket();
  
  // Reset Actual
  cupoStore.filterActual = "";
  cupoStore.paginationActual = {
    page: 1,
    rowsPerPage: 10,
    sortBy: "id_cupo_actual",
    descending: false,
    rowsNumber: 0,
  };

  // Reset Base
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

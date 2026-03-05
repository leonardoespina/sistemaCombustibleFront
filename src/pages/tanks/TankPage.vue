<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-y-md">
      <div class="row items-center justify-between">
        <h4 class="text-h4 q-my-none">Gestión de Tanques</h4>
        <q-btn
          color="primary"
          icon="add"
          label="Nuevo Tanque"
          @click="openAddDialog"
        />
      </div>

      <q-table
        :rows="rows"
        :columns="columns"
        row-key="id_tanque"
        :loading="loading"
        v-model:pagination="pagination"
        v-model:filter="filter"
        @request="handleRequest"
        binary-state-sort
      >
        <template v-slot:top-left>
          <q-input
            borderless
            dense
            debounce="500"
            v-model="filter"
            placeholder="Buscar por código o nombre..."
            style="width: 300px"
          >
            <template v-slot:append><q-icon name="search" /></template>
          </q-input>
        </template>

        <!-- Celda: Capacidad y Nivel -->
        <template v-slot:body-cell-nivel="props">
          <q-td :props="props">
            <div class="column items-center">
              <div class="text-caption">
                {{ props.row.nivel_actual }} / {{ props.row.capacidad_maxima }} L
              </div>
              <q-linear-progress
                size="15px"
                :value="props.row.nivel_actual / props.row.capacidad_maxima"
                :color="getProgressColor(props.row)"
                class="q-mt-xs rounded-borders"
                style="width: 100px"
              >
                <q-tooltip>
                  {{ ((props.row.nivel_actual / props.row.capacidad_maxima) * 100).toFixed(1) }}% ocupado
                </q-tooltip>
              </q-linear-progress>
            </div>
          </q-td>
        </template>

        <!-- Celda: Estado -->
        <template v-slot:body-cell-estado="props">
          <q-td :props="props">
            <q-chip
              :color="getStatusColor(props.row.estado)"
              text-color="white"
              dense
            >
              {{ props.row.estado }}
            </q-chip>
          </q-td>
        </template>
        
        <!-- Celda: Despacho Activo -->
        <template v-slot:body-cell-activo_para_despacho="props">
          <q-td :props="props" align="center">
            <q-icon
              :name="props.row.activo_para_despacho ? 'check_circle' : 'cancel'"
              :color="props.row.activo_para_despacho ? 'positive' : 'grey-5'"
              size="sm"
            >
              <q-tooltip>{{ props.row.activo_para_despacho ? 'Sí' : 'No' }}</q-tooltip>
            </q-icon>
          </q-td>
        </template>

        <!-- Celda: Acciones -->
        <template v-slot:body-cell-actions="props">
          <q-td :props="props" class="q-gutter-x-sm">
            <q-btn
              dense
              round
              flat
              icon="edit"
              color="primary"
              @click="openEditDialog(props.row)"
            >
              <q-tooltip>Editar Tanque</q-tooltip>
            </q-btn>
            <q-btn
              dense
              round
              flat
              icon="delete"
              color="negative"
              @click="openDeleteDialog(props.row)"
            >
              <q-tooltip>Desactivar Tanque</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- Diálogo de Formulario -->
    <TankFormDialog
      :key="editingTank?.id_tanque || 'new'"
      v-model="isFormDialogVisible"
      :initial-data="editingTank"
      :is-editing="!!editingTank"
      :loading="loading"
      @save="onFormSave"
    />


  </q-page>
</template>

<script setup>
import { onMounted, onUnmounted, computed } from "vue";
import { storeToRefs } from "pinia";
import { useTankStore } from "../../stores/tankStore.js";
import { useTankPage } from "./composables/useTankPage.js";
import TankFormDialog from "../../components/tanks/TankFormDialog.vue";

const tankStore = useTankStore();
const { rows, loading, pagination } = storeToRefs(tankStore);

const {
  isFormDialogVisible,
  editingTank,
  handleRequest,
  openAddDialog,
  openEditDialog,
  openDeleteDialog,
  onFormSave,
  getProgressColor,
  getStatusColor
} = useTankPage(tankStore);

const filter = computed({
  get: () => tankStore.filter,
  set: (val) => (tankStore.filter = val),
});

const columns = [
  { name: "id_tanque", label: "ID", field: "id_tanque", sortable: true, align: "left" },
  { name: "codigo", label: "Código", field: "codigo", sortable: true, align: "left" },
  { name: "nombre", label: "Nombre", field: "nombre", sortable: true, align: "left" },
  { name: "llenadero", label: "Llenadero", field: (row) => row.Llenadero?.nombre_llenadero, align: "left" },
  { name: "combustible", label: "Combustible", field: (row) => row.TipoCombustible?.nombre, align: "left" },
  { name: "tipo", label: "Tipo", field: "tipo_tanque", align: "center" },
  { name: "nivel", label: "Ocupación", align: "center" },
  { name: "activo_para_despacho", label: "Habilitado Despecho", field: "activo_para_despacho", align: "center" },
  { name: "estado", label: "Estado", field: "estado", align: "center" },
  { name: "actions", label: "Acciones", align: "right" },
];

onMounted(() => {
  tankStore.initSocket();
  tankStore.fetchTanks();
});

onUnmounted(() => {
  tankStore.cleanupSocket();
  // Resetear filtros y paginación al salir
  tankStore.filter = "";
  tankStore.pagination = {
    page: 1,
    rowsPerPage: 10,
    sortBy: "id_tanque",
    descending: false,
    rowsNumber: 0,
  };
});
</script>

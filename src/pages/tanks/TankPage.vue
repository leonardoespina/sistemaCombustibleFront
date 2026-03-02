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

    <!-- Diálogo de Confirmación de Borrado -->
    <q-dialog v-model="isDeleteDialogVisible" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm"
            >¿Seguro que deseas desactivar el tanque
            <strong>{{ editingTank?.nombre }}</strong
            >?</span
          >
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            flat
            label="Desactivar"
            color="negative"
            @click="confirmDelete"
            :loading="loading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { useTankStore } from "../../stores/tankStore.js";
import TankFormDialog from "../../components/tanks/TankFormDialog.vue";

const tankStore = useTankStore();
const { rows, loading, filter, pagination } = storeToRefs(tankStore);

const isFormDialogVisible = ref(false);
const isDeleteDialogVisible = ref(false);
const editingTank = ref(null);

const columns = [
  { name: "id_tanque", label: "ID", field: "id_tanque", sortable: true, align: "left" },
  { name: "codigo", label: "Código", field: "codigo", sortable: true, align: "left" },
  { name: "nombre", label: "Nombre", field: "nombre", sortable: true, align: "left" },
  { name: "llenadero", label: "Llenadero", field: (row) => row.Llenadero?.nombre_llenadero, align: "left" },
  { name: "combustible", label: "Combustible", field: (row) => row.TipoCombustible?.nombre, align: "left" },
  { name: "tipo", label: "Tipo", field: "tipo_tanque", align: "center" },
  { name: "nivel", label: "Ocupación", align: "center" },
  { name: "estado", label: "Estado", field: "estado", align: "center" },
  { name: "actions", label: "Acciones", align: "right" },
];

function handleRequest(props) {
  pagination.value = props.pagination;
  filter.value = props.filter;
  tankStore.fetchTanks();
}

function openAddDialog() {
  editingTank.value = null;
  isFormDialogVisible.value = true;
}

function openEditDialog(tank) {
  editingTank.value = JSON.parse(JSON.stringify(tank));
  isFormDialogVisible.value = true;
}

function openDeleteDialog(tank) {
  editingTank.value = tank;
  isDeleteDialogVisible.value = true;
}

async function onFormSave(formData) {
  let success = false;
  if (editingTank.value) {
    success = await tankStore.updateTank(editingTank.value.id_tanque, formData);
  } else {
    success = await tankStore.createTank(formData);
  }
  if (success) {
    isFormDialogVisible.value = false;
  }
}

async function confirmDelete() {
  await tankStore.deleteTank(editingTank.value.id_tanque);
  isDeleteDialogVisible.value = false;
}

function getProgressColor(row) {
  const percent = row.nivel_actual / row.capacidad_maxima;
  if (percent < 0.15) return "negative";
  if (percent < 0.3) return "warning";
  return "positive";
}

function getStatusColor(status) {
  switch (status) {
    case "ACTIVO": return "positive";
    case "INACTIVO": return "grey";
    case "MANTENIMIENTO": return "orange";
    case "CONTAMINADO": return "negative";
    default: return "blue";
  }
}

onMounted(() => {
  tankStore.initSocket();
  tankStore.fetchTanks();
});

onUnmounted(() => {
  tankStore.cleanupSocket();
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

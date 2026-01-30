<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-y-md">
      <h4 class="text-h4 q-my-none">Recepción de Cisternas</h4>

      <q-table
        :rows="rows"
        :columns="columns"
        row-key="id_carga"
        :loading="loading"
        v-model:pagination="pagination"
        v-model:filter="filter"
        @request="handleRequest"
        binary-state-sort
      >
        <template v-slot:top>
          <q-input
            borderless
            dense
            debounce="500"
            v-model="filter"
            placeholder="Buscar guía..."
            style="width: 300px"
          >
            <template v-slot:append><q-icon name="search" /></template>
          </q-input>
          <q-space />
          <q-btn
            color="primary"
            icon="add"
            label="Registrar Carga"
            @click="openAddDialog"
          />
        </template>

        <template v-slot:body-cell-estado="props">
          <q-td :props="props">
            <q-badge :color="props.value === 'PROCESADO' ? 'green' : 'red'">{{
              props.value
            }}</q-badge>
          </q-td>
        </template>

        <!-- ACCIONES ACTUALIZADAS -->
        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <!-- 1. CONSULTAR (VER DETALLE) -->
            <q-btn
              dense
              round
              flat
              color="info"
              icon="visibility"
              @click="openDetailDialog(props.row)"
            >
              <q-tooltip>Ver Detalle</q-tooltip>
            </q-btn>

            <!-- 2. EDITAR -->
            <q-btn
              dense
              round
              flat
              icon="edit"
              @click="openEditDialog(props.row)"
              :disable="props.row.estado === 'ANULADO'"
            >
              <q-tooltip>Editar Datos</q-tooltip>
            </q-btn>

            <!-- 3. ANULAR -->
            <q-btn
              dense
              round
              flat
              color="negative"
              icon="block"
              @click="openAnnulDialog(props.row)"
              :disable="props.row.estado === 'ANULADO'"
            >
              <q-tooltip>Anular</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- Componentes de Diálogo -->
    <CisternLoadFormDialog
      v-model="isFormDialogVisible"
      :initial-data="editingItem"
      :is-editing="!!editingItem"
      :tanks-list="tanksList"
      :vehicles-list="vehiclesList"
      :drivers-list="driversList"
      :warehousemen-list="warehousemenList"
      :current-tank-aforo="selectedTankAforo"
      :current-tank-detail="selectedTankDetail"
      @save="onFormSave"
      @tank-changed="handleTankChange"
    />

    <!-- NUEVO: Diálogo de Detalle -->
    <CisternLoadDetailDialog
      v-model="isDetailDialogVisible"
      :load="selectedLoad"
    />

    <q-dialog v-model="isAnnulDialogVisible" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <div class="q-ml-sm">
            <div class="text-weight-bold">
              ¿Anular Guía #{{ editingItem?.numero_guia }}?
            </div>
            <div class="text-caption">
              Se descontarán {{ editingItem?.litros_recibidos_real }} litros del
              tanque.
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            flat
            label="Anular"
            color="negative"
            @click="confirmAnnul"
            :loading="loading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { date } from "quasar";
import { useCisternLoadStore } from "../../stores/cisternLoadStore.js";
import CisternLoadFormDialog from "../../components/loads/CisternLoadFormDialog.vue";
import CisternLoadDetailDialog from "../../components/loads/CisternLoadDetailDialog.vue"; // Importar

const loadStore = useCisternLoadStore();
const {
  rows,
  loading,
  filter,
  pagination,
  tanksList,
  vehiclesList,
  driversList,
  warehousemenList,
  selectedTankAforo,
  selectedTankDetail,
} = storeToRefs(loadStore);

const isFormDialogVisible = ref(false);
const isDetailDialogVisible = ref(false); // Nuevo estado
const isAnnulDialogVisible = ref(false);
const editingItem = ref(null);
const selectedLoad = ref(null); // Para pasar al detalle

const columns = ref([
  {
    name: "guia",
    label: "N° Guía",
    field: "numero_guia",
    sortable: true,
    align: "left",
  },
  {
    name: "fecha",
    label: "Fecha",
    field: (row) => date.formatDate(row.fecha_hora_llegada, "DD/MM HH:mm"),
    sortable: true,
    align: "left",
  },

  {
    name: "cisterna",
    label: "Cisterna",
    field: (row) => (row.Vehiculo ? row.Vehiculo.placa : "N/A"),
    align: "left",
  },
  {
    name: "Usuario",
    label: "Usuario",
    field: (row) =>
      row.Usuario ? `${row.Usuario.nombre} ${row.Usuario.apellido} ` : "N/A",
    align: "left",
  },
  {
    name: "tanque",
    label: "Tanque",
    field: (row) => (row.Tanque ? row.Tanque.codigo : "N/A"),
    align: "left",
  },
  {
    name: "litros",
    label: "Litros Real",
    field: "litros_recibidos_real",
    sortable: true,
    align: "right",
    style: "font-weight: bold",
  },
  {
    name: "faltante",
    label: "Dif. Guía",
    field: "litros_faltantes",
    align: "right",
    classes: (row) =>
      row.litros_faltantes > 0 ? "text-negative" : "text-positive",
  },
  { name: "estado", label: "Estado", field: "estado", align: "center" },
  { name: "actions", label: "Acciones", align: "right" },
]);

function handleRequest(props) {
  pagination.value = props.pagination;
  filter.value = props.filter;
  loadStore.fetchLoads();
}

function openAddDialog() {
  editingItem.value = null;
  loadStore.selectedTankAforo = null;
  isFormDialogVisible.value = true;
}

function openEditDialog(item) {
  editingItem.value = { ...item };
  isFormDialogVisible.value = true;
}

function openDetailDialog(item) {
  selectedLoad.value = item;
  isDetailDialogVisible.value = true;
}

function openAnnulDialog(item) {
  editingItem.value = item;
  isAnnulDialogVisible.value = true;
}

function handleTankChange(tankId) {
  loadStore.fetchTankDetail(tankId);
}

async function onFormSave(formData) {
  let success = false;
  if (editingItem.value) {
    success = await loadStore.updateLoad(editingItem.value.id_carga, formData);
  } else {
    success = await loadStore.createLoad(formData);
  }
  if (success) isFormDialogVisible.value = false;
}

async function confirmAnnul() {
  await loadStore.annulLoad(editingItem.value.id_carga);
  isAnnulDialogVisible.value = false;
}

onMounted(() => {
  loadStore.fetchLoads();
  loadStore.loadFormOptions();
});
</script>

<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-y-md">
      <h4 class="text-h4 q-my-none">Transferencias Internas</h4>

      <q-table
        :rows="rows"
        :columns="columns"
        row-key="id_transferencia"
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
            placeholder="Buscar..."
            style="width: 300px"
          >
            <template v-slot:append><q-icon name="search" /></template>
          </q-input>
          <q-space />
          <q-btn
            color="primary"
            icon="add"
            label="Nueva Transferencia"
            @click="openAddDialog"
          />
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
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
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- Componentes de Diálogo -->
    <InternalTransferFormDialog
      v-model="isFormDialogVisible"
      :tanks-list="tanksList"
      :warehousemen-list="warehousemenList"
      :source-tank-detail="sourceTankDetail"
      :destination-tank-detail="destinationTankDetail"
      :destination-tank-aforo="destinationTankAforo"
      @save="onFormSave"
      @source-tank-changed="handleSourceTankChange"
      @destination-tank-changed="handleDestinationTankChange"
    />

    <InternalTransferDetailDialog
      v-model="isDetailDialogVisible"
      :transfer="selectedTransfer"
    />
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { date } from "quasar";
import { useInternalTransferStore } from "../../stores/internalTransferStore.js";
import InternalTransferFormDialog from "../../components/internal-transfers/InternalTransferFormDialog.vue";
import InternalTransferDetailDialog from "../../components/internal-transfers/InternalTransferDetailDialog.vue";

const store = useInternalTransferStore();
const {
  rows,
  loading,
  filter,
  pagination,
  tanksList,
  warehousemenList,
  sourceTankDetail,
  destinationTankDetail,
  destinationTankAforo,
} = storeToRefs(store);

const isFormDialogVisible = ref(false);
const isDetailDialogVisible = ref(false);
const selectedTransfer = ref(null);

const columns = ref([
  {
    name: "fecha",
    label: "Fecha",
    field: (row) => date.formatDate(row.hora_inicio, "DD/MM HH:mm"),
    sortable: true,
    align: "left",
  },
  {
    name: "origen",
    label: "Origen",
    field: (row) => (row.TanqueOrigen ? row.TanqueOrigen.codigo : "N/A"),
    align: "left",
  },
  {
    name: "destino",
    label: "Destino",
    field: (row) => (row.TanqueDestino ? row.TanqueDestino.codigo : "N/A"),
    align: "left",
  },
  {
    name: "litros",
    label: "Transferidos",
    field: "litros_transferidos",
    sortable: true,
    align: "right",
    format: (val) => `${val} L`,
    style: "font-weight: bold",
  },
  {
    name: "responsable",
    label: "Responsable",
    field: (row) =>
      row.Almacenista
        ? `${row.Almacenista.nombre} ${row.Almacenista.apellido}`
        : "N/A",
    align: "left",
  },
  { name: "actions", label: "Acciones", align: "right" },
]);

function handleRequest(props) {
  pagination.value = props.pagination;
  filter.value = props.filter;
  store.fetchTransfers();
}

function openAddDialog() {
  store.sourceTankDetail = null;
  store.destinationTankDetail = null;
  store.destinationTankAforo = null;
  isFormDialogVisible.value = true;
}

function openDetailDialog(item) {
  selectedTransfer.value = item;
  isDetailDialogVisible.value = true;
}

function handleSourceTankChange(tankId) {
  store.fetchTankDetail(tankId, false);
}

function handleDestinationTankChange(tankId) {
  store.fetchTankDetail(tankId, true);
}

async function onFormSave(formData) {
  const success = await store.createTransfer(formData);
  if (success) isFormDialogVisible.value = false;
}

onMounted(() => {
  store.fetchTransfers();
  store.loadFormOptions();
});
</script>

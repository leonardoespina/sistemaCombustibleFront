<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-y-md">
      <h4 class="text-h4 q-my-none">Gestión de Despachos</h4>

      <q-table
        :rows="rows"
        :columns="columns"
        row-key="id_despacho"
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
            placeholder="Buscar ticket..."
            style="width: 300px"
          >
            <template v-slot:append><q-icon name="search" /></template>
          </q-input>
          <q-space />
          <q-btn
            color="primary"
            icon="add"
            label="Nuevo Despacho"
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

        <template v-slot:body-cell-cierre="props">
          <q-td :props="props">
            <q-badge :color="props.row.id_cierre ? 'green' : 'red'">
              {{ props.row.id_cierre ? "cerrado" : "por cierre" }}
            </q-badge>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              dense
              round
              flat
              color="info"
              icon="receipt_long"
              @click="openDetailDialog(props.row)"
            >
              <q-tooltip>Ver Ticket</q-tooltip>
            </q-btn>

            <q-btn
              dense
              round
              flat
              color="warning"
              icon="edit"
              @click="openEditDialog(props.row)"
              :disable="
                !!(props.row.estado === 'ANULADO' || props.row.id_cierre)
              "
              :class="{
                'disabled-btn':
                  props.row.estado === 'ANULADO' || props.row.id_cierre,
              }"
            >
              <q-tooltip v-if="props.row.id_cierre"
                >Cerrado - No editable</q-tooltip
              >
              <q-tooltip v-else>Editar</q-tooltip>
            </q-btn>

            <q-btn
              dense
              round
              flat
              color="negative"
              icon="block"
              @click="openAnnulDialog(props.row)"
              :disable="
                !!(props.row.estado === 'ANULADO' || props.row.id_cierre)
              "
              :class="{
                'disabled-btn':
                  props.row.estado === 'ANULADO' || props.row.id_cierre,
              }"
            >
              <q-tooltip v-if="props.row.id_cierre"
                >Cerrado - No anulable</q-tooltip
              >
              <q-tooltip v-else>Anular</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </div>

    <DispatchFormDialog
      v-model="isFormDialogVisible"
      :is-editing="isEditing"
      :initial-data="selectedDispatch"
      :dispensers-list="dispensersList"
      :vehicles-list="vehiclesList"
      :drivers-list="driversList"
      :managements-list="managementsList"
      :warehousemen-list="warehousemenList"
      @save="onFormSave"
    />

    <DispatchDetailDialog
      v-model="isDetailDialogVisible"
      :dispatch="selectedDispatch"
    />

    <q-dialog v-model="isAnnulDialogVisible" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <div class="q-ml-sm">
            <div class="text-weight-bold">
              ¿Anular Despacho #{{ selectedDispatch?.numero_ticket }}?
            </div>
            <div class="text-caption">
              Se restaurará el inventario al tanque original.
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
import { useDispatchStore } from "../../stores/dispatchStore.js";
import DispatchFormDialog from "../../components/dispatches/DispatchFormDialog.vue";
import DispatchDetailDialog from "../../components/dispatches/DispatchDetailDialog.vue";

const dispatchStore = useDispatchStore();
const {
  rows,
  loading,
  filter,
  pagination,
  dispensersList,
  vehiclesList,
  driversList,
  managementsList,
  warehousemenList,
} = storeToRefs(dispatchStore);

const isFormDialogVisible = ref(false);
const isEditing = ref(false);
const isDetailDialogVisible = ref(false);
const isAnnulDialogVisible = ref(false);
const selectedDispatch = ref(null);

const columns = ref([
  {
    name: "ticket",
    label: "Ticket",
    field: "numero_ticket",
    sortable: true,
    align: "left",
  },
  {
    name: "fecha",
    label: "Fecha",
    field: (row) => date.formatDate(row.fecha_hora, "DD/MM HH:mm"),
    sortable: true,
    align: "left",
  },
  {
    name: "placa",
    label: "placa",
    field: (row) => (row.Vehiculo ? row.Vehiculo.placa : "N/A"),
    align: "left",
  },
  {
    name: "cierre",
    label: "Estatus de Cierre",
    field: (row) => (row.id_cierre ? "cerrado" : "por cierre"),
    align: "left",
  },
  // Columna Beneficiario Dinámica
  {
    name: "beneficiario",
    label: "Beneficiario",
    field: (row) => getBeneficiarioLabel(row),
    align: "left",
  },
  {
    name: "cantidad",
    label: "Litros",
    field: "cantidad_despachada",
    sortable: true,
    align: "right",
    style: "font-weight: bold",
  },
  { name: "estado", label: "Estado", field: "estado", align: "center" },
  { name: "actions", label: "Acciones", align: "right" },
]);

// Helper para mostrar beneficiario correcto en la tabla
function getBeneficiarioLabel(row) {
  if (row.tipo_destino === "VEHICULO") {
    return row.Chofer
      ? `${row.Chofer.nombre} ${row.Chofer.apellido}`
      : "Chofer N/A";
  }
  if (row.tipo_destino === "BIDON") {
    // Ajuste: El backend puede devolver 'Gerencium' en lugar de 'Gerencia'
    const gerencia = row.Gerencia || row.Gerencium;
    return gerencia ? gerencia.nombre : "Gerencia N/A";
  }

  return "N/A";
}

function handleRequest(props) {
  pagination.value = props.pagination;
  filter.value = props.filter;
  dispatchStore.fetchDispatches();
}

function openAddDialog() {
  isEditing.value = false;
  selectedDispatch.value = null;
  dispatchStore.loadFormOptions();
  isFormDialogVisible.value = true;
}

function openEditDialog(item) {
  isEditing.value = true;
  selectedDispatch.value = item;
  dispatchStore.loadFormOptions();
  isFormDialogVisible.value = true;
}

function openDetailDialog(item) {
  selectedDispatch.value = item;
  isDetailDialogVisible.value = true;
}

function openAnnulDialog(item) {
  selectedDispatch.value = item;
  isAnnulDialogVisible.value = true;
}

async function onFormSave(formData) {
  let success = false;
  if (isEditing.value) {
    success = await dispatchStore.updateDispatch(
      formData.id_despacho,
      formData
    );
  } else {
    success = await dispatchStore.createDispatch(formData);
  }
  if (success) isFormDialogVisible.value = false;
}

async function confirmAnnul() {
  await dispatchStore.annulDispatch(selectedDispatch.value.id_despacho);
  isAnnulDialogVisible.value = false;
}

onMounted(() => {
  dispatchStore.fetchDispatches();
});
</script>

<style lang="scss" scoped>
.disabled-btn {
  cursor: not-allowed !important;
}
</style>

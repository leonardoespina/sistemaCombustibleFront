<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-y-md">
      <div class="row items-center justify-between">
        <h4 class="text-h4 q-my-none">Gestión de Solicitudes</h4>
        <q-btn
          color="primary"
          icon="add"
          label="Nueva Solicitud"
          @click="openAddDialog"
        />
      </div>

      <q-table
        :rows="rows"
        :columns="columns"
        row-key="id_solicitud"
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
            placeholder="Buscar por placa, ticket..."
            style="width: 300px"
          >
            <template v-slot:append><q-icon name="search" /></template>
          </q-input>
        </template>

        <!-- Celda Estatus -->
        <template v-slot:body-cell-estatus="props">
          <q-td :props="props">
            <q-badge :color="getStatusColor(props.value)" class="q-pa-xs">
              {{ props.value.replace('_', ' ') }}
            </q-badge>
          </q-td>
        </template>

        <!-- Celda Litros -->
        <template v-slot:body-cell-litros="props">
          <q-td :props="props">
            <div class="text-weight-bold">{{ props.row.litros_solicitado }} L</div>
            <div v-if="props.row.litros_despachados > 0" class="text-caption text-grey">
              Surtido: {{ props.row.litros_despachados }} L
            </div>
          </q-td>
        </template>

        <!-- Acciones -->
        <template v-slot:body-cell-actions="props">
          <q-td :props="props" class="q-gutter-x-sm">
            <!-- Aprobar (Solo si está por aprobar) -->
            <q-btn
              v-if="props.row.estatus === 'POR_APROBAR'"
              dense
              round
              flat
              color="positive"
              icon="check_circle"
              @click="onApprove(props.row)"
            >
              <q-tooltip>Aprobar Solicitud</q-tooltip>
            </q-btn>

            <!-- Imprimir (Solo si está aprobado) -->
            <q-btn
              v-if="props.row.estatus === 'APROBADO' || props.row.estatus === 'IMPRESO_APROBADO'"
              dense
              round
              flat
              color="primary"
              icon="print"
              @click="onPrint(props.row)"
            >
              <q-tooltip>Imprimir Ticket / QR</q-tooltip>
            </q-btn>

            <!-- Rechazar (Solo si no está despachado/vencido) -->
            <q-btn
              v-if="['POR_APROBAR', 'APROBADO'].includes(props.row.estatus)"
              dense
              round
              flat
              color="negative"
              icon="cancel"
              @click="onReject(props.row)"
            >
              <q-tooltip>Rechazar</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- Diálogo de Formulario -->
    <RequestFormDialog
      v-model="isFormDialogVisible"
      @save="onFormSave"
    />
  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { useRequestStore } from "../../stores/requestStore.js";
import RequestFormDialog from "../../components/dispatches/RequestFormDialog.vue";
import { useQuasar } from "quasar";

const $q = useQuasar();
const requestStore = useRequestStore();
const { rows, loading, filter, pagination } = storeToRefs(requestStore);

const isFormDialogVisible = ref(false);

const columns = [
  { name: "id_solicitud", label: "ID", field: "id_solicitud", sortable: true, align: "left" },
  { name: "ticket", label: "Ticket", field: "numero_ticket", sortable: true, align: "left" },
  { name: "fecha", label: "Fecha/Hora", field: row => `${row.fecha} ${row.hora}`, align: "left" },
  { name: "placa", label: "Vehículo", field: "placa", sortable: true, align: "left" },
  { name: "solicitante", label: "Solicitante", field: "solicitante_nombre", align: "left" },
  { name: "litros", label: "Cantidad", align: "right" },
  { name: "estatus", label: "Estatus", field: "estatus", align: "center" },
  { name: "actions", label: "Acciones", align: "right" },
];

function handleRequest(props) {
  pagination.value = props.pagination;
  filter.value = props.filter;
  requestStore.fetchRequests();
}

function openAddDialog() {
  isFormDialogVisible.value = true;
}

async function onFormSave(formData) {
  const success = await requestStore.createRequest(formData);
  if (success) isFormDialogVisible.value = false;
}

function onApprove(row) {
  $q.dialog({
    title: 'Confirmar Aprobación',
    message: `¿Desea aprobar la solicitud del vehículo ${row.placa} por ${row.litros_solicitado}L?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await requestStore.approveRequest(row.id_solicitud);
  });
}

function onPrint(row) {
  // Aquí irá la lógica para abrir la ventana de impresión con el QR
  $q.notify({ type: 'info', message: 'Generando ticket de impresión...' });
}

function onReject(row) {
  $q.dialog({
    title: 'Rechazar Solicitud',
    message: 'Ingrese el motivo del rechazo:',
    prompt: {
      model: '',
      type: 'text'
    },
    cancel: true,
    persistent: true
  }).onOk(async (data) => {
     // Lógica para rechazar (Pendiente implementar action en store si se requiere motivo)
     $q.notify({ type: 'warning', message: 'Funcionalidad de rechazo en desarrollo' });
  });
}

function getStatusColor(status) {
  switch (status) {
    case 'POR_APROBAR': return 'orange';
    case 'APROBADO': return 'blue';
    case 'IMPRESO_APROBADO': return 'indigo';
    case 'DESPACHADO': return 'green';
    case 'RECHAZADO': return 'red';
    case 'VENCIDO': return 'grey-8';
    case 'CANCELADO': return 'grey-6';
    default: return 'black';
  }
}

onMounted(() => {
  requestStore.initSocket();
  requestStore.fetchRequests();
});

onUnmounted(() => {
  requestStore.cleanupSocket();
});
</script>

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
              {{ props.value.replace("_", " ") }}
            </q-badge>
          </q-td>
        </template>

        <!-- Celda Litros -->
        <template v-slot:body-cell-litros="props">
          <q-td :props="props">
            <div class="text-weight-bold">
              {{ props.row.cantidad_litros }} L
            </div>
            <div
              v-if="props.row.cantidad_despachada > 0"
              class="text-caption text-grey"
            >
              Surtido: {{ props.row.cantidad_despachada }} L
            </div>
          </q-td>
        </template>

        <!-- Acciones -->
        <template v-slot:body-cell-actions="props">
          <q-td :props="props" class="q-gutter-x-sm">
            <!-- Ver Detalles -->
            <q-btn
              dense
              round
              flat
              color="grey-7"
              icon="visibility"
              @click="onShowDetails(props.row)"
            >
              <q-tooltip>Ver Detalles</q-tooltip>
            </q-btn>

            <!-- Aprobar (Solo si está PENDIENTE) -->
            <q-btn
              v-if="props.row.estado === 'PENDIENTE'"
              dense
              round
              flat
              color="positive"
              icon="check_circle"
              @click="onApprove(props.row)"
            >
              <q-tooltip>Aprobar Solicitud</q-tooltip>
            </q-btn>

            <!-- Rechazar (Solo si no está despachado/vencido) -->
            <q-btn
              v-if="['PENDIENTE', 'APROBADA'].includes(props.row.estado)"
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
    <RequestFormDialog v-model="isFormDialogVisible" @save="onFormSave" />

    <!-- ¡NUEVO! Diálogo de Detalles de Solicitud -->
    <RequestDetailsDialog
      v-model="isDetailsVisible"
      :request-data="selectedRequest"
    />
  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { useRequestStore } from "../../stores/requestStore.js";
import RequestFormDialog from "../../components/dispatches/RequestFormDialog.vue";
//import TicketPreviewDialog from "../../components/dispatches/TicketPreviewDialog.vue";
import RequestDetailsDialog from "../../components/dispatches/RequestDetailsDialog.vue";
import { useQuasar } from "quasar";

const $q = useQuasar();
const requestStore = useRequestStore();
const { rows, loading, filter, pagination } = storeToRefs(requestStore);

const isFormDialogVisible = ref(false);
//const isTicketVisible = ref(false);
const isDetailsVisible = ref(false);
//const selectedTicket = ref(null);
const selectedRequest = ref(null);

const columns = [
  {
    name: "id_solicitud",
    label: "ID",
    field: "id_solicitud",
    sortable: true,
    align: "left",
  },
  {
    name: "ticket",
    label: "Ticket",
    field: "codigo_ticket",
    sortable: true,
    align: "left",
  },
  {
    name: "fecha",
    label: "Fecha/Hora",
    field: (row) =>
      row.fecha_solicitud
        ? new Date(row.fecha_solicitud).toLocaleString()
        : "N/A",
    align: "left",
  },
  {
    name: "placa",
    label: "Vehículo",
    field: "placa",
    sortable: true,
    align: "left",
  },
  {
    name: "solicitante",
    label: "Solicitante",
    field: (row) =>
      row.Solicitante
        ? `${row.Solicitante.nombre} ${row.Solicitante.apellido}`
        : "N/A",
    align: "left",
  },
  {
    name: "subdependencia",
    label: "Subdependencia",
    field: (row) => (row.Subdependencia ? row.Subdependencia.nombre : "N/A"),
    align: "left",
  },
  {
    name: "litros",
    label: "Cantidad",
    field: "cantidad_litros",
    align: "right",
  },
  { name: "estatus", label: "Estatus", field: "estado", align: "center" },
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

function onFormSave(response) {
  // El formulario ya creó la solicitud, solo recibimos la respuesta
  if (response && response.data) {
    // Cerrar el formulario inmediatamente
    isFormDialogVisible.value = false;

    // Extraer datos para el resumen
    const ticket =
      response.ticket || response.data.codigo_ticket || "PENDIENTE";
    const status = response.data.estado || "PENDIENTE";
    const placa = response.data.placa || "N/A";
    const litros = response.data.cantidad_litros || "0";
    const solicitante = response.data.solicitante || "Usuario";

    // Mostrar diálogo con resumen detallado
    $q.dialog({
      title: "✅ ¡Solicitud Creada con Éxito!",
      message: `
        <div class="q-pa-sm">
          <div class="text-subtitle1 text-center q-mb-md">La solicitud ha sido registrada en el sistema.</div>
          
          <div class="row q-col-gutter-sm bg-grey-2 q-pa-md rounded-borders">
            <div class="col-12 text-center q-mb-sm">
              <div class="text-caption text-uppercase text-grey-8">Número de Ticket</div>
              <div class="text-h4 text-weight-bolder text-primary">${ticket}</div>
            </div>
            
            <div class="col-6">
              <div class="text-caption text-grey-8">Estatus</div>
              <div class="text-weight-bold text-orange-9">${status}</div>
            </div>
            <div class="col-6 text-right">
              <div class="text-caption text-grey-8">Vehículo</div>
              <div class="text-weight-bold">${placa}</div>
            </div>
            
            <div class="col-6">
              <div class="text-caption text-grey-8">Solicitante</div>
              <div class="text-weight-bold text-truncate" style="max-width: 150px">${solicitante}</div>
            </div>
             <div class="col-6 text-right">
              <div class="text-caption text-grey-8">Cantidad</div>
              <div class="text-weight-bold">${litros} Litros</div>
            </div>
          </div>

          <div class="text-caption text-center text-grey-6 q-mt-md">
            Por favor, indique al conductor que se dirija al área de despacho.
          </div>
        </div>
      `,
      html: true,
      ok: {
        label: "Aceptar y Cerrar",
        color: "primary",
        push: true,
        size: "md",
      },
      persistent: true,
    });
  }
}

function onApprove(row) {
  $q.dialog({
    title: "Confirmar Aprobación",
    message: `¿Desea aprobar la solicitud del vehículo ${row.placa} por ${row.cantidad_litros}L?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    await requestStore.approveRequest(row.id_solicitud);
  });
}

function onShowDetails(row) {
  selectedRequest.value = row;
  isDetailsVisible.value = true;
}

function onReject(row) {
  $q.dialog({
    title: "Rechazar Solicitud",
    message: `¿Desea rechazar la solicitud del vehículo ${row.placa}? Ingrese el motivo:`,
    prompt: {
      model: "",
      type: "text",
      isValid: (val) => val.length > 3,
    },
    cancel: true,
    persistent: true,
  }).onOk(async (motivo) => {
    await requestStore.rejectRequest(row.id_solicitud, motivo);
  });
}

function getStatusColor(status) {
  switch (status) {
    case "PENDIENTE":
      return "orange";
    case "APROBADA":
      return "blue";
    case "IMPRESA":
      return "indigo";
    case "DESPACHADA":
      return "green";
    case "RECHAZADA":
      return "red";
    case "VENCIDA":
      return "grey-8";
    case "CANCELADA":
      return "grey-6";
    default:
      return "black";
  }
}

onMounted(() => {
  // Inicializar sockets
  requestStore.initSocket();
  requestStore.fetchRequests();
});

onUnmounted(() => {
  requestStore.cleanupSocket();
  requestStore.filter = "";
  requestStore.pagination = {
    page: 1,
    rowsPerPage: 10,
    sortBy: "id_solicitud",
    descending: true,
    rowsNumber: 0,
  };
});
</script>

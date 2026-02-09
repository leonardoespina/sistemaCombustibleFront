<!-- src/pages/FingerprintManagementPage.vue -->
<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <h4 class="text-h4 q-my-none">Gestión de Huellas</h4>
      <div class="q-gutter-sm">
        <q-btn
          color="secondary"
          icon="manage_search"
          label="Probar Verificación"
          to="/huella/verificar"
          outline
        />
        <q-btn
          color="primary"
          icon="fingerprint"
          label="Nuevo Registro"
          @click="openCreateDialog"
        />
      </div>
    </div>

    <q-table
      :rows="rows"
      :columns="columns"
      row-key="id_biometria"
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
          placeholder="Buscar persona..."
          style="width: 300px"
        >
          <template v-slot:append><q-icon name="search" /></template>
        </q-input>
      </template>

      <template v-slot:body-cell-rol="props">
        <q-td :props="props">
          <q-chip dense color="blue-2" text-color="blue-9" label="">
            {{ props.row.rol }}
          </q-chip>
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props" class="q-gutter-sm">
          <q-btn
            dense
            round
            flat
            color="primary"
            icon="edit"
            @click="editBiometry(props.row)"
          >
            <q-tooltip>Editar Registro</q-tooltip>
          </q-btn>
          <q-btn
            dense
            round
            flat
            color="negative"
            icon="delete"
            @click="confirmDelete(props.row)"
          >
            <q-tooltip>Eliminar Registro</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Diálogo de Captura -->
    <q-dialog v-model="isCaptureDialogVisible" persistent maximized>
      <q-card>
        <q-bar class="bg-primary text-white">
          <q-icon name="fingerprint" />
          <div>
            {{ editingId ? "Actualizar Huellas" : "Nueva Captura Biométrica" }}
          </div>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup />
        </q-bar>

        <q-card-section class="q-pa-none">
          <FingerprintCapture
            :initial-data="selectedRecord"
            @success="onCaptureSuccess"
          />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Diálogo de Confirmación Borrado -->
    <q-dialog v-model="isDeleteDialogVisible" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm">
            ¿Seguro que deseas eliminar el registro biométrico de
            <strong>{{ selectedRecord?.nombre }}</strong
            >?
          </span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            flat
            label="Eliminar"
            color="negative"
            @click="doDelete"
            :loading="deleting"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useQuasar } from "quasar";
import FingerprintCapture from "../../components/fingerprint/FingerprintCapture.vue";
import api from "../../api";
import socket from "../../services/socket";

const $q = useQuasar();

const rows = ref([]);
const loading = ref(false);
const filter = ref("");
const isCaptureDialogVisible = ref(false);
const isDeleteDialogVisible = ref(false);
const selectedRecord = ref(null);
const editingId = ref(null);
const deleting = ref(false);

const pagination = ref({
  sortBy: "fecha_registro",
  descending: true,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const columns = [
  {
    name: "cedula",
    label: "Cédula",
    field: "cedula",
    align: "left",
    sortable: true,
  },
  {
    name: "nombre",
    label: "Nombre",
    field: "nombre",
    align: "left",
    sortable: true,
  },
  { name: "rol", label: "Rol", field: "rol", align: "center" },
  {
    name: "categoria",
    label: "Categoría",
    field: (row) => row.Categoria?.nombre || "N/A",
    align: "left",
  },
  {
    name: "dependencia",
    label: "Dependencia",
    field: (row) => row.Dependencia?.nombre_dependencia || "N/A",
    align: "left",
  },
  {
    name: "fecha_registro",
    label: "Fecha Registro",
    field: (row) => formatDateTime(row.fecha_registro),
    align: "center",
    sortable: true,
  },
  { name: "actions", label: "Acciones", align: "center" },
];

// Función para formatear fechas
const formatDateTime = (isoString) => {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
};

const fetchRecords = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.rowsPerPage,
      search: filter.value,
      sortBy: pagination.value.sortBy,
      descending: pagination.value.descending,
    };
    const { data } = await api.get("/biometria", { params });
    rows.value = data.data;
    pagination.value.rowsNumber = data.pagination.totalItems;
  } catch (error) {
    console.error(error);
    $q.notify({ type: "negative", message: "Error al cargar registros" });
  } finally {
    loading.value = false;
  }
};

const handleRequest = (props) => {
  pagination.value = props.pagination;
  filter.value = props.filter;
  fetchRecords();
};

const openCreateDialog = () => {
  selectedRecord.value = null;
  editingId.value = null;
  isCaptureDialogVisible.value = true;
};

const editBiometry = (record) => {
  selectedRecord.value = { ...record };
  editingId.value = record.id_biometria;
  isCaptureDialogVisible.value = true;
};

const confirmDelete = (record) => {
  selectedRecord.value = record;
  isDeleteDialogVisible.value = true;
};

const doDelete = async () => {
  deleting.value = true;
  try {
    await api.delete(`/biometria/${selectedRecord.value.id_biometria}`);
    $q.notify({ type: "positive", message: "Registro eliminado" });
    fetchRecords();
    isDeleteDialogVisible.value = false;
  } catch (error) {
    console.error(error);
    $q.notify({ type: "negative", message: "Error al eliminar" });
  } finally {
    deleting.value = false;
  }
};

const onCaptureSuccess = () => {
  isCaptureDialogVisible.value = false;
  fetchRecords();
};

onMounted(() => {
  fetchRecords();
  socket.on("biometria:actualizado", () => fetchRecords());
});

onUnmounted(() => {
  socket.off("biometria:actualizado");
});
</script>

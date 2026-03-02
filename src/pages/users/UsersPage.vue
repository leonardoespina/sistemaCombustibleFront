<!-- src/pages/users/UsersPage.vue -->
<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-y-md">
      <h4 class="text-h4 q-my-none">Gestión de Usuarios</h4>

      <q-table
        :rows="rows"
        :columns="columns"
        row-key="id_usuario"
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
            label="Agregar Usuario"
            @click="openAddDialog"
          />
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
            <q-btn
              dense
              round
              flat
              color="negative"
              icon="delete"
              @click="openDeleteDialog(props.row)"
            />
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- Diálogo de Formulario -->
    <UserFormDialog
      :key="editingUser?.id_usuario || 'new'"
      v-model="isFormDialogVisible"
      :initial-data="editingUser"
      :is-editing="!!editingUser"
      @save="onFormSave"
      @dataUpdated="() => userStore.fetchUsers()"
    />

    <!-- Diálogo de Confirmación de Borrado -->
    <q-dialog v-model="isDeleteDialogVisible" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm"
            >¿Seguro que deseas desactivar a
            <strong>{{ editingUser?.nombre }}</strong>
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
import { useUserStore } from "../../stores/userStore";
import { useUserPage } from "./composables/useUserPage.js";
import UserFormDialog from "../../components/users/UserFormDialog.vue";

// --- STORE ---
const userStore = useUserStore();
const { rows, loading, filter, pagination } = storeToRefs(userStore);

// Composable de la página
const {
  isFormDialogVisible,
  isDeleteDialogVisible,
  editingUser,
  openAddDialog,
  openEditDialog,
  openDeleteDialog,
  onFormSave,
  confirmDelete,
  setupSocketListeners,
  cleanupSocketListeners,
} = useUserPage(userStore);

const columns = ref([
  { name: "id_usuario", label: "ID", field: "id_usuario", sortable: true },
  { name: "nombre", label: "Nombre", field: "nombre", sortable: true },
  { name: "apellido", label: "Apellido", field: "apellido", sortable: true },
  { name: "cedula", label: "Cédula", field: "cedula" },
  { name: "tipo_usuario", label: "Rol", field: "tipo_usuario", sortable: true },
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
    name: "subdependencia",
    label: "Subdependencia",
    field: (row) => row.Subdependencia?.nombre || "N/A",
    align: "left",
  },
  { name: "estado", label: "Estado", field: "estado" },
  { name: "actions", label: "Acciones", align: "right", field: "actions" },
]);

function handleRequest(props) {
  pagination.value = props.pagination;
  filter.value = props.filter;
  userStore.fetchUsers();
}

onMounted(() => {
  userStore.fetchUsers();
  setupSocketListeners();
});

onUnmounted(() => {
  userStore.filter = "";
  userStore.pagination = {
    page: 1,
    rowsPerPage: 10,
    sortBy: "id_usuario",
    descending: false,
    rowsNumber: 0,
  };
  cleanupSocketListeners();
});
</script>

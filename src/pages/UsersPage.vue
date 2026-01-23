<!-- src/pages/UsersPage.vue -->
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
            <strong>{{ editingUser?.nombre }}</strong
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
import { ref, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useUserStore } from "../stores/userStore";
import UserFormDialog from "../components/UserFormDialog.vue";

// --- STORE ---
const userStore = useUserStore();
// Hacemos el estado reactivo usando storeToRefs para poder usarlo en el template
const { rows, loading, filter, pagination } = storeToRefs(userStore);

// --- ESTADO LOCAL DEL COMPONENTE (para diálogos) ---
const isFormDialogVisible = ref(false);
const isDeleteDialogVisible = ref(false);
const editingUser = ref(null); // Almacena el usuario que se está editando/eliminando

const columns = ref([
  // ... tu definición de columnas no cambia ...
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

// --- MANEJADORES DE EVENTOS ---
function handleRequest(props) {
  // Actualizamos la paginación y el filtro en el store
  pagination.value = props.pagination;
  filter.value = props.filter;
  // Llamamos a la acción del store
  userStore.fetchUsers();
}

// Abrir diálogos
function openAddDialog() {
  editingUser.value = null; // Modo creación
  isFormDialogVisible.value = true;
}

function openEditDialog(user) {
  editingUser.value = { ...user }; // Modo edición
  isFormDialogVisible.value = true;
}

function openDeleteDialog(user) {
  editingUser.value = user;
  isDeleteDialogVisible.value = true;
}

// Lógica de guardado y borrado
async function onFormSave(formData) {
  let success = false;
  if (editingUser.value) {
    // Editando
    success = await userStore.updateUser(
      editingUser.value.id_usuario,
      formData
    );
  } else {
    // Creando
    success = await userStore.createUser(formData);
  }
  if (success) {
    isFormDialogVisible.value = false;
  }
}

async function confirmDelete() {
  await userStore.deleteUser(editingUser.value.id_usuario);
  isDeleteDialogVisible.value = false;
}

// --- CICLO DE VIDA ---
onMounted(() => {
  // Carga inicial de datos
  userStore.fetchUsers();
});
</script>

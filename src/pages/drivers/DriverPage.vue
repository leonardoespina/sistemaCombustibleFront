<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-y-md">
      <h4 class="text-h4 q-my-none">Gestión de Choferes</h4>

      <q-table
        :rows="rows"
        :columns="columns"
        row-key="id_chofer"
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
            placeholder="Buscar por nombre, cédula..."
            style="width: 300px"
          >
            <template v-slot:append><q-icon name="search" /></template>
          </q-input>
          <q-space />
          <q-btn
            color="primary"
            icon="add"
            label="Agregar Chofer"
            @click="openAddDialog"
          />
        </template>

        <!-- Slot personalizado para el nombre completo -->
        <template v-slot:body-cell-nombre_completo="props">
          <q-td :props="props">
            {{ props.row.nombre }} {{ props.row.apellido }}
          </q-td>
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
    <DriverFormDialog
      v-model="isFormDialogVisible"
      :initial-data="editingItem"
      :is-editing="!!editingItem"
      @save="onFormSave"
    />

    <!-- Diálogo de Confirmación de Borrado -->
    <q-dialog v-model="isDeleteDialogVisible" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm"
            >¿Desactivar al chofer
            <strong
              >{{ editingItem?.nombre }} {{ editingItem?.apellido }}</strong
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
// Rutas relativas
import { useDriverStore } from "../../stores/driverStore.js";
import DriverFormDialog from "../../components/drivers/DriverFormDialog.vue";

const driverStore = useDriverStore();
const { rows, loading, filter, pagination } = storeToRefs(driverStore);

const isFormDialogVisible = ref(false);
const isDeleteDialogVisible = ref(false);
const editingItem = ref(null);

const columns = ref([
  {
    name: "cedula",
    label: "Cédula",
    field: "cedula",
    sortable: true,
    align: "left",
  },
  {
    name: "nombre_completo",
    label: "Nombre Completo",
    field: "nombre",
    sortable: true,
    align: "left",
  },
  {
    name: "estado",
    label: "Estado",
    field: "estado",
    sortable: true,
    align: "center",
  },
  { name: "actions", label: "Acciones", align: "right" },
]);

function handleRequest(props) {
  pagination.value = props.pagination;
  filter.value = props.filter;
  driverStore.fetchDrivers();
}

function openAddDialog() {
  editingItem.value = null;
  isFormDialogVisible.value = true;
}

function openEditDialog(item) {
  editingItem.value = { ...item };
  isFormDialogVisible.value = true;
}

function openDeleteDialog(item) {
  editingItem.value = item;
  isDeleteDialogVisible.value = true;
}

async function onFormSave(formData) {
  let success = false;
  if (editingItem.value) {
    success = await driverStore.updateDriver(
      editingItem.value.id_chofer,
      formData
    );
  } else {
    success = await driverStore.createDriver(formData);
  }
  if (success) {
    isFormDialogVisible.value = false;
  }
}

async function confirmDelete() {
  await driverStore.deleteDriver(editingItem.value.id_chofer);
  isDeleteDialogVisible.value = false;
}

onMounted(() => {
  driverStore.fetchDrivers();
});

onUnmounted(() => {
  driverStore.filter = "";
  driverStore.pagination = {
    page: 1,
    rowsPerPage: 10,
    sortBy: "id_chofer",
    descending: false,
    rowsNumber: 0,
  };
});
</script>

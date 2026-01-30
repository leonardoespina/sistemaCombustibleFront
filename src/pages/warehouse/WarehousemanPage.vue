<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-y-md">
      <h4 class="text-h4 q-my-none">Gestión de Almacenistas</h4>

      <q-table
        :rows="rows"
        :columns="columns"
        row-key="id_almacenista"
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
            label="Agregar Almacenista"
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
    <WarehousemanFormDialog
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
            >¿Desactivar a
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
import { ref, onMounted } from "vue";
import { storeToRefs } from "pinia";
// Rutas relativas solicitadas
import { useWarehousemanStore } from "../../stores/warehousemanStore.js";
import WarehousemanFormDialog from "../../components/warehouse/WarehousemanFormDialog.vue";

const warehousemanStore = useWarehousemanStore();
const { rows, loading, filter, pagination } = storeToRefs(warehousemanStore);

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
  // Creamos una columna virtual para mostrar nombre + apellido
  {
    name: "nombre_completo",
    label: "Nombre Completo",
    field: "nombre",
    sortable: true,
    align: "left",
  },
  {
    name: "cargo",
    label: "Cargo",
    field: "cargo",
    sortable: true,
    align: "left",
  },
  { name: "telefono", label: "Teléfono", field: "telefono", align: "left" },
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
  warehousemanStore.fetchWarehousemen();
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
    success = await warehousemanStore.updateWarehouseman(
      editingItem.value.id_almacenista,
      formData
    );
  } else {
    success = await warehousemanStore.createWarehouseman(formData);
  }
  if (success) {
    isFormDialogVisible.value = false;
  }
}

async function confirmDelete() {
  await warehousemanStore.deleteWarehouseman(editingItem.value.id_almacenista);
  isDeleteDialogVisible.value = false;
}

onMounted(() => {
  warehousemanStore.fetchWarehousemen();
});
</script>

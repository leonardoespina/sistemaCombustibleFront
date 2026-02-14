<!-- src/pages/dependencias/DependenciasPage.vue -->
<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-y-md">
      <h4 class="text-h4 q-my-none">Gestión de Dependencias</h4>

      <q-table
        :rows="rows"
        :columns="columns"
        row-key="id_dependencia"
        :loading="loading"
        v-model:pagination="pagination"
        v-model:filter="filter"
        @request="handleRequest"
        binary-state-sort
      >
        <template v-slot:top>
          <q-input
            dense
            debounce="500"
            v-model="filter"
            placeholder="Buscar..."
            style="width: 350px"
          >
            <template v-slot:append><q-icon name="search" /></template>
          </q-input>
          <q-space />
          <q-btn
            color="primary"
            icon="add"
            label="Agregar Dependencia"
            @click="openAddDialog"
          />
        </template>

        <template v-slot:body-cell-categoria="props">
          <q-td :props="props">
            {{ props.row.Categoria?.nombre || "N/A" }}
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

    <DependenciaFormDialog
      v-model="isFormDialogVisible"
      :initial-data="editingItem"
      :is-editing="!!editingItem"
      @save="onFormSave"
      @dataUpdated="() => dependenciaStore.fetchDependencias()"
    />

    <q-dialog v-model="isDeleteDialogVisible" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm"
            >¿Seguro que deseas desactivar la dependencia
            <strong>{{ editingItem?.nombre_dependencia }}</strong>
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
import { useDependenciaStore } from "../../stores/dependenciaStore.js";
import { useDependenciaPage } from "./composables/useDependenciaPage.js";
import DependenciaFormDialog from "../../components/dependencias/DependenciaFormDialog.vue";

const dependenciaStore = useDependenciaStore();
const { rows, loading, filter, pagination } = storeToRefs(dependenciaStore);

// Composable de la página
const {
  isFormDialogVisible,
  isDeleteDialogVisible,
  editingItem,
  openAddDialog,
  openEditDialog,
  openDeleteDialog,
  onFormSave,
  confirmDelete,
  setupSocketListeners,
  cleanupSocketListeners,
} = useDependenciaPage(dependenciaStore);

const columns = ref([
  {
    name: "categoria",
    label: "Categoría",
    field: (row) => row.Categoria?.nombre,
    align: "left",
  },
  {
    name: "nombre_dependencia",
    label: "Dependencia",
    field: "nombre_dependencia",
    sortable: true,
    align: "left",
  },
  {
    name: "codigo",
    label: "Código",
    field: "codigo",
    align: "left",
  },
  {
    name: "tipo_venta",
    label: "Tipo Solicitud",
    field: "tipo_venta",
    sortable: true,
    align: "center",
  },
  {
    name: "estatus",
    label: "Estatus",
    field: "estatus",
    sortable: true,
    align: "center",
  },
  { name: "actions", label: "Acciones", align: "right" },
]);

function handleRequest(props) {
  pagination.value = props.pagination;
  filter.value = props.filter;
  dependenciaStore.fetchDependencias();
}

onMounted(() => {
  dependenciaStore.fetchDependencias();
  setupSocketListeners();
});

onUnmounted(() => {
  dependenciaStore.filter = "";
  dependenciaStore.pagination = {
    page: 1,
    rowsPerPage: 10,
    sortBy: "id_dependencia",
    descending: false,
    rowsNumber: 0,
  };
  cleanupSocketListeners();
});
</script>

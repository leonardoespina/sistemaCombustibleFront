<!-- src/pages/categoria/CategoriaPage.vue -->
<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-y-md">
      <h4 class="text-h4 q-my-none">Gestión de Categorías</h4>

      <q-table
        :rows="rows"
        :columns="columns"
        row-key="id_categoria"
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
            placeholder="Buscar por categoría..."
            style="width: 350px"
          >
            <template v-slot:append><q-icon name="search" /></template>
          </q-input>
          <q-space />
          <q-btn
            color="primary"
            icon="add"
            label="Agregar Categoría"
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

    <CategoriaFormDialog
      v-model="isFormDialogVisible"
      :initial-data="editingItem"
      :is-editing="!!editingItem"
      @save="onFormSave"
      @dataUpdated="() => categoriaStore.fetchCategorias()"
    />

    <q-dialog v-model="isDeleteDialogVisible" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm"
            >¿Seguro que deseas desactivar la categoría
            <strong>{{ editingItem?.nombre }}</strong>
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
import { useCategoriaStore } from "../../stores/categoriaStore.js";
import { useCategoriaPage } from "./composables/useCategoriaPage.js";
import CategoriaFormDialog from "../../components/categoria/CategoriaFormDialog.vue";

const categoriaStore = useCategoriaStore();
const { rows, loading, filter, pagination } = storeToRefs(categoriaStore);

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
} = useCategoriaPage(categoriaStore);

const columns = ref([
  {
    name: "nombre",
    label: "Categoría",
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
  categoriaStore.fetchCategorias();
}

onMounted(() => {
  categoriaStore.fetchCategorias();
  setupSocketListeners();
});

onUnmounted(() => {
  categoriaStore.filter = "";
  categoriaStore.pagination = {
    page: 1,
    rowsPerPage: 10,
    sortBy: "id_categoria",
    descending: false,
    rowsNumber: 0,
  };
  cleanupSocketListeners();
});
</script>

<!-- src/pages/subdependencias/SubdependenciasPage.vue -->
<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-y-md">
      <h4 class="text-h4 q-my-none">Gestión de Subdependencias</h4>

      <q-table
        :rows="rows"
        :columns="columns"
        row-key="id_subdependencia"
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
            style="width: 350px"
          >
            <template v-slot:append><q-icon name="search" /></template>
          </q-input>
          <q-space />
          <q-btn
            color="primary"
            icon="add"
            label="Agregar Subdependencia"
            @click="openAddDialog"
          />
        </template>

        <template v-slot:body-cell-dependencia="props">
          <q-td :props="props">
            {{ props.row.Dependencia?.nombre_dependencia || "N/A" }}
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

    <SubdependenciaFormDialog
      v-model="isFormDialogVisible"
      :initial-data="editingItem"
      :is-editing="!!editingItem"
      @save="onFormSave"
    />

    <q-dialog v-model="isDeleteDialogVisible" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm"
            >¿Seguro que deseas desactivar la subdependencia
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
import { useSubdependenciaStore } from "../../stores/subdependenciaStore.js";
import { useSubdependenciaPage } from "./composables/useSubdependenciaPage.js";
import SubdependenciaFormDialog from "../../components/subdependencias/SubdependenciaFormDialog.vue";

const subdependenciaStore = useSubdependenciaStore();
const { rows, loading, filter, pagination } = storeToRefs(subdependenciaStore);

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
} = useSubdependenciaPage(subdependenciaStore);

const columns = ref([
  {
    name: "dependencia",
    label: "Dependencia",
    field: (row) => row.Dependencia?.nombre_dependencia,
    align: "left",
  },

  {
    name: "nombre",
    label: "Nombre",
    field: "nombre",
    sortable: true,
    align: "left",
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
  subdependenciaStore.fetchSubdependencias();
}

onMounted(() => {
  subdependenciaStore.fetchSubdependencias();
  setupSocketListeners();
});

onUnmounted(() => {
  subdependenciaStore.filter = "";
  subdependenciaStore.pagination = {
    page: 1,
    rowsPerPage: 10,
    sortBy: "id_subdependencia",
    descending: false,
    rowsNumber: 0,
  };
  cleanupSocketListeners();
});
</script>

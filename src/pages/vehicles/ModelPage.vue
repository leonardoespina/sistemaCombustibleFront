<!-- src/pages/vehicles/ModelPage.vue -->
<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-y-md">
      <h4 class="text-h4 q-my-none">Gestión de Modelos</h4>

      <q-table
        :rows="rows"
        :columns="columns"
        row-key="id_modelo"
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
            placeholder="Buscar modelo..."
            style="width: 300px"
          >
            <template v-slot:append><q-icon name="search" /></template>
          </q-input>
          <q-space />
          <q-btn
            color="primary"
            icon="add"
            label="Agregar Modelo"
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
    <ModelFormDialog
      v-model="isFormDialogVisible"
      :initial-data="editingModel"
      :is-editing="!!editingModel"
      :brands="allBrands"
      @save="onFormSave"
    />

    <!-- Diálogo de Confirmación de Borrado -->
    <q-dialog v-model="isDeleteDialogVisible" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm"
            >¿Seguro que deseas desactivar el modelo
            <strong>{{ editingModel?.nombre_modelo }}</strong
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
import { useModelStore } from "../../stores/modelStore";
import ModelFormDialog from "../../components/vehicles/ModelFormDialog.vue";

const modelStore = useModelStore();
const { rows, loading, filter, pagination, allBrands } =
  storeToRefs(modelStore);

const isFormDialogVisible = ref(false);
const isDeleteDialogVisible = ref(false);
const editingModel = ref(null);

const columns = ref([
  { name: "id_modelo", label: "ID", field: "id_modelo", sortable: true },
  {
    name: "nombre",
    label: "Modelo",
    field: "nombre",
    sortable: true,
    align: "left",
  },
  // Usamos una función para acceder al nombre de la marca anidado de forma segura
  {
    name: "marca",
    label: "Marca",
    field: (row) => row.Marca?.nombre,
    sortable: false,
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
  modelStore.fetchModels();
}

function openAddDialog() {
  editingModel.value = null;
  isFormDialogVisible.value = true;
}

function openEditDialog(model) {
  editingModel.value = { ...model };
  isFormDialogVisible.value = true;
}

function openDeleteDialog(model) {
  editingModel.value = model;
  isDeleteDialogVisible.value = true;
}

async function onFormSave(formData) {
  let success = false;
  if (editingModel.value) {
    success = await modelStore.updateModel(
      editingModel.value.id_modelo,
      formData
    );
  } else {
    success = await modelStore.createModel(formData);
  }
  if (success) {
    isFormDialogVisible.value = false;
  }
}

async function confirmDelete() {
  await modelStore.deleteModel(editingModel.value.id_modelo);
  isDeleteDialogVisible.value = false;
}

onMounted(() => {
  // Cargamos tanto los modelos para la tabla como las marcas para el formulario
  modelStore.fetchModels();
  modelStore.fetchAllBrands();
});

onUnmounted(() => {
  modelStore.filter = "";
  modelStore.pagination = {
    page: 1,
    rowsPerPage: 10,
    sortBy: "id_modelo",
    descending: false,
    rowsNumber: 0,
  };
});
</script>

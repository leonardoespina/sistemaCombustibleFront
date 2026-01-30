<!-- src/pages/dispensers/DispenserPage.vue -->
<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-y-md">
      <h4 class="text-h4 q-my-none">Gestión de Dispensadores</h4>

      <q-table
        :rows="rows"
        :columns="columns"
        row-key="id_dispensador"
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
            placeholder="Buscar dispensador..."
            style="width: 300px"
          >
            <template v-slot:append><q-icon name="search" /></template>
          </q-input>
          <q-space />
          <q-btn
            color="primary"
            icon="add"
            label="Nuevo Dispensador"
            @click="openAddDialog"
          />
        </template>

        <template v-slot:body-cell-estado="props">
          <q-td :props="props">
            <q-chip
              :color="getStatusColor(props.row.estado)"
              text-color="white"
              dense
            >
              {{ props.row.estado }}
            </q-chip>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props" class="q-gutter-x-sm">
            <q-btn
              dense
              round
              flat
              icon="edit"
              color="primary"
              @click="openEditDialog(props.row)"
            >
              <q-tooltip>Editar</q-tooltip>
            </q-btn>
            <q-btn
              dense
              round
              flat
              color="negative"
              icon="delete"
              @click="openDeleteDialog(props.row)"
            >
              <q-tooltip>Desactivar</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- Diálogo de Formulario -->
    <DispenserFormDialog
      v-model="isFormDialogVisible"
      :initial-data="editingDispenser"
      :is-editing="!!editingDispenser"
      @save="onFormSave"
    />

    <!-- Diálogo de Confirmación de Borrado -->
    <q-dialog v-model="isDeleteDialogVisible" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm"
            >¿Seguro que deseas desactivar el dispensador
            <strong>{{ editingDispenser?.codigo }}</strong
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
import { useDispenserStore } from "../../stores/dispenserStore";
import DispenserFormDialog from "../../components/dispensers/DispenserFormDialog.vue";

const dispenserStore = useDispenserStore();
const { rows, loading, filter, pagination } = storeToRefs(dispenserStore);

const isFormDialogVisible = ref(false);
const isDeleteDialogVisible = ref(false);
const editingDispenser = ref(null);

const columns = [
  { name: "id_dispensador", label: "ID", field: "id_dispensador", sortable: true, align: "left" },
  { name: "codigo", label: "Código", field: "codigo", sortable: true, align: "left" },
  { name: "nombre", label: "Nombre", field: "nombre", sortable: true, align: "left" },
  {
    name: "tanque",
    label: "Tanque Asociado",
    field: (row) => row.Tanque?.nombre || "N/A",
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
];

function handleRequest(props) {
  pagination.value = props.pagination;
  filter.value = props.filter;
  dispenserStore.fetchDispensers();
}

function openAddDialog() {
  editingDispenser.value = null;
  isFormDialogVisible.value = true;
}

function openEditDialog(item) {
  editingDispenser.value = { ...item };
  isFormDialogVisible.value = true;
}

function openDeleteDialog(item) {
  editingDispenser.value = item;
  isDeleteDialogVisible.value = true;
}

async function onFormSave(formData) {
  let success = false;
  if (editingDispenser.value) {
    success = await dispenserStore.updateDispenser(
      editingDispenser.value.id_dispensador,
      formData
    );
  } else {
    success = await dispenserStore.createDispenser(formData);
  }
  if (success) {
    isFormDialogVisible.value = false;
  }
}

async function confirmDelete() {
  await dispenserStore.deleteDispenser(editingDispenser.value.id_dispensador);
  isDeleteDialogVisible.value = false;
}

function getStatusColor(status) {
  switch (status) {
    case "ACTIVO": return "positive";
    case "INACTIVO": return "grey";
    case "MANTENIMIENTO": return "orange";
    default: return "blue";
  }
}

onMounted(() => {
  dispenserStore.initSocket();
  dispenserStore.fetchDispensers();
});

onUnmounted(() => {
  dispenserStore.cleanupSocket();
});
</script>

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
            placeholder="Buscar..."
            style="width: 300px"
          >
            <template v-slot:append><q-icon name="search" /></template>
          </q-input>
          <q-space />
          <q-btn
            color="primary"
            icon="add"
            label="Agregar Dispensador"
            @click="openAddDialog"
          />
        </template>

        <!-- Columna personalizada para Odómetro -->
        <template v-slot:body-cell-odometro="props">
          <q-td :props="props">
            <div
              class="text-weight-bold font-mono bg-grey-2 q-px-sm rounded-borders inline-block"
            >
              {{ props.value }}
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
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
               <q-tooltip>Eliminar</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- Diálogo de Formulario -->
    <DispenserFormDialog
      v-model="isFormDialogVisible"
      :initial-data="editingItem"
      :is-editing="!!editingItem"
      :tanks-list="tanksList"
      @save="onFormSave"
    />

    <!-- Diálogo de Confirmación de Borrado -->
    <q-dialog v-model="isDeleteDialogVisible" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm"
            >¿Desactivar el dispensador
            <strong>{{ editingItem?.nombre }}</strong
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
import { useDispenserStore } from "../../stores/dispenserStore.js";
import DispenserFormDialog from "../../components/dispensers/DispenserFormDialog.vue";

const dispenserStore = useDispenserStore();
const { rows, loading, filter, pagination, tanksList } =
  storeToRefs(dispenserStore);

const isFormDialogVisible = ref(false);
const isDeleteDialogVisible = ref(false);
const editingItem = ref(null);

const columns = ref([
  {
    name: "nombre",
    label: "Nombre",
    field: "nombre",
    sortable: true,
    align: "left",
  },
  {
    name: "tanque",
    label: "Tanque Asociado",
    // Usamos optional chaining para acceder al nombre del tanque y su combustible
    field: (row) =>
      row.TanqueAsociado
        ? `${row.TanqueAsociado.nombre} (${row.TanqueAsociado.tipo_combustible})`
        : "N/A",
    align: "left",
  },
  {
    name: "odometro",
    label: "Odómetro Actual",
    field: "odometro_actual",
    sortable: true,
    align: "right",
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
  dispenserStore.fetchDispensers();
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
    success = await dispenserStore.updateDispenser(
      editingItem.value.id_dispensador,
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
  await dispenserStore.deleteDispenser(editingItem.value.id_dispensador);
  isDeleteDialogVisible.value = false;
}

onMounted(() => {
  dispenserStore.fetchDispensers();
  dispenserStore.loadTanks(); // Cargar lista de tanques para el formulario
});
</script>

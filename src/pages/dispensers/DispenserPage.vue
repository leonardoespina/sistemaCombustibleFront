<<<<<<< HEAD
<!-- src/pages/dispensers/DispenserPage.vue -->
=======
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
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
<<<<<<< HEAD
            placeholder="Buscar dispensador..."
=======
            placeholder="Buscar..."
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
            style="width: 300px"
          >
            <template v-slot:append><q-icon name="search" /></template>
          </q-input>
          <q-space />
          <q-btn
            color="primary"
            icon="add"
<<<<<<< HEAD
            label="Nuevo Dispensador"
=======
            label="Agregar Dispensador"
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
            @click="openAddDialog"
          />
        </template>

<<<<<<< HEAD
        <template v-slot:body-cell-estado="props">
          <q-td :props="props">
            <q-chip
              :color="getStatusColor(props.row.estado)"
              text-color="white"
              dense
            >
              {{ props.row.estado }}
            </q-chip>
=======
        <!-- Columna personalizada para Odómetro -->
        <template v-slot:body-cell-odometro="props">
          <q-td :props="props">
            <div
              class="text-weight-bold font-mono bg-grey-2 q-px-sm rounded-borders inline-block"
            >
              {{ props.value }}
            </div>
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
<<<<<<< HEAD
          <q-td :props="props" class="q-gutter-x-sm">
=======
          <q-td :props="props">
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
            <q-btn
              dense
              round
              flat
              icon="edit"
<<<<<<< HEAD
              color="primary"
              @click="openEditDialog(props.row)"
            >
              <q-tooltip>Editar</q-tooltip>
            </q-btn>
=======
              @click="openEditDialog(props.row)"
            />
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
            <q-btn
              dense
              round
              flat
              color="negative"
              icon="delete"
              @click="openDeleteDialog(props.row)"
<<<<<<< HEAD
            >
              <q-tooltip>Desactivar</q-tooltip>
            </q-btn>
=======
            />
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- Diálogo de Formulario -->
    <DispenserFormDialog
      v-model="isFormDialogVisible"
<<<<<<< HEAD
      :initial-data="editingDispenser"
      :is-editing="!!editingDispenser"
=======
      :initial-data="editingItem"
      :is-editing="!!editingItem"
      :tanks-list="tanksList"
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
      @save="onFormSave"
    />

    <!-- Diálogo de Confirmación de Borrado -->
    <q-dialog v-model="isDeleteDialogVisible" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm"
<<<<<<< HEAD
            >¿Seguro que deseas desactivar el dispensador
            <strong>{{ editingDispenser?.codigo }}</strong
=======
            >¿Desactivar el dispensador
            <strong>{{ editingItem?.nombre }}</strong
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
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
<<<<<<< HEAD
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
=======
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
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
    name: "estado",
    label: "Estado",
    field: "estado",
    sortable: true,
    align: "center",
  },
  { name: "actions", label: "Acciones", align: "right" },
<<<<<<< HEAD
];
=======
]);
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d

function handleRequest(props) {
  pagination.value = props.pagination;
  filter.value = props.filter;
  dispenserStore.fetchDispensers();
}

function openAddDialog() {
<<<<<<< HEAD
  editingDispenser.value = null;
=======
  editingItem.value = null;
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
  isFormDialogVisible.value = true;
}

function openEditDialog(item) {
<<<<<<< HEAD
  editingDispenser.value = { ...item };
=======
  editingItem.value = { ...item };
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
  isFormDialogVisible.value = true;
}

function openDeleteDialog(item) {
<<<<<<< HEAD
  editingDispenser.value = item;
=======
  editingItem.value = item;
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
  isDeleteDialogVisible.value = true;
}

async function onFormSave(formData) {
  let success = false;
<<<<<<< HEAD
  if (editingDispenser.value) {
    success = await dispenserStore.updateDispenser(
      editingDispenser.value.id_dispensador,
=======
  if (editingItem.value) {
    success = await dispenserStore.updateDispenser(
      editingItem.value.id_dispensador,
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
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
<<<<<<< HEAD
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
=======
  await dispenserStore.deleteDispenser(editingItem.value.id_dispensador);
  isDeleteDialogVisible.value = false;
}

onMounted(() => {
  dispenserStore.fetchDispensers();
  dispenserStore.loadTanks(); // Cargar lista de tanques para el formulario
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
});
</script>

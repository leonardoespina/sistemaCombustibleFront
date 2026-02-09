<template>
  <q-page class="q-pa-md">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
      <h4 class="text-h4 q-my-none">Tipos de Combustible</h4>
      <q-btn
        color="primary"
        icon="add"
        label="Nuevo Tipo"
        @click="openCreateDialog"
      />
    </div>

    <!-- Table -->
    <q-table
      :rows="rows"
      :columns="columns"
      row-key="id_tipo_combustible"
      :loading="loading"
      v-model:pagination="pagination"
      v-model:filter="filter"
      @request="onRequest"
      binary-state-sort
    >
      <template v-slot:top-left>
        <q-input
          borderless
          dense
          debounce="300"
          v-model="filter"
          placeholder="Buscar..."
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>

      <template v-slot:body-cell-activo="props">
        <q-td :props="props">
          <q-chip
            :color="props.row.activo ? 'positive' : 'negative'"
            text-color="white"
            dense
          >
            {{ props.row.activo ? "Activo" : "Inactivo" }}
          </q-chip>
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props" class="q-gutter-sm">
          <q-btn
            dense
            round
            flat
            color="primary"
            icon="edit"
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
            @click="confirmDelete(props.row)"
          >
            <q-tooltip>Eliminar</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Dialog -->
    <TipoCombustibleFormDialog
      v-model="showDialog"
      :initial-data="selectedItem"
    />
  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useQuasar } from "quasar";
import { useTipoCombustibleStore } from "../../stores/tipoCombustibleStore";
import TipoCombustibleFormDialog from "../../components/combustibles/TipoCombustibleFormDialog.vue";

const $q = useQuasar();
const store = useTipoCombustibleStore();

const rows = computed(() => store.rows);
const loading = computed(() => store.loading);
const filter = computed({
  get: () => store.filter,
  set: (val) => (store.filter = val),
});
const pagination = computed({
  get: () => store.pagination,
  set: (val) => (store.pagination = val),
});

const showDialog = ref(false);
const selectedItem = ref(null);

const columns = [
  {
    name: "id_tipo_combustible",
    label: "ID",
    field: "id_tipo_combustible",
    sortable: true,
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
    name: "descripcion",
    label: "Descripción",
    field: "descripcion",
    sortable: true,
    align: "left",
  },
  {
    name: "activo",
    label: "Estado",
    field: "activo",
    sortable: true,
    align: "center",
  },
  { name: "actions", label: "Acciones", align: "center" },
];

const onRequest = (props) => {
  store.pagination = props.pagination;
  store.filter = props.filter;
  store.fetchTiposCombustible();
};

const openCreateDialog = () => {
  selectedItem.value = null;
  showDialog.value = true;
};

const openEditDialog = (row) => {
  selectedItem.value = row;
  showDialog.value = true;
};

const confirmDelete = (row) => {
  $q.dialog({
    title: "Confirmar eliminación",
    message: `¿Estás seguro de eliminar el tipo de combustible "${row.nombre}"?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    store.deleteTipoCombustible(row.id_tipo_combustible);
  });
};

onMounted(() => {
  store.fetchTiposCombustible();
  store.initSocket();
});

onUnmounted(() => {
  store.cleanupSocket();
  store.filter = "";
  store.pagination = {
    page: 1,
    rowsPerPage: 10,
    sortBy: "id_tipo_combustible",
    descending: false,
    rowsNumber: 0,
  };
});
</script>

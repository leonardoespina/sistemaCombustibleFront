<template>
  <q-page class="q-pa-md">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
      <h4 class="text-h4 q-my-none">Gestión de Llenaderos</h4>
      <q-btn
        color="primary"
        icon="add"
        label="Nuevo Llenadero"
        @click="openCreateDialog"
      />
    </div>

    <!-- Table -->
    <q-table
      :rows="rows"
      :columns="columns"
      row-key="id_llenadero"
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
          placeholder="Buscar llenadero..."
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>

      <template v-slot:body-cell-estado="props">
        <q-td :props="props">
          <q-chip
            :color="props.row.estado === 'ACTIVO' ? 'positive' : 'negative'"
            text-color="white"
            dense
          >
            {{ props.row.estado }}
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
            <q-tooltip>Desactivar</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Dialog -->
    <LlenaderoFormDialog
      v-model="showDialog"
      :initial-data="selectedItem"
    />
  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useQuasar } from "quasar";
import { useLlenaderoStore } from "../../stores/llenaderoStore";
import LlenaderoFormDialog from "../../components/llenaderos/LlenaderoFormDialog.vue";

const $q = useQuasar();
const store = useLlenaderoStore();

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
    name: "id_llenadero",
    label: "ID",
    field: "id_llenadero",
    sortable: true,
    align: "left",
  },
  {
    name: "nombre_llenadero",
    label: "Nombre del Llenadero",
    field: "nombre_llenadero",
    sortable: true,
    align: "left",
  },
  {
<<<<<<< HEAD
    name: "capacidad",
    label: "Capacidad (litros)",
    field: "capacidad",
    sortable: true,
    align: "right",
    format: (val) => val ? `${val} L` : 'No especificado'
  },
  {
    name: "disponibilidadActual",
    label: "Disponibilidad Actual (litros)",
    field: "disponibilidadActual",
    sortable: true,
    align: "right",
    format: (val) => val ? `${val} L` : 'No especificado'
  },
  {
    name: "tipo_combustible",
    label: "Tipo de Combustible",
    field: (row) => row.TipoCombustible?.nombre || 'No especificado',
    sortable: true,
    align: "left",
  },
  {
=======
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
    name: "estado",
    label: "Estado",
    field: "estado",
    sortable: true,
    align: "center",
  },
  { name: "actions", label: "Acciones", align: "center" },
];

const onRequest = (props) => {
  store.pagination = props.pagination;
  store.filter = props.filter;
  store.fetchLlenaderos();
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
    title: "Confirmar acción",
    message: `¿Estás seguro de desactivar el llenadero "${row.nombre_llenadero}"?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    store.deleteLlenadero(row.id_llenadero);
  });
};

onMounted(() => {
  store.fetchLlenaderos();
  store.initSocket();
});

onUnmounted(() => {
  store.cleanupSocket();
});
</script>

<!-- src/pages/tanks/TankPage.vue -->
<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-y-md">
      <h4 class="text-h4 q-my-none">Gestión de Tanques</h4>

      <q-table
        :rows="rows"
        :columns="columns"
        row-key="id_tanque"
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
            placeholder="Buscar por código, nombre..."
            style="width: 300px"
          >
            <template v-slot:append><q-icon name="search" /></template>
          </q-input>
          <q-space />
          <q-btn
            color="primary"
            icon="add"
            label="Agregar Tanque"
            @click="openAddDialog"
          />
        </template>

        <!-- Personalización de columnas -->
        <template v-slot:body-cell-tipo_combustible="props">
          <q-td :props="props">
            <q-badge :color="props.value === 'GASOLINA' ? 'orange' : 'black'">
              {{ props.value }}
            </q-badge>
          </q-td>
        </template>

        <template v-slot:body-cell-nivel="props">
          <q-td :props="props">
            <!-- Barra de progreso visual para el nivel -->
            <div class="row items-center no-wrap">
              <q-linear-progress
                rounded
                size="15px"
                :value="props.row.nivel_actual / props.row.capacidad_maxima"
                :color="getNivelColor(props.row)"
                class="q-mr-sm"
                style="width: 100px"
              />
              <div>
                {{ props.row.nivel_actual }} /
                {{ props.row.capacidad_maxima }} L
              </div>
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

    <!-- Diálogos -->
    <TankFormDialog
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
            >¿Desactivar el tanque <strong>{{ editingItem?.codigo }}</strong
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
import { useTankStore } from "../../stores/tankStore.js";
import TankFormDialog from "../../components/tanks/TankFormDialog.vue";

const tankStore = useTankStore();
const { rows, loading, filter, pagination } = storeToRefs(tankStore);

const isFormDialogVisible = ref(false);
const isDeleteDialogVisible = ref(false);
const editingItem = ref(null);

const columns = ref([
  {
    name: "codigo",
    label: "Código",
    field: "codigo",
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
  { name: "ubicacion", label: "Ubicación", field: "ubicacion", align: "left" },
  {
    name: "tipo_combustible",
    label: "Combustible",
    field: "tipo_combustible",
    sortable: true,
    align: "center",
  },
  // Columna personalizada para mostrar la barra de nivel
  {
    name: "nivel",
    label: "Nivel Actual",
    field: "nivel_actual",
    align: "center",
  },
  { name: "unidad", label: "Unidad", field: "unidad_medida", align: "center" },
  {
    name: "estado",
    label: "Estado",
    field: "estado",
    sortable: true,
    align: "center",
  },
  {
    name: "jerarquia",
    label: "Tipo",
    field: "tipo_jerarquia",
    sortable: true,
    align: "center",
  },
  { name: "actions", label: "Acciones", align: "right" },
]);

// Función para colorear la barra de nivel (rojo si está bajo alarma)
function getNivelColor(row) {
  if (row.nivel_actual <= row.nivel_alarma) return "negative"; // Rojo
  if (row.tipo_combustible === "GASOLINA") return "orange";
  return "grey-9"; // Negro para Gasoil
}

function handleRequest(props) {
  pagination.value = props.pagination;
  filter.value = props.filter;
  tankStore.fetchTanks();
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
    success = await tankStore.updateTank(editingItem.value.id_tanque, formData);
  } else {
    success = await tankStore.createTank(formData);
  }
  if (success) {
    isFormDialogVisible.value = false;
  }
}

async function confirmDelete() {
  await tankStore.deleteTank(editingItem.value.id_tanque);
  isDeleteDialogVisible.value = false;
}

onMounted(() => {
  tankStore.fetchTanks();
});
</script>

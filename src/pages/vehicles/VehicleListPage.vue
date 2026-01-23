<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-y-md">
      <h4 class="text-h4 q-my-none">Gestión de Vehículos y Equipos</h4>

      <q-table
        :rows="rows"
        :columns="columns"
        row-key="id_vehiculo"
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
            placeholder="Buscar por placa, marca, combustible..."
            style="width: 300px"
          >
            <template v-slot:append><q-icon name="search" /></template>
          </q-input>
          <q-space />
          <q-btn
            color="primary"
            icon="add"
            label="Nuevo Registro"
            @click="openAddDialog"
          />
        </template>

        <!-- COLUMNA PERSONALIZADA: PLACA/CÓDIGO -->
        <template v-slot:body-cell-placa="props">
          <q-td :props="props">
            <div class="row items-center no-wrap">
              <q-icon
                :name="props.row.es_generador ? 'bolt' : 'directions_car'"
                :color="props.row.es_generador ? 'orange-8' : 'primary'"
                size="sm"
                class="q-mr-sm"
              >
                <q-tooltip>{{
                  props.row.es_generador
                    ? "Generador / Planta"
                    : "Vehículo Flota"
                }}</q-tooltip>
              </q-icon>
              <span class="text-weight-medium">{{ props.row.placa }}</span>
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

    <!-- Diálogo de Formulario -->
    <VehicleFormDialog
      v-model="isFormDialogVisible"
      :initial-data="editingVehicle"
      :is-editing="!!editingVehicle"
      :brands="allBrands"
      :models="modelsForSelectedBrand"
      :managements="allManagements"
      :loading-models="loadingModels"
      @save="onFormSave"
      @brand-changed="handleBrandChange"
    />

    <!-- Diálogo de Confirmación de Borrado -->
    <q-dialog v-model="isDeleteDialogVisible" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm"
            >¿Seguro que deseas desactivar el registro
            <strong>{{ editingVehicle?.placa }}</strong
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
import { useVehicleStore } from "../../stores/vehicleStore.js";
import VehicleFormDialog from "../../components/vehicles/VehicleFormDialog.vue";

const vehicleStore = useVehicleStore();
const {
  rows,
  loading,
  filter,
  pagination,
  allBrands,
  modelsForSelectedBrand,
  loadingModels,
  allManagements,
} = storeToRefs(vehicleStore);

const isFormDialogVisible = ref(false);
const isDeleteDialogVisible = ref(false);
const editingVehicle = ref(null);

const columns = ref([
  { name: "id_vehiculo", label: "ID", field: "id_vehiculo", sortable: true },
  {
    name: "placa",
    label: "Placa / Código",
    field: "placa",
    sortable: true,
    align: "left",
  },
  {
    name: "marca",
    label: "Marca",
    field: (row) => row.Marca?.nombre,
    sortable: true,
  },
  {
    name: "modelo",
    label: "Modelo",
    field: (row) => row.Modelo?.nombre,
    sortable: false,
  },
  {
    name: "gerencia",
    label: "Gerencia",
    field: (row) => row.Gerencium?.nombre || "N/A",
    sortable: false,
    align: "center",
  },
  { name: "anio", label: "Año", field: "anio", sortable: true },
  { name: "estado", label: "Estado", field: "estado" },
  { name: "actions", label: "Acciones", align: "right" },
]);

function handleRequest(props) {
  pagination.value = props.pagination;
  filter.value = props.filter;
  vehicleStore.fetchVehicles();
}

function openAddDialog() {
  editingVehicle.value = null;
  isFormDialogVisible.value = true;
}

function openEditDialog(vehicle) {
  editingVehicle.value = { ...vehicle };
  isFormDialogVisible.value = true;
}

function openDeleteDialog(vehicle) {
  editingVehicle.value = vehicle;
  isDeleteDialogVisible.value = true;
}

async function onFormSave(formData) {
  let success = false;
  if (editingVehicle.value) {
    success = await vehicleStore.updateVehicle(
      editingVehicle.value.id_vehiculo,
      formData
    );
  } else {
    success = await vehicleStore.createVehicle(formData);
  }
  if (success) {
    isFormDialogVisible.value = false;
  }
}

async function confirmDelete() {
  await vehicleStore.deleteVehicle(editingVehicle.value.id_vehiculo);
  isDeleteDialogVisible.value = false;
}

function handleBrandChange(brandId) {
  vehicleStore.fetchModelsByBrand(brandId);
}

onMounted(() => {
  vehicleStore.fetchVehicles();
  vehicleStore.fetchAllBrands();
  vehicleStore.fetchAllManagements();
});
</script>

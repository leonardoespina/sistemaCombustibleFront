<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-y-md">
      <h4 class="text-h4 q-my-none">Mediciones de Tanque (Varillaje)</h4>

      <q-table
        :rows="rows"
        :columns="columns"
        row-key="id_medicion"
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
            label="Nueva Medición"
            @click="openAddDialog"
          />
        </template>

        <template v-slot:body-cell-estado="props">
          <q-td :props="props">
            <q-badge :color="props.value === 'PROCESADO' ? 'green' : 'red'">{{
              props.value
            }}</q-badge>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <!-- Botón Anular -->
            <q-btn
              dense
              round
              flat
              color="negative"
              icon="block"
              @click="openAnnulDialog(props.row)"
              :disable="props.row.estado === 'ANULADO'"
            >
              <q-tooltip>Anular (Solo Admin)</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- Diálogo de Formulario -->
    <MeasurementFormDialog
      v-model="isFormDialogVisible"
      :tanks-list="tanksList"
      :current-tank-detail="selectedTankDetail"
      @save="onFormSave"
      @tank-changed="handleTankChange"
    />

    <!-- Diálogo de Confirmación Anulación -->
    <q-dialog v-model="isAnnulDialogVisible" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <div class="q-ml-sm">
            <div class="text-weight-bold">¿Anular Medición?</div>
            <div class="text-caption">
              Se revertirá el inventario al estado anterior. Solo se permite
              anular la última medición.
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            flat
            label="Confirmar Anulación"
            color="negative"
            @click="confirmAnnul"
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
import { date } from "quasar";
import { useMeasurementStore } from "../../stores/measurementStore.js";
import MeasurementFormDialog from "../../components/measurements/MeasurementFormDialog.vue";

const measStore = useMeasurementStore();
const { rows, loading, filter, pagination, tanksList, selectedTankDetail } =
  storeToRefs(measStore);

const isFormDialogVisible = ref(false);
const isAnnulDialogVisible = ref(false);
const selectedItem = ref(null);

const columns = ref([
  {
    name: "fecha",
    label: "Fecha/Hora",
    field: (row) => date.formatDate(row.fecha_hora_medicion, "DD/MM HH:mm"),
    sortable: true,
    align: "left",
  },
  {
    name: "tanque",
    label: "Tanque",
    field: (row) =>
      row.Tanque ? `${row.Tanque.codigo} - ${row.Tanque.nombre}` : "N/A",
    align: "left",
  },
  {
    name: "medida",
    label: "Vara CM/PULG",
    field: "medida_vara",
    align: "right",
  },
  ,
  {
    name: "Medicion_Anterior",
    label: "Medicion Anterior",
    field: "nivel_sistema_anterior",
    align: "right",
  },

  {
    name: "real",
    label: "Medicion",
    field: "litros_reales_aforo",
    align: "right",
    style: "font-weight: bold",
  },
  {
    name: "diferencia",
    label: "Diferencia/Evaporizacion/planta",
    field: "diferencia_neta",
    align: "center",
    classes: (row) =>
      row.diferencia_neta > 0 ? "text-negative" : "text-positive",
  },
  {
    name: "usuario",
    label: "Registrado Por",
    field: (row) =>
      row.Usuario ? `${row.Usuario.nombre} ${row.Usuario.apellido} ` : "N/A",
    align: "left",
  },
  { name: "estado", label: "Estado", field: "estado", align: "center" },
  { name: "actions", label: "Acciones", align: "right" },
]);

function handleRequest(props) {
  pagination.value = props.pagination;
  filter.value = props.filter;
  measStore.fetchMeasurements();
}

function openAddDialog() {
  measStore.selectedTankDetail = null; // Limpiar selección anterior
  isFormDialogVisible.value = true;
}

function openAnnulDialog(item) {
  selectedItem.value = item;
  isAnnulDialogVisible.value = true;
}

function handleTankChange(tankId) {
  measStore.fetchTankDetail(tankId);
}

async function onFormSave(formData) {
  const success = await measStore.createMeasurement(formData);
  if (success) {
    isFormDialogVisible.value = false;
    // --- SOLUCIÓN ---
    // Refrescar la lista de tanques para que se actualice el nivel_actual
    measStore.loadTanksList();
  }
}

async function confirmAnnul() {
  await measStore.annulMeasurement(selectedItem.value.id_medicion);
  isAnnulDialogVisible.value = false;
}

onMounted(() => {
  measStore.fetchMeasurements();
  measStore.loadTanksList();
});
</script>

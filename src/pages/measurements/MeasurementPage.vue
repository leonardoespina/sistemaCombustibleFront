<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-y-md">
      <!-- HEADER Y TITULO -->
      <div class="row items-center justify-between q-mb-sm">
        <div class="col-12 col-md-auto">
          <h4 class="text-h4 q-my-none text-primary text-weight-bold">
            <q-icon name="straighten" class="q-mr-sm" />
            Mediciones de Tanque
          </h4>
          <div class="text-caption text-grey-7">Varillaje, Aforo y Auditoría de Inventario Físico</div>
        </div>
        <div class="col-12 col-md-auto q-mt-sm q-mt-md-none">
          <q-btn
            color="primary"
            icon="add"
            label="Nueva Medición"
            unelevated
            @click="openAddDialog"
          />
        </div>
      </div>

      <!-- SECCIÓN DE FILTROS -->
      <q-card flat bordered class="bg-grey-1">
        <q-expansion-item
          icon="filter_list"
          label="Filtros de Búsqueda"
          header-class="text-weight-medium"
        >
          <q-card-section>
            <div class="row q-col-gutter-md items-end">
              <div class="col-12 col-sm-3">
                <q-input dense outlined v-model="filters.fecha_inicio" type="date" label="Desde" />
              </div>
              <div class="col-12 col-sm-3">
                <q-input dense outlined v-model="filters.fecha_fin" type="date" label="Hasta" />
              </div>
              <div class="col-12 col-sm-4">
                <q-input
                  outlined
                  dense
                  v-model="filter"
                  placeholder="Buscar por observaciones..."
                >
                  <template v-slot:append><q-icon name="search" /></template>
                </q-input>
              </div>
              <div class="col-12 col-sm-2 row q-gutter-sm justify-end">
                <q-btn flat color="grey-7" label="Limpiar" @click="clearFilters" />
                <q-btn color="secondary" label="Filtrar" unelevated @click="applyFilters" />
              </div>
            </div>
          </q-card-section>
        </q-expansion-item>
      </q-card>

      <!-- TABLA DE RESULTADOS -->
      <q-table
        :rows="rows"
        :columns="columns"
        row-key="id_medicion"
        :loading="loading"
        v-model:pagination="pagination"
        @request="handleRequest"
        flat
        bordered
        binary-state-sort
      >
        <!-- ESTADO CHIP -->
        <template v-slot:body-cell-estado="props">
          <q-td :props="props">
            <q-badge :color="props.value === 'PROCESADO' ? 'green' : 'red'" rounded>
              {{ props.value }}
            </q-badge>
          </q-td>
        </template>

        <!-- DIFERENCIA COLOREADA -->
        <template v-slot:body-cell-diferencia="props">
          <q-td :props="props">
            <div :class="parseFloat(props.value) > 0 ? 'text-negative text-weight-bold' : 'text-positive text-weight-bold'">
              <q-icon 
                :name="parseFloat(props.value) > 0 ? 'trending_up' : 'trending_down'" 
                size="xs" 
                class="q-mr-xs"
              />
              {{ props.value }} L
              <div class="text-xxs text-grey-6 text-weight-normal">
                {{ parseFloat(props.value) > 0 ? 'FALTANTE' : 'SOBRANTE' }}
              </div>
            </div>
          </q-td>
        </template>

        <!-- ACCIONES -->
        <template v-slot:body-cell-actions="props">
          <q-td :props="props" class="q-gutter-x-sm">
            <q-btn
              dense
              round
              flat
              color="primary"
              icon="visibility"
              @click="openViewDialog(props.row)"
            >
              <q-tooltip>Ver Detalles</q-tooltip>
            </q-btn>
            <q-btn
              dense
              round
              flat
              color="warning"
              icon="edit"
              @click="openEditDialog(props.row)"
            >
              <q-tooltip>Modificar</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- Diálogo de Formulario -->
    <MeasurementFormDialog
      v-model="isFormDialogVisible"
      :llenaderos-list="llenaderosList"
      :tanks-list="tanksList"
      :current-tank-detail="selectedTankDetail"
      :is-editing="isEditing"
      :is-read-only="isReadOnly"
      :initial-data="selectedItem"
      @save="onFormSave"
      @llenadero-changed="handleLlenaderoChange"
      @tank-changed="handleTankChange"
    />

    <!-- Diálogo de Detalle -->
    <MeasurementDetailDialog
      v-model="isDetailDialogVisible"
      :data="selectedItem"
    />
  </q-page>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { date } from "quasar";
import { useMeasurementTable } from "./composables/useMeasurementTable.js";
import MeasurementFormDialog from "../../components/measurements/MeasurementFormDialog.vue";
import MeasurementDetailDialog from "../../components/measurements/MeasurementDetailDialog.vue";

const {
  rows,
  loading,
  filter,
  pagination,
  llenaderosList,
  tanksList,
  selectedTankDetail,
  isFormDialogVisible,
  isDetailDialogVisible,
  isEditing,
  isReadOnly,
  selectedItem,
  filters,
  handleRequest,
  openAddDialog,
  openViewDialog,
  openEditDialog,
  handleLlenaderoChange,
  handleTankChange,
  onFormSave,
  applyFilters,
  clearFilters,
  measStore
} = useMeasurementTable();

const columns = [
  {
    name: "fecha",
    label: "Fecha/Hora",
    field: (row) => date.formatDate(`${row.fecha_medicion}T${row.hora_medicion}`, "DD/MM HH:mm"),
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
    label: "Vara (cm/pulg)",
    field: "medida_vara",
    align: "right",
  },
  {
    name: "volumen_teorico",
    label: "Sistema (L)",
    field: "volumen_teorico",
    align: "right",
    format: val => `${parseFloat(val).toLocaleString()} L`
  },
  {
    name: "volumen_real",
    label: "Real (Físico)",
    field: "volumen_real",
    align: "right",
    format: val => `${parseFloat(val).toLocaleString()} L`
  },
  {
    name: "diferencia",
    label: "Diferencia Neta",
    field: "diferencia",
    align: "center",
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
];

onMounted(() => {
  measStore.fetchMeasurements();
  measStore.initSocketListeners();
});

onUnmounted(() => {
  measStore.removeSocketListeners();
});
</script>

<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-y-md">
      <!-- HEADER -->
      <div class="row items-center justify-between q-mb-sm">
        <div class="col-12 col-md-auto">
          <h4 class="text-h4 q-my-none text-primary text-weight-bold">
            <q-icon name="local_shipping" class="q-mr-sm" />
            Recepción de Cisternas
          </h4>
          <div class="text-caption text-grey-7">Gestión de cargas, pesaje y control de inventario de entrada</div>
        </div>
        <div class="col-12 col-md-auto q-mt-sm q-mt-md-none">
          <q-btn
            color="primary"
            icon="add"
            label="Registrar Carga"
            unelevated
            @click="openAddDialog"
          />
        </div>
      </div>

      <!-- FILTROS -->
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
                  placeholder="Buscar por guía o cisterna..."
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

      <!-- TABLA -->
      <q-table
        :rows="rows"
        :columns="columns"
        row-key="id_carga"
        :loading="loading"
        v-model:pagination="pagination"
        @request="handleRequest"
        flat
        bordered
        binary-state-sort
      >
        <!-- TICKET / GUIA -->
        <template v-slot:body-cell-guia="props">
          <q-td :props="props">
            <div class="text-weight-bold text-primary">{{ props.value }}</div>
            <div class="text-xxs text-grey-6">{{ props.row.Vehiculo?.placa || 'S/I' }}</div>
          </q-td>
        </template>

        <!-- VOLUMEN RECIBIDO -->
        <template v-slot:body-cell-recibido="props">
          <q-td :props="props" class="text-weight-bold text-blue-9">
            {{ parseFloat(props.value).toLocaleString() }} L
          </q-td>
        </template>

        <!-- DIFERENCIA -->
        <template v-slot:body-cell-diferencia="props">
          <q-td :props="props">
            <q-badge
              :color="parseFloat(props.value) > 0 ? 'negative' : 'positive'"
              class="q-pa-xs"
            >
              {{ props.value }} L
            </q-badge>
          </q-td>
        </template>

        <!-- ACCIONES -->
        <template v-slot:body-cell-actions="props">
          <q-td :props="props" class="q-gutter-x-sm">
            <q-btn dense round flat color="primary" icon="visibility" @click="openViewDialog(props.row)">
              <q-tooltip>Ver Detalles</q-tooltip>
            </q-btn>
            <q-btn dense round flat color="warning" icon="edit" @click="openEditDialog(props.row)">
              <q-tooltip>Editar</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- Diálogo de Formulario -->
    <CisternLoadFormDialog
      v-model="isFormDialogVisible"
      :initial-data="selectedItem"
      :is-editing="isEditing"
      :is-read-only="isReadOnly"
      :llenaderos-list="llenaderosList"
      :tanks-list="tanksList"
      :current-tank-aforo="selectedTankAforo"
      :current-tank-detail="selectedTankDetail"
      @save="onFormSave"
      @llenadero-changed="handleLlenaderoChange"
      @tank-changed="handleTankChange"
    />

    <!-- Diálogo de Detalle -->
    <CisternLoadDetailDialog
      v-model="isDetailDialogVisible"
      :data="selectedItem"
    />
  </q-page>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue";
import { date } from "quasar";
import { useCisternLoadTable } from "./composables/useCisternLoadTable";
import CisternLoadFormDialog from "../../components/loads/CisternLoadFormDialog.vue";
import CisternLoadDetailDialog from "../../components/loads/CisternLoadDetailDialog.vue";

const {
  rows, loading, filter, pagination, llenaderosList, tanksList, 
  selectedTankAforo, selectedTankDetail, isFormDialogVisible, isDetailDialogVisible, isEditing, isReadOnly, selectedItem, filters,
  handleRequest, openAddDialog, openViewDialog, openEditDialog, handleLlenaderoChange, handleTankChange, onFormSave,
  applyFilters, clearFilters, initSocketListeners, removeSocketListeners
} = useCisternLoadTable();

const columns = [
  { name: "fecha", label: "Llegada", field: row => date.formatDate(row.fecha_llegada, "DD/MM HH:mm"), align: "left", sortable: true },
  { name: "guia", label: "N° Guía / Cisterna", field: "numero_guia", align: "left" },
  { name: "tanque", label: "Tanque Receptor", field: row => row.Tanque?.nombre || 'N/A', align: "left" },
  { name: "guia_litros", label: "Guía (L)", field: "litros_segun_guia", align: "right", format: val => `${parseFloat(val).toLocaleString()} L` },
  { name: "recibido", label: "Recibido (L)", field: "litros_recibidos", align: "right" },
  { name: "diferencia", label: "Dif. Guía", field: "diferencia_guia", align: "center" },
  { name: "almacenista", label: "Recibido Por", field: row => `${row.Almacenista?.nombre} ${row.Almacenista?.apellido}`, align: "left" },
  { name: "actions", label: "Acciones", align: "right" }
];

onMounted(() => {
  handleRequest({ pagination: pagination.value, filter: filter.value });
  initSocketListeners();
});

onUnmounted(() => {
  removeSocketListeners();
});
</script>

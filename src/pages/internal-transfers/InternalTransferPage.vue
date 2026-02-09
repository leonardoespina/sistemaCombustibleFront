<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-y-md">
      <!-- HEADER -->
      <div class="row items-center justify-between q-mb-sm">
        <div class="col-12 col-md-auto">
          <h4 class="text-h4 q-my-none text-primary text-weight-bold">
            <q-icon name="swap_horiz" class="q-mr-sm" />
            Transferencias Internas
          </h4>
          <div class="text-caption text-grey-7">Movimientos de producto entre tanques del llenadero</div>
        </div>
        <div class="col-12 col-md-auto q-mt-sm q-mt-md-none">
          <q-btn
            color="primary"
            icon="add"
            label="Nueva Transferencia"
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

      <!-- TABLA -->
      <q-table
        :rows="rows"
        :columns="columns"
        row-key="id_transferencia"
        :loading="loading"
        v-model:pagination="pagination"
        @request="handleRequest"
        flat
        bordered
        binary-state-sort
      >
        <!-- TANQUES -->
        <template v-slot:body-cell-tanques="props">
          <q-td :props="props">
            <div class="row items-center no-wrap">
              <q-chip dense outline color="negative" text-color="white" icon="upload">
                {{ props.row.TanqueOrigen?.codigo }} - {{ props.row.TanqueOrigen?.nombre }}
              </q-chip>
              <q-icon name="arrow_forward" size="sm" class="q-mx-xs text-primary" />
              <q-chip dense outline color="positive" text-color="white" icon="download">
                {{ props.row.TanqueDestino?.codigo }} - {{ props.row.TanqueDestino?.nombre }}
              </q-chip>
            </div>
            <div class="text-xxs text-grey-7 q-pl-xs">Salida -> Entrada</div>
          </q-td>
        </template>

        <!-- CANTIDAD -->
        <template v-slot:body-cell-cantidad="props">
          <q-td :props="props" class="text-weight-bold text-primary">
            {{ parseFloat(props.value).toLocaleString() }} L
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

    <!-- Diálogo de Formulario (Creación/Edición) -->
    <InternalTransferFormDialog
      v-model="isFormDialogVisible"
      :initial-data="selectedItem"
      :is-editing="isEditing"
      :is-read-only="false"
      :llenaderos-list="llenaderosList"
      :tanks-list="tanksList"
      :source-tank-detail="sourceTankDetail"
      :destination-tank-detail="destinationTankDetail"
      :destination-tank-aforo="destinationTankAforo"
      @save="onFormSave"
      @llenadero-changed="handleLlenaderoChange"
      @source-tank-changed="id => transferStore.fetchTankDetail(id, 'source')"
      @destination-tank-changed="id => transferStore.fetchTankDetail(id, 'destination')"
    />

    <!-- Diálogo de Detalle (Consulta Tipo Acta) -->
    <InternalTransferDetailDialog
      v-model="isDetailDialogVisible"
      :data="selectedItem"
    />
  </q-page>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue";
import { date } from "quasar";
import { useInternalTransferTable } from "./composables/useInternalTransferTable";
import InternalTransferFormDialog from "../../components/internal-transfers/InternalTransferFormDialog.vue";
import InternalTransferDetailDialog from "../../components/internal-transfers/InternalTransferDetailDialog.vue";

const {
  rows, loading, filter, pagination, llenaderosList, tanksList,
  sourceTankDetail, destinationTankDetail, destinationTankAforo,
  isFormDialogVisible, isDetailDialogVisible, isEditing, isReadOnly, selectedItem, filters,
  handleRequest, openAddDialog, openViewDialog, openEditDialog, handleLlenaderoChange,
  onFormSave, applyFilters, clearFilters, initSocketListeners, removeSocketListeners, transferStore
} = useInternalTransferTable();

const columns = [
  { name: "fecha", label: "Fecha/Hora", field: row => date.formatDate(row.fecha_transferencia, "DD/MM HH:mm"), align: "left", sortable: true },
  { name: "tanques", label: "Movimiento", align: "left" },
  { name: "cantidad", label: "Transferido", field: "cantidad_transferida", align: "right" },
  { name: "origen_final", label: "Nivel Origen Final", field: "nivel_origen_despues", align: "right", format: v => `${parseFloat(v).toLocaleString()} L` },
  { name: "destino_final", label: "Nivel Destino Final", field: "nivel_destino_despues", align: "right", format: v => `${parseFloat(v).toLocaleString()} L` },
  { name: "usuario", label: "Registrado Por", field: row => `${row.Almacenista?.nombre} ${row.Almacenista?.apellido}`, align: "left" },
  { name: "actions", label: "Acciones", align: "right" }
];

onMounted(() => {
  handleRequest({ pagination: pagination.value, filter: filter.value });
  initSocketListeners();
});

onUnmounted(() => {
  removeSocketListeners();
  filter.value = "";
  pagination.value = {
    page: 1,
    rowsPerPage: 10,
    sortBy: "fecha_transferencia",
    descending: true,
    rowsNumber: 0,
  };
});
</script>

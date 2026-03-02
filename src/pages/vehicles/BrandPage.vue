<!-- src/pages/vehicles/BrandPage.vue -->
<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-y-md">
      <h4 class="text-h4 q-my-none">Gestión de Marcas</h4>

      <q-table
        :rows="rows"
        :columns="columns"
        row-key="id_marca"
        :loading="loading"
        v-model:pagination="pagination"
        v-model:filter="filter"
        @request="handleRequest"
        binary-state-sort
      >
        <template v-slot:top>
          <q-input
            outlined
            dense
            debounce="500"
            v-model="filter"
            placeholder="Buscar marca..."
            style="width: 300px"
          >
            <template v-slot:append><q-icon name="search" /></template>
          </q-input>
          <q-space />
          <q-btn
            color="primary"
            icon="add"
            label="Agregar Marca"
            @click="openAddDialog"
          />
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
    <BrandFormDialog
      v-model="isFormDialogVisible"
      :initial-data="editingBrand"
      :is-editing="!!editingBrand"
      @save="onFormSave"
    />

    <!-- Diálogo de Confirmación de Borrado -->
    <q-dialog v-model="isDeleteDialogVisible" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm"
            >¿Seguro que deseas desactivar la marca
            <strong>{{ editingBrand?.nombre }}</strong
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
import { useBrandPage } from "./composables/useBrandPage.js";
import BrandFormDialog from "../../components/vehicles/BrandFormDialog.vue";

const {
  rows,
  loading,
  filter,
  pagination,
  isFormDialogVisible,
  isDeleteDialogVisible,
  editingBrand,
  handleRequest,
  openAddDialog,
  openEditDialog,
  openDeleteDialog,
  onFormSave,
  confirmDelete,
} = useBrandPage();

const columns = [
  { name: "id_marca", label: "ID", field: "id_marca", sortable: true },
  {
    name: "nombre",
    label: "Nombre",
    field: "nombre",
    sortable: true,
    align: "left",
  },
  {
    name: "estado",
    label: "Estado",
    field: "estado",
    sortable: true,
    align: "center",
  },
  { name: "actions", label: "Acciones", align: "right" },
];
</script>

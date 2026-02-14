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
import { useLlenaderoPage } from "../../components/llenaderos/composables/useLlenaderoPage";
import LlenaderoFormDialog from "../../components/llenaderos/LlenaderoFormDialog.vue";

// ============================================
// COMPOSABLE
// ============================================

const {
  showDialog,
  selectedItem,
  rows,
  loading,
  filter,
  pagination,
  columns,
  onRequest,
  openCreateDialog,
  openEditDialog,
  confirmDelete,
} = useLlenaderoPage();
</script>

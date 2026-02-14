<template>
  <q-page class="q-pa-md">
    <q-card>
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Recepción de Cisternas (Cargas)</div>
        <q-space />
        <q-input
          v-model="store.filter"
          dense
          debounce="300"
          placeholder="Buscar..."
          color="primary"
          class="q-mr-md"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
        <q-btn
          color="primary"
          icon="add"
          label="Nueva Recepción"
          @click="showDialog = true"
        />
      </q-card-section>

      <q-card-section>
        <q-table
          v-model:pagination="store.pagination"
          :rows="store.rows"
          :columns="columns"
          :loading="store.loading"
          row-key="id_movimiento"
          @request="onRequest"
          binary-state-sort
        >
          <template v-slot:body-cell-cantidad="props">
             <q-td :props="props" class="text-right">
                <span class="text-weight-bold text-positive">+ {{ props.row.cantidad }} Lts</span>
             </q-td>
          </template>

          <template v-slot:body-cell-porcentaje_anterior="props">
             <q-td :props="props" class="text-center">
                {{ props.row.porcentaje_anterior }} %
             </q-td>
          </template>
          
           <template v-slot:body-cell-saldo_nuevo="props">
             <q-td :props="props" class="text-right">
                {{ props.row.saldo_nuevo }} Lts
             </q-td>
          </template>

          <template v-slot:body-cell-porcentaje_nuevo="props">
             <q-td :props="props" class="text-center">
                <q-badge :color="props.row.porcentaje_nuevo > 10 ? 'positive' : 'negative'">
                  {{ props.row.porcentaje_nuevo }} %
                </q-badge>
             </q-td>
          </template>

          <template v-slot:body-cell-usuario="props">
            <q-td :props="props">
              {{ props.row.Usuario ? `${props.row.Usuario.nombre} ${props.row.Usuario.apellido}` : 'Sistema' }}
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props" auto-width>
              <q-btn
                flat
                round
                dense
                color="primary"
                icon="visibility"
                @click="openDetail(props.row)"
              >
                <q-tooltip>Ver Detalle</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Diálogo de Registro (Solo Carga) -->
    <MovimientoLlenaderoDialog
      v-model="showDialog"
      @save="store.fetchMovimientos"
    />

    <!-- Diálogo de Detalle -->
    <MovimientoDetailDialog
      v-model="showDetailDialog"
      :data="selectedMovement"
    />
  </q-page>
</template>

<script setup>
import { useMovimientosLlenaderoPage } from "../../components/llenaderos/composables/useMovimientosLlenaderoPage";
import MovimientoLlenaderoDialog from "../../components/llenaderos/MovimientoLlenaderoDialog.vue";
import MovimientoDetailDialog from "../../components/llenaderos/MovimientoDetailDialog.vue";

// ============================================
// COMPOSABLE
// ============================================

const {
  store,
  showDialog,
  showDetailDialog,
  selectedMovement,
  columns,
  onRequest,
  openDetail,
} = useMovimientosLlenaderoPage();
</script>

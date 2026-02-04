<template>
  <q-page class="q-pa-md">
    <q-card>
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Gestión de Evaporaciones</div>
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
          icon="opacity"
          label="Registrar Evaporación"
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
             <q-td :props="props" class="text-right text-negative text-weight-bold">
                - {{ props.row.cantidad }} Lts
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

    <!-- Diálogo de Registro -->
    <EvaporacionFormDialog
      v-model="showDialog"
      @save="store.fetchEvaporaciones"
    />

    <!-- Diálogo de Detalle -->
    <MovimientoDetailDialog
      v-model="showDetailDialog"
      :data="selectedMovement"
    />
  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useEvaporacionStore } from "../../stores/evaporacionStore";
import EvaporacionFormDialog from "../../components/llenaderos/EvaporacionFormDialog.vue";
import MovimientoDetailDialog from "../../components/llenaderos/MovimientoDetailDialog.vue";
import { date } from "quasar";

const store = useEvaporacionStore();
const showDialog = ref(false);
const showDetailDialog = ref(false);
const selectedMovement = ref(null);

const columns = [
  {
    name: "fecha_movimiento",
    label: "Fecha",
    field: "fecha_movimiento",
    align: "left",
    sortable: true,
    format: (val) => date.formatDate(val, "DD/MM/YYYY HH:mm"),
  },
  {
    name: "llenadero",
    label: "Llenadero",
    field: (row) => row.Llenadero?.nombre_llenadero || "N/A",
    align: "left",
  },
  {
    name: "cantidad",
    label: "Evaporado",
    field: "cantidad",
    align: "right",
    sortable: true,
  },
  {
    name: "porcentaje_anterior",
    label: "% Ant.",
    field: "porcentaje_anterior",
    align: "center",
    sortable: true,
  },
  {
    name: "saldo_nuevo",
    label: "Saldo Final",
    field: "saldo_nuevo",
    align: "right",
    sortable: true,
  },
  {
    name: "porcentaje_nuevo",
    label: "% Final",
    field: "porcentaje_nuevo",
    align: "center",
    sortable: true,
  },
  {
    name: "observacion",
    label: "Observación",
    field: "observacion",
    align: "left",
  },
  {
    name: "usuario",
    label: "Registrado Por",
    field: "id_usuario",
    align: "left",
  },
  {
    name: "actions",
    label: "Acciones",
    field: "actions",
    align: "center",
  },
];

onMounted(() => {
  store.fetchEvaporaciones();
  store.initSocket();
});

onUnmounted(() => {
  store.cleanupSocket();
});

function onRequest(props) {
  store.pagination = props.pagination;
  store.fetchEvaporaciones();
}

function openDetail(row) {
  selectedMovement.value = row;
  showDetailDialog.value = true;
}
</script>

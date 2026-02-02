<template>
  <q-page class="q-pa-md">
    <q-card>
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Movimientos de Inventario (Llenaderos)</div>
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
          label="Nuevo Movimiento"
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
          <template v-slot:body-cell-tipo_movimiento="props">
            <q-td :props="props">
              <q-chip
                :color="props.row.tipo_movimiento === 'CARGA' ? 'positive' : 'warning'"
                text-color="white"
                dense
              >
                {{ props.row.tipo_movimiento }}
              </q-chip>
            </q-td>
          </template>

          <template v-slot:body-cell-cantidad="props">
             <q-td :props="props" class="text-right">
                <span class="text-weight-bold">{{ props.row.cantidad }} Lts</span>
             </q-td>
          </template>
          
           <template v-slot:body-cell-saldo_nuevo="props">
             <q-td :props="props" class="text-right">
                {{ props.row.saldo_nuevo }} Lts
             </q-td>
          </template>

          <template v-slot:body-cell-usuario="props">
            <q-td :props="props">
              {{ props.row.Usuario ? `${props.row.Usuario.nombre} ${props.row.Usuario.apellido}` : 'Sistema' }}
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Diálogo de Registro -->
    <MovimientoLlenaderoDialog
      v-model="showDialog"
      @save="store.fetchMovimientos"
    />
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useMovimientoLlenaderoStore } from "../../stores/movimientoLlenaderoStore";
import MovimientoLlenaderoDialog from "../../components/llenaderos/MovimientoLlenaderoDialog.vue";
import { date } from "quasar";

const store = useMovimientoLlenaderoStore();
const showDialog = ref(false);

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
    sortable: false, // Sortable solo si backend soporta join sort
  },
  {
    name: "tipo_movimiento",
    label: "Tipo",
    field: "tipo_movimiento",
    align: "center",
    sortable: true,
  },
  {
    name: "cantidad",
    label: "Cantidad",
    field: "cantidad",
    align: "right",
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
];

onMounted(() => {
  store.fetchMovimientos();
});

function onRequest(props) {
  store.pagination = props.pagination;
  // filter también se actualiza automáticamente por v-model
  store.fetchMovimientos();
}
</script>

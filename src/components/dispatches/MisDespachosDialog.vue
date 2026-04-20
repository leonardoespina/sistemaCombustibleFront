<template>
  <q-dialog
    v-model="isOpen"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="bg-grey-1">
      <!-- TOOLBAR -->
      <q-toolbar class="bg-secondary text-white shadow-2">
        <q-btn flat round dense icon="arrow_back" v-close-popup>
          <q-tooltip>Volver a filtros</q-tooltip>
        </q-btn>
        <q-toolbar-title class="text-body1">Mis Despachos</q-toolbar-title>
        <q-space />
        <template v-if="$q.screen.gt.xs">
          <ExportExcelBtn
            :rows="data" :columns="columns"
            :filename="`MisDespachos_${filters.fechaDesde}_${filters.fechaHasta}`"
            sheet-name="Mis Despachos"
            :meta="['MIS DESPACHOS', `Periodo: ${formatDate(filters.fechaDesde)} - ${formatDate(filters.fechaHasta)}`, `Total General: ${total} L`]"
            label="Excel" flat color="white" class="q-mr-xs"
          />
          <q-btn flat icon="print" label="Imprimir" color="white" @click="printReport" />
        </template>
        <q-btn v-else flat round icon="more_vert">
          <q-menu>
            <q-list style="min-width: 150px">
              <q-item clickable v-close-popup @click="printReport">
                <q-item-section avatar><q-icon name="print" /></q-item-section>
                <q-item-section>Imprimir</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>

      <q-card-section class="q-pa-lg scroll" style="height: calc(100vh - 50px)">
        <div
          id="print-section"
          class="bg-white q-pa-lg shadow-3 rounded-borders"
          style="width: 100%; margin: 0 auto"
        >
          <!-- ENCABEZADO RESPONSIVE -->
          <div class="column items-center q-mb-md q-pb-sm" style="border-bottom: 1px solid #e0e0e0">
            <img src="/logo.png" style="height: 55px" alt="Logo" class="q-mb-xs" />
            <div class="text-center">
              <div :class="$q.screen.lt.sm ? 'text-subtitle1' : 'text-h5'" class="text-weight-bold text-uppercase text-secondary">
                Mis Despachos
              </div>
              <div class="text-caption text-grey-8">
                Periodo:
                <span class="text-weight-bold">{{ formatDate(filters.fechaDesde) }}</span>
                —
                <span class="text-weight-bold">{{ formatDate(filters.fechaHasta) }}</span>
              </div>
              <q-chip color="secondary" text-color="white" icon="local_gas_station" size="sm" class="q-mt-xs">
                Total: {{ total }} L
              </q-chip>
            </div>
          </div>

          <!-- TABLA -->
          <q-table
            flat bordered dense
            :rows="data"
            :columns="columns"
            row-key="id"
            :loading="loading"
            :pagination="pagination"
            @request="(p) => $emit('request', p)"
          >
            <template v-slot:body-cell-fecha="props">
              <q-td :props="props">
                <div>{{ formatDateTime(props.row.fecha) }}</div>
                <div class="text-caption text-grey">{{ props.row.hora }}</div>
              </q-td>
            </template>
            <template v-slot:body-cell-cantidad_despachada="props">
              <q-td :props="props" class="text-right text-weight-bold text-secondary">
                {{ props.value }} L
              </q-td>
            </template>
            <template v-slot:bottom-row>
              <q-tr class="bg-grey-2 text-weight-bold">
                <q-td colspan="7" class="text-right">Total General Despachado:</q-td>
                <q-td class="text-right text-secondary text-h6">{{ total }} L</q-td>
              </q-tr>
            </template>
            <template v-slot:no-data>
              <div class="full-width text-center q-pa-xl text-grey-6">
                <q-icon name="search_off" size="48px" /><br />
                No se encontraron despachos.
              </div>
            </template>
          </q-table>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue';
import { date } from 'quasar';
import ExportExcelBtn from '../common/ExportExcelBtn.vue';

const props = defineProps({
  modelValue: Boolean,
  data:       { type: Array,  required: true },
  total:      { type: String, default: '0.00' },
  filters:    { type: Object, required: true },
  pagination: { type: Object, required: true },
  loading:    { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'request']);

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const columns = [
  { name: 'fecha',              label: 'Fecha',          field: 'fecha',               align: 'left', sortable: true },
  { name: 'codigo_ticket',     label: 'Ticket',          field: 'codigo_ticket',        align: 'left' },
  { name: 'vehiculo',          label: 'Vehículo',        field: 'vehiculo',             align: 'left' },
  { name: 'placa',             label: 'Placa',           field: 'placa',                align: 'left' },
  { name: 'subdependencia',    label: 'Subdependencia',  field: 'subdependencia',        align: 'left' },
  { name: 'solicitante',       label: 'Solicitante',     field: 'solicitante',           align: 'left' },
  { name: 'aprobador',         label: 'Aprobador',       field: 'aprobador',             align: 'left' },
  { name: 'recibido',          label: 'Recibido',        field: 'recibido',              align: 'left' },
  { name: 'cantidad_aprobada', label: 'Aprobado (L)',    field: 'cantidad_aprobada',     align: 'right' },
  { name: 'cantidad_despachada', label: 'Despachado (L)', field: 'cantidad_despachada', align: 'right' },
];

function formatDate(fechaStr) {
  if (!fechaStr) return '';
  return date.formatDate(fechaStr.replace(/-/g, '/'), 'DD/MM/YYYY');
}

function formatDateTime(fechaStr) {
  if (!fechaStr) return '-';
  return date.formatDate(new Date(fechaStr), 'DD/MM/YYYY');
}

function printReport() {
  window.print();
}
</script>

<style scoped>
@media print {
  body * { visibility: hidden; }
  #print-section, #print-section * { visibility: visible; }
  #print-section { position: absolute; left: 0; top: 0; width: 100%; }
  .q-toolbar, .q-btn { display: none !important; }
}
</style>

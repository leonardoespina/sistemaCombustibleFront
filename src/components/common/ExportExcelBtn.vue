<template>
  <q-btn
    v-bind="$attrs"
    :color="color"
    :icon="icon"
    :label="label"
    :disable="disable || !rows || rows.length === 0"
    :loading="loading"
    unelevated
    no-caps
    @click="handleExport"
  >
    <q-tooltip v-if="rows && rows.length === 0">Sin datos para exportar</q-tooltip>
  </q-btn>
</template>

<script setup>
import { useExcelExport } from '../../composables/useExcelExport';

const props = defineProps({
  rows:      { type: Array,  required: true },
  columns:   { type: Array,  required: true },
  filename:  { type: String, required: true },
  sheetName: { type: String, default: 'Datos' },
  meta:      { type: Array,  default: () => [] },
  label:     { type: String, default: 'Excel' },
  icon:      { type: String, default: 'table_view' },
  color:     { type: String, default: 'positive' },
  disable:   { type: Boolean, default: false },
  loading:   { type: Boolean, default: false },
});

const { exportToExcel } = useExcelExport();

function handleExport() {
  exportToExcel({
    rows:      props.rows,
    columns:   props.columns,
    filename:  props.filename,
    sheetName: props.sheetName,
    meta:      props.meta,
  });
}
</script>

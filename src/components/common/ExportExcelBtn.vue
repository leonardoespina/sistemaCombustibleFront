<template>
  <q-btn
    v-bind="$attrs"
    :color="color"
    :icon="icon"
    :label="label"
    :disable="disable || isButtonDisabled"
    :loading="loading"
    unelevated
    no-caps
    @click="handleExport"
  >
    <q-tooltip v-if="isButtonDisabled">Sin datos para exportar</q-tooltip>
  </q-btn>
</template>

<script setup>
import { computed } from 'vue';
import { useExcelExport } from '../../composables/useExcelExport';

const props = defineProps({
  rows:      { type: Array,   default: () => [] },
  columns:   { type: Array,   default: () => [] },
  filename:  { type: String,  required: true },
  sheetName: { type: String,  default: 'Datos' },
  meta:      { type: Array,   default: () => [] },
  sheets:    { type: Array,   default: null },
  label:     { type: String,  default: 'Excel' },
  icon:      { type: String,  default: 'table_view' },
  color:     { type: String,  default: 'positive' },
  disable:   { type: Boolean, default: false },
  loading:   { type: Boolean, default: false },
});

const isButtonDisabled = computed(() => {
  if (props.sheets && props.sheets.length > 0) {
    return props.sheets.every(s => !s.rows || s.rows.length === 0);
  }
  return !props.rows || props.rows.length === 0;
});

const { exportToExcel } = useExcelExport();

function handleExport() {
  if (props.sheets && props.sheets.length > 0) {
    exportToExcel({
      filename: props.filename,
      sheets:   props.sheets,
    });
  } else {
    exportToExcel({
      rows:      props.rows,
      columns:   props.columns,
      filename:  props.filename,
      sheetName: props.sheetName,
      meta:      props.meta,
    });
  }
}
</script>

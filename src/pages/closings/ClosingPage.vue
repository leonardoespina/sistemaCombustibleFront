<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-y-md">
      <h4 class="text-h4 q-my-none">Acta de Cierre</h4>

      <q-table
        :rows="rows"
        :columns="columns"
        row-key="grupo_cierre_uuid"
        :loading="loading"
        :pagination="{ rowsPerPage: 10 }"
      >
        <template v-slot:top>
          <div class="text-subtitle1">Historial de Actas</div>
          <q-space />
          <q-btn
            color="primary"
            icon="post_add"
            label="Generar Cierre"
            @click="openAddDialog"
          />
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              dense
              round
              flat
              color="secondary"
              icon="visibility"
              @click="viewActa(props.row.grupo_cierre_uuid)"
            >
              <q-tooltip>Ver Acta</q-tooltip>
            </q-btn>

            <q-btn
              dense
              round
              flat
              color="negative"
              icon="delete_forever"
              @click="confirmRevert(props.row.grupo_cierre_uuid)"
              v-if="props.rowIndex === 0"
            >
              <q-tooltip>Anular/Revertir Acta</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </div>

    <ClosingFormDialog
      v-model="isFormDialogVisible"
      :loading="loading"
      :warehousemen-list="allWarehousemen"
      @save="onFormSave"
    />

    <ActaViewerDialog v-model="isViewerVisible" :acta="selectedActaData" />
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { date, useQuasar } from "quasar";
import { useClosingStore } from "../../stores/closingStore.js";
import { useWarehousemanStore } from "../../stores/warehousemanStore.js";
import ClosingFormDialog from "../../components/closings/ClosingFormDialog.vue";
import ActaViewerDialog from "../../components/closings/ActaViewerDialog.vue";

const $q = useQuasar();
const closingStore = useClosingStore();
const warehousemanStore = useWarehousemanStore();
const { rows, loading, selectedActaData } = storeToRefs(closingStore);
const { allWarehousemen } = storeToRefs(warehousemanStore);

const isFormDialogVisible = ref(false);
const isViewerVisible = ref(false);

const columns = ref([
  {
    name: "fecha",
    label: "Fecha/Hora Ejecución",
    field: (row) => date.formatDate(row.fecha_cierre, "DD/MM/YYYY HH:mm:ss"), // Mostramos segundos para precisión
    sortable: true,
    align: "left",
  },
  {
    name: "turno",
    label: "Turno",
    field: "turno",
    sortable: true,
    align: "left",
  },
  {
    name: "tanques",
    label: "Tanques Proc.",
    field: "tanques_involucrados",
    align: "center",
  },
  { name: "actions", label: "Acciones", align: "right" },
]);

function openAddDialog() {
  isFormDialogVisible.value = true;
}

async function onFormSave(formData) {
  const success = await closingStore.generateClosing(formData);
  if (success) isFormDialogVisible.value = false;
}

async function viewActa(uuid) {
  const success = await closingStore.fetchActaData(uuid);
  if (success) isViewerVisible.value = true;
}

function confirmRevert(uuid) {
  $q.dialog({
    title: "Confirmar Anulación",
    message:
      "¿Está seguro de que desea revertir esta acta de cierre? Esta acción es irreversible y liberará todos los movimientos asociados para un nuevo cálculo.",
    cancel: true,
    persistent: true,
    ok: {
      label: "Sí, anular",
      color: "negative",
    },
  }).onOk(() => {
    closingStore.revertClosing(uuid);
  });
}

onMounted(() => {
  closingStore.fetchHistory();
  warehousemanStore.fetchAllWarehousemen();
});
</script>

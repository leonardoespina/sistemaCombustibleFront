<!-- src/components/cupos/HistorialRecargasDialog.vue -->
<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <q-card style="width: 750px; max-width: 95vw">
      <!-- HEADER -->
      <q-card-section class="row items-center q-pb-sm bg-primary text-white">
        <q-icon name="history" size="1.8rem" class="q-mr-sm" />
        <div class="text-h6">Historial y Edición de Recargas</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup color="white" />
      </q-card-section>

      <!-- INFO DEL CUPO -->
      <q-card-section class="bg-grey-2 q-py-sm">
        <div class="row items-center justify-between">
          <div>
            <span class="text-weight-bold text-subtitle2 text-primary" v-if="cupo">
              {{ cupo.CupoBase?.Categoria?.nombre }} — {{ cupo.CupoBase?.Dependencia?.nombre_dependencia }}
            </span>
            <div class="text-caption text-grey-8" v-if="cupo?.CupoBase?.Subdependencia?.nombre">
              Subdependencia: {{ cupo.CupoBase.Subdependencia.nombre }}
            </div>
          </div>
          <div class="text-right">
            <span class="text-caption text-grey-8">Saldo Actual: </span>
            <span class="text-weight-bolder text-subtitle2">{{ cupo?.cantidad_disponible || 0 }} L</span>
            <span class="text-caption text-grey-7 q-ml-sm">
              (Total Recargado: {{ cupo?.cantidad_recargada || 0 }} L)
            </span>
          </div>
        </div>
      </q-card-section>

      <!-- TABLA DE RECARGAS -->
      <q-card-section class="q-pa-md">
        <div v-if="loading" class="text-center q-pa-lg">
          <q-spinner color="primary" size="3rem" />
          <div class="text-caption text-grey-7 q-mt-sm">Cargando recargas...</div>
        </div>

        <div v-else-if="recargas.length === 0" class="text-center q-pa-lg text-grey-7">
          <q-icon name="info" size="2.5rem" color="grey-5" />
          <div class="text-subtitle2 q-mt-sm">No hay recargas registradas para este periodo.</div>
        </div>

        <q-table
          v-else
          flat
          bordered
          dense
          :rows="recargas"
          :columns="columns"
          row-key="id_recarga"
          :pagination="{ rowsPerPage: 5 }"
        >
          <template v-slot:body-cell-fecha="props">
            <q-td :props="props">
              {{ formatFecha(props.row.fecha_recarga) }}
            </q-td>
          </template>

          <template v-slot:body-cell-cantidad="props">
            <q-td :props="props" class="text-weight-bold text-primary">
              +{{ parseFloat(props.row.cantidad_recargada).toFixed(2) }} L
            </q-td>
          </template>

          <template v-slot:body-cell-autorizado="props">
            <q-td :props="props">
              {{ props.row.AutorizadoPor ? `${props.row.AutorizadoPor.nombre} ${props.row.AutorizadoPor.apellido}` : 'Usuario #' + props.row.autorizado_por }}
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props" class="text-center">
              <q-btn
                flat
                round
                dense
                color="primary"
                icon="edit"
                @click="iniciarEdicion(props.row)"
              >
                <q-tooltip>Editar Recarga</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card-section>

      <!-- DIÁLOGO / SUB-FORMULARIO DE EDICIÓN -->
      <q-dialog v-model="showEditDialog" persistent>
        <q-card style="width: 420px; max-width: 90vw">
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6 text-primary">Editar Recarga #{{ editForm.id_recarga }}</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>

          <q-form @submit.prevent="guardarEdicion">
            <q-card-section class="q-gutter-md q-pt-md">
              <div class="bg-blue-1 q-pa-sm rounded-borders text-caption text-primary">
                Modificar esta cantidad recalculará automáticamente la disponibilidad actual del cupo.
              </div>

              <!-- Cantidad -->
              <q-input
                dense
                outlined
                v-model.number="editForm.cantidad"
                type="number"
                label="Cantidad Recargada (Litros)"
                suffix="L"
                :rules="[
                  (val) => val !== null && val !== '' || 'Requerido',
                  (val) => val >= 0 || 'Debe ser mayor o igual a 0'
                ]"
                hint="Cantidad ajustada en litros"
              />

              <!-- Motivo -->
              <q-input
                dense
                outlined
                v-model="editForm.motivo"
                type="textarea"
                label="Motivo / Justificación"
                rows="3"
                :rules="[(val) => !!val && val.trim().length >= 5 || 'Mínimo 5 caracteres']"
                maxlength="500"
                counter
              />
            </q-card-section>

            <q-card-actions align="right" class="q-pa-md">
              <q-btn flat label="Cancelar" v-close-popup :disable="saving" />
              <q-btn
                unelevated
                color="primary"
                label="Guardar Cambios"
                type="submit"
                :loading="saving"
                icon="save"
              />
            </q-card-actions>
          </q-form>
        </q-card>
      </q-dialog>

      <!-- ACCIONES -->
      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cerrar" color="grey-8" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from "vue";
import { useCupoStore } from "../../stores/cupoStore";
import { date } from "quasar";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  cupo: { type: Object, default: null },
});

const emit = defineEmits(["update:modelValue"]);

const cupoStore = useCupoStore();
const loading = ref(false);
const recargas = ref([]);

// Estado de Edición
const showEditDialog = ref(false);
const saving = ref(false);
const editForm = ref({
  id_recarga: null,
  cantidad: 0,
  motivo: "",
});

const columns = [
  { name: "fecha", label: "Fecha y Hora", align: "left", field: "fecha_recarga", sortable: true },
  { name: "cantidad", label: "Cantidad", align: "right", field: "cantidad_recargada", sortable: true },
  { name: "motivo", label: "Motivo", align: "left", field: "motivo" },
  { name: "autorizado", label: "Autorizado Por", align: "left", field: "autorizado_por" },
  { name: "actions", label: "Acción", align: "center" },
];

const formatFecha = (f) => {
  if (!f) return "-";
  return date.formatDate(f, "DD/MM/YYYY hh:mm A");
};

const cargarRecargas = async () => {
  if (!props.cupo?.id_cupo_actual) return;
  loading.value = true;
  try {
    recargas.value = await cupoStore.fetchRecargas(props.cupo.id_cupo_actual);
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      cargarRecargas();
    }
  }
);

const iniciarEdicion = (row) => {
  editForm.value = {
    id_recarga: row.id_recarga,
    cantidad: parseFloat(row.cantidad_recargada),
    motivo: row.motivo || "",
  };
  showEditDialog.value = true;
};

const guardarEdicion = async () => {
  saving.value = true;
  try {
    const success = await cupoStore.updateRecarga(editForm.value.id_recarga, {
      cantidad: editForm.value.cantidad,
      motivo: editForm.value.motivo,
    });

    if (success) {
      showEditDialog.value = false;
      await cargarRecargas();
    }
  } finally {
    saving.value = false;
  }
};
</script>

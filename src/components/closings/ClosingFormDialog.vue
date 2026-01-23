<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <q-card style="min-width: 450px">
      <q-card-section>
        <div class="text-h6">Generar Cierre Global</div>
        <div class="text-caption text-grey">
          Se consolidará el inventario con la fecha y hora seleccionada.
        </div>
      </q-card-section>

      <q-form @submit.prevent="onSave">
        <q-card-section class="q-gutter-md">
          <div class="bg-blue-1 q-pa-sm rounded-borders">
            <div class="text-body2 text-primary">
              <q-icon name="access_time" /> Fecha de Corte:
            </div>
            <div class="text-caption text-grey-9">
              Los movimientos posteriores a esta fecha quedarán para el
              siguiente turno.
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-6">
              <!-- Input de Fecha (YYYY-MM-DD) -->
              <q-input
                dense
                filled
                v-model="localDate"
                type="date"
                label="Fecha"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>
            <div class="col-6">
              <!-- Input de Hora (HH:mm) -->
              <q-input
                dense
                filled
                v-model="localTime"
                type="time"
                label="Hora"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>
          </div>

          <q-select
            dense
            filled
            v-model="formData.turno"
            :options="['DIURNO', 'NOCTURNO']"
            label="Turno"
            :rules="[(val) => !!val || 'Requerido']"
          />

          <q-select
            dense
            filled
            use-input
            v-model="formData.id_almacenista"
            :options="filteredWarehousemen"
            @filter="filterWarehousemen"
            option-value="id_almacenista"
            :option-label="(opt) => `${opt.nombre} ${opt.apellido}`"
            label="Almacenista"
            emit-value
            map-options
            :rules="[(val) => !!val || 'Requerido']"
          />

          <q-input
            dense
            filled
            v-model="formData.observacion_general"
            type="textarea"
            label="Observaciones Generales (Opcional)"
            rows="3"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            label="Procesar Cierre"
            type="submit"
            color="primary"
            :loading="loading"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from "vue";
import { date } from "quasar";

const props = defineProps({
  modelValue: Boolean,
  loading: Boolean,
  warehousemenList: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue", "save"]);

const formData = ref({});
const localDate = ref("");
const localTime = ref("");
const filteredWarehousemen = ref([]);

watch(
  () => props.modelValue,
  (isNowOpen) => {
    if (isNowOpen) {
      const now = new Date();
      // Inicializamos los inputs con la hora actual del sistema
      localDate.value = date.formatDate(now, "YYYY-MM-DD");
      localTime.value = date.formatDate(now, "HH:mm");

      formData.value = {
        turno: "DIURNO",
        observacion_general: "",
        id_almacenista: null,
      };

      filteredWarehousemen.value = props.warehousemenList;
    }
  }
);

function filterWarehousemen(val, update) {
  if (val === "") {
    update(() => {
      filteredWarehousemen.value = props.warehousemenList;
    });
    return;
  }
  update(() => {
    const needle = val.toLowerCase();
    filteredWarehousemen.value = props.warehousemenList.filter(
      (w) =>
        w.nombre.toLowerCase().includes(needle) ||
        w.apellido.toLowerCase().includes(needle)
    );
  });
}

function onSave() {
  // 1. Combinamos Fecha y Hora en el formato deseado
  // Resultado ejemplo: "2025-11-30 15:59:00"
  const fechaCompleta = `${localDate.value} ${localTime.value}:00`;

  // 2. Preparamos el payload
  const payload = {
    turno: formData.value.turno,
    observacion_general: formData.value.observacion_general,
    fechaCierre: fechaCompleta, // <--- Enviamos el string combinado
    id_almacenista: formData.value.id_almacenista,
  };

  emit("save", payload);
}
</script>

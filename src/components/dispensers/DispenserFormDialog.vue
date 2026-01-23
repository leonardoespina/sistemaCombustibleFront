<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <q-card style="width: 600px; max-width: 90vw">
      <q-card-section>
        <div class="text-h6">
          {{ isEditing ? "Editar Dispensador" : "Nuevo Dispensador" }}
        </div>
      </q-card-section>

      <q-form @submit.prevent="onSave">
        <q-card-section class="q-pt-none">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-input
                dense
                v-model="formData.nombre"
                label="Nombre / Identificador"
                hint="Ej: Surtidor Gasolina 01"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-input
                dense
                v-model.number="formData.odometro_actual"
                type="number"
                label="Lectura Odómetro"
                suffix="Lts"
                :rules="[(val) => val >= 0 || 'No puede ser negativo']"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-select
                dense
                filled
                v-model="formData.id_tanque_asociado"
                :options="tanksList"
                option-value="id_tanque"
                :option-label="
                  (opt) =>
                    `${opt.codigo} - ${opt.nombre} (${opt.tipo_combustible})`
                "
                label="Tanque Asociado"
                emit-value
                map-options
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>

            <div class="col-12" v-if="isEditing">
              <q-select
                dense
                v-model="formData.estado"
                :options="['ACTIVO', 'INACTIVO']"
                label="Estado"
              />
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn label="Guardar" type="submit" color="primary" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, nextTick } from "vue";

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
  isEditing: Boolean,
  tanksList: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue", "save"]);

const formData = ref({});

// --- INICIALIZACIÓN ---
watch(
  () => props.modelValue,
  (isNowOpen) => {
    if (isNowOpen) {
      formData.value = {
        nombre: props.initialData?.nombre || "",
        odometro_actual:
          props.initialData?.odometro_actual !== undefined
            ? Number(props.initialData.odometro_actual)
            : 0,
        id_tanque_asociado: props.initialData?.id_tanque_asociado || null,
        estado: props.initialData?.estado || "ACTIVO",
      };
    }
  }
);

async function onSave() {
  await nextTick();
  emit("save", formData.value);
}
</script>

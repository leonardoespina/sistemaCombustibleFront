<!-- src/components/cupos/RecargaCupoDialog.vue -->
<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <q-card style="min-width: 400px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Recarga Extra de Cupo</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-sm">
        <div class="text-subtitle2 text-primary" v-if="cupo">
          {{ cupo.CupoBase?.Categoria?.nombre }} - {{ cupo.CupoBase?.Dependencia?.nombre_dependencia }}
        </div>
        <div class="text-caption text-grey" v-if="cupo">
          Saldo Actual: <strong>{{ cupo.cantidad_disponible }} L</strong>
        </div>
      </q-card-section>

      <q-form @submit.prevent="onSave">
        <q-card-section class="q-gutter-md">
          <q-input
            dense
            v-model.number="formData.cantidad"
            type="number"
            label="Cantidad a Recargar (Litros)"
            suffix="L"
            autofocus
            :rules="[
              (val) => !!val || 'Campo requerido',
              (val) => val > 0 || 'La cantidad debe ser mayor a 0'
            ]"
          />

          <q-input
            dense
            v-model="formData.motivo"
            type="textarea"
            label="Motivo de la Recarga"
            rows="3"
            :rules="[(val) => !!val || 'Campo requerido']"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn flat label="Confirmar Recarga" type="submit" color="primary" :loading="loading" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  modelValue: Boolean,
  cupo: Object, // El registro de CupoActual
  loading: Boolean
});

const emit = defineEmits(["update:modelValue", "save"]);

const formData = ref({
  cantidad: 0,
  motivo: ""
});

function onSave() {
  emit("save", {
    id_cupo_base: props.cupo.id_cupo_base,
    cantidad: formData.value.cantidad,
    motivo: formData.value.motivo
  });
}
</script>

<template>
  <q-dialog v-model="visible" persistent>
    <q-card style="min-width: 400px">
      <q-card-section class="row items-center">
        <div class="text-h6">Recargar Cupo</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section v-if="cupoInfo">
        <q-item>
          <q-item-section>
            <q-item-label caption>Dependencia</q-item-label>
            <q-item-label>{{ cupoInfo.CupoBase?.Dependencia?.nombre_dependencia || 'N/A' }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label caption>Saldo Actual</q-item-label>
            <q-item-label class="text-weight-bold">{{ cupoInfo.cantidad_disponible }} L</q-item-label>
          </q-item-section>
        </q-item>
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model.number="form.cantidad"
            label="Cantidad a Recargar (Litros) *"
            outlined
            dense
            type="number"
            min="1"
            :rules="[(val) => val > 0 || 'Debe ser mayor a 0']"
          />

          <q-input
            v-model="form.motivo"
            label="Motivo de la Recarga"
            outlined
            dense
            type="textarea"
          />

          <div class="row justify-end q-mt-md">
            <q-btn
              label="Cancelar"
              color="negative"
              flat
              v-close-popup
              class="q-mr-sm"
            />
            <q-btn
              label="Confirmar Recarga"
              type="submit"
              color="primary"
              :loading="loading"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useCupoStore } from "../../stores/cupoStore";

const props = defineProps({
  modelValue: Boolean,
  cupoInfo: Object,
});

const emit = defineEmits(["update:modelValue"]);

const store = useCupoStore();
const loading = ref(false);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const form = ref({
  id_cupo_base: null,
  cantidad: null,
  motivo: "",
});

watch(
  () => props.cupoInfo,
  (val) => {
    if (val) {
      form.value = {
        id_cupo_base: val.id_cupo_base,
        cantidad: null,
        motivo: "",
      };
    }
  },
  { immediate: true }
);

const onSubmit = async () => {
  loading.value = true;
  const success = await store.recargarCupo(form.value);
  loading.value = false;

  if (success) {
    visible.value = false;
  }
};
</script>

<template>
  <q-dialog v-model="visible" persistent>
    <q-card style="min-width: 400px">
      <q-card-section class="row items-center">
        <div class="text-h6">
          {{ isEdit ? "Editar Moneda" : "Nueva Moneda" }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model="form.nombre"
            label="Nombre *"
            outlined
            dense
            hint="Ej: Dólar Americano, Bolívar Digital"
            :rules="[(val) => (val && val.length > 0) || 'El nombre es requerido']"
          />

          <q-input
            v-model="form.simbolo"
            label="Símbolo *"
            outlined
            dense
            hint="Ej: $, Bs, Au"
            :rules="[(val) => (val && val.length > 0) || 'El símbolo es requerido']"
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
              :label="isEdit ? 'Actualizar' : 'Guardar'"
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
import { usePrecioStore } from "../../stores/precioStore";

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
});

const emit = defineEmits(["update:modelValue"]);

const store = usePrecioStore();
const loading = computed(() => store.loading);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const isEdit = computed(() => !!props.initialData);

const form = ref({
  nombre: "",
  simbolo: "",
});

watch(
  () => props.initialData,
  (val) => {
    resetForm(val);
  },
  { immediate: true }
);

// Resetear form cuando se cierra el diálogo
watch(visible, (val) => {
  if (!val) {
    resetForm(props.initialData);
  }
});

function resetForm(data) {
  if (data) {
    form.value = { ...data };
  } else {
    form.value = {
      nombre: "",
      simbolo: "",
    };
  }
}

const onSubmit = async () => {
  let success;
  if (isEdit.value) {
    success = await store.updateMoneda(
      props.initialData.id_moneda,
      form.value
    );
  } else {
    success = await store.createMoneda(form.value);
  }

  if (success) {
    visible.value = false;
  }
};
</script>

<template>
  <q-dialog v-model="visible" persistent>
    <q-card style="min-width: 400px">
      <q-card-section class="row items-center">
        <div class="text-h6">
          {{ isEdit ? "Editar Llenadero" : "Nuevo Llenadero" }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model="form.nombre_llenadero"
            label="Nombre del Llenadero / Operario *"
            outlined
            dense
            :rules="[(val) => (val && val.length >= 3) || 'El nombre debe tener al menos 3 caracteres']"
          />

          <q-toggle
            v-if="isEdit"
            v-model="form.estado"
            label="Activo"
            true-value="ACTIVO"
            false-value="INACTIVO"
            dense
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
import { useLlenaderoStore } from "../../stores/llenaderoStore";

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
});

const emit = defineEmits(["update:modelValue"]);

const store = useLlenaderoStore();
const loading = computed(() => store.loading);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const isEdit = computed(() => !!props.initialData);

const form = ref({
  nombre_llenadero: "",
  estado: "ACTIVO",
});

watch(
  () => props.initialData,
  (val) => {
    if (val) {
      form.value = { ...val };
    } else {
      form.value = {
        nombre_llenadero: "",
        estado: "ACTIVO",
      };
    }
  },
  { immediate: true }
);

const onSubmit = async () => {
  let success;
  if (isEdit.value) {
    success = await store.updateLlenadero(
      props.initialData.id_llenadero,
      form.value
    );
  } else {
    success = await store.createLlenadero(form.value);
  }

  if (success) {
    visible.value = false;
  }
};
</script>

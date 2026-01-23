<template>
  <q-dialog v-model="visible" persistent>
    <q-card style="min-width: 400px">
      <q-card-section class="row items-center">
        <div class="text-h6">
          {{ isEdit ? "Editar Tipo de Combustible" : "Nuevo Tipo de Combustible" }}
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
            :rules="[(val) => (val && val.length > 0) || 'El nombre es requerido']"
          />

          <q-input
            v-model="form.descripcion"
            label="Descripción"
            outlined
            dense
            type="textarea"
          />

          <q-toggle
            v-if="isEdit"
            v-model="form.activo"
            label="Activo"
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
import { useTipoCombustibleStore } from "../../stores/tipoCombustibleStore";

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
});

const emit = defineEmits(["update:modelValue"]);

const store = useTipoCombustibleStore();
const loading = computed(() => store.loading);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const isEdit = computed(() => !!props.initialData);

const form = ref({
  nombre: "",
  descripcion: "",
  activo: true,
});

watch(
  () => props.initialData,
  (val) => {
    if (val) {
      form.value = { ...val };
    } else {
      form.value = {
        nombre: "",
        descripcion: "",
        activo: true,
      };
    }
  },
  { immediate: true }
);

const onSubmit = async () => {
  let success;
  if (isEdit.value) {
    success = await store.updateTipoCombustible(
      props.initialData.id_tipo_combustible,
      form.value
    );
  } else {
    success = await store.createTipoCombustible(form.value);
  }

  if (success) {
    visible.value = false;
  }
};
</script>

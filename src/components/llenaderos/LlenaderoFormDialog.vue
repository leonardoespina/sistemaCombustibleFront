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

<<<<<<< HEAD
          <q-input
            v-model="form.capacidad"
            label="Capacidad (litros)"
            outlined
            dense
            type="number"
            step="0.01"
            min="0"
            :rules="[
              (val) => val === null || val === '' || val >= 0 || 'La capacidad debe ser mayor o igual a 0'
            ]"
          />

          <q-input
            v-model="form.disponibilidadActual"
            label="Disponibilidad Actual (litros)"
            outlined
            dense
            type="number"
            step="0.01"
            min="0"
            :rules="[
              (val) => val === null || val === '' || val >= 0 || 'La disponibilidad debe ser mayor o igual a 0',
              (val) => val === null || val === '' || !form.capacidad || val <= form.capacidad || 'La disponibilidad no puede ser mayor que la capacidad'
            ]"
          />

          <q-select
            v-model="form.id_combustible"
            :options="tipoCombustibleOptions"
            option-label="nombre"
            option-value="id_tipo_combustible"
            label="Tipo de Combustible"
            outlined
            dense
            emit-value
            map-options
            :loading="loadingTiposCombustible"
          />

=======
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
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
<<<<<<< HEAD
import { ref, computed, watch, onMounted } from "vue";
import { useLlenaderoStore } from "../../stores/llenaderoStore";
import { useTipoCombustibleStore } from "../../stores/tipoCombustibleStore";
=======
import { ref, computed, watch } from "vue";
import { useLlenaderoStore } from "../../stores/llenaderoStore";
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
});

const emit = defineEmits(["update:modelValue"]);

const store = useLlenaderoStore();
<<<<<<< HEAD
const tipoCombustibleStore = useTipoCombustibleStore();
const loading = computed(() => store.loading);
const loadingTiposCombustible = computed(() => tipoCombustibleStore.loading);
=======
const loading = computed(() => store.loading);
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const isEdit = computed(() => !!props.initialData);

const form = ref({
  nombre_llenadero: "",
<<<<<<< HEAD
  capacidad: null,
  disponibilidadActual: null,
  id_combustible: null,
  estado: "ACTIVO",
});

const tipoCombustibleOptions = computed(() => {
  return tipoCombustibleStore.rows ? tipoCombustibleStore.rows.filter(tc => tc.activo) : [];
});

=======
  estado: "ACTIVO",
});

>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
watch(
  () => props.initialData,
  (val) => {
    if (val) {
<<<<<<< HEAD
      form.value = { 
        nombre_llenadero: val.nombre_llenadero || "",
        capacidad: val.capacidad || null,
        disponibilidadActual: val.disponibilidadActual || null,
        id_combustible: val.id_combustible || null,
        estado: val.estado || "ACTIVO"
      };
    } else {
      form.value = {
        nombre_llenadero: "",
        capacidad: null,
        disponibilidadActual: null,
        id_combustible: null,
=======
      form.value = { ...val };
    } else {
      form.value = {
        nombre_llenadero: "",
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
        estado: "ACTIVO",
      };
    }
  },
  { immediate: true }
);

<<<<<<< HEAD
onMounted(async () => {
  if (!tipoCombustibleStore.rows || tipoCombustibleStore.rows.length === 0) {
    await tipoCombustibleStore.fetchTiposCombustible();
  }
});

=======
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
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
<<<<<<< HEAD
    // Limpiar el formulario después de crear o editar
    form.value = {
      nombre_llenadero: "",
      capacidad: null,
      disponibilidadActual: null,
      id_combustible: null,
      estado: "ACTIVO",
    };
=======
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
  }
};
</script>

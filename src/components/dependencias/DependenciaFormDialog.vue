<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <q-card style="width: 700px; max-width: 80vw">
      <q-card-section>
        <div class="text-h6">
          {{ isEditing ? "Editar Dependencia" : "Nueva Dependencia" }}
        </div>
      </q-card-section>

      <q-form @submit.prevent="onSave" class="q-gutter-md">
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-select
                dense
                v-model="formData.id_categoria"
                :options="categoriaOptions"
                option-value="id_categoria"
                option-label="nombre"
                label="Categoría"
                emit-value
                map-options
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                dense
                v-model="formData.nombre_dependencia"
                label="Nombre Dependencia"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input dense v-model="formData.codigo" label="Código" />
            </div>
            <div class="col-12 col-md-6">
              <q-input dense v-model="formData.ubicacion" label="Ubicación" />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                dense
                v-model="formData.nombre_apellido"
                label="Responsable (Nombre/Apellido)"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                dense
                v-model="formData.cedula"
                label="Cédula Responsable"
              />
            </div>
            <div class="col-12 col-md-6" v-if="isEditing">
              <q-select
                dense
                v-model="formData.estatus"
                :options="['ACTIVO', 'INACTIVO']"
                label="Estatus"
              />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn flat label="Guardar" type="submit" color="primary" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue";
import { useCategoriaStore } from "../../stores/categoriaStore.js";
import { storeToRefs } from "pinia";

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
  isEditing: Boolean,
});

const emit = defineEmits(["update:modelValue", "save", "dataUpdated"]);

const categoriaStore = useCategoriaStore();
const { rows: categoriaOptions } = storeToRefs(categoriaStore);

const formData = ref({});

// Listeners
onMounted(() => {
  categoriaStore.fetchCategorias();
  categoriaStore.initSocket();
});

onUnmounted(() => {
  categoriaStore.cleanupSocket();
});

watch(
  () => props.modelValue,
  (isNowOpen) => {
    if (isNowOpen) {
      formData.value = {
        id_categoria: props.initialData?.id_categoria || null,
        nombre_dependencia: props.initialData?.nombre_dependencia || "",
        nombre_apellido: props.initialData?.nombre_apellido || "",
        cedula: props.initialData?.cedula || "",
        ubicacion: props.initialData?.ubicacion || "",
        codigo: props.initialData?.codigo || "",
        estatus: props.initialData?.estatus || "ACTIVO",
      };
    }
  },
);

function onSave() {
  emit("save", formData.value);
}
</script>

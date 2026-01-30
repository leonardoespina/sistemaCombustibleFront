<!-- src/components/cupos/CupoFormDialog.vue -->
<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <q-card style="min-width: 450px">
      <q-card-section>
        <div class="text-h6">
          {{ isEditing ? "Editar Configuración de Cupo" : "Nueva Configuración de Cupo" }}
        </div>
      </q-card-section>

      <q-form @submit.prevent="onSave">
        <q-card-section class="q-gutter-md">
          <!-- Jerarquía Organizacional -->
          <OrganizationalHierarchy
            v-if="!isInitializing"
            v-model:categoryId="formData.id_categoria"
            v-model:dependencyId="formData.id_dependencia"
            v-model:subdependencyId="formData.id_subdependencia"
            :initial-category="mappedCategory"
            :initial-dependency="mappedDependency"
            :initial-subdependency="mappedSubdependency"
          />

          <!-- Tipo de Combustible -->
          <q-select
            dense
            v-model="formData.id_tipo_combustible"
            :options="tipoCombustibleOptions"
            label="Tipo de Combustible"
            option-label="nombre"
            option-value="id_tipo_combustible"
            emit-value
            map-options
            :loading="loadingTipos"
            :rules="[(val) => !!val || 'Campo requerido']"
          />

          <!-- Cantidad Mensual -->
          <q-input
            dense
            v-model.number="formData.cantidad_mensual"
            type="number"
            label="Asignación Mensual (Litros)"
            suffix="L"
            :rules="[
              (val) => !!val || 'Campo requerido',
              (val) => val > 0 || 'La cantidad debe ser mayor a 0'
            ]"
          />

          <q-toggle
            v-if="isEditing"
            v-model="formData.activo"
            label="Cupo Activo"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn flat label="Guardar" type="submit" color="primary" :loading="loading" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from "vue";
import { useTipoCombustibleStore } from "../../stores/tipoCombustibleStore";
import OrganizationalHierarchy from "../OrganizationalHierarchy.vue";

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
  isEditing: Boolean,
  loading: Boolean
});

const emit = defineEmits(["update:modelValue", "save"]);

const tipoCombustibleStore = useTipoCombustibleStore();
const formData = ref({});
const isInitializing = ref(false);

const tipoCombustibleOptions = computed(() => tipoCombustibleStore.rows);
const loadingTipos = computed(() => tipoCombustibleStore.loading);

// Mapeo manual de objetos iniciales para que tengan ID + Nombre
const mappedCategory = computed(() => {
  if (!props.initialData?.Categoria) return null;
  return {
    id_categoria: props.initialData.id_categoria,
    nombre: props.initialData.Categoria.nombre
  };
});

const mappedDependency = computed(() => {
  if (!props.initialData?.Dependencia) return null;
  return {
    id_dependencia: props.initialData.id_dependencia,
    nombre_dependencia: props.initialData.Dependencia.nombre_dependencia
  };
});

const mappedSubdependency = computed(() => {
  if (!props.initialData?.Subdependencia) return null;
  return {
    id_subdependencia: props.initialData.id_subdependencia,
    nombre: props.initialData.Subdependencia.nombre
  };
});

const initializeForm = async () => {
  isInitializing.value = true;
  
  if (props.initialData) {
    formData.value = {
      ...props.initialData,
      id_categoria: props.initialData.id_categoria,
      id_dependencia: props.initialData.id_dependencia,
      id_subdependencia: props.initialData.id_subdependencia,
      id_tipo_combustible: props.initialData.id_tipo_combustible,
      cantidad_mensual: props.initialData.cantidad_mensual,
      activo: props.initialData.activo ?? true,
    };
  } else {
    formData.value = {
      id_categoria: null,
      id_dependencia: null,
      id_subdependencia: null,
      id_tipo_combustible: null,
      cantidad_mensual: 0,
      activo: true,
    };
  }
  
  await nextTick();
  isInitializing.value = false;
};

watch(
  () => props.modelValue,
  async (val) => {
    if (val) {
      await initializeForm();
    }
  },
  { immediate: true }
);

onMounted(async () => {
  if (tipoCombustibleStore.rows.length === 0) {
    await tipoCombustibleStore.fetchTiposCombustible();
  }
});

function onSave() {
  const payload = { ...formData.value };
  // Limpiar relaciones circulares u objetos anidados antes de enviar
  delete payload.Categoria;
  delete payload.Dependencia;
  delete payload.Subdependencia;
  delete payload.TipoCombustible;
  
  emit("save", payload);
}
</script>

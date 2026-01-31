<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <q-card style="width: 800px; max-width: 90vw">
      <q-card-section>
        <div class="text-h6">
          {{ isEditing ? "Editar Registro" : "Nuevo Registro" }}
        </div>
      </q-card-section>

      <q-form @submit.prevent="onSave">
        <q-card-section class="q-pt-none">
          <!-- === TIPO DE ACTIVO (TOGGLE) === -->
          <div class="row q-mb-md bg-grey-1 q-pa-sm rounded-borders">
            <div class="col-12 flex items-center">
              <q-icon
                :name="formData.es_generador ? 'bolt' : 'directions_car'"
                size="sm"
                class="q-mr-sm text-grey-8"
              />
              <span class="text-subtitle2 q-mr-md">Tipo de Activo:</span>
              <q-toggle
                v-model="formData.es_generador"
                label="Es Generador / Planta Eléctrica"
                color="orange"
                left-label
              />
            </div>
          </div>

          <!-- === SIN PLACA (CHECKBOX) === -->
          <div class="row q-mb-md bg-grey-1 q-pa-sm rounded-borders">
            <div class="col-12 flex items-center">
              <q-checkbox
                v-model="formData.es_sin_placa"
                label="Sin Placa (Generar Correlativo)"
                color="primary"
                left-label
                @update:model-value="onSinPlacaChange"
              />
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <!-- Sección: Identificación -->
            <div class="col-12 text-subtitle2 text-primary">Identificación</div>

            <div class="col-4">
              <q-input
                dense
                v-model="formData.placa"
                :label="formData.es_generador ? 'Código de Activo' : 'Placa'"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>

            <!-- Sección: Datos Técnicos -->
            <div class="col-12 text-subtitle2 text-primary q-pt-sm">
              Datos Técnicos
            </div>

            <div class="col-12 col-md-4">
              <q-select
                dense
                filled
                use-input
                v-model="formData.id_marca"
                label="Marca"
                :options="filteredBrandOptions"
                @filter="filterBrandFn"
                option-value="id_marca"
                option-label="nombre"
                emit-value
                map-options
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-select
                dense
                filled
                v-model="formData.id_modelo"
                label="Modelo"
                :options="models"
                option-value="id_modelo"
                option-label="nombre"
                emit-value
                map-options
                :disable="!formData.id_marca"
                :loading="loadingModels"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-select
                dense
                filled
                v-model="formData.id_tipo_combustible"
                label="Tipo de Combustible"
                :options="tipoCombustibleStore.rows"
                option-value="id_tipo_combustible"
                option-label="nombre"
                emit-value
                map-options
                :loading="tipoCombustibleStore.loading"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>

            <!-- Sección: Ubicación Jerárquica -->
            <div class="col-12 text-subtitle2 text-primary q-pt-sm">
              Ubicación Jerárquica
            </div>

            <div class="col-12">
              <OrganizationalHierarchy
                v-if="!isInitializing"
                v-model:categoryId="formData.id_categoria"
                v-model:dependencyId="formData.id_dependencia"
                v-model:subdependencyId="formData.id_subdependencia"
                :initial-category="mappedCategory"
                :initial-dependency="mappedDependency"
                :initial-subdependency="mappedSubdependency"
              />
            </div>

            <div class="col-12" v-if="isEditing">
              <q-select
                dense
                v-model="formData.estado"
                :options="['ACTIVO', 'INACTIVO', 'MANTENIMIENTO']"
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
import { ref, watch, onMounted, toRefs, nextTick, computed } from "vue";
import { useTipoCombustibleStore } from "../../stores/tipoCombustibleStore";
import OrganizationalHierarchy from "../OrganizationalHierarchy.vue";
import api from "../../api/index.js";

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
  isEditing: Boolean,
  brands: { type: Array, default: () => [] },
  models: { type: Array, default: () => [] },
  loadingModels: Boolean,
});

const emit = defineEmits(["update:modelValue", "save", "brand-changed"]);

const formData = ref({});
const { brands, models } = toRefs(props);
const filteredBrandOptions = ref([]);
const loadingCorrelativo = ref(false);

const tipoCombustibleStore = useTipoCombustibleStore();

// Flag de inicialización
const isInitializing = ref(false);

// Mapeos para evitar IDs numéricos en el componente jerárquico
const mappedCategory = computed(() => {
  if (!props.initialData?.Categoria) return null;
  return {
    id_categoria: props.initialData.id_categoria,
    nombre: props.initialData.Categoria.nombre,
  };
});

const mappedDependency = computed(() => {
  if (!props.initialData?.Dependencia) return null;
  return {
    id_dependencia: props.initialData.id_dependencia,
    nombre_dependencia: props.initialData.Dependencia.nombre_dependencia,
  };
});

const mappedSubdependency = computed(() => {
  if (!props.initialData?.Subdependencia) return null;
  return {
    id_subdependencia: props.initialData.id_subdependencia,
    nombre: props.initialData.Subdependencia.nombre,
  };
});

onMounted(async () => {
  if (props.modelValue) await initializeForm();
});

watch(
  () => props.modelValue,
  async (val) => {
    if (val) await initializeForm();
  },
);

async function initializeForm() {
  isInitializing.value = true;

  // 1. Limpiar estado local
  formData.value = {};

  const data = props.initialData ? { ...props.initialData } : {};

  // 2. Cargar tipos de combustible si no están
  if (tipoCombustibleStore.rows.length === 0) {
    await tipoCombustibleStore.fetchTiposCombustible();
  }

  // 3. Mapeo de valores (Asegurando tipos numéricos)
  formData.value = {
    placa: data.placa || "",
    es_generador: !!data.es_generador,
    id_marca: data.id_marca ? Number(data.id_marca) : null,
    id_modelo: data.id_modelo ? Number(data.id_modelo) : null,
    id_tipo_combustible: data.id_tipo_combustible
      ? Number(data.id_tipo_combustible)
      : null,
    id_categoria: data.id_categoria ? Number(data.id_categoria) : null,
    id_dependencia: data.id_dependencia ? Number(data.id_dependencia) : null,
    id_subdependencia: data.id_subdependencia
      ? Number(data.id_subdependencia)
      : null,
    estado: data.estado || "ACTIVO",
  };

  if (props.isEditing && data.id_marca) {
    emit("brand-changed", data.id_marca);
  }

  filteredBrandOptions.value = brands.value;

  await nextTick();
  isInitializing.value = false;
}

// --- CASCADA MARCA/MODELO ---

watch(
  () => formData.value.id_marca,
  (newVal, oldVal) => {
    if (isInitializing.value) return;
    if (newVal !== oldVal) {
      if (oldVal !== undefined && oldVal !== null)
        formData.value.id_modelo = null;
      if (newVal) emit("brand-changed", newVal);
    }
  },
);

function filterBrandFn(val, update) {
  if (val === "") {
    update(() => {
      filteredBrandOptions.value = brands.value;
    });
    return;
  }
  update(() => {
    const needle = val.toLowerCase();
    filteredBrandOptions.value = brands.value.filter(
      (v) => v.nombre.toLowerCase().indexOf(needle) > -1,
    );
  });
}

// --- OBTENER ÚLTIMO CORRELATIVO ---
async function obtenerUltimoCorrelativo() {
  try {
    loadingCorrelativo.value = true;
    const response = await api.get("/vehiculos-sin-placa/ultimo-correlativo");
    return response.data;
  } catch (error) {
    console.error("Error al obtener último correlativo:", error);
    return null;
  } finally {
    loadingCorrelativo.value = false;
  }
}

// --- MANEJADOR DEL CHECKBOX SIN PLACA ---
async function onSinPlacaChange() {
  if (formData.value.es_sin_placa) {
    const data = await obtenerUltimoCorrelativo();
    if (data && data.placaGenerada) {
      formData.value.placa = data.placaGenerada;
    } else {
      // Fallback en caso de error
      formData.value.placa = "SPMB0053";
    }
  } else {
    // Si desmarca, limpiar el campo
    formData.value.placa = "";
  }
}

async function onSave() {
  await nextTick();
  const payload = {
    ...formData.value,
    id_marca: formData.value.id_marca ? Number(formData.value.id_marca) : null,
    id_modelo: formData.value.id_modelo
      ? Number(formData.value.id_modelo)
      : null,
    id_categoria: formData.value.id_categoria
      ? Number(formData.value.id_categoria)
      : null,
    id_dependencia: formData.value.id_dependencia
      ? Number(formData.value.id_dependencia)
      : null,
    id_tipo_combustible: formData.value.id_tipo_combustible
      ? Number(formData.value.id_tipo_combustible)
      : null,
    id_subdependencia: formData.value.id_subdependencia
      ? Number(formData.value.id_subdependencia)
      : null,
  };
  emit("save", payload);
}
</script>

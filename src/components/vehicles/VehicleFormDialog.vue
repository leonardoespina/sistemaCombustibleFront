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

          <div class="row q-col-gutter-md">
            <!-- Sección: Identificación -->
            <div class="col-12 text-subtitle2 text-primary">Identificación</div>

            <div class="col-12">
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
                :options="fuelTypeOptions"
                option-value="id_tipo_combustible"
                option-label="nombre"
                emit-value
                map-options
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>

            <!-- Sección: Ubicación Jerárquica -->
            <div class="col-12 text-subtitle2 text-primary q-pt-sm">
              Ubicación Jerárquica
            </div>

            <div class="col-12 col-md-4">
              <q-select
                dense
                filled
                v-model="formData.id_categoria"
                label="Categoría"
                :options="categoryOptions"
                use-input
                input-debounce="300"
                @filter="filterCategory"
                option-value="id_categoria"
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
                v-model="formData.id_dependencia"
                label="Dependencia"
                :options="dependencyOptions"
                :disable="!formData.id_categoria"
                use-input
                input-debounce="300"
                @filter="filterDependency"
                option-value="id_dependencia"
                option-label="nombre_dependencia"
                emit-value
                map-options
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-select
                dense
                filled
                v-model="formData.id_subdependencia"
                label="Subdependencia (Opcional)"
                :options="subdependencyOptions"
                :disable="!formData.id_dependencia"
                use-input
                input-debounce="300"
                @filter="filterSubdependency"
                option-value="id_subdependencia"
                option-label="nombre"
                emit-value
                map-options
                clearable
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
import { ref, watch, onMounted, toRefs, nextTick } from "vue";
import api from "../../api";

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

// Opciones Locales
const categoryOptions = ref([]);
const dependencyOptions = ref([]);
const subdependencyOptions = ref([]);
const fuelTypeOptions = ref([]);

// Flag de inicialización
const isInitializing = ref(false);

onMounted(async () => {
    if (props.modelValue) await initializeForm();
});

watch(() => props.modelValue, async (val) => {
    if (val) await initializeForm();
});

async function initializeForm() {
    isInitializing.value = true;
    
    // 1. Limpiar estado local
    categoryOptions.value = [];
    dependencyOptions.value = [];
    subdependencyOptions.value = [];
    formData.value = {};

    const data = props.initialData ? { ...props.initialData } : {};
    
    // 2. Inyección Proactiva de Opciones (Eager Loading)
    if (props.isEditing) {
        if (data.Categoria) categoryOptions.value = [data.Categoria];
        if (data.Dependencia) dependencyOptions.value = [data.Dependencia];
        if (data.Subdependencia) subdependencyOptions.value = [data.Subdependencia];
        if (data.TipoCombustible) fuelTypeOptions.value = [data.TipoCombustible];
        
        // Disparar carga de modelos para la marca actual
        if (data.id_marca) emit("brand-changed", data.id_marca);
    } else {
        // Cargar listas iniciales si es nuevo registro
        await filterCategory("", (opts) => opts());
        await loadFuelTypes();
    }

    // 3. Mapeo de valores (Asegurando tipos numéricos)
    formData.value = {
        placa: data.placa || "",
        es_generador: !!data.es_generador,
        id_marca: data.id_marca ? Number(data.id_marca) : null,
        id_modelo: data.id_modelo ? Number(data.id_modelo) : null,
        id_tipo_combustible: data.id_tipo_combustible ? Number(data.id_tipo_combustible) : null,
        id_categoria: data.id_categoria ? Number(data.id_categoria) : null,
        id_dependencia: data.id_dependencia ? Number(data.id_dependencia) : null,
        id_subdependencia: data.id_subdependencia ? Number(data.id_subdependencia) : null,
        estado: data.estado || "ACTIVO",
    };

    // Cargas asíncronas de fondo (si no se inyectaron)
    if (fuelTypeOptions.value.length === 0) loadFuelTypes();
    filteredBrandOptions.value = brands.value;

    await nextTick();
    isInitializing.value = false;
}

async function loadFuelTypes() {
  try {
    const response = await api.get("/tipos-combustible/lista");
    const list = Array.isArray(response.data) ? response.data : (response.data?.data || []);
    fuelTypeOptions.value = list;
  } catch (error) { console.error(error); }
}

// --- FILTROS JERÁRQUICOS ---

async function filterCategory(val, update) {
  update(async () => {
    try {
      const { data } = await api.get("/categorias/jerarquia", { params: { search: val } });
      categoryOptions.value = data.data;
    } catch (error) { console.error(error); }
  });
}

async function filterDependency(val, update) {
  if (!formData.value.id_categoria) {
    update(() => { dependencyOptions.value = []; });
    return;
  }
  update(async () => {
    try {
      const { data } = await api.get("/categorias/jerarquia", {
        params: { type: "categoria", parentId: formData.value.id_categoria, search: val },
      });
      dependencyOptions.value = data.data;
    } catch (error) { console.error(error); }
  });
}

async function filterSubdependency(val, update) {
  if (!formData.value.id_dependencia) {
    update(() => { subdependencyOptions.value = []; });
    return;
  }
  update(async () => {
    try {
      const { data } = await api.get("/categorias/jerarquia", {
        params: { type: "dependencia", parentId: formData.value.id_dependencia, search: val },
      });
      subdependencyOptions.value = data.data;
    } catch (error) { console.error(error); }
  });
}

// --- CASCADA (Alineada con UserFormDialog) ---

watch(() => formData.value.id_marca, (newVal, oldVal) => {
    if (isInitializing.value) return;
    if (newVal !== oldVal) {
        if (oldVal !== undefined && oldVal !== null) formData.value.id_modelo = null;
        if (newVal) emit("brand-changed", newVal);
    }
});

watch(() => formData.value.id_categoria, (newVal, oldVal) => {
    if (isInitializing.value) return;
    if (newVal !== oldVal) {
        if (oldVal !== undefined && oldVal !== null) {
            formData.value.id_dependencia = null;
            formData.value.id_subdependencia = null;
            dependencyOptions.value = [];
            subdependencyOptions.value = [];
        }
    }
});

watch(() => formData.value.id_dependencia, (newVal, oldVal) => {
    if (isInitializing.value) return;
    if (newVal !== oldVal) {
        if (oldVal !== undefined && oldVal !== null) {
            formData.value.id_subdependencia = null;
            subdependencyOptions.value = [];
        }
    }
});

function filterBrandFn(val, update) {
  if (val === "") {
    update(() => { filteredBrandOptions.value = brands.value; });
    return;
  }
  update(() => {
    const needle = val.toLowerCase();
    filteredBrandOptions.value = brands.value.filter(v => v.nombre.toLowerCase().indexOf(needle) > -1);
  });
}

async function onSave() {
  await nextTick();
  const payload = {
    ...formData.value,
    id_marca: formData.value.id_marca ? Number(formData.value.id_marca) : null,
    id_modelo: formData.value.id_modelo ? Number(formData.value.id_modelo) : null,
    id_categoria: formData.value.id_categoria ? Number(formData.value.id_categoria) : null,
    id_dependencia: formData.value.id_dependencia ? Number(formData.value.id_dependencia) : null,
    id_tipo_combustible: formData.value.id_tipo_combustible ? Number(formData.value.id_tipo_combustible) : null,
    id_subdependencia: formData.value.id_subdependencia ? Number(formData.value.id_subdependencia) : null,
  };
  emit("save", payload);
}
</script>

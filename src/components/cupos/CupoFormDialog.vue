<template>
  <q-dialog v-model="visible" persistent>
    <q-card style="min-width: 500px">
      <q-card-section class="row items-center">
        <div class="text-h6">
          {{
            isEdit ? "Editar Configuración de Cupo" : "Nueva Asignación de Cupo"
          }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <!-- Select Categoría -->
          <q-select
            v-model="form.id_categoria"
            :options="categoriaOptions"
            label="Categoría *"
            outlined
            dense
            option-label="nombre"
            option-value="id_categoria"
            emit-value
            map-options
            :disable="isEdit"
            :rules="[(val) => !!val || 'Requerido']"
            use-input
            @filter="filterCategoria"
          />

          <!-- Select Dependencia -->
          <q-select
            v-model="form.id_dependencia"
            :options="dependenciaOptions"
            label="Dependencia *"
            outlined
            dense
            option-label="nombre_dependencia"
            option-value="id_dependencia"
            emit-value
            map-options
            :disable="!form.id_categoria || isEdit"
            :rules="[(val) => !!val || 'Requerido']"
            use-input
            @filter="filterDependencia"
          />

          <!-- Select Subdependencia -->
          <q-select
            v-model="form.id_subdependencia"
            :options="subdependenciaOptions"
            label="Subdependencia (Opcional)"
            outlined
            dense
            option-label="nombre"
            option-value="id_subdependencia"
            emit-value
            map-options
            :disable="!form.id_dependencia || isEdit"
            use-input
            @filter="filterSubdependencia"
          />

          <!-- Select Tipo Combustible -->
          <q-select
            v-model="form.id_tipo_combustible"
            :options="combustibleOptions"
            label="Tipo de Combustible *"
            outlined
            dense
            option-label="nombre"
            option-value="id_tipo_combustible"
            emit-value
            map-options
            :disable="isEdit"
            :rules="[(val) => !!val || 'Requerido']"
          />

          <!-- Cantidad Mensual -->
          <q-input
            v-model.number="form.cantidad_mensual"
            label="Cupo Mensual (Litros) *"
            outlined
            dense
            type="number"
            min="0"
            :rules="[(val) => val > 0 || 'Debe ser mayor a 0']"
          />

          <!-- Activo -->
          <q-toggle
            v-if="isEdit"
            v-model="form.activo"
            label="Cupo Activo"
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
              :label="isEdit ? 'Actualizar' : 'Asignar'"
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
import { ref, computed, watch, onMounted } from "vue";
import { useCupoStore } from "../../stores/cupoStore";
import api from "../../api";

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
});

const emit = defineEmits(["update:modelValue"]);

const store = useCupoStore();
const loading = computed(() => store.loadingBase);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const isEdit = computed(() => !!props.initialData);

const form = ref({
  id_categoria: null,
  id_dependencia: null,
  id_tipo_combustible: null,
  cantidad_mensual: 0,
  activo: true,
});

const categoriaOptions = ref([]);
const dependenciaOptions = ref([]);
const subdependenciaOptions = ref([]);
const combustibleOptions = ref([]);

// --- CARGA DE DATOS ---

const loadCombustibles = async () => {
  try {
    const { data } = await api.get("/tipos-combustible/lista");
    combustibleOptions.value = data;
  } catch (e) {
    console.error(e);
  }
};

const filterCategoria = async (val, update) => {
  update(async () => {
    try {
      const { data } = await api.get("/categorias/jerarquia", {
        params: { search: val },
      });
      categoriaOptions.value = data.data;
    } catch (e) {
      console.error(e);
    }
  });
};

const filterDependencia = async (val, update) => {
  if (!form.value.id_categoria) {
    update(() => {
      dependenciaOptions.value = [];
    });
    return;
  }
  update(async () => {
    try {
      const { data } = await api.get("/categorias/jerarquia", {
        params: {
          type: "categoria",
          parentId: form.value.id_categoria,
          search: val,
        },
      });
      dependenciaOptions.value = data.data;
    } catch (e) {
      console.error(e);
    }
  });
};

const filterSubdependencia = async (val, update) => {
  if (!form.value.id_dependencia) {
    update(() => {
      subdependenciaOptions.value = [];
    });
    return;
  }
  update(async () => {
    try {
      const { data } = await api.get("/categorias/jerarquia", {
        params: {
          type: "dependencia",
          parentId: form.value.id_dependencia,
          search: val,
        },
      });
      subdependenciaOptions.value = data.data;
    } catch (e) {
      console.error(e);
    }
  });
};

// --- WATCHERS ---

watch(
  () => props.initialData,
  async (val) => {
    if (val) {
      // Cargar opciones para mostrar labels correctos en edición
      await filterCategoria("", (fn) => fn());
      form.value = { ...val };
      // Cargar dependencias de esa categoría
      await filterDependencia("", (fn) => fn());
      // Cargar subdependencias si existe dependencia
      if (val.id_dependencia) {
        await filterSubdependencia("", (fn) => fn());
      }
    } else {
      form.value = {
        id_categoria: null,
        id_dependencia: null,
        id_tipo_combustible: null,
        cantidad_mensual: 0,
        activo: true,
      };
    }
  },
  { immediate: true },
);

watch(
  () => form.value.id_categoria,
  () => {
    if (!isEdit.value) {
      // Solo limpiar si es nuevo
      form.value.id_dependencia = null;
      form.value.id_subdependencia = null;
      dependenciaOptions.value = [];
      subdependenciaOptions.value = [];
    }
  },
);

watch(
  () => form.value.id_dependencia,
  () => {
    if (!isEdit.value) {
      form.value.id_subdependencia = null;
      subdependenciaOptions.value = [];
    }
  },
);

// --- SUBMIT ---

const onSubmit = async () => {
  let success;
  if (isEdit.value) {
    success = await store.updateCupoBase(props.initialData.id_cupo_base, {
      cantidad_mensual: form.value.cantidad_mensual,
      activo: form.value.activo,
    });
  } else {
    success = await store.createCupoBase({
      ...form.value,
      id_subdependencia: form.value.id_subdependencia || null,
    });
  }

  if (success) {
    visible.value = false;
  }
};

onMounted(() => {
  loadCombustibles();
});
</script>

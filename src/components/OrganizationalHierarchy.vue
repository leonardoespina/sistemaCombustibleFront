<template>
  <div class="organizational-hierarchy">
    <div class="text-subtitle2 q-mb-xs">Ubicación Organizacional</div>

    <q-select
      dense
      v-model="internalCategoryId"
      :options="categoriaOptions"
      label="Categoría"
      @filter="filterCategoria"
      @virtual-scroll="onScrollCategoria"
      option-label="nombre"
      option-value="id_categoria"
      emit-value
      map-options
      :loading="pagination.categoria.loading"
      :rules="[(val) => !!val || 'Campo requerido']"
    >
      <template v-slot:no-option>
        <q-item>
          <q-item-section class="text-grey"> No hay resultados </q-item-section>
        </q-item>
      </template>
    </q-select>

    <q-select
      dense
      v-model="internalDependencyId"
      :options="dependenciaOptions"
      label="Dependencia"
      :disable="!internalCategoryId"
      @filter="filterDependencia"
      @virtual-scroll="onScrollDependencia"
      option-label="nombre_dependencia"
      option-value="id_dependencia"
      emit-value
      map-options
      :loading="pagination.dependencia.loading"
      :rules="[(val) => !!val || 'Campo requerido']"
    >
      <template v-slot:no-option>
        <q-item>
          <q-item-section class="text-grey"> No hay resultados </q-item-section>
        </q-item>
      </template>
    </q-select>

    <q-select
      dense
      v-model="internalSubdependencyId"
      :options="subdependenciaOptions"
      label="Subdependencia"
      :disable="!internalDependencyId"
      @filter="filterSubdependencia"
      @virtual-scroll="onScrollSubdependencia"
      option-label="nombre"
      option-value="id_subdependencia"
      emit-value
      map-options
      clearable
      :loading="pagination.subdependencia.loading"
    >
      <template v-slot:no-option>
        <q-item>
          <q-item-section class="text-grey"> No hay resultados </q-item-section>
        </q-item>
      </template>
    </q-select>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import api from "../api";

const props = defineProps({
  categoryId: {
    type: [Number, String, null],
    default: null,
  },
  dependencyId: {
    type: [Number, String, null],
    default: null,
  },
  subdependencyId: {
    type: [Number, String, null],
    default: null,
  },
  initialCategory: {
    type: Object,
    default: null,
  },
  initialDependency: {
    type: Object,
    default: null,
  },
  initialSubdependency: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits([
  "update:categoryId",
  "update:dependencyId",
  "update:subdependencyId",
]);

// Options State
const categoriaOptions = ref([]);
const dependenciaOptions = ref([]);
const subdependenciaOptions = ref([]);

// Pagination State
const pagination = ref({
  categoria: { page: 1, hasMore: true, loading: false, search: "" },
  dependencia: { page: 1, hasMore: true, loading: false, search: "" },
  subdependencia: { page: 1, hasMore: true, loading: false, search: "" },
});

const LIMIT = 20;

// Internal V-Models (Proxies to Props)
const internalCategoryId = computed({
  get: () => props.categoryId,
  set: (val) => emit("update:categoryId", val),
});

const internalDependencyId = computed({
  get: () => props.dependencyId,
  set: (val) => emit("update:dependencyId", val),
});

const internalSubdependencyId = computed({
  get: () => props.subdependencyId,
  set: (val) => emit("update:subdependencyId", val),
});

// Flag to prevent cascading clears during initialization
const isInitializing = ref(false);

// Initialization Logic
onMounted(async () => {
  isInitializing.value = true;
  await initializeOptions();
  isInitializing.value = false;
});

// Re-run initialization if initial props change drastically (optional, depending on use case)
watch(
  () => [props.initialCategory, props.initialDependency],
  async () => {
    if (
      props.categoryId &&
      props.initialCategory?.id_categoria === props.categoryId
    ) {
      if (
        !categoriaOptions.value.find((o) => o.id_categoria === props.categoryId)
      ) {
        categoriaOptions.value = [props.initialCategory];
      }
    }
  },
);

async function initializeOptions() {
  if (props.initialCategory) {
    categoriaOptions.value = [props.initialCategory];
  } else {
    await filterCategoria("", (opts) => opts());
  }

  if (props.initialDependency) {
    dependenciaOptions.value = [props.initialDependency];
  }

  if (props.initialSubdependency) {
    subdependenciaOptions.value = [props.initialSubdependency];
  }
}

// Cascading Watchers
watch(internalCategoryId, (newVal, oldVal) => {
  if (isInitializing.value) return;
  if (newVal !== oldVal) {
    if (oldVal !== undefined) {
      internalDependencyId.value = null;
      internalSubdependencyId.value = null;
      dependenciaOptions.value = [];
      subdependenciaOptions.value = [];
      resetPagination("dependencia");
      resetPagination("subdependencia");
    }
  }
});

watch(internalDependencyId, (newVal, oldVal) => {
  if (isInitializing.value) return;
  if (newVal !== oldVal) {
    if (oldVal !== undefined) {
      internalSubdependencyId.value = null;
      subdependenciaOptions.value = [];
      resetPagination("subdependencia");
    }
  }
});

const resetPagination = (type) => {
  pagination.value[type] = {
    page: 1,
    hasMore: true,
    loading: false,
    search: "",
  };
};

// Filter Functions (Lazy Loading / Server Side)
const filterCategoria = async (val, update) => {
  if (
    val === pagination.value.categoria.search &&
    categoriaOptions.value.length > 0
  ) {
    update();
    return;
  }

  update(async () => {
    resetPagination("categoria");
    pagination.value.categoria.search = val;
    await fetchCategorias();
  });
};

const fetchCategorias = async () => {
  if (pagination.value.categoria.loading || !pagination.value.categoria.hasMore)
    return;

  pagination.value.categoria.loading = true;
  try {
    const { data } = await api.get("/categorias/jerarquia", {
      params: {
        search: pagination.value.categoria.search,
        page: pagination.value.categoria.page,
        limit: LIMIT,
      },
    });

    const newOptions = data.data || [];
    if (pagination.value.categoria.page === 1) {
      categoriaOptions.value = newOptions;
    } else {
      categoriaOptions.value.push(...newOptions);
    }

    pagination.value.categoria.hasMore = newOptions.length === LIMIT;
    pagination.value.categoria.page++;
  } catch (error) {
    console.error("Error cargando categorías:", error);
  } finally {
    pagination.value.categoria.loading = false;
  }
};

const filterDependencia = async (val, update) => {
  if (!internalCategoryId.value) {
    update(() => {
      dependenciaOptions.value = [];
    });
    return;
  }

  if (
    val === pagination.value.dependencia.search &&
    dependenciaOptions.value.length > 0
  ) {
    update();
    return;
  }

  update(async () => {
    resetPagination("dependencia");
    pagination.value.dependencia.search = val;
    await fetchDependencias();
  });
};

const fetchDependencias = async () => {
  if (
    pagination.value.dependencia.loading ||
    !pagination.value.dependencia.hasMore ||
    !internalCategoryId.value
  )
    return;

  pagination.value.dependencia.loading = true;
  try {
    const { data } = await api.get("/categorias/jerarquia", {
      params: {
        type: "categoria",
        parentId: internalCategoryId.value,
        search: pagination.value.dependencia.search,
        page: pagination.value.dependencia.page,
        limit: LIMIT,
      },
    });

    const newOptions = data.data || [];
    if (pagination.value.dependencia.page === 1) {
      dependenciaOptions.value = newOptions;
    } else {
      dependenciaOptions.value.push(...newOptions);
    }

    pagination.value.dependencia.hasMore = newOptions.length === LIMIT;
    pagination.value.dependencia.page++;
  } catch (error) {
    console.error("Error cargando dependencias:", error);
  } finally {
    pagination.value.dependencia.loading = false;
  }
};

const filterSubdependencia = async (val, update) => {
  if (!internalDependencyId.value) {
    update(() => {
      subdependenciaOptions.value = [];
    });
    return;
  }

  if (
    val === pagination.value.subdependencia.search &&
    subdependenciaOptions.value.length > 0
  ) {
    update();
    return;
  }

  update(async () => {
    resetPagination("subdependencia");
    pagination.value.subdependencia.search = val;
    await fetchSubdependencias();
  });
};

const fetchSubdependencias = async () => {
  if (
    pagination.value.subdependencia.loading ||
    !pagination.value.subdependencia.hasMore ||
    !internalDependencyId.value
  )
    return;

  pagination.value.subdependencia.loading = true;
  try {
    const { data } = await api.get("/categorias/jerarquia", {
      params: {
        type: "dependencia",
        parentId: internalDependencyId.value,
        search: pagination.value.subdependencia.search,
        page: pagination.value.subdependencia.page,
        limit: LIMIT,
      },
    });

    const newOptions = data.data || [];
    if (pagination.value.subdependencia.page === 1) {
      subdependenciaOptions.value = newOptions;
    } else {
      subdependenciaOptions.value.push(...newOptions);
    }

    pagination.value.subdependencia.hasMore = newOptions.length === LIMIT;
    pagination.value.subdependencia.page++;
  } catch (error) {
    console.error("Error cargando subdependencias:", error);
  } finally {
    pagination.value.subdependencia.loading = false;
  }
};

const onScrollCategoria = ({ index, to, ref }) => {
  const lastIndex = categoriaOptions.value.length - 1;
  if (
    !pagination.value.categoria.loading &&
    pagination.value.categoria.hasMore &&
    to === lastIndex
  ) {
    fetchCategorias();
  }
};

const onScrollDependencia = ({ index, to, ref }) => {
  const lastIndex = dependenciaOptions.value.length - 1;
  if (
    !pagination.value.dependencia.loading &&
    pagination.value.dependencia.hasMore &&
    to === lastIndex
  ) {
    fetchDependencias();
  }
};

const onScrollSubdependencia = ({ index, to, ref }) => {
  const lastIndex = subdependenciaOptions.value.length - 1;
  if (
    !pagination.value.subdependencia.loading &&
    pagination.value.subdependencia.hasMore &&
    to === lastIndex
  ) {
    fetchSubdependencias();
  }
};
</script>

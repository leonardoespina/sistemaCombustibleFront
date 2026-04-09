<!-- src/components/fingerprint/BiometriaSubdependenciasSelect.vue -->
<template>
  <q-select
    v-model="internalValue"
    :options="options"
    label="Subdependencias autorizadas"
    option-label="nombre"
    option-value="id_subdependencia"
    emit-value
    map-options
    multiple
    use-chips
    use-input
    input-debounce="300"
    outlined
    dense
    bg-color="grey-1"
    :loading="loading"
    :rules="[(val) => (val && val.length > 0) || 'Requerido: al menos una subdependencia']"
    hide-bottom-space
    @filter="onFilter"
    @virtual-scroll="onScroll"
    @popup-show="onPopupShow"
  >
    <template v-slot:no-option>
      <q-item>
        <q-item-section class="text-grey">Sin resultados</q-item-section>
      </q-item>
    </template>

    <template v-slot:option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section>
          <q-item-label>{{ scope.opt.nombre }}</q-item-label>
          <q-item-label caption v-if="scope.opt.Dependencia">
            {{ scope.opt.Dependencia.nombre_dependencia }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </template>

    <template v-slot:hint>
      <span class="text-grey-6">Al menos una subdependencia requerida</span>
    </template>
  </q-select>
</template>

<script setup>
import { ref, computed } from "vue";
import api from "../../api";

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  // Opciones iniciales para pre-cargar los objetos seleccionados y que
  // Quasar pueda mostrar el nombre en lugar de solo el ID
  initialOptions: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:modelValue"]);

const internalValue = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

// --- Estado de paginación y carga ---
const options = ref([]);
const loading = ref(false);
const currentSearch = ref("");
const page = ref(1);
const hasMore = ref(true);
const LIMIT = 30;

// Inicializa las opciones con los registros ya asignados para que se vean bien
import { onMounted } from "vue";
onMounted(() => {
  if (props.initialOptions && props.initialOptions.length > 0) {
    options.value = [...props.initialOptions];
  }
});

// --- Fetch todas las subdependencias con lazy loading ---
const fetchSubdependencias = async (reset = false) => {
  if (loading.value || (!hasMore.value && !reset)) return;

  if (reset) {
    options.value = [];
    page.value = 1;
    hasMore.value = true;
  }

  loading.value = true;
  try {
    const { data } = await api.get("/subdependencias", {
      params: {
        search: currentSearch.value,
        page: page.value,
        limit: LIMIT,
        estatus: "ACTIVO",
      },
    });

    const newItems = data.data || data || [];
    options.value.push(...newItems);
    hasMore.value = newItems.length === LIMIT;
    page.value++;
  } catch (error) {
    console.error("[BiometriaSubdependenciasSelect] Error:", error);
  } finally {
    loading.value = false;
  }
};

// --- Filtro (búsqueda por texto) ---
const onFilter = (val, update) => {
  if (val === currentSearch.value && options.value.length > 0) {
    update();
    return;
  }
  update(async () => {
    currentSearch.value = val;
    await fetchSubdependencias(true);
  });
};

// --- Scroll infinito ---
const onScroll = ({ to }) => {
  const lastIndex = options.value.length - 1;
  if (!loading.value && hasMore.value && to === lastIndex) {
    fetchSubdependencias();
  }
};

// --- Al abrir el dropdown ---
const onPopupShow = () => {
  if (options.value.length === 0) {
    fetchSubdependencias(true);
  }
};
</script>

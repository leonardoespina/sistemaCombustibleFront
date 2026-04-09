<!-- src/components/fingerprint/BiometriaSubdependenciasSelect.vue -->
<!--
  Multi-select de subdependencias para el registro biométrico.
  Filtra las subdependencias según la dependencia seleccionada (idDependencia).
  Permite asignar N subdependencias a una persona (relación M:N).
  Al menos 1 subdependencia es obligatoria.
-->
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
    :disable="!idDependencia"
    :rules="[(val) => (val && val.length > 0) || 'Requerido: al menos una subdependencia']"
    hide-bottom-space
    @filter="onFilter"
    @virtual-scroll="onScroll"
    @popup-show="onPopupShow"
  >
    <template v-slot:no-option>
      <q-item>
        <q-item-section class="text-grey">
          {{ idDependencia ? 'Sin resultados' : 'Seleccione una Dependencia primero' }}
        </q-item-section>
      </q-item>
    </template>

    <template v-slot:option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section>
          <q-item-label>{{ scope.opt.nombre }}</q-item-label>
        </q-item-section>
      </q-item>
    </template>

    <template v-slot:hint>
      <span class="text-grey-6">
        {{ idDependencia ? 'Al menos una subdependencia requerida' : 'Seleccione una Dependencia primero' }}
      </span>
    </template>
  </q-select>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import api from "../../api";

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  // ID de la dependencia seleccionada — filtra las opciones disponibles
  idDependencia: {
    type: [Number, String, null],
    default: null,
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

/**
 * Flag que distingue la carga inicial (edición de registro existente)
 * del cambio manual de dependencia que el usuario hace en el formulario.
 * En la carga inicial NO se borran las subdependencias ya seleccionadas.
 */
const isFirstLoad = ref(true);

// --- Fetch subdependencias filtradas por dependencia ---
const fetchSubdependencias = async (reset = false) => {
  if (!props.idDependencia) return;
  if (loading.value || (!hasMore.value && !reset)) return;

  if (reset) {
    options.value = [];
    page.value = 1;
    hasMore.value = true;
  }

  loading.value = true;
  try {
    const { data } = await api.get("/categorias/jerarquia", {
      params: {
        type: "dependencia",       // subdependencias hijas de la dependencia
        parentId: props.idDependencia,
        search: currentSearch.value,
        page: page.value,
        limit: LIMIT,
      },
    });

    const newItems = data.data || [];
    options.value.push(...newItems);
    hasMore.value = newItems.length === LIMIT;
    page.value++;
  } catch (error) {
    console.error("[BiometriaSubdependenciasSelect] Error:", error);
  } finally {
    loading.value = false;
  }
};

/**
 * Cuando cambia la dependencia:
 * - Primera vez (carga inicial en modo edición): solo recarga opciones, NO borra la selección.
 * - Cambios posteriores (usuario cambia dependencia): borra selección y recarga.
 */
watch(
  () => props.idDependencia,
  (newVal) => {
    if (isFirstLoad.value) {
      // Primera carga: cargar las opciones para que los chips se muestren con label correcto,
      // pero NO borrar los valores ya seleccionados por loadInitialData
      isFirstLoad.value = false;
      options.value = [];
      currentSearch.value = "";
      page.value = 1;
      hasMore.value = true;
      if (newVal) fetchSubdependencias(true);
      return;
    }

    // El usuario cambió de dependencia manualmente: limpiar selección y recargar
    emit("update:modelValue", []);
    options.value = [];
    currentSearch.value = "";
    page.value = 1;
    hasMore.value = true;
    if (newVal) fetchSubdependencias(true);
  }
);

// --- Filtro (búsqueda por texto) ---
const onFilter = (val, update) => {
  if (!props.idDependencia) {
    update(() => { options.value = []; });
    return;
  }
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
  if (props.idDependencia && options.value.length === 0) {
    fetchSubdependencias(true);
  }
};
</script>

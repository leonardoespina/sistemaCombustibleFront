import { ref, watch, computed, nextTick, toRefs, onMounted } from "vue";
import { useTipoCombustibleStore } from "../../../stores/tipoCombustibleStore";
import api from "../../../api/index.js";

export function useVehicleForm(props, emit) {
  const formData = ref({});
  const filteredBrandOptions = ref([]);
  const loadingCorrelativo = ref(false);
  const isInitializing = ref(false);

  const tipoCombustibleStore = useTipoCombustibleStore();
  const { brands } = toRefs(props);

  // --- Computed Properties para OrganizationalHierarchy ---
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

  // --- Inicialización ---
  const initializeForm = async () => {
    isInitializing.value = true;
    formData.value = {}; // Reset

    const data = props.initialData ? { ...props.initialData } : {};

    // Cargar tipos de combustible si es necesario
    if (tipoCombustibleStore.rows.length === 0) {
      await tipoCombustibleStore.fetchTiposCombustible();
    }

    formData.value = {
      placa: data.placa || "",
      es_generador: !!data.es_generador,
      es_sin_placa: false, // Por defecto false al abrir
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

    filteredBrandOptions.value = brands.value || [];

    await nextTick();
    isInitializing.value = false;
  };

  // --- Filtrado de Marcas ---
  const filterBrandFn = (val, update) => {
    if (val === "") {
      update(() => {
        filteredBrandOptions.value = brands.value;
      });
      return;
    }
    update(() => {
      const needle = val.toLowerCase();
      if (Array.isArray(brands.value)) {
        filteredBrandOptions.value = brands.value.filter(
          (v) => v.nombre.toLowerCase().indexOf(needle) > -1,
        );
      }
    });
  };

  // --- Lógica de Sin Placa ---
  const obtenerUltimoCorrelativo = async () => {
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
  };

  const onSinPlacaChange = async () => {
    if (formData.value.es_sin_placa) {
      const data = await obtenerUltimoCorrelativo();
      if (data && data.placaGenerada) {
        formData.value.placa = data.placaGenerada;
      } else {
        formData.value.placa = "SPMB0053"; // Fallback
      }
    } else {
      formData.value.placa = "";
    }
  };

  // --- Guardado ---
  const handleSave = async () => {
    await nextTick();
    const payload = {
      ...formData.value,
      id_marca: formData.value.id_marca
        ? Number(formData.value.id_marca)
        : null,
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
  };

  // --- Watchers ---
  watch(
    () => props.modelValue,
    async (val) => {
      if (val) await initializeForm();
    },
  );

  // Cascada Marca -> Modelo
  watch(
    () => formData.value.id_marca,
    (newVal, oldVal) => {
      if (isInitializing.value) return;
      if (newVal !== oldVal) {
        // Reset modelo si cambia la marca manualmente
        if (oldVal !== undefined && oldVal !== null) {
          formData.value.id_modelo = null;
        }
        if (newVal) emit("brand-changed", newVal);
      }
    },
  );

  onMounted(async () => {
    if (props.modelValue) await initializeForm();
  });

  return {
    formData,
    isInitializing,
    filteredBrandOptions,
    tipoCombustibleStore,
    loadingCorrelativo,
    mappedCategory,
    mappedDependency,
    mappedSubdependency,
    filterBrandFn,
    onSinPlacaChange,
    handleSave,
  };
}

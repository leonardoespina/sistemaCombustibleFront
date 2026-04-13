import { ref, computed, watch, onMounted } from "vue";
import { useLlenaderoStore } from "../../../stores/llenaderoStore";
import { useTipoCombustibleStore } from "../../../stores/tipoCombustibleStore";

/**
 * Composable para gestión del formulario de llenaderos
 * 
 * Este composable maneja toda la lógica del formulario para crear/editar
 * llenaderos (surtidores de combustible).
 * 
 * @param {Object} props - Props del componente (modelValue, initialData)
 * @param {Function} emit - Función emit del componente
 * @returns {Object} Estado y métodos del formulario
 */
export function useLlenaderoForm(props, emit) {
  // ============================================
  // STORES
  // ============================================

  const store = useLlenaderoStore();
  const tipoCombustibleStore = useTipoCombustibleStore();

  // ============================================
  // ESTADO DEL FORMULARIO
  // ============================================

  const formData = ref({
    nombre_llenadero: "",
    direccion_ip: "",
    estado: "ACTIVO",
  });

  // ============================================
  // COMPUTADOS
  // ============================================

  const isEdit = computed(() => !!props.initialData);

  const loading = computed(() => store.loading);

  const loadingTipoCombustible = computed(() => tipoCombustibleStore.loading);

  /**
   * Opciones de tipo de combustible activas
   */
  const tipoCombustibleOptions = computed(() => {
    return tipoCombustibleStore.rows
      ? tipoCombustibleStore.rows.filter((tc) => tc.activo)
      : [];
  });

  // ============================================
  // REGLAS DE VALIDACIÓN
  // ============================================

  const validationRules = {
    nombre_llenadero: [
      (val) =>
        (val && val.length >= 3) ||
        "El nombre debe tener al menos 3 caracteres",
    ],
  };

  // ============================================
  // MÉTODOS
  // ============================================

  /**
   * Inicializa el formulario con datos iniciales o valores por defecto
   */
  function initializeForm() {
    if (props.initialData) {
      formData.value = {
        nombre_llenadero: props.initialData.nombre_llenadero || "",
        direccion_ip: props.initialData.direccion_ip || "",
        estado: props.initialData.estado || "ACTIVO",
      };
    } else {
      formData.value = {
        nombre_llenadero: "",
        direccion_ip: "",
        estado: "ACTIVO",
      };
    }
  }

  /**
   * Maneja el guardado del formulario
   * Crea o actualiza el llenadero según el modo
   */
  async function handleSave() {
    let success;

    if (isEdit.value) {
      // ACTUALIZAR llenadero existente
      success = await store.updateLlenadero(
        props.initialData.id_llenadero,
        formData.value
      );
    } else {
      // CREAR nuevo llenadero
      success = await store.createLlenadero(formData.value);
    }

    // Si la operación fue exitosa, cerrar el diálogo
    if (success) {
      emit("update:modelValue", false);
    }
  }

  // ============================================
  // WATCHERS
  // ============================================

  /**
   * Watch para reinicializar cuando se abre el diálogo
   */
  watch(
    () => props.modelValue,
    (isOpen) => {
      if (isOpen) {
        initializeForm();
      }
    },
    { immediate: true }
  );

  // ============================================
  // LIFECYCLE
  // ============================================

  /**
   * Cargar tipos de combustible al montar si no están cargados
   */
  onMounted(async () => {
    if (!tipoCombustibleStore.rows || tipoCombustibleStore.rows.length === 0) {
      await tipoCombustibleStore.fetchTiposCombustible();
    }
  });

  // ============================================
  // RETORNO
  // ============================================

  return {
    // Estado
    formData,
    loading,
    loadingTipoCombustible,
    isEdit,

    // Opciones
    tipoCombustibleOptions,

    // Validaciones
    validationRules,

    // Métodos
    initializeForm,
    handleSave,
  };
}

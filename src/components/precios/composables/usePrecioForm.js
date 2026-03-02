import { ref, watch, onMounted } from "vue";

/**
 * Composable para gestión del formulario de precios
 * 
 * Este composable maneja la lógica del formulario para actualizar precios
 * de combustibles en múltiples monedas de forma dinámica.
 * 
 * NOTA: Este es un formulario DINÁMICO que genera campos según las monedas
 * activas en el sistema (ej: Bs, USD, Au, etc.)
 * 
 * @param {Object} props - Props del componente (modelValue, combustibleData)
 * @param {Function} emit - Función emit del componente
 * @param {Object} store - Store de precios
 * @returns {Object} Estado y métodos del formulario
 */
export function usePrecioForm(props, emit, store) {
  // ============================================
  // ESTADO DEL FORMULARIO
  // ============================================
  
  /**
   * Monedas activas en el sistema
   * Estructura: [{ id_moneda, nombre, simbolo }, ...]
   */
  const monedasActivas = ref([]);
  
  /**
   * Formulario de precios dinámico
   * Estructura: { precios: { "Bs": 50, "USD": 1.2, "Au": 0.00025 } }
   */
  const formData = ref({
    precios: {}
  });

  // ============================================
  // COMPUTED
  // ============================================
  
  /**
   * Nombre del combustible que se está editando
   * Se usa en el título del diálogo
   */
  const combustibleNombre = ref("");

  // ============================================
  // REGLAS DE VALIDACIÓN DINÁMICAS
  // ============================================
  
  /**
   * Genera reglas de validación para cada campo de precio
   * Las reglas son las mismas para todas las monedas
   */
  const validationRules = {
    precio: [
      (val) => val === null || val === undefined || val >= 0 || "El precio no puede ser negativo",
      (val) => val === null || val === undefined || val <= 999999999 || "El precio es demasiado alto",
    ]
  };

  // ============================================
  // MÉTODOS
  // ============================================
  
  /**
   * Carga las monedas activas del sistema
   * Se ejecuta al montar el componente y al abrir el diálogo
   */
  async function cargarMonedas() {
    try {
      await store.fetchMonedas();
      // Obtener solo las monedas activas (sin paginación)
      monedasActivas.value = store.monedas;
    } catch (error) {
      console.error("Error cargando monedas", error);
      monedasActivas.value = [];
    }
  }

  /**
   * Inicializa el formulario con los precios actuales del combustible
   * 
   * Si el combustible ya tiene precios configurados, los carga
   * Si no, inicializa con un objeto vacío
   */
  function initializeForm() {
    if (props.combustibleData) {
      // Actualizar nombre del combustible
      combustibleNombre.value = props.combustibleData.nombre || "";
      
      // Cargar precios existentes o inicializar vacío
      // Los precios vienen en formato: { "Bs": 50, "USD": 1.2, "Au": 0.00025 }
      formData.value.precios = { ...(props.combustibleData.precios || {}) };
    } else {
      combustibleNombre.value = "";
      formData.value.precios = {};
    }
  }

  /**
   * Maneja el guardado de los precios
   * 
   * 1. Prepara el payload con ID del combustible y precios
   * 2. Llama al store para actualizar
   * 3. Cierra el diálogo si la operación fue exitosa
   */
  async function handleSave() {
    // Preparar payload
    const payload = {
      id_tipo_combustible: props.combustibleData.id_tipo_combustible,
      precios: formData.value.precios
    };

    // Actualizar precios en el store
    const success = await store.actualizarPrecios(payload);

    // Si fue exitoso, cerrar el diálogo
    if (success) {
      emit("update:modelValue", false);
    }
  }

  // ============================================
  // WATCHERS
  // ============================================
  
  /**
   * Watch para reinicializar cuando cambian los datos del combustible
   * Esto ocurre cuando se selecciona un combustible diferente para editar
   */
  watch(
    () => props.combustibleData,
    () => {
      initializeForm();
    },
    { immediate: true, deep: true }
  );

  /**
   * Watch para recargar monedas cuando se abre el diálogo
   * Esto asegura que siempre se tengan las monedas más actualizadas
   */
  watch(
    () => props.modelValue,
    async (isOpen) => {
      if (isOpen) {
        await cargarMonedas();
      }
    }
  );

  // ============================================
  // LIFECYCLE
  // ============================================
  
  /**
   * Al montar el componente, cargar las monedas activas
   */
  onMounted(async () => {
    await cargarMonedas();
  });

  // ============================================
  // RETORNO
  // ============================================
  
  return {
    // Estado
    formData,
    monedasActivas,
    combustibleNombre,
    
    // Validaciones
    validationRules,
    
    // Métodos
    cargarMonedas,
    initializeForm,
    handleSave,
  };
}

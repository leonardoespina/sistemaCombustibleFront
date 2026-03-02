import { ref, watch } from "vue";

/**
 * Composable para gestión del formulario de configuración de cupos base
 * 
 * Este composable maneja toda la lógica del formulario para crear/editar
 * configuraciones de cupos mensuales (cupos base).
 * 
 * @param {Object} props - Props del componente (modelValue, initialData, isEditing)
 * @param {Function} emit - Función emit del componente
 * @param {Object} store - Store de cupos
 * @returns {Object} Estado y métodos del formulario
 */
export function useCupoForm(props, emit, store) {
  // ============================================
  // ESTADO DEL FORMULARIO
  // ============================================
  
  const formData = ref({});
  
  // Flag para controlar la inicialización del componente OrganizationalHierarchy
  // Necesario para evitar renders innecesarios durante la carga inicial
  const isInitializing = ref(false);

  // ============================================
  // REGLAS DE VALIDACIÓN
  // ============================================
  
  const validationRules = {
    // Validación para ID de categoría (requerido)
    id_categoria: [
      (val) => !!val || "La categoría es requerida"
    ],
    
    // Validación para ID de dependencia (requerido)
    id_dependencia: [
      (val) => !!val || "La dependencia es requerida"
    ],
    
    // Validación para ID de subdependencia (opcional en algunos casos)
    id_subdependencia: [
      // Puede ser null en algunos sistemas
    ],
    
    // Validación para tipo de combustible (requerido)
    id_tipo_combustible: [
      (val) => !!val || "El tipo de combustible es requerido"
    ],
    
    // Validación para cantidad mensual (requerido, positivo, máximo razonable)
    cantidad_mensual: [
      (val) => val !== null && val !== undefined && val !== "" || "La cantidad mensual es requerida",
      (val) => val > 0 || "La cantidad debe ser mayor a 0",
      (val) => val <= 999999 || "La cantidad no puede exceder 999,999 litros",
      (val) => Number.isInteger(Number(val)) || "La cantidad debe ser un número entero"
    ]
  };

  // ============================================
  // MÉTODOS
  // ============================================
  
  /**
   * Inicializa el formulario con datos iniciales o valores por defecto
   * 
   * En modo edición: Carga los datos del cupo base existente
   * En modo creación: Establece valores por defecto
   */
  async function initializeForm() {
    // Activar flag de inicialización para prevenir renders prematuros
    isInitializing.value = true;

    if (props.isEditing && props.initialData) {
      // MODO EDICIÓN: Cargar datos existentes
      formData.value = {
        id_categoria: props.initialData.id_categoria,
        id_dependencia: props.initialData.id_dependencia,
        id_subdependencia: props.initialData.id_subdependencia,
        id_tipo_combustible: props.initialData.id_tipo_combustible,
        cantidad_mensual: props.initialData.cantidad_mensual,
        activo: props.initialData.activo ?? true,
      };
    } else {
      // MODO CREACIÓN: Valores por defecto
      formData.value = {
        id_categoria: null,
        id_dependencia: null,
        id_subdependencia: null,
        id_tipo_combustible: null,
        cantidad_mensual: 0,
        activo: true,
      };
    }

    // Esperar al siguiente tick del DOM antes de desactivar el flag
    await new Promise(resolve => setTimeout(resolve, 0));
    isInitializing.value = false;
  }

  /**
   * Maneja el guardado del formulario
   * 
   * 1. Prepara el payload limpiando relaciones circulares
   * 2. Llama al store para crear/actualizar
   * 3. Cierra el diálogo si la operación fue exitosa
   */
  async function handleSave() {
    // Preparar payload limpio (sin relaciones anidadas de Sequelize)
    const payload = {
      id_categoria: formData.value.id_categoria,
      id_dependencia: formData.value.id_dependencia,
      id_subdependencia: formData.value.id_subdependencia,
      id_tipo_combustible: formData.value.id_tipo_combustible,
      cantidad_mensual: formData.value.cantidad_mensual,
      activo: formData.value.activo,
    };

    let success;
    
    if (props.isEditing) {
      // ACTUALIZAR cupo base existente
      success = await store.updateCupoBase(
        props.initialData.id_cupo_base,
        payload
      );
    } else {
      // CREAR nuevo cupo base
      success = await store.createCupoBase(payload);
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
   * Watch para reinicializar el formulario cuando se abre/cierra el diálogo
   * Esto asegura que los datos se recarguen correctamente cada vez
   */
  watch(
    () => props.modelValue,
    async (isOpen) => {
      if (isOpen) {
        await initializeForm();
      }
    },
    { immediate: true }
  );

  // ============================================
  // RETORNO
  // ============================================
  
  return {
    // Estado
    formData,
    isInitializing,
    
    // Validaciones
    validationRules,
    
    // Métodos
    initializeForm,
    handleSave,
  };
}

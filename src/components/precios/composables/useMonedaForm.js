import { ref, watch } from "vue";

/**
 * Composable para gestión del formulario de monedas
 * 
 * Este composable maneja la lógica del formulario para crear/editar
 * monedas/unidades de medida para el sistema de precios multi-moneda.
 * 
 * @param {Object} props - Props del componente (modelValue, initialData)
 * @param {Function} emit - Función emit del componente
 * @param {Object} store - Store de precios
 * @returns {Object} Estado y métodos del formulario
 */
export function useMonedaForm(props, emit, store) {
  // ============================================
  // ESTADO DEL FORMULARIO
  // ============================================
  
  const formData = ref({
    nombre: "",
    simbolo: ""
  });

  // ============================================
  // REGLAS DE VALIDACIÓN
  // ============================================
  
  const validationRules = {
    // Validación para nombre de moneda
    nombre: [
      (val) => (val && val.length > 0) || "El nombre es requerido",
      (val) => (val && val.length >= 3) || "Mínimo 3 caracteres",
      (val) => (val && val.length <= 50) || "Máximo 50 caracteres",
      (val) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(val) || "Solo letras y espacios permitidos"
    ],
    
    // Validación para símbolo de moneda
    simbolo: [
      (val) => (val && val.length > 0) || "El símbolo es requerido",
      (val) => (val && val.length >= 1) || "Mínimo 1 carácter",
      (val) => (val && val.length <= 5) || "Máximo 5 caracteres",
      (val) => /^[A-Z$€£¥₿₡₹₽₣₤₦₧₨₩₪₫₭₮₱₴₵₸₺₼₾฿]+$/.test(val) || "Use letras mayúsculas o símbolos de moneda válidos (ej: USD, $, Bs, Au)"
    ]
  };

  // ============================================
  // MÉTODOS
  // ============================================
  
  /**
   * Inicializa el formulario con datos iniciales o valores por defecto
   * 
   * En modo edición: Carga los datos de la moneda existente
   * En modo creación: Establece valores vacíos
   */
  function initializeForm() {
    if (props.initialData) {
      // MODO EDICIÓN: Cargar datos existentes
      formData.value = {
        nombre: props.initialData.nombre || "",
        simbolo: props.initialData.simbolo || ""
      };
    } else {
      // MODO CREACIÓN: Valores vacíos
      formData.value = {
        nombre: "",
        simbolo: ""
      };
    }
  }

  /**
   * Maneja el guardado del formulario
   * 
   * 1. Prepara el payload con trim() para evitar espacios
   * 2. Llama al store para crear/actualizar
   * 3. Cierra el diálogo si la operación fue exitosa
   */
  async function handleSave() {
    // Preparar payload limpio
    const payload = {
      nombre: formData.value.nombre.trim(),
      simbolo: formData.value.simbolo.trim().toUpperCase() // Siempre en mayúsculas
    };

    let success;
    
    if (props.initialData) {
      // ACTUALIZAR moneda existente
      success = await store.updateMoneda(
        props.initialData.id_moneda,
        payload
      );
    } else {
      // CREAR nueva moneda
      success = await store.createMoneda(payload);
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
   * Watch para reinicializar el formulario cuando cambian los datos iniciales
   * Esto asegura que el formulario se actualice correctamente en modo edición
   */
  watch(
    () => props.initialData,
    () => {
      initializeForm();
    },
    { immediate: true }
  );

  /**
   * Watch para resetear el formulario cuando se cierra el diálogo
   * Esto limpia los campos al cerrar sin guardar
   */
  watch(
    () => props.modelValue,
    (isOpen) => {
      if (!isOpen) {
        initializeForm();
      }
    }
  );

  // ============================================
  // RETORNO
  // ============================================
  
  return {
    // Estado
    formData,
    
    // Validaciones
    validationRules,
    
    // Métodos
    initializeForm,
    handleSave,
  };
}

import { ref, watch } from "vue";

/**
 * Composable para gestión del formulario de recarga de cupos
 * 
 * Este composable maneja la lógica del formulario para agregar litros extra
 * a un cupo actual (recargas extraordinarias por solicitud especial).
 * 
 * @param {Object} props - Props del componente (modelValue, cupo)
 * @param {Function} emit - Función emit del componente
 * @param {Object} store - Store de cupos
 * @returns {Object} Estado y métodos del formulario
 */
export function useRecargaCupoForm(props, emit, store) {
  // ============================================
  // ESTADO DEL FORMULARIO
  // ============================================
  
  const formData = ref({
    cantidad: 0,
    motivo: ""
  });

  // ============================================
  // REGLAS DE VALIDACIÓN
  // ============================================
  
  const validationRules = {
    // Validación para cantidad de recarga
    cantidad: [
      (val) => val !== null && val !== undefined && val !== "" || "La cantidad es requerida",
      (val) => val > 0 || "La cantidad debe ser mayor a 0",
      (val) => val <= 100000 || "La cantidad no puede exceder 100,000 litros",
      (val) => Number.isInteger(Number(val)) || "La cantidad debe ser un número entero"
    ],
    
    // Validación para motivo de la recarga
    motivo: [
      (val) => !!val || "El motivo es requerido",
      (val) => (val && val.trim().length >= 10) || "El motivo debe tener al menos 10 caracteres",
      (val) => (val && val.length <= 500) || "Máximo 500 caracteres"
    ]
  };

  // ============================================
  // MÉTODOS
  // ============================================
  
  /**
   * Inicializa el formulario limpiando los campos
   * Se llama cada vez que se abre el diálogo para comenzar con un formulario vacío
   */
  function initializeForm() {
    formData.value = {
      cantidad: 0,
      motivo: ""
    };
  }

  /**
   * Maneja el guardado de la recarga
   * 
   * 1. Prepara el payload con ID del cupo base, cantidad y motivo
   * 2. Llama al store para ejecutar la recarga
   * 3. Cierra el diálogo si la operación fue exitosa
   */
  async function handleSave() {
    // Preparar payload para la recarga
    const payload = {
      id_cupo_base: props.cupo.id_cupo_base, // ID del cupo base al que pertenece el cupo actual
      cantidad: formData.value.cantidad,
      motivo: formData.value.motivo.trim()
    };

    // Ejecutar recarga en el store
    const success = await store.recargarCupo(payload);

    // Si fue exitoso, cerrar el diálogo
    if (success) {
      emit("update:modelValue", false);
    }
  }

  // ============================================
  // WATCHERS
  // ============================================
  
  /**
   * Watch para reinicializar el formulario cuando se abre el diálogo
   * Esto asegura que cada recarga comience con campos vacíos
   */
  watch(
    () => props.modelValue,
    (isOpen) => {
      if (isOpen) {
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

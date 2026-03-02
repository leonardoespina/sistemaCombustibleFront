import { ref, watch } from "vue";

/**
 * Composable para gestión del formulario de categorías
 * @param {Object} props - Props del componente (modelValue, initialData, isEditing)
 * @param {Function} emit - Función emit del componente
 * @returns {Object} Estado y métodos del formulario
 */
export function useCategoriaForm(props, emit) {
  const formData = ref({});

  // Validaciones mejoradas
  const validationRules = {
    nombre: [
      (val) => !!val || "El nombre es requerido",
      (val) => (val && val.trim().length >= 2) || "Mínimo 2 caracteres",
      (val) => (val && val.length <= 50) || "Máximo 50 caracteres",
      (val) =>
        /^[a-zA-ZÀ-ÿ0-9\s\-_]+$/.test(val) ||
        "Solo letras, números, espacios y guiones",
    ],
    estado: [(val) => !!val || "El estado es requerido"],
  };

  /**
   * Inicializa el formulario con datos iniciales o valores por defecto
   */
  function initializeForm() {
    if (props.isEditing && props.initialData) {
      formData.value = {
        nombre: props.initialData.nombre?.trim() || "",
        estado: props.initialData.estado || "ACTIVO",
      };
    } else {
      formData.value = {
        nombre: "",
        estado: "ACTIVO",
      };
    }
  }

  /**
   * Prepara el payload y emite el evento de guardado
   */
  function handleSave() {
    // Sanitizar datos antes de enviar
    const payload = {
      nombre: formData.value.nombre.trim(),
      estado: formData.value.estado,
    };

    emit("save", payload);
  }

  // Watch para reinicializar cuando se abre el diálogo
  watch(
    () => props.modelValue,
    (isOpen) => {
      if (isOpen) {
        initializeForm();
      }
    }
  );

  return {
    formData,
    validationRules,
    initializeForm,
    handleSave,
  };
}

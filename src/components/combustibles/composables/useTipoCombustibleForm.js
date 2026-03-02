import { ref, watch } from "vue";

/**
 * Composable para gestión del formulario de tipos de combustible
 * @param {Object} props - Props del componente (modelValue, initialData, isEditing)
 * @param {Function} emit - Función emit del componente
 * @param {Object} store - Store de tipos de combustible
 * @returns {Object} Estado y métodos del formulario
 */
export function useTipoCombustibleForm(props, emit, store) {
  const formData = ref({});

  // Validaciones mejoradas
  const validationRules = {
    nombre: [
      (val) => !!val || "El nombre es requerido",
      (val) => (val && val.trim().length >= 2) || "Mínimo 2 caracteres",
      (val) => (val && val.length <= 100) || "Máximo 100 caracteres",
      (val) =>
        /^[a-zA-ZÀ-ÿ0-9\s\-_.]+$/.test(val) ||
        "Solo letras, números, espacios y guiones",
    ],
    descripcion: [
      (val) => !val || val.length <= 500 || "Máximo 500 caracteres",
    ],
  };

  /**
   * Inicializa el formulario con datos iniciales o valores por defecto
   */
  function initializeForm() {
    if (props.isEditing && props.initialData) {
      formData.value = {
        nombre: props.initialData.nombre?.trim() || "",
        descripcion: props.initialData.descripcion?.trim() || "",
        activo: props.initialData.activo ?? true,
      };
    } else {
      formData.value = {
        nombre: "",
        descripcion: "",
        activo: true,
      };
    }
  }

  /**
   * Prepara el payload y llama al store para guardar
   */
  async function handleSave() {
    // Sanitizar datos antes de enviar
    const payload = {
      nombre: formData.value.nombre.trim(),
      descripcion: formData.value.descripcion?.trim() || null,
      activo: formData.value.activo,
    };

    let success;
    if (props.isEditing) {
      success = await store.updateTipoCombustible(
        props.initialData.id_tipo_combustible,
        payload
      );
    } else {
      success = await store.createTipoCombustible(payload);
    }

    if (success) {
      emit("update:modelValue", false);
    }
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


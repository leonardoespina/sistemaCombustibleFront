import { ref, watch } from "vue";

/**
 * Composable para gestión del formulario de dependencias
 * @param {Object} props - Props del componente (modelValue, initialData, isEditing)
 * @param {Function} emit - Función emit del componente
 * @returns {Object} Estado y métodos del formulario
 */
export function useDependenciaForm(props, emit) {
  const formData = ref({});

  // Validaciones mejoradas
  const validationRules = {
    id_categoria: [(val) => !!val || "La categoría es requerida"],
    nombre_dependencia: [
      (val) => !!val || "El nombre es requerido",
      (val) => (val && val.trim().length >= 3) || "Mínimo 3 caracteres",
      (val) => (val && val.length <= 100) || "Máximo 100 caracteres",
      (val) =>
        /^[a-zA-ZÀ-ÿ0-9\s\-_.]+$/.test(val) ||
        "Solo letras, números, espacios y guiones",
    ],
    codigo: [
      (val) =>
        !val ||
        /^[A-Z0-9\-_]+$/.test(val) ||
        "Solo letras mayúsculas, números y guiones",
      (val) => !val || val.length <= 20 || "Máximo 20 caracteres",
    ],
    tipo_venta: [(val) => !!val || "El tipo de solicitud es requerido"],
  };

  /**
   * Inicializa el formulario con datos iniciales o valores por defecto
   */
  function initializeForm() {
    if (props.isEditing && props.initialData) {
      formData.value = {
        id_categoria: props.initialData.id_categoria || null,
        nombre_dependencia: props.initialData.nombre_dependencia?.trim() || "",
        codigo: props.initialData.codigo?.trim() || "",
        tipo_venta: props.initialData.tipo_venta || "INSTITUCIONAL",
        estatus: props.initialData.estatus || "ACTIVO",
        tipo_acceso_menu: props.initialData.tipo_acceso_menu || "ESTANDAR",
      };
    } else {
      formData.value = {
        id_categoria: null,
        nombre_dependencia: "",
        codigo: "",
        tipo_venta: "INSTITUCIONAL",
        estatus: "ACTIVO",
        tipo_acceso_menu: "ESTANDAR",
      };
    }
  }

  /**
   * Prepara el payload y emite el evento de guardado
   */
  function handleSave() {
    // Sanitizar datos antes de enviar
    const payload = {
      id_categoria: formData.value.id_categoria,
      nombre_dependencia: formData.value.nombre_dependencia.trim(),
      codigo: formData.value.codigo?.trim().toUpperCase() || null,
      tipo_venta: formData.value.tipo_venta,
      estatus: formData.value.estatus,
      tipo_acceso_menu: formData.value.tipo_acceso_menu,
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
    },
  );

  return {
    formData,
    validationRules,
    initializeForm,
    handleSave,
  };
}

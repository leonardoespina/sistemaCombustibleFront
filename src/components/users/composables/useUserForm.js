import { ref, watch } from "vue";

/**
 * Composable para gestión del formulario de usuarios
 * @param {Object} props - Props del componente (modelValue, initialData, isEditing)
 * @param {Function} emit - Función emit del componente
 * @returns {Object} Estado y métodos del formulario
 */
export function useUserForm(props, emit) {
  const formData = ref({});
  const isInitializing = ref(false);

  // Validaciones mejoradas
  const validationRules = {
    nombre: [
      (val) => !!val || "El nombre es requerido",
      (val) => (val && val.trim().length >= 2) || "Mínimo 2 caracteres",
      (val) => (val && val.length <= 50) || "Máximo 50 caracteres",
      (val) =>
        /^[a-zA-ZÀ-ÿ\s]+$/.test(val) || "Solo se permiten letras y espacios",
    ],
    apellido: [
      (val) => !!val || "El apellido es requerido",
      (val) => (val && val.trim().length >= 2) || "Mínimo 2 caracteres",
      (val) => (val && val.length <= 50) || "Máximo 50 caracteres",
      (val) =>
        /^[a-zA-ZÀ-ÿ\s]+$/.test(val) || "Solo se permiten letras y espacios",
    ],
    cedula: [
      (val) => !!val || "La cédula es requerida",
      (val) =>
        /^[VEJPG]?-?\d{6,9}$/i.test(val) ||
        "Formato inválido (ej: V-12345678, 12345678)",
    ],
    passwordCrear: [
      (val) => !!val || "La contraseña es requerida",
      (val) => val.length >= 6 || "Mínimo 6 caracteres",
      (val) => val.length <= 50 || "Máximo 50 caracteres",
    ],
    passwordEditar: [
      // Opcional en edición
      (val) => !val || val.length >= 6 || "Mínimo 6 caracteres",
      (val) => !val || val.length <= 50 || "Máximo 50 caracteres",
    ],
    tipo_usuario: [(val) => !!val || "El tipo de usuario es requerido"],
    estado: [(val) => !!val || "El estado es requerido"],
  };

  /**
   * Inicializa el formulario con datos iniciales o valores por defecto
   */
  async function initializeForm() {
    isInitializing.value = true;

    // Reset total del formulario
    formData.value = {};

    const data = props.initialData ? { ...props.initialData } : {};

    // Mapeo de datos al formulario
    formData.value = {
      nombre: data.nombre?.trim() || "",
      apellido: data.apellido?.trim() || "",
      cedula: data.cedula?.trim() || "",
      password: "", // Siempre vacío por seguridad
      tipo_usuario: data.tipo_usuario || "INSPECTOR",
      estado: data.estado || "ACTIVO",
      id_categoria: data.id_categoria || null,
      id_dependencia: data.id_dependencia || null,
      id_subdependencia: data.id_subdependencia || null,
    };

    // Pequeño delay para asegurar que el DOM se actualice
    await new Promise((resolve) => setTimeout(resolve, 50));
    isInitializing.value = false;
  }

  /**
   * Prepara el payload y emite el evento de guardado
   */
  function handleSave() {
    // Sanitizar datos antes de enviar
    const payload = {
      nombre: formData.value.nombre.trim(),
      apellido: formData.value.apellido.trim(),
      cedula: formData.value.cedula.trim().toUpperCase(),
      password: formData.value.password, // Solo se envía si tiene valor
      tipo_usuario: formData.value.tipo_usuario,
      estado: formData.value.estado,
      id_categoria: formData.value.id_categoria,
      id_dependencia: formData.value.id_dependencia,
      id_subdependencia: formData.value.id_subdependencia || null,
    };

    // Si no hay password (edición sin cambio), quitar del payload
    if (!payload.password) {
      delete payload.password;
    }

    emit("save", payload);
  }

  // Watch para reinicializar cuando se abre el diálogo
  watch(
    () => props.modelValue,
    async (isOpen) => {
      if (isOpen) {
        await initializeForm();
      }
    },
    { immediate: true }
  );

  return {
    formData,
    isInitializing,
    validationRules,
    initializeForm,
    handleSave,
  };
}

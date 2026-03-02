import { ref, watch, computed } from "vue";

/**
 * Composable para gestión del formulario de subdependencias
 * Maneja lógica condicional compleja según tipo_venta de la dependencia
 * @param {Object} props - Props del componente (modelValue, initialData, isEditing)
 * @param {Function} emit - Función emit del componente
 * @param {Array} dependenciaOptions - Opciones de dependencias disponibles
 * @returns {Object} Estado y métodos del formulario
 */
export function useSubdependenciaForm(props, emit, dependenciaOptions) {
  const formData = ref({});
  const dependenciaSeleccionada = ref(null);

  /**
   * Determina si los campos fiscales son requeridos según el tipo de venta
   */
  const requiereCamposFiscales = computed(() => {
    if (!dependenciaSeleccionada.value) return false;
    const tipo = dependenciaSeleccionada.value.tipo_venta;
    // VENTA: siempre requeridos
    // AMBOS: requeridos solo si cobra_venta es true
    // INSTITUCIONAL: nunca requeridos
    if (tipo === "VENTA") return true;
    if (tipo === "AMBOS") return formData.value.cobra_venta === true;
    return false;
  });

  /**
   * Validaciones base para nombre
   */
  const validationRules = {
    id_dependencia: [(val) => !!val || "La dependencia es requerida"],
    nombre: [
      (val) => !!val || "El nombre es requerido",
      (val) => (val && val.trim().length >= 3) || "Mínimo 3 caracteres",
      (val) => (val && val.length <= 100) || "Máximo 100 caracteres",
    ],
  };

  /**
   * Validaciones dinámicas para campos fiscales
   * Se generan en tiempo real según requiereCamposFiscales
   */
  const validacionesUbicacion = computed(() => {
    if (!requiereCamposFiscales.value) return [];
    return [
      (val) => !!val || "La ubicación es obligatoria",
      (val) => (val && val.trim().length > 0) || "La ubicación no puede estar vacía",
      (val) => (val && val.length <= 200) || "Máximo 200 caracteres",
    ];
  });

  const validacionesResponsable = computed(() => {
    if (!requiereCamposFiscales.value) return [];
    return [
      (val) => !!val || "El responsable es obligatorio",
      (val) => (val && val.trim().length > 0) || "El responsable no puede estar vacío",
      (val) => (val && val.length <= 100) || "Máximo 100 caracteres",
    ];
  });

  const validacionesCedulaRif = computed(() => {
    if (!requiereCamposFiscales.value) return [];
    return [
      (val) => !!val || "La cédula/RIF es obligatoria",
      (val) => (val && val.trim().length > 0) || "La cédula/RIF no puede estar vacía",
      (val) =>
        /^[VEJPG]?-?\d{6,9}(-?\d)?$/i.test(val) ||
        "Formato inválido (ej: V-12345678, J-123456789-0)",
    ];
  });

  /**
   * Maneja el cambio de dependencia seleccionada
   */
  function onDependenciaChange(dependenciaId) {
    if (dependenciaId) {
      dependenciaSeleccionada.value = dependenciaOptions.value.find(
        (d) => d.id_dependencia === dependenciaId
      );

      // Auto-configurar cobra_venta según tipo
      if (dependenciaSeleccionada.value) {
        const tipo = dependenciaSeleccionada.value.tipo_venta;
        if (tipo === "VENTA") {
          formData.value.cobra_venta = true; // Siempre true para VENTA
        } else if (tipo === "INSTITUCIONAL") {
          formData.value.cobra_venta = false; // Siempre false para INSTITUCIONAL
          // Limpiar campos fiscales si ya no son necesarios
          formData.value.ubicacion = "";
          formData.value.responsable = "";
          formData.value.cedula_rif = "";
        }
        // AMBOS: el usuario decide, no forzamos
      }
    } else {
      dependenciaSeleccionada.value = null;
    }
  }

  /**
   * Watch para limpiar campos fiscales cuando cobra_venta cambia a false en tipo AMBOS
   */
  watch(
    () => formData.value.cobra_venta,
    (nuevoValor) => {
      if (
        !nuevoValor &&
        dependenciaSeleccionada.value?.tipo_venta === "AMBOS"
      ) {
        // Limpiar campos fiscales si el usuario decide no cobrar
        formData.value.ubicacion = "";
        formData.value.responsable = "";
        formData.value.cedula_rif = "";
      }
    }
  );

  /**
   * Inicializa el formulario con datos iniciales o valores por defecto
   */
  function initializeForm() {
    if (props.isEditing && props.initialData) {
      formData.value = {
        id_dependencia: props.initialData.id_dependencia || null,
        nombre: props.initialData.nombre?.trim() || "",
        ubicacion: props.initialData.ubicacion?.trim() || "",
        responsable: props.initialData.responsable?.trim() || "",
        cedula_rif: props.initialData.cedula_rif?.trim() || "",
        cobra_venta: props.initialData.cobra_venta || false,
        estatus: props.initialData.estatus || "ACTIVO",
      };

      // Establecer dependencia seleccionada para edición
      if (props.initialData.id_dependencia) {
        dependenciaSeleccionada.value = dependenciaOptions.value.find(
          (d) => d.id_dependencia === props.initialData.id_dependencia
        );
      }
    } else {
      formData.value = {
        id_dependencia: null,
        nombre: "",
        ubicacion: "",
        responsable: "",
        cedula_rif: "",
        cobra_venta: false,
        estatus: "ACTIVO",
      };
      dependenciaSeleccionada.value = null;
    }
  }

  /**
   * Prepara el payload y emite el evento de guardado
   */
  function handleSave() {
    // Sanitizar datos antes de enviar
    const payload = {
      id_dependencia: formData.value.id_dependencia,
      nombre: formData.value.nombre.trim(),
      ubicacion: formData.value.ubicacion?.trim() || null,
      responsable: formData.value.responsable?.trim() || null,
      cedula_rif: formData.value.cedula_rif?.trim().toUpperCase() || null,
      cobra_venta: formData.value.cobra_venta,
      estatus: formData.value.estatus,
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

  // Watch para actualizar dependencia seleccionada cuando cambien las opciones
  watch(
    () => dependenciaOptions.value,
    () => {
      if (formData.value.id_dependencia) {
        dependenciaSeleccionada.value = dependenciaOptions.value.find(
          (d) => d.id_dependencia === formData.value.id_dependencia
        );
      }
    },
    { immediate: true }
  );

  return {
    formData,
    dependenciaSeleccionada,
    validationRules,
    validacionesUbicacion,
    validacionesResponsable,
    validacionesCedulaRif,
    requiereCamposFiscales,
    onDependenciaChange,
    initializeForm,
    handleSave,
  };
}

import { ref, watch, onMounted, onUnmounted } from "vue";
import socket from "../../../services/socket.js";

/**
 * Composable para gestionar la lógica del formulario de Marcas
 */
export function useBrandForm(props, emit) {
  const formData = ref({
    nombre: "",
    estado: "ACTIVO",
  });

  // Reglas de validación nativas de Quasar
  const validationRules = {
    nombre: [(val) => !!val || "El nombre de la marca es obligatorio"],
  };

  /**
   * Inicializa el formulario con los datos iniciales (para edición)
   */
  const initializeForm = () => {
    formData.value = {
      nombre: props.initialData?.nombre || "",
      estado: props.initialData?.estado || "ACTIVO",
    };
  };

  /**
   * Maneja el guardado del formulario emitiendo el evento 'save'
   */
  const handleSave = () => {
    emit("save", { ...formData.value });
  };

  /**
   * Configuración de listeners de Socket.io
   */
  const setupSockets = () => {
    socket.on("marca:creado", (data) => {
      emit("dataUpdated", data);
    });

    socket.on("marca:actualizado", (data) => {
      emit("dataUpdated", data);
    });
  };

  /**
   * Limpieza de listeners de Socket.io
   */
  const cleanupSockets = () => {
    socket.off("marca:creado");
    socket.off("marca:actualizado");
  };

  onMounted(() => {
    setupSockets();
  });

  onUnmounted(() => {
    cleanupSockets();
  });

  // Reinicializar el formulario cada vez que se abra el diálogo
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
    handleSave,
  };
}

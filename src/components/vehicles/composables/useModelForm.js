import { ref, watch, onMounted, onUnmounted } from "vue";
import socket from "../../../services/socket.js";

/**
 * Composable para gestionar la lógica del formulario de Modelos
 * @param {Object} props
 * @param {Function} emit
 */
export function useModelForm(props, emit) {
  const formData = ref({
    nombre: "",
    id_marca: null,
    estado: "ACTIVO",
  });

  const filteredBrandOptions = ref([]);

  const validationRules = {
    id_marca: [(val) => !!val || "Debe seleccionar una marca"],
    nombre: [(val) => !!val || "El nombre es requerido"],
  };

  /**
   * Inicializa el formulario
   */
  const initializeForm = () => {
    formData.value = {
      nombre: props.initialData?.nombre || "",
      id_marca: props.initialData?.id_marca || null,
      estado: props.initialData?.estado || "ACTIVO",
    };
    // Inicializar opciones filtradas con todas las marcas
    filteredBrandOptions.value = props.brands;
  };

  /**
   * Filtra las marcas en el q-select
   */
  const filterBrandFn = (val, update) => {
    if (val === "") {
      update(() => {
        filteredBrandOptions.value = props.brands;
      });
      return;
    }
    update(() => {
      const needle = val.toLowerCase();
      if (Array.isArray(props.brands)) {
        filteredBrandOptions.value = props.brands.filter(
          (v) => v && v.nombre && v.nombre.toLowerCase().indexOf(needle) > -1,
        );
      }
    });
  };

  const handleSave = () => {
    emit("save", { ...formData.value });
  };

  // Sockets
  const setupSockets = () => {
    socket.on("modelo:creado", (data) => emit("dataUpdated", data));
    socket.on("modelo:actualizado", (data) => emit("dataUpdated", data));
  };

  const cleanupSockets = () => {
    socket.off("modelo:creado");
    socket.off("modelo:actualizado");
  };

  onMounted(() => {
    setupSockets();
  });

  onUnmounted(() => {
    cleanupSockets();
  });

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
    filteredBrandOptions,
    filterBrandFn,
    handleSave,
  };
}

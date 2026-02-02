// src/components/dispatches/composables/useRequestForm.js
import { ref, computed } from "vue";
import { date } from "quasar";

/**
 * Composable para manejar la lógica del formulario de solicitudes
 * @param {Function} emit - Función emit del componente padre
 * @param {Object} requestStore - Store de solicitudes
 */
export function useRequestForm(emit, requestStore) {
  // --- STATE ---
  const loading = ref(false);
  const selectedCombustible = ref(null);
  const selectedVehicle = ref(null);
  const selectedSubdependencia = ref(null);
  const selectedPrecioObj = ref(null);
  
  const solicitanteName = ref("");
  const currentDate = ref(date.formatDate(Date.now(), "DD/MM/YYYY"));
  const currentTime = ref(date.formatDate(Date.now(), "HH:mm:ss"));

  // Obtener datos del usuario desde localStorage
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  const formData = ref({
    id_categoria: user?.id_categoria || null,
    id_dependencia: user?.id_dependencia || null,
    id_llenadero: null,
    cantidad_litros: null,
    tipo_suministro: "REGULAR",
    tipo_solicitud: "INSTITUCIONAL",
    id_precio: null,
  });

  // --- COMPUTED ---

  /**
   * Modalidades disponibles según la subdependencia seleccionada
   */
  const availableModalities = computed(() => {
    const options = ["INSTITUCIONAL"];
    
    if (!selectedSubdependencia.value || !requestStore.subdependenciasAutorizadas) {
      return options;
    }

    const sub = requestStore.subdependenciasAutorizadas.find(
      (s) => s.id_subdependencia === selectedSubdependencia.value
    );

    if (
      sub?.cobra_venta ||
      sub?.cobra_venta === 1 ||
      sub?.cobra_venta === "1" ||
      sub?.cobra_venta === true
    ) {
      options.push("VENTA");
    }

    return options;
  });

  /**
   * Total calculado para modalidad VENTA
   */
  const calculatedTotal = computed(() => {
    if (!selectedPrecioObj.value || !formData.value.cantidad_litros) return "0";
    
    const total =
      parseFloat(selectedPrecioObj.value.precio) *
      parseFloat(formData.value.cantidad_litros);

    return new Intl.NumberFormat("es-VE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    }).format(total);
  });

  /**
   * Validar si se puede enviar el formulario
   */
  const canSubmit = computed(() => {
    return Boolean(
      formData.value.id_llenadero &&
      formData.value.cantidad_litros > 0 &&
      selectedVehicle.value &&
      selectedCombustible.value
    );
  });

  // --- METHODS ---

  /**
   * Inicializar datos del formulario
   */
  function initializeForm() {
    if (user) {
      solicitanteName.value = `${user.nombre} ${user.apellido}`;
      formData.value.id_categoria = user.id_categoria;
      formData.value.id_dependencia = user.id_dependencia;
    }

    // Actualizar hora cada segundo
    setInterval(() => {
      currentTime.value = date.formatDate(Date.now(), "HH:mm:ss");
    }, 1000);
  }

  /**
   * Resetear formulario a valores iniciales
   */
  function resetForm() {
    selectedVehicle.value = null;
    selectedSubdependencia.value = null;
    selectedCombustible.value = null;
    selectedPrecioObj.value = null;

    formData.value = {
      id_categoria: user?.id_categoria || null,
      id_dependencia: user?.id_dependencia || null,
      id_llenadero: null,
      cantidad_litros: null,
      tipo_suministro: "REGULAR",
      tipo_solicitud: "INSTITUCIONAL",
      id_precio: null,
    };
  }

  /**
   * Manejar cambio de tipo de solicitud
   */
  function onTipoSolicitudChange(val) {
    if (val !== "VENTA") {
      selectedPrecioObj.value = null;
      formData.value.id_precio = null;
    }
  }

  /**
   * Guardar solicitud
   */
  async function onSave() {
    if (!canSubmit.value) {
      console.warn("No se puede enviar: canSubmit es false");
      return;
    }

    // Debug: Verificar datos antes de enviar
    console.log("=== DEBUG onSave ===");
    console.log("selectedVehicle:", selectedVehicle.value);
    console.log("selectedCombustible:", selectedCombustible.value);
    console.log("selectedSubdependencia:", selectedSubdependencia.value);

    loading.value = true;

    const payload = {
      ...formData.value,
      id_vehiculo: selectedVehicle.value?.id_vehiculo,
      placa: selectedVehicle.value?.placa,
      marca: selectedVehicle.value?.Marca?.nombre || "",
      modelo: selectedVehicle.value?.Modelo?.nombre || "",
      flota: selectedVehicle.value?.flota || "GENERAL",
      id_tipo_combustible: selectedCombustible.value,
      id_subdependencia: selectedSubdependencia.value,
      id_precio: selectedPrecioObj.value?.id_precio || null,
      monto_total:
        parseFloat(selectedPrecioObj.value?.precio || 0) *
        parseFloat(formData.value.cantidad_litros),
      solicitante: solicitanteName.value,
      fecha_solicitud: currentDate.value,
      hora_solicitud: currentTime.value,
    };

    console.log("Payload a enviar:", payload);

    try {
      const result = await requestStore.createRequest(payload);
      
      if (result) {
        // NO resetear aquí - se hace en el componente padre después de cerrar
        emit("save", result);
      }
    } catch (error) {
      console.error("Error en onSave:", error);
    } finally {
      loading.value = false;
    }
  }

  return {
    // State
    loading,
    formData,
    selectedCombustible,
    selectedVehicle,
    selectedSubdependencia,
    selectedPrecioObj,
    solicitanteName,
    currentDate,
    currentTime,
    // Computed
    availableModalities,
    calculatedTotal,
    canSubmit,
    // Methods
    initializeForm,
    resetForm,
    onTipoSolicitudChange,
    onSave,
  };
}

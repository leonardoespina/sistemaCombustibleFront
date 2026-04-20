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
  // Vehículo deshabilitado SOLO cuando BIDÓN + VENTA
  const vehicleDisabled = computed(
    () =>
      formData.value.tipo_suministro === "BIDON" &&
      formData.value.tipo_solicitud === "VENTA",
  );

  const availableFuelInTank = computed(() => {
    if (!formData.value.id_llenadero || !selectedCombustible.value) return 0;
    
    // Buscar llenadero en la lista (que viene de requestStore.llenaderosPorCombustible)
    // Nota: llenaderosPorCombustible se carga y expone globalmente, pero como el store reactivo 
    // está en requestStore, accedemos por ahí.
    const llenadero = requestStore.llenaderosPorCombustible?.find(
      (l) => l.id_llenadero === formData.value.id_llenadero
    );
    if (!llenadero) return 0;

    const tanque = llenadero.Tanques?.find(
      (t) => t.id_tipo_combustible === selectedCombustible.value && t.activo_para_despacho
    );

    return tanque ? parseFloat(tanque.nivel_actual || 0) : 0;
  });

  const canSubmit = computed(() => {
    const baseOk =
      formData.value.id_llenadero &&
      formData.value.cantidad_litros > 0 &&
      selectedCombustible.value;

    if (!baseOk) return false;
    
    // Bloquear si el tanque está en cero o la cantidad solicitada supera el nivel físico
    if (availableFuelInTank.value <= 0) return false;
    if (parseFloat(formData.value.cantidad_litros) > availableFuelInTank.value) return false;

    // BIDÓN+VENTA no requiere vehículo seleccionado
    if (vehicleDisabled.value) return Boolean(baseOk);

    return Boolean(baseOk && selectedVehicle.value);
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
    formData.value.tipo_solicitud = val; // ← actualizar el valor en formData
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


    const payload = {
      ...formData.value,
      // Datos de vehículo: null solo para BIDÓN + VENTA
      id_vehiculo: vehicleDisabled.value ? null : selectedVehicle.value?.id_vehiculo,
      placa: vehicleDisabled.value ? null : selectedVehicle.value?.placa,
      marca: vehicleDisabled.value ? null : (selectedVehicle.value?.Marca?.nombre || ""),
      modelo: vehicleDisabled.value ? null : (selectedVehicle.value?.Modelo?.nombre || ""),
      flota: vehicleDisabled.value ? null : (selectedVehicle.value?.flota || "GENERAL"),
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
    vehicleDisabled,
    availableModalities,
    calculatedTotal,
    availableFuelInTank,
    canSubmit,
    // Methods
    initializeForm,
    resetForm,
    onTipoSolicitudChange,
    onSave,
  };
}

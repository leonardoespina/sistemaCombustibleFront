// src/components/dispatches/composables/useRequestFilters.js
import { ref } from "vue";

/**
 * Composable para manejar filtros de vehículos y subdependencias
 * @param {Object} vehicleStore - Store de vehículos
 */
export function useRequestFilters(vehicleStore) {
  // --- STATE ---
  const filterPlaca = ref("");
  const filteredSubdependenciaOptions = ref([]);
  const filteredVehicleOptions = ref([]);
  
  // Cache de vehículos obtenidos del servidor
  const fetchedVehicles = ref([]);

  // --- METHODS ---

  /**
   * Filtrar subdependencias por texto de búsqueda
   */
  function filterSubdependencias(val, update, subdependenciaOptions) {
    if (val === "") {
      update(() => {
        filteredSubdependenciaOptions.value = subdependenciaOptions;
      });
      return;
    }

    update(() => {
      const needle = val.toLowerCase();
      filteredSubdependenciaOptions.value = subdependenciaOptions.filter(
        (v) => v.nombre.toLowerCase().indexOf(needle) > -1
      );
    });
  }

  /**
   * Filtrar vehículos por placa
   */
  function triggerFilterVehicles(val) {
    const needle = val.toLowerCase();
    filteredVehicleOptions.value = fetchedVehicles.value.filter(
      (v) => v.placa.toLowerCase().indexOf(needle) > -1
    );
  }

  /**
   * Obtener vehículos desde el store y cachearlos
   */
  async function fetchVehicles(idSubdependencia, idTipoCombustible) {
    if (!idSubdependencia || !idTipoCombustible) {
      fetchedVehicles.value = [];
      filteredVehicleOptions.value = [];
      return;
    }

    try {
      const vehicles = await vehicleStore.fetchVehiclesByFilters({
        id_subdependencia: idSubdependencia,
        id_tipo_combustible: idTipoCombustible,
        limit: 1000,
      });

      fetchedVehicles.value = vehicles;
      filteredVehicleOptions.value = vehicles;
    } catch (error) {
      console.error("Error al obtener vehículos:", error);
      fetchedVehicles.value = [];
      filteredVehicleOptions.value = [];
    }
  }

  /**
   * Obtener color del badge según tipo de combustible
   */
  function getFuelColor(name) {
    if (!name) return "grey";
    const n = name.toLowerCase();
    if (n.includes("gasolina")) return "green-7";
    if (n.includes("diesel") || n.includes("gasoil")) return "blue-grey-8";
    return "blue-8";
  }

  /**
   * Resetear filtros
   */
  function resetFilters() {
    filterPlaca.value = "";
    filteredSubdependenciaOptions.value = [];
    filteredVehicleOptions.value = [];
    fetchedVehicles.value = [];
  }

  return {
    // State
    filterPlaca,
    filteredSubdependenciaOptions,
    filteredVehicleOptions,
    fetchedVehicles,
    // Methods
    filterSubdependencias,
    triggerFilterVehicles,
    fetchVehicles,
    getFuelColor,
    resetFilters,
  };
}

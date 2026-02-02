// src/components/dispatches/composables/useRequestQuota.js
import { ref, onMounted, onUnmounted } from "vue";
import socket from "../../../services/socket";

/**
 * Composable para manejar la lógica del cupo mensual
 * @param {Object} cupoStore - Store de cupos
 * @param {Object} selectedSubdependencia - Ref de subdependencia seleccionada
 * @param {Object} selectedCombustible - Ref de combustible seleccionado
 */
export function useRequestQuota(cupoStore, selectedSubdependencia, selectedCombustible) {
  // --- STATE ---
  const quotaInfo = ref(null);

  // --- METHODS ---

  /**
   * Obtener información del cupo específico
   */
  async function fetchQuotaInfo() {
    if (!selectedSubdependencia.value || !selectedCombustible.value) {
      quotaInfo.value = null;
      return;
    }

    try {
      const cupo = await cupoStore.fetchCupoEspecifico(
        selectedSubdependencia.value,
        selectedCombustible.value
      );

      quotaInfo.value = cupo;
    } catch (error) {
      console.warn("Error al obtener cupo:", error);
      quotaInfo.value = {
        disponible: 0,
        asignado: 0,
        consumido: 0,
        porcentaje: 0,
      };
    }
  }

  /**
   * Formatear volumen con separadores de miles
   */
  function formatVolume(val) {
    if (val === undefined || val === null) return "0";
    return Number(val).toLocaleString("es-VE");
  }

  /**
   * Manejar actualizaciones de cupo vía Socket.IO
   */
  function handleSocketUpdate(data) {
    console.log("Evento de socket recibido (cupo):", data);
    fetchQuotaInfo();
  }

  // --- LIFECYCLE ---

  onMounted(() => {
    // Escuchar actualizaciones de cupo vía Socket.IO
    socket.on("cupo:consumo", handleSocketUpdate);
    socket.on("cupo:recarga", handleSocketUpdate);
    socket.on("solicitud:creada", handleSocketUpdate);
  });

  onUnmounted(() => {
    // Limpiar listeners
    socket.off("cupo:consumo", handleSocketUpdate);
    socket.off("cupo:recarga", handleSocketUpdate);
    socket.off("solicitud:creada", handleSocketUpdate);
  });

  return {
    // State
    quotaInfo,
    // Methods
    fetchQuotaInfo,
    formatVolume,
  };
}

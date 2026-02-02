// src/stores/cupoStore.js
import { defineStore } from "pinia";
import { ref } from "vue";
import { useQuasar } from "quasar";
import api from "../api/index.js";
import socket from "../services/socket";

export const useCupoStore = defineStore("cupos", () => {
  const $q = useQuasar();

  // --- STATE ---
  const loading = ref(false);
  
  // Cupos Actuales (Saldos del mes)
  const cuposActuales = ref([]);
  const paginationActual = ref({
    page: 1,
    rowsPerPage: 10,
    rowsNumber: 0,
    sortBy: "id_cupo_actual",
    descending: true
  });
  const filterActual = ref("");

  // Cupos Base (Configuración mensual)
  const cuposBase = ref([]);
  const paginationBase = ref({
    page: 1,
    rowsPerPage: 10,
    rowsNumber: 0,
    sortBy: "id_cupo_base",
    descending: true
  });
  const filterBase = ref("");

  // --- ACTIONS ---

  /**
   * Obtener cupos actuales (saldos del mes en curso)
   */
  async function fetchCuposActuales() {
    loading.value = true;
    try {
      const params = {
        page: paginationActual.value.page,
        limit: paginationActual.value.rowsPerPage,
        search: filterActual.value
      };
      const response = await api.get("/cupos/actual", { params });
      cuposActuales.value = response.data.data;
      paginationActual.value.rowsNumber = response.data.pagination.totalItems;
    } catch (error) {
      console.error("Error al obtener cupos actuales:", error);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Obtener cupos base (configuración mensual estándar)
   */
  async function fetchCuposBase() {
    loading.value = true;
    try {
      const params = {
        page: paginationBase.value.page,
        limit: paginationBase.value.rowsPerPage,
        search: filterBase.value
      };
      const response = await api.get("/cupos/base", { params });
      cuposBase.value = response.data.data;
      paginationBase.value.rowsNumber = response.data.pagination.totalItems;
    } catch (error) {
      console.error("Error al obtener cupos base:", error);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Crear nueva configuración de cupo base
   */
  async function createCupoBase(formData) {
    loading.value = true;
    try {
      const response = await api.post("/cupos/base", formData);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchCuposBase();
      await fetchCuposActuales(); // También refrescamos actuales por si se creó el registro del mes
      return true;
    } catch (error) {
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Actualizar configuración de cupo base
   */
  async function updateCupoBase(id, formData) {
    loading.value = true;
    try {
      const response = await api.put(`/cupos/base/${id}`, formData);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchCuposBase();
      return true;
    } catch (error) {
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Recargar un cupo actual con saldo extra
   */
  async function recargarCupo(payload) {
    loading.value = true;
    try {
      const response = await api.post("/cupos/recargar", payload);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchCuposActuales();
      return true;
    } catch (error) {
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Reiniciar mes manualmente (Solo Admin)
   */
  async function reiniciarMes() {
    loading.value = true;
    try {
      const response = await api.post("/cupos/reiniciar-mes");
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchCuposActuales();
      return true;
    } catch (error) {
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Obtiene información detallada de cupo para una combinación específica
   */
  async function fetchCupoEspecifico(id_subdependencia, id_tipo_combustible) {
    if (!id_subdependencia || !id_tipo_combustible) {
      return null;
    }
    try {
      const response = await api.get("/cupos/especifico", {
        params: { id_subdependencia, id_tipo_combustible },
      });
      const cupo = response.data.data;
      if (cupo) {
        const asignado = parseFloat(cupo.cantidad_asignada);
        const consumido = parseFloat(cupo.cantidad_consumida);
        return {
          disponible: parseFloat(cupo.cantidad_disponible),
          asignado: asignado,
          consumido: consumido,
          porcentaje: asignado > 0 ? ((consumido / asignado) * 100).toFixed(1) : 0
        };
      }
      return { disponible: 0, asignado: 0, consumido: 0, porcentaje: 0 };
    } catch (error) {
      console.warn("Cupo no disponible para esta combinación");
      return { disponible: 0, asignado: 0, consumido: 0, porcentaje: 0 };
    }
  }

  function initSocket() {
    socket.on("cupo:creado", () => {
      fetchCuposBase();
      fetchCuposActuales();
    });

    socket.on("cupo:actualizado", () => {
      fetchCuposBase();
      fetchCuposActuales();
    });

    socket.on("cupo:consumo", () => {
      fetchCuposActuales();
    });

    socket.on("cupo:recarga", () => {
      fetchCuposActuales();
    });

    // Eventos globales del sistema que afectan cupos
    socket.on("cupo:reinicio-mensual", () => {
      fetchCuposActuales();
    });
  }

  function cleanupSocket() {
    socket.off("cupo:creado");
    socket.off("cupo:actualizado");
    socket.off("cupo:consumo");
    socket.off("cupo:recarga");
    socket.off("cupo:reinicio-mensual");
  }

  return {
    loading,
    cuposActuales,
    paginationActual,
    filterActual,
    cuposBase,
    paginationBase,
    filterBase,
    fetchCuposActuales,
    fetchCuposBase,
    createCupoBase,
    updateCupoBase,
    recargarCupo,
    reiniciarMes,
    initSocket,
    cleanupSocket
  };
});

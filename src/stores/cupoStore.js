// src/stores/cupoStore.js
import { defineStore } from "pinia";
import { ref } from "vue";
import { useQuasar } from "quasar";
import api from "../api/index.js";
import socket from "../services/socket";

export const useCupoStore = defineStore("cupos", () => {
  const $q = useQuasar();

  // --- STATE ---
  // Cupos Base (Configuración)
  const rowsBase = ref([]);
  const loadingBase = ref(false);
  const filterBase = ref("");
  const paginationBase = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: "id_cupo_base",
    descending: true,
    rowsNumber: 0,
  });

  // Cupos Actuales (Estado)
  const rowsActual = ref([]);
  const loadingActual = ref(false);
  const filterActual = ref("");
  const paginationActual = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: "id_cupo_actual",
    descending: true,
    rowsNumber: 0,
  });

  // --- ACTIONS ---

  // Obtener Cupos Base
  async function fetchCuposBase() {
    loadingBase.value = true;
    try {
      const params = {
        page: paginationBase.value.page,
        limit: paginationBase.value.rowsPerPage,
        sortBy: paginationBase.value.sortBy,
        descending: paginationBase.value.descending,
        search: filterBase.value,
      };
      const response = await api.get("/cupos/base", { params });
      rowsBase.value = response.data.data;
      paginationBase.value.rowsNumber = response.data.pagination.totalItems;
    } catch (error) {
      console.error(error);
      $q.notify({ type: "negative", message: "Error cargando cupos base" });
    } finally {
      loadingBase.value = false;
    }
  }

  // Crear Cupo Base
  async function createCupoBase(data) {
    loadingBase.value = true;
    try {
      const response = await api.post("/cupos/base", data);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchCuposBase();
      return true;
    } catch (error) {
      console.error(error);
      $q.notify({ type: "negative", message: error.response?.data?.msg || "Error creando cupo" });
      return false;
    } finally {
      loadingBase.value = false;
    }
  }

  // Actualizar Cupo Base
  async function updateCupoBase(id, data) {
    loadingBase.value = true;
    try {
      const response = await api.put(`/cupos/base/${id}`, data);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchCuposBase();
      return true;
    } catch (error) {
      console.error(error);
      $q.notify({ type: "negative", message: error.response?.data?.msg || "Error actualizando cupo" });
      return false;
    } finally {
      loadingBase.value = false;
    }
  }

  // Obtener Cupos Actuales
  async function fetchCuposActuales() {
    loadingActual.value = true;
    try {
      const params = {
        page: paginationActual.value.page,
        limit: paginationActual.value.rowsPerPage,
        sortBy: paginationActual.value.sortBy,
        descending: paginationActual.value.descending,
        search: filterActual.value,
      };
      const response = await api.get("/cupos/actual", { params });
      rowsActual.value = response.data.data;
      paginationActual.value.rowsNumber = response.data.pagination.totalItems;
    } catch (error) {
      console.error(error);
      $q.notify({ type: "negative", message: "Error cargando estado de cupos" });
    } finally {
      loadingActual.value = false;
    }
  }

  // Recargar Cupo
  async function recargarCupo(data) {
    try {
        const response = await api.post("/cupos/recargar", data);
        $q.notify({ type: "positive", message: response.data.msg });
        // No necesitamos recargar toda la lista si usamos sockets, pero por seguridad:
        // await fetchCuposActuales(); 
        return true;
    } catch (error) {
        console.error(error);
        $q.notify({ type: "negative", message: error.response?.data?.msg || "Error al recargar" });
        return false;
    }
  }

  // SOCKETS
  function initSocket() {
    // Escuchar cambios en configuración
    socket.on("cupo:creado", () => fetchCuposBase());
    socket.on("cupo:actualizado", () => fetchCuposBase());

    // Escuchar cambios en estado actual (consumos/recargas)
    socket.on("cupo:consumo", () => fetchCuposActuales());
    socket.on("cupo:recarga", () => fetchCuposActuales());
  }

  function cleanupSocket() {
    socket.off("cupo:creado");
    socket.off("cupo:actualizado");
    socket.off("cupo:consumo");
    socket.off("cupo:recarga");
  }

  return {
    // Base
    rowsBase,
    loadingBase,
    filterBase,
    paginationBase,
    fetchCuposBase,
    createCupoBase,
    updateCupoBase,
    
    // Actual
    rowsActual,
    loadingActual,
    filterActual,
    paginationActual,
    fetchCuposActuales,
    recargarCupo,

    // General
    initSocket,
    cleanupSocket,
  };
});

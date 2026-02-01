// src/stores/requestStore.js
import { defineStore } from "pinia";
import { ref } from "vue";
import { useQuasar } from "quasar";
import api from "../api/index.js";
import socket from "../services/socket";

export const useRequestStore = defineStore("requests", () => {
  const $q = useQuasar();

  // --- STATE ---
  const rows = ref([]);
  const loading = ref(false);
  const filter = ref("");
  const pagination = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: "id_solicitud",
    descending: true,
    rowsNumber: 0,
  });

  // --- ACTIONS ---

  /**
   * Obtener listado optimizado de solicitudes (vía Vista SQL)
   */
  async function fetchRequests() {
    loading.value = true;
    try {
      const params = {
        page: pagination.value.page,
        limit: pagination.value.rowsPerPage,
        sortBy: pagination.value.sortBy,
        descending: pagination.value.descending,
        search: filter.value,
      };
      const response = await api.get("/solicitudes", { params });
      rows.value = response.data.data;
      pagination.value.rowsNumber = response.data.pagination.totalItems;
    } catch (error) {
      console.error("Error al obtener solicitudes:", error);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Crear nueva solicitud de combustible (Retiene cupo)
   */
  async function createRequest(requestData) {
    loading.value = true;
    try {
      const response = await api.post("/solicitudes", requestData);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchRequests();
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.msg || "Error al crear solicitud";
      $q.notify({ type: "negative", message: errorMsg });
      console.error("Error completo:", error.response?.data);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Aprobar solicitud jerárquicamente
   */
  async function approveRequest(requestId) {
    loading.value = true;
    try {
      const response = await api.put(`/solicitudes/${requestId}/aprobar`);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchRequests();
      return true;
    } catch (error) {
      const errorMsg = error.response?.data?.msg || "Error al aprobar solicitud";
      $q.notify({ type: "negative", message: errorMsg });
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Generar Ticket (Imprimir con validación biométrica)
   */
  async function printTicket(requestId, huellas) {
    loading.value = true;
    try {
      const response = await api.post(`/despacho/imprimir/${requestId}`, huellas);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchRequests();
      return response.data; // Retorna datos del ticket para imprimir
    } catch (error) {
      const errorMsg = error.response?.data?.msg || "Error al imprimir ticket";
      $q.notify({ type: "negative", message: errorMsg });
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Reimprimir Ticket (Copia)
   */
  async function reprintTicket(requestId) {
    loading.value = true;
    try {
      const response = await api.post(`/despacho/reimprimir/${requestId}`);
      $q.notify({ type: "positive", message: response.data.msg });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.msg || "Error al reimprimir ticket";
      $q.notify({ type: "negative", message: errorMsg });
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Cerrar despacho (Conciliación de litros y reintegro)
   */
  async function dispatchRequest(dispatchData) {
    loading.value = true;
    try {
      const response = await api.post(`/despacho/despachar`, dispatchData);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchRequests();
      return true;
    } catch (error) {
      const errorMsg = error.response?.data?.msg || "Error al despachar solicitud";
      $q.notify({ type: "negative", message: errorMsg });
      return false;
    } finally {
      loading.value = false;
    }
  }

  // --- SOCKET IO ---

  function initSocket() {
    socket.on("solicitud:creada", () => fetchRequests());
    socket.on("solicitud:actualizada", () => fetchRequests());
    socket.on("solicitud:despachada", () => fetchRequests());
  }

  function cleanupSocket() {
    socket.off("solicitud:creada");
    socket.off("solicitud:actualizada");
    socket.off("solicitud:despachada");
  }

  return {
    rows,
    loading,
    filter,
    pagination,
    fetchRequests,
    createRequest,
    approveRequest,
    printTicket,
    reprintTicket,
    dispatchRequest,
    initSocket,
    cleanupSocket,
  };
});

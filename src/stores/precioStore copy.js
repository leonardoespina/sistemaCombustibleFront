// src/stores/precioStore.js
import { defineStore } from "pinia";
import { ref } from "vue";
import { useQuasar } from "quasar";
import api from "../api/index.js";
import socket from "../services/socket";

export const usePrecioStore = defineStore("precio", () => {
  const $q = useQuasar();

  // --- STATE ---
  const monedas = ref([]);
  const preciosActuales = ref([]);
  const loading = ref(false);
  const filter = ref("");
  const pagination = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: "id_moneda",
    descending: false,
    rowsNumber: 0,
  });

  // --- ACTIONS: MONEDAS ---

  async function fetchMonedas() {
    loading.value = true;
    try {
      const params = {
        page: pagination.value.page,
        limit: pagination.value.rowsPerPage,
        sortBy: pagination.value.sortBy,
        descending: pagination.value.descending,
        search: filter.value,
      };
      const response = await api.get("/precios/monedas", { params });
      monedas.value = response.data.data;
      pagination.value.rowsNumber = response.data.pagination.totalItems;
    } catch (error) {
      console.error(error);
      $q.notify({ type: "negative", message: "Error cargando monedas" });
    } finally {
      loading.value = false;
    }
  }

  async function createMoneda(data) {
    loading.value = true;
    try {
      const response = await api.post("/precios/monedas", data);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchMonedas();
      return true;
    } catch (error) {
      console.error(error);
      $q.notify({ type: "negative", message: error.response?.data?.msg || "Error creando moneda" });
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function updateMoneda(id, data) {
    loading.value = true;
    try {
      const response = await api.put(`/precios/monedas/${id}`, data);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchMonedas();
      return true;
    } catch (error) {
      console.error(error);
      $q.notify({ type: "negative", message: error.response?.data?.msg || "Error actualizando moneda" });
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteMoneda(id) {
    loading.value = true;
    try {
      const response = await api.delete(`/precios/monedas/${id}`);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchMonedas();
    } catch (error) {
      console.error(error);
      $q.notify({ type: "negative", message: error.response?.data?.msg || "Error eliminando moneda" });
    } finally {
      loading.value = false;
    }
  }

  // --- ACTIONS: PRECIOS ---

  async function fetchPreciosActuales() {
    loading.value = true;
    try {
      const response = await api.get("/precios/actuales");
      preciosActuales.value = response.data;
    } catch (error) {
      console.error(error);
      $q.notify({ type: "negative", message: "Error cargando precios" });
    } finally {
      loading.value = false;
    }
  }

  async function actualizarPrecios(data) {
    loading.value = true;
    try {
      const response = await api.post("/precios/actualizar", data);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchPreciosActuales();
      return true;
    } catch (error) {
      console.error(error);
      $q.notify({ type: "negative", message: error.response?.data?.msg || "Error actualizando precios" });
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Obtiene precios configurados para un tipo de combustible específico.
   */
  async function fetchPreciosByCombustible(id_tipo_combustible) {
    if (!id_tipo_combustible) return [];
    try {
      const response = await api.get(`/precios/combustible/${id_tipo_combustible}`);
      return response.data.map(p => ({
          ...p,
          etiqueta_precio: `${p.Moneda?.nombre}: ${p.precio} x Lto`
      }));
    } catch (error) {
      console.error("Error fetching prices by fuel type:", error);
      return [];
    }
  }

  // --- SOCKET ---

  function initSocket() {
    socket.on("moneda:creado", () => {
      fetchMonedas();
      fetchPreciosActuales();
    });
    socket.on("moneda:actualizado", () => {
      fetchMonedas();
      fetchPreciosActuales();
    });
    socket.on("precio:actualizado", () => fetchPreciosActuales());
  }

  function cleanupSocket() {
    socket.off("moneda:creado");
    socket.off("moneda:actualizado");
    socket.off("precio:actualizado");
  }

  return {
    monedas,
    preciosActuales,
    loading,
    filter,
    pagination,
    fetchMonedas,
    createMoneda,
    updateMoneda,
    deleteMoneda,
    fetchPreciosActuales,
    actualizarPrecios,
    initSocket,
    cleanupSocket,
  };
});

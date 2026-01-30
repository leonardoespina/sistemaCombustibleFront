// src/stores/tipoCombustibleStore.js
import { defineStore } from "pinia";
import { ref } from "vue";
import { useQuasar } from "quasar";
import api from "../api/index.js";
import socket from "../services/socket";

export const useTipoCombustibleStore = defineStore("tipoCombustible", () => {
  const $q = useQuasar();

  // --- STATE ---
  const rows = ref([]);
  const loading = ref(false);
  const filter = ref("");
  const pagination = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: "id_tipo_combustible",
    descending: true,
    rowsNumber: 0,
  });

  // --- ACTIONS ---

  async function fetchTiposCombustible() {
    loading.value = true;
    try {
      const params = {
        page: pagination.value.page,
        limit: pagination.value.rowsPerPage,
        sortBy: pagination.value.sortBy,
        descending: pagination.value.descending,
        search: filter.value,
      };
      const response = await api.get("/tipos-combustible", { params });
      rows.value = response.data.data;
      pagination.value.rowsNumber = response.data.pagination.totalItems;
    } catch (error) {
      console.error(error);
      $q.notify({ type: "negative", message: "Error cargando tipos de combustible" });
    } finally {
      loading.value = false;
    }
  }

  async function createTipoCombustible(data) {
    loading.value = true;
    try {
      const response = await api.post("/tipos-combustible", data);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchTiposCombustible();
      return true;
    } catch (error) {
      console.error(error);
      $q.notify({ type: "negative", message: error.response?.data?.msg || "Error creando registro" });
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function updateTipoCombustible(id, data) {
    loading.value = true;
    try {
      const response = await api.put(`/tipos-combustible/${id}`, data);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchTiposCombustible();
      return true;
    } catch (error) {
      console.error(error);
      $q.notify({ type: "negative", message: error.response?.data?.msg || "Error actualizando registro" });
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteTipoCombustible(id) {
    loading.value = true;
    try {
      const response = await api.delete(`/tipos-combustible/${id}`);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchTiposCombustible();
    } catch (error) {
        console.error(error);
        $q.notify({ type: "negative", message: error.response?.data?.msg || "Error eliminando registro" });
    } finally {
      loading.value = false;
    }
  }

  function initSocket() {
    socket.on("tipo_combustible:creado", () => fetchTiposCombustible());
    socket.on("tipo_combustible:actualizado", () => fetchTiposCombustible());
  }

  function cleanupSocket() {
    socket.off("tipo_combustible:creado");
    socket.off("tipo_combustible:actualizado");
  }

  return {
    rows,
    loading,
    filter,
    pagination,
    fetchTiposCombustible,
    createTipoCombustible,
    updateTipoCombustible,
    deleteTipoCombustible,
    initSocket,
    cleanupSocket,
  };
});

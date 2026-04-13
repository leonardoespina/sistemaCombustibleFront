// src/stores/tankStore.js
import { defineStore } from "pinia";
import { ref } from "vue";
import { useQuasar } from "quasar";
import api from "../api/index.js";
import socket from "../services/socket";

export const useTankStore = defineStore("tanks", () => {
  const $q = useQuasar();

  // --- STATE ---
  const rows = ref([]);
  const tanquesLista = ref([]);
  const loading = ref(false);
  const loadingLista = ref(false);
  const filter = ref("");
  const pagination = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: "id_tanque",
    descending: true,
    rowsNumber: 0,
  });

  // Listas auxiliares para el formulario
  const llenaderos = ref([]);
  const tiposCombustible = ref([]);

  // --- ACTIONS ---

  async function fetchTanks() {
    loading.value = true;
    try {
      const params = {
        page: pagination.value.page,
        limit: pagination.value.rowsPerPage,
        sortBy: pagination.value.sortBy,
        descending: pagination.value.descending,
        search: filter.value,
      };
      const response = await api.get("/tanques", { params });
      rows.value = response.data.data;
      pagination.value.rowsNumber = response.data.pagination.totalItems;
    } catch (error) {
      if (error.response?.status !== 403) {
        console.error("Error al obtener tanques:", error);
      }
    } finally {
      loading.value = false;
    }
  }

  async function fetchTanksList() {
    loadingLista.value = true;
    try {
      const response = await api.get("/tanques/lista");
      tanquesLista.value = response.data || [];
    } catch (error) {
      console.error("Error al obtener lista simplificada de tanques:", error);
    } finally {
      loadingLista.value = false;
    }
  }

  async function createTank(tankData) {
    loading.value = true;
    try {
      const response = await api.post("/tanques", tankData);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchTanks();
      return true;
    } catch (error) {
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function updateTank(tankId, tankData) {
    loading.value = true;
    try {
      const response = await api.put(`/tanques/${tankId}`, tankData);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchTanks();
      return true;
    } catch (error) {
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteTank(tankId) {
    loading.value = true;
    try {
      const response = await api.delete(`/tanques/${tankId}`);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchTanks();
    } catch (error) {
      console.error(error);
    } finally {
      loading.value = false;
    }
  }

  // --- AUXILIARY LISTS ---

  async function toggleTankUsage(tankId) {
    loading.value = true;
    try {
      const response = await api.patch(`/tanques/${tankId}/uso`);
      $q.notify({ type: "positive", message: response.data.msg });
      // El listado total se actualiza vía WebSocket, pero reforzamos localmente
      await fetchTanks();
      await fetchTanksList();
      return true;
    } catch (error) {
      // El error ya genera notificaciones si hay un interceptor global, pero se retorna fallido
      // $q.notify es manejado usualmente en interceptores o se puede des-comentar
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function fetchLlenaderosList() {
    try {
      const response = await api.get("/llenaderos/lista");

      llenaderos.value = response.data;

    } catch (error) {
      console.error("Error llenaderos:", error);
    }
  }

  async function fetchFuelTypesList() {
    try {
      const response = await api.get("/tipos-combustible/lista");
      tiposCombustible.value = response.data;
    } catch (error) {
      console.error("Error combustibles:", error);
    }
  }

  // --- SOCKET IO ---

  function initSocket() {
    socket.on("tanque:creado", () => {
      fetchTanks();
      fetchTanksList();
    });
    socket.on("tanque:actualizado", () => {
      fetchTanks();
      fetchTanksList();
    });
  }

  function cleanupSocket() {
    socket.off("tanque:creado");
    socket.off("tanque:actualizado");
  }

  return {
    rows,
    tanquesLista,
    loading,
    loadingLista,
    filter,
    pagination,
    llenaderos,
    tiposCombustible,
    fetchTanks,
    fetchTanksList,
    createTank,
    updateTank,
    deleteTank,
    toggleTankUsage,
    fetchLlenaderosList,
    fetchFuelTypesList,
    initSocket,
    cleanupSocket
  };
});

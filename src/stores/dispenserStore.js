// src/stores/dispenserStore.js

import { defineStore } from "pinia";
import { ref } from "vue";
import { useQuasar } from "quasar";
import api from "../api/index.js";
import socket from "../services/socket";

export const useDispenserStore = defineStore("dispensers", () => {
  const $q = useQuasar();

  // --- STATE ---
  const rows = ref([]);
  const loading = ref(false);
  const filter = ref("");
  const pagination = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: "codigo",
    descending: false,
    rowsNumber: 0,
  });

  // --- ACTIONS ---

  async function fetchDispensers() {
    loading.value = true;
    try {
      const params = {
        page: pagination.value.page,
        limit: pagination.value.rowsPerPage,
        sortBy: pagination.value.sortBy,
        descending: pagination.value.descending,
        search: filter.value,
      };
      const response = await api.get("/dispensadores", { params });
      rows.value = response.data.data;
      pagination.value.rowsNumber = response.data.pagination.totalItems;
    } catch (error) {
      console.error("Error al obtener dispensadores:", error);
    } finally {
      loading.value = false;
    }
  }

  async function createDispenser(dispenserData) {
    loading.value = true;
    try {
      const response = await api.post("/dispensadores", dispenserData);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchDispensers();
      return true;
    } catch (error) {
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function updateDispenser(id, dispenserData) {
    loading.value = true;
    try {
      const response = await api.put(`/dispensadores/${id}`, dispenserData);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchDispensers();
      return true;
    } catch (error) {
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteDispenser(id) {
    loading.value = true;
    try {
      const response = await api.delete(`/dispensadores/${id}`);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchDispensers();
    } finally {
      loading.value = false;
    }
  }

  function initSocket() {
    socket.on("dispensador:creado", () => fetchDispensers());
    socket.on("dispensador:actualizado", () => fetchDispensers());
  }

  function cleanupSocket() {
    socket.off("dispensador:creado");
    socket.off("dispensador:actualizado");
  }

  return {
    rows,
    loading,
    filter,
    pagination,
    fetchDispensers,
    createDispenser,
    updateDispenser,
    deleteDispenser,
    initSocket,
    cleanupSocket,
  };
});

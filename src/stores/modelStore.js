// src/stores/modelStore.js

import { defineStore } from "pinia";
import { ref } from "vue";
import { useQuasar } from "quasar";
import api from "../api/index.js";
import socket from "../services/socket";

export const useModelStore = defineStore("models", () => {
  const $q = useQuasar();

  // --- STATE ---
  const rows = ref([]);
  const loading = ref(false);
  const filter = ref("");
  const pagination = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: "id_modelo",
    descending: false,
    rowsNumber: 0,
  });

  // Estado para guardar la lista de todas las marcas activas (para el QSelect)
  const allBrands = ref([]);

  // --- ACTIONS ---

  async function fetchModels() {
    loading.value = true;
    try {
      const params = {
        page: pagination.value.page,
        limit: pagination.value.rowsPerPage,
        sortBy: pagination.value.sortBy,
        descending: pagination.value.descending,
        search: filter.value,
      };
      const response = await api.get("/modelos", { params });
      rows.value = response.data.data;
      pagination.value.rowsNumber = response.data.pagination.totalItems;
    } finally {
      loading.value = false;
    }
  }

  async function createModel(modelData) {
    loading.value = true;
    try {
      const response = await api.post("/modelos", modelData);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchModels();
      return true;
    } catch (error) {
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function updateModel(modelId, modelData) {
    loading.value = true;
    try {
      const response = await api.put(`/modelos/${modelId}`, modelData);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchModels();
      return true;
    } catch (error) {
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteModel(modelId) {
    loading.value = true;
    try {
      const response = await api.delete(`/modelos/${modelId}`);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchModels();
    } finally {
      loading.value = false;
    }
  }

  /**
   * Acción para obtener todas las marcas activas y poblar el QSelect.
   * Reutilizamos el endpoint que ya existe para vehículos.
   */
  async function fetchAllBrands() {
    try {
      // --- CAMBIO CLAVE AQUÍ ---
      // Apuntamos al nuevo endpoint específico para listas, que no tiene paginación.
      const response = await api.get("/marcas/lista");

      // Como este endpoint ya devuelve un array, la asignación es directa y segura.
      allBrands.value = response.data;
    } catch (error) {
      console.error("Error al obtener la lista de marcas:", error);
      $q.notify({
        type: "negative",
        message: "No se pudo cargar la lista de marcas.",
      });
    }
  }

  function initSocket() {
    socket.on("modelo:creado", () => fetchModels());
    socket.on("modelo:actualizado", () => fetchModels());
  }

  function cleanupSocket() {
    socket.off("modelo:creado");
    socket.off("modelo:actualizado");
  }

  return {
    rows,
    loading,
    filter,
    pagination,
    allBrands, // Exponemos las marcas
    fetchModels,
    createModel,
    updateModel,
    deleteModel,
    fetchAllBrands, // Exponemos la acción
    initSocket,
    cleanupSocket,
  };
});

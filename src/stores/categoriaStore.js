// src/stores/categoriaStore.js
import { defineStore } from "pinia";
import { ref } from "vue";
import { useQuasar } from "quasar";
import api from "../api/index.js";
import socket from "../services/socket";

export const useCategoriaStore = defineStore("categorias", () => {
  const $q = useQuasar();

  // --- STATE ---
  const rows = ref([]);
  const loading = ref(false);
  const filter = ref("");
  const pagination = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: "id_categoria",
    descending: true,
    rowsNumber: 0,
  });

  // --- ACTIONS ---

  async function fetchCategorias() {
    loading.value = true;
    try {
      const params = {
        page: pagination.value.page,
        limit: pagination.value.rowsPerPage,
        sortBy: pagination.value.sortBy,
        descending: pagination.value.descending,
        search: filter.value,
      };
      const response = await api.get("/categorias", { params });
      rows.value = response.data.data;
      pagination.value.rowsNumber = response.data.pagination.totalItems;
    } finally {
      loading.value = false;
    }
  }

  async function createCategoria(data) {
    loading.value = true;
    try {
      const response = await api.post("/categorias", data);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchCategorias();
      return true;
    } catch (error) {
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function updateCategoria(id, data) {
    loading.value = true;
    try {
      const response = await api.put(`/categorias/${id}`, data);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchCategorias();
      return true;
    } catch (error) {
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteCategoria(id) {
    loading.value = true;
    try {
      const response = await api.delete(`/categorias/${id}`);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchCategorias();
    } finally {
      loading.value = false;
    }
  }

  function initSocket() {
    socket.on("categoria:creado", () => fetchCategorias());
    socket.on("categoria:actualizado", () => fetchCategorias());
  }

  function cleanupSocket() {
    socket.off("categoria:creado");
    socket.off("categoria:actualizado");
  }

  return {
    rows,
    loading,
    filter,
    pagination,
    fetchCategorias,
    createCategoria,
    updateCategoria,
    deleteCategoria,
    initSocket,
    cleanupSocket,
  };
});

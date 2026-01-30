import { defineStore } from "pinia";
import { ref } from "vue";
import { useQuasar } from "quasar";
import api from "../api/index.js";
import socket from "../services/socket";

export const useDependenciaStore = defineStore("dependencias", () => {
  const $q = useQuasar();

  // --- STATE ---
  const rows = ref([]);
  const loading = ref(false);
  const filter = ref("");
  const pagination = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: "id_dependencia",
    descending: true,
    rowsNumber: 0,
  });

  // --- ACTIONS ---

  async function fetchDependencias() {
    loading.value = true;
    try {
      const params = {
        page: pagination.value.page,
        limit: pagination.value.rowsPerPage,
        sortBy: pagination.value.sortBy,
        descending: pagination.value.descending,
        search: filter.value,
      };
      const response = await api.get("/dependencias", { params });
      rows.value = response.data.data;
      pagination.value.rowsNumber = response.data.pagination.totalItems;
    } finally {
      loading.value = false;
    }
  }

  async function createDependencia(data) {
    loading.value = true;
    try {
      const response = await api.post("/dependencias", data);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchDependencias();
      return true;
    } catch (error) {
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function updateDependencia(id, data) {
    loading.value = true;
    try {
      const response = await api.put(`/dependencias/${id}`, data);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchDependencias();
      return true;
    } catch (error) {
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteDependencia(id) {
    loading.value = true;
    try {
      const response = await api.delete(`/dependencias/${id}`);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchDependencias();
    } finally {
      loading.value = false;
    }
  }

  function initSocket() {
    socket.on("dependencia:creado", () => {
      fetchDependencias();
    });
    socket.on("dependencia:actualizado", () => {
      fetchDependencias();
    });
  }

  function cleanupSocket() {
    socket.off("dependencia:creado");
    socket.off("dependencia:actualizado");
  }

  return {
    rows,
    loading,
    filter,
    pagination,
    fetchDependencias,
    createDependencia,
    updateDependencia,
    deleteDependencia,
    initSocket,
    cleanupSocket,
  };
});

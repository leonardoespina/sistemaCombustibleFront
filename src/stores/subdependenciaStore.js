import { defineStore } from "pinia";
import { ref } from "vue";
import { useQuasar } from "quasar";
import api from "../api/index.js";
import socket from "../services/socket";

export const useSubdependenciaStore = defineStore("subdependencias", () => {
  const $q = useQuasar();
  const rows = ref([]);
  const loading = ref(false);
  const filter = ref("");
  const pagination = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: "id_subdependencia",
    descending: true,
    rowsNumber: 0,
  });

  async function fetchSubdependencias() {
    loading.value = true;
    try {
      const params = {
        page: pagination.value.page,
        limit: pagination.value.rowsPerPage,
        sortBy: pagination.value.sortBy,
        descending: pagination.value.descending,
        search: filter.value,
      };
      const response = await api.get("/subdependencias", { params });
      rows.value = response.data.data;
      pagination.value.rowsNumber = response.data.pagination.totalItems;
    } finally {
      loading.value = false;
    }
  }
  
    async function createSubdependencia(data) {
    loading.value = true;
    try {
      const response = await api.post("/subdependencias", data);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchSubdependencias();
      return true;
    } catch (error) {
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function updateSubdependencia(id, data) {
    loading.value = true;
    try {
      const response = await api.put(`/subdependencias/${id}`, data);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchSubdependencias();
      return true;
    } catch (error) {
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteSubdependencia(id) {
    loading.value = true;
    try {
      const response = await api.delete(`/subdependencias/${id}`);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchSubdependencias();
    } finally {
      loading.value = false;
    }
  }

  async function fetchSubdependenciasByDependencia(id_dependencia) {
    try {
      const response = await api.get("/subdependencias", { params: { id_dependencia } });
      return response.data.data || response.data;
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  function initSocket() {
    socket.on("subdependencia:creado", fetchSubdependencias);
    socket.on("subdependencia:actualizado", fetchSubdependencias);
  }

  function cleanupSocket() {
    socket.off("subdependencia:creado");
    socket.off("subdependencia:actualizado");
  }

  return {
    rows,
    loading,
    filter,
    pagination,
    fetchSubdependencias,
    createSubdependencia,
    updateSubdependencia,
    deleteSubdependencia,
    fetchSubdependenciasByDependencia,
    initSocket,
    cleanupSocket,
  };
});

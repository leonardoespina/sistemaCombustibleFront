// src/stores/llenaderoStore.js
import { defineStore } from "pinia";
import { ref } from "vue";
import { useQuasar } from "quasar";
import api from "../api/index.js";
import socket from "../services/socket";

export const useLlenaderoStore = defineStore("llenaderos", () => {
  const $q = useQuasar();

  // --- STATE ---
  const rows = ref([]);
  const loading = ref(false);
  const filter = ref("");
  const pagination = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: "id_llenadero",
    descending: true,
    rowsNumber: 0,
  });

  // --- ACTIONS ---

  async function fetchLlenaderos() {
    loading.value = true;
    try {
      const params = {
        page: pagination.value.page,
        limit: pagination.value.rowsPerPage,
        sortBy: pagination.value.sortBy,
        descending: pagination.value.descending,
        search: filter.value,
      };
      const response = await api.get("/llenaderos", { params });
      rows.value = response.data.data;
      pagination.value.rowsNumber = response.data.pagination.totalItems;
    } catch (error) {
      console.error(error);
      $q.notify({ type: "negative", message: "Error cargando llenaderos" });
    } finally {
      loading.value = false;
    }
  }

  async function createLlenadero(data) {
    loading.value = true;
    try {
      const response = await api.post("/llenaderos", data);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchLlenaderos();
      return true;
    } catch (error) {
      console.error(error);
      $q.notify({ type: "negative", message: error.response?.data?.msg || "Error creando registro" });
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function updateLlenadero(id, data) {
    loading.value = true;
    try {
      const response = await api.put(`/llenaderos/${id}`, data);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchLlenaderos();
      return true;
    } catch (error) {
      console.error(error);
      $q.notify({ type: "negative", message: error.response?.data?.msg || "Error actualizando registro" });
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteLlenadero(id) {
    loading.value = true;
    try {
      const response = await api.delete(`/llenaderos/${id}`);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchLlenaderos();
    } catch (error) {
        console.error(error);
        $q.notify({ type: "negative", message: error.response?.data?.msg || "Error desactivando registro" });
    } finally {
      loading.value = false;
    }
  }

  function initSocket() {
    socket.on("llenadero:creado", () => fetchLlenaderos());
    socket.on("llenadero:actualizado", () => fetchLlenaderos());
  }

  function cleanupSocket() {
    socket.off("llenadero:creado");
    socket.off("llenadero:actualizado");
  }

  return {
    rows,
    loading,
    filter,
    pagination,
    fetchLlenaderos,
    createLlenadero,
    updateLlenadero,
    deleteLlenadero,
    initSocket,
    cleanupSocket,
  };
});

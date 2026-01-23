// src/stores/tankStore.js
import { defineStore } from "pinia";
import { ref } from "vue";
import { useQuasar } from "quasar";
import api from "../api/index.js";

export const useTankStore = defineStore("tanks", () => {
  const $q = useQuasar();

  // --- STATE ---
  const rows = ref([]);
  const loading = ref(false);
  const filter = ref("");
  const pagination = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: "codigo", // Ordenar por código por defecto
    descending: false,
    rowsNumber: 0,
  });

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
    } finally {
      loading.value = false;
    }
  }

  // ... (imports y state iguales) ...

  // --- ACTIONS ---

  // ... fetchTanks igual ...

  async function createTank(tankData) {
    loading.value = true;
    try {
      const response = await api.post("/tanques", tankData);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchTanks();
      return true;
    } catch (error) {
      // El interceptor muestra el error, pero retornamos false para que el diálogo no se cierre
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
    } finally {
      loading.value = false;
    }
  }

  return {
    rows,
    loading,
    filter,
    pagination,
    fetchTanks,
    createTank,
    updateTank,
    deleteTank,
  };
});

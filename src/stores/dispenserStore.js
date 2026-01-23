import { defineStore } from "pinia";
import { ref } from "vue";
import { useQuasar } from "quasar";
import api from "../api/index.js";

export const useDispenserStore = defineStore("dispensers", () => {
  const $q = useQuasar();

  // --- STATE ---
  const rows = ref([]);
  const loading = ref(false);
  const filter = ref("");
  const pagination = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: "id_dispensador",
    descending: true,
    rowsNumber: 0,
  });

  // Lista de Tanques para el select
  const tanksList = ref([]);

  // --- ACTIONS (CRUD) ---

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
    } finally {
      loading.value = false;
    }
  }

  async function createDispenser(data) {
    loading.value = true;
    try {
      const response = await api.post("/dispensadores", data);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchDispensers();
      return true;
    } catch (error) {
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function updateDispenser(id, data) {
    loading.value = true;
    try {
      const response = await api.put(`/dispensadores/${id}`, data);
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

  // --- CARGA DE LISTAS AUXILIARES ---
  async function loadTanks() {
    try {
      const response = await api.get("/tanques/lista");
      tanksList.value = Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      $q.notify({
        type: "warning",
        message: "No se pudo cargar la lista de tanques.",
      });
    }
  }

  return {
    rows,
    loading,
    filter,
    pagination,
    tanksList,
    fetchDispensers,
    createDispenser,
    updateDispenser,
    deleteDispenser,
    loadTanks,
  };
});

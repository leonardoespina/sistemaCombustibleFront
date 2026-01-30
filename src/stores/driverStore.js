import { defineStore } from "pinia";
import { ref } from "vue";
import { useQuasar } from "quasar";
import api from "../api/index.js";

export const useDriverStore = defineStore("drivers", () => {
  const $q = useQuasar();

  // --- STATE ---
  const rows = ref([]);
  const loading = ref(false);
  const filter = ref("");
  const pagination = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: "id_chofer",
    descending: true,
    rowsNumber: 0,
  });

  // --- ACTIONS (CRUD) ---

  async function fetchDrivers() {
    loading.value = true;
    try {
      const params = {
        page: pagination.value.page,
        limit: pagination.value.rowsPerPage,
        sortBy: pagination.value.sortBy,
        descending: pagination.value.descending,
        search: filter.value,
      };
      const response = await api.get("/choferes", { params });
      rows.value = response.data.data;
      pagination.value.rowsNumber = response.data.pagination.totalItems;
    } finally {
      loading.value = false;
    }
  }

  async function createDriver(data) {
    loading.value = true;
    try {
      const response = await api.post("/choferes", data);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchDrivers();
      return true;
    } catch (error) {
      return false; // El error lo maneja el interceptor
    } finally {
      loading.value = false;
    }
  }

  async function updateDriver(id, data) {
    loading.value = true;
    try {
      const response = await api.put(`/choferes/${id}`, data);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchDrivers();
      return true;
    } catch (error) {
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteDriver(id) {
    loading.value = true;
    try {
      const response = await api.delete(`/choferes/${id}`);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchDrivers();
    } finally {
      loading.value = false;
    }
  }

  return {
    rows,
    loading,
    filter,
    pagination,
    fetchDrivers,
    createDriver,
    updateDriver,
    deleteDriver,
  };
});

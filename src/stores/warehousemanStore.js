import { defineStore } from "pinia";
import { ref } from "vue";
import { useQuasar } from "quasar";
import api from "../api/index.js"; // Ruta relativa corregida

export const useWarehousemanStore = defineStore("warehousemen", () => {
  const $q = useQuasar();

  // --- STATE ---
  const rows = ref([]);
  const allWarehousemen = ref([]);
  const loading = ref(false);
  const filter = ref("");
  const pagination = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: "id_almacenista",
    descending: true,
    rowsNumber: 0,
  });

  // --- ACTIONS ---

  async function fetchWarehousemen() {
    loading.value = true;
    try {
      const params = {
        page: pagination.value.page,
        limit: pagination.value.rowsPerPage,
        sortBy: pagination.value.sortBy,
        descending: pagination.value.descending,
        search: filter.value,
      };
      const response = await api.get("/almacenistas", { params });
      rows.value = response.data.data;
      pagination.value.rowsNumber = response.data.pagination.totalItems;
    } finally {
      loading.value = false;
    }
  }

  async function fetchAllWarehousemen() {
    try {
      const response = await api.get("/almacenistas/lista");
      allWarehousemen.value = Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      $q.notify({
        type: "warning",
        message: "No se pudo cargar la lista de tanques.",
      });
    }
  }

  async function createWarehouseman(data) {
    loading.value = true;
    try {
      const response = await api.post("/almacenistas", data);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchWarehousemen();
      return true;
    } catch (error) {
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function updateWarehouseman(id, data) {
    loading.value = true;
    try {
      const response = await api.put(`/almacenistas/${id}`, data);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchWarehousemen();
      return true;
    } catch (error) {
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteWarehouseman(id) {
    loading.value = true;
    try {
      const response = await api.delete(`/almacenistas/${id}`);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchWarehousemen();
    } finally {
      loading.value = false;
    }
  }

  return {
    rows,
    loading,
    filter,
    pagination,
    fetchWarehousemen,
    createWarehouseman,
    updateWarehouseman,
    deleteWarehouseman,
    allWarehousemen,
    fetchAllWarehousemen,
  };
});

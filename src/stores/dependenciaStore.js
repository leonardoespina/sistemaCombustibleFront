// src/stores/dependenciaStore.js
import { defineStore } from "pinia";
import { ref } from "vue";
import { useQuasar } from "quasar";
import api from "../api/index.js";

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
    } catch (error) {
      console.error("Error fetching dependencias:", error);
      const errorMsg =
        error.response?.data?.msg || "Error al cargar las dependencias";
      $q.notify({
        type: "negative",
        message: errorMsg,
        icon: "error",
        position: "top-right",
      });
    } finally {
      loading.value = false;
    }
  }

  async function createDependencia(data) {
    loading.value = true;
    try {
      const response = await api.post("/dependencias", data);
      $q.notify({
        type: "positive",
        message: response.data.msg || "Dependencia creada exitosamente",
        icon: "check_circle",
        position: "top-right",
      });
      await fetchDependencias();
      return true;
    } catch (error) {
      console.error("Error creating dependencia:", error);
      const errorMsg =
        error.response?.data?.msg || "Error al crear la dependencia";
      $q.notify({
        type: "negative",
        message: errorMsg,
        icon: "error",
        position: "top-right",
      });
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function updateDependencia(id, data) {
    loading.value = true;
    try {
      const response = await api.put(`/dependencias/${id}`, data);
      $q.notify({
        type: "positive",
        message: response.data.msg || "Dependencia actualizada exitosamente",
        icon: "check_circle",
        position: "top-right",
      });
      await fetchDependencias();
      return true;
    } catch (error) {
      console.error("Error updating dependencia:", error);
      const errorMsg =
        error.response?.data?.msg || "Error al actualizar la dependencia";
      $q.notify({
        type: "negative",
        message: errorMsg,
        icon: "error",
        position: "top-right",
      });
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteDependencia(id) {
    loading.value = true;
    try {
      const response = await api.delete(`/dependencias/${id}`);
      $q.notify({
        type: "positive",
        message: response.data.msg || "Dependencia desactivada exitosamente",
        icon: "check_circle",
        position: "top-right",
      });
      await fetchDependencias();
      return true;
    } catch (error) {
      console.error("Error deleting dependencia:", error);
      const errorMsg =
        error.response?.data?.msg || "Error al desactivar la dependencia";
      $q.notify({
        type: "negative",
        message: errorMsg,
        icon: "error",
        position: "top-right",
      });
      return false;
    } finally {
      loading.value = false;
    }
  }

  // Nota: Los socket listeners se han movido a useDependenciaPage composable
  // para evitar duplicados y tener mejor control del ciclo de vida

  return {
    rows,
    loading,
    filter,
    pagination,
    fetchDependencias,
    createDependencia,
    updateDependencia,
    deleteDependencia,
  };
});

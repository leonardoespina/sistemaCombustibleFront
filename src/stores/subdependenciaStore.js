// src/stores/subdependenciaStore.js
import { defineStore } from "pinia";
import { ref } from "vue";
import { useQuasar } from "quasar";
import api from "../api/index.js";

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
    } catch (error) {
      console.error("Error fetching subdependencias:", error);
      const errorMsg =
        error.response?.data?.msg || "Error al cargar las subdependencias";
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
  
  async function createSubdependencia(data) {
    loading.value = true;
    try {
      const response = await api.post("/subdependencias", data);
      $q.notify({
        type: "positive",
        message: response.data.msg || "Subdependencia creada exitosamente",
        icon: "check_circle",
        position: "top-right",
      });
      await fetchSubdependencias();
      return true;
    } catch (error) {
      console.error("Error creating subdependencia:", error);
      const errorMsg =
        error.response?.data?.msg || "Error al crear la subdependencia";
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

  async function updateSubdependencia(id, data) {
    loading.value = true;
    try {
      const response = await api.put(`/subdependencias/${id}`, data);
      $q.notify({
        type: "positive",
        message: response.data.msg || "Subdependencia actualizada exitosamente",
        icon: "check_circle",
        position: "top-right",
      });
      await fetchSubdependencias();
      return true;
    } catch (error) {
      console.error("Error updating subdependencia:", error);
      const errorMsg =
        error.response?.data?.msg || "Error al actualizar la subdependencia";
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

  async function deleteSubdependencia(id) {
    loading.value = true;
    try {
      const response = await api.delete(`/subdependencias/${id}`);
      $q.notify({
        type: "positive",
        message: response.data.msg || "Subdependencia desactivada exitosamente",
        icon: "check_circle",
        position: "top-right",
      });
      await fetchSubdependencias();
      return true;
    } catch (error) {
      console.error("Error deleting subdependencia:", error);
      const errorMsg =
        error.response?.data?.msg || "Error al desactivar la subdependencia";
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

  async function fetchSubdependenciasByDependencia(id_dependencia) {
    try {
      const response = await api.get("/subdependencias", {
        params: { id_dependencia },
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error("Error fetching subdependencias by dependencia:", error);
      $q.notify({
        type: "negative",
        message: "Error al cargar subdependencias",
        icon: "error",
        position: "top-right",
      });
      return [];
    }
  }

  // Nota: Los socket listeners se han movido a useSubdependenciaPage composable
  // para evitar duplicados y tener mejor control del ciclo de vida

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
  };
});

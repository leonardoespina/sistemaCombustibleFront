// src/stores/categoriaStore.js
import { defineStore } from "pinia";
import { ref } from "vue";
import { useQuasar } from "quasar";
import api from "../api/index.js";

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
    } catch (error) {
      console.error("Error fetching categorias:", error);
      const errorMsg =
        error.response?.data?.msg || "Error al cargar las categorías";
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

  async function createCategoria(data) {
    loading.value = true;
    try {
      const response = await api.post("/categorias", data);
      $q.notify({
        type: "positive",
        message: response.data.msg || "Categoría creada exitosamente",
        icon: "check_circle",
        position: "top-right",
      });
      await fetchCategorias();
      return true;
    } catch (error) {
      console.error("Error creating categoria:", error);
      const errorMsg =
        error.response?.data?.msg || "Error al crear la categoría";
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

  async function updateCategoria(id, data) {
    loading.value = true;
    try {
      const response = await api.put(`/categorias/${id}`, data);
      $q.notify({
        type: "positive",
        message: response.data.msg || "Categoría actualizada exitosamente",
        icon: "check_circle",
        position: "top-right",
      });
      await fetchCategorias();
      return true;
    } catch (error) {
      console.error("Error updating categoria:", error);
      const errorMsg =
        error.response?.data?.msg || "Error al actualizar la categoría";
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

  async function deleteCategoria(id) {
    loading.value = true;
    try {
      const response = await api.delete(`/categorias/${id}`);
      $q.notify({
        type: "positive",
        message: response.data.msg || "Categoría desactivada exitosamente",
        icon: "check_circle",
        position: "top-right",
      });
      await fetchCategorias();
      return true;
    } catch (error) {
      console.error("Error deleting categoria:", error);
      const errorMsg =
        error.response?.data?.msg || "Error al desactivar la categoría";
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

  // Nota: Los socket listeners se han movido a useCategoriaPage composable
  // para evitar duplicados y tener mejor control del ciclo de vida

  return {
    rows,
    loading,
    filter,
    pagination,
    fetchCategorias,
    createCategoria,
    updateCategoria,
    deleteCategoria,
  };
});

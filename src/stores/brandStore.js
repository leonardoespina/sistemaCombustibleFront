// src/stores/brandStore.js

import { defineStore } from "pinia";
import { ref } from "vue";
import { useQuasar } from "quasar";
import api from "../api/index.js";

export const useBrandStore = defineStore("brands", () => {
  const $q = useQuasar();

  // --- STATE ---
  const rows = ref([]);
  const loading = ref(false);
  const filter = ref("");
  const pagination = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: "nombre_marca", // Ordenar por nombre por defecto
    descending: false,
    rowsNumber: 0,
  });

  // --- ACTIONS ---

  async function fetchBrands() {
    loading.value = true;
    try {
      const params = {
        page: pagination.value.page,
        limit: pagination.value.rowsPerPage,
        sortBy: pagination.value.sortBy,
        descending: pagination.value.descending,
        search: filter.value,
      };
      // Apuntamos al nuevo endpoint de marcas
      const response = await api.get("/marcas", { params });
      rows.value = response.data.data;
      pagination.value.rowsNumber = response.data.pagination.totalItems;
    } catch (error) {
      console.error("Error al obtener marcas:", error);
    } finally {
      loading.value = false;
    }
  }

  async function createBrand(brandData) {
    console.log(brandData);
    loading.value = true;
    try {
      const response = await api.post("/marcas", brandData);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchBrands();
      return true; // Éxito
    } catch (error) {
      return false; // Fallo
    } finally {
      loading.value = false;
    }
  }

  async function updateBrand(brandId, brandData) {
    loading.value = true;
    try {
      const response = await api.put(`/marcas/${brandId}`, brandData);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchBrands();
      return true;
    } catch (error) {
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteBrand(brandId) {
    loading.value = true;
    try {
      const response = await api.delete(`/marcas/${brandId}`);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchBrands();
    } catch (error) {
      // El interceptor maneja la notificación
    } finally {
      loading.value = false;
    }
  }

  return {
    rows,
    loading,
    filter,
    pagination,
    fetchBrands,
    createBrand,
    updateBrand,
    deleteBrand,
  };
});

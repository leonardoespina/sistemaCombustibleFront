import { defineStore } from "pinia";
import { ref } from "vue";
import { useQuasar } from "quasar";
import api from "../api/index.js";

export const useVehicleStore = defineStore("vehicles", () => {
  const $q = useQuasar();

  // --- STATE ---
  const rows = ref([]);
  const loading = ref(false);
  const filter = ref("");
  const pagination = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: "id_vehiculo",
    descending: true,
    rowsNumber: 0,
  });

  // Listas para los selects del formulario
  const allBrands = ref([]);
  const modelsForSelectedBrand = ref([]);
  const allManagements = ref([]);
  const loadingModels = ref(false);

  // --- ACTIONS (CRUD) ---

  async function fetchVehicles() {
    loading.value = true;
    try {
      const params = {
        page: pagination.value.page,
        limit: pagination.value.rowsPerPage,
        sortBy: pagination.value.sortBy,
        descending: pagination.value.descending,
        search: filter.value,
      };
      const response = await api.get("/vehiculos", { params });
      rows.value = response.data.data;

      console.log(rows.value);
      pagination.value.rowsNumber = response.data.pagination.totalItems;
    } catch (error) {
      console.error("Error al obtener vehículos:", error);
    } finally {
      loading.value = false;
    }
  }

  async function createVehicle(vehicleData) {
    loading.value = true;
    try {
      const response = await api.post("/vehiculos", vehicleData);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchVehicles();
      return true;
    } catch (error) {
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function updateVehicle(vehicleId, vehicleData) {
    loading.value = true;
    try {
      const response = await api.put(`/vehiculos/${vehicleId}`, vehicleData);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchVehicles();
      return true;
    } catch (error) {
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteVehicle(vehicleId) {
    loading.value = true;
    try {
      const response = await api.delete(`/vehiculos/${vehicleId}`);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchVehicles();
    } finally {
      loading.value = false;
    }
  }

  // --- ACCIONES PARA FORMULARIOS ---

  async function fetchAllBrands() {
    try {
      const response = await api.get("/marcas/lista");
      allBrands.value = response.data;
    } catch (error) {
      $q.notify({
        type: "negative",
        message: "No se pudo cargar la lista de marcas.",
      });
    }
  }

  async function fetchModelsByBrand(brandId) {
    if (!brandId) {
      modelsForSelectedBrand.value = [];
      return;
    }
    loadingModels.value = true;
    try {
      const response = await api.get(`/vehiculos/listas/modelos/${brandId}`);
      modelsForSelectedBrand.value = response.data;
    } catch (error) {
      modelsForSelectedBrand.value = [];
      $q.notify({
        type: "negative",
        message: "No se pudieron cargar los modelos.",
      });
    } finally {
      loadingModels.value = false;
    }
  }

  async function fetchAllManagements() {
    try {
      const response = await api.get("/gerencias/lista");
      allManagements.value = response.data;
    } catch (error) {
      $q.notify({
        type: "negative",
        message: "No se pudo cargar la lista de gerencias.",
      });
    }
  }

  return {
    rows,
    loading,
    filter,
    pagination,
    allBrands,
    modelsForSelectedBrand,
    loadingModels,
    allManagements,
    fetchVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    fetchAllBrands,
    fetchModelsByBrand,
    fetchAllManagements,
  };
});

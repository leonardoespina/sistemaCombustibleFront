import { defineStore } from "pinia";
import { ref } from "vue";
import { useQuasar } from "quasar";
import api from "../api/index.js";

export const useCisternLoadStore = defineStore("cisternLoads", () => {
  const $q = useQuasar();

  // --- STATE ---
  const rows = ref([]);
  const loading = ref(false);
  const filter = ref("");
  const pagination = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: "fecha_hora_llegada",
    descending: true,
    rowsNumber: 0,
  });

  // Listas Auxiliares
  const tanksList = ref([]);
  const vehiclesList = ref([]);
  const driversList = ref([]);
  const warehousemenList = ref([]);

  // Estado para la tabla de aforo del tanque seleccionado
  const selectedTankAforo = ref(null);
  const selectedTankDetail = ref(null);

  // --- ACTIONS (CRUD) ---

  async function fetchLoads() {
    loading.value = true;
    try {
      const params = {
        page: pagination.value.page,
        limit: pagination.value.rowsPerPage,
        sortBy: pagination.value.sortBy,
        descending: pagination.value.descending,
        search: filter.value,
      };
      const response = await api.get("/cargas-cisterna", { params });
      rows.value = response.data.data;
      pagination.value.rowsNumber = response.data.pagination.totalItems;
    } finally {
      loading.value = false;
    }
  }

  async function createLoad(data) {
    loading.value = true;
    try {
      const response = await api.post("/cargas-cisterna", data);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchLoads();
      return true;
    } catch (error) {
      return false; // Interceptor maneja error
    } finally {
      loading.value = false;
    }
  }

  async function updateLoad(id, data) {
    loading.value = true;
    try {
      const response = await api.put(`/cargas-cisterna/${id}`, data);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchLoads();
      return true;
    } catch (error) {
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function annulLoad(id) {
    loading.value = true;
    try {
      const response = await api.delete(`/cargas-cisterna/${id}`);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchLoads();
    } finally {
      loading.value = false;
    }
  }

  // --- CARGA DE LISTAS ---
  async function loadFormOptions() {
    try {
      const [resTanks, resVehicles, resDrivers, resWarehouse] =
        await Promise.all([
          api.get("/tanques/lista"),
          api.get("/vehiculos/lista"),
          api.get("/choferes/lista"),
          api.get("/almacenistas/lista"),
        ]);

      tanksList.value = Array.isArray(resTanks.data) ? resTanks.data : [];
      vehiclesList.value = Array.isArray(resVehicles.data)
        ? resVehicles.data
        : [];
      driversList.value = Array.isArray(resDrivers.data) ? resDrivers.data : [];
      warehousemenList.value = Array.isArray(resWarehouse.data)
        ? resWarehouse.data
        : [];
    } catch (error) {
      console.error("Error listas:", error);
      $q.notify({ type: "warning", message: "Error cargando listas." });
    }
  }

  // --- OBTENER DETALLE TANQUE (AFORO Y DATOS COMPLETOS) ---
  async function fetchTankDetail(tankId) {
    if (!tankId) {
      selectedTankAforo.value = null;
      selectedTankDetail.value = null;
      return;
    }
    try {
      const response = await api.get(`/tanques/${tankId}`);
      const tankData = response.data;

      // Guardar detalle completo del tanque
      selectedTankDetail.value = tankData;

      // Procesar aforo
      let aforo = tankData.tabla_aforo;
      if (typeof aforo === "string") {
        try {
          aforo = JSON.parse(aforo);
        } catch (e) {
          aforo = {};
        }
      }
      selectedTankAforo.value = aforo || {};
    } catch (error) {
      selectedTankAforo.value = null;
      selectedTankDetail.value = null;
      $q.notify({
        type: "negative",
        message: "Error al cargar aforo del tanque.",
      });
    }
  }

  return {
    rows,
    loading,
    filter,
    pagination,
    tanksList,
    vehiclesList,
    driversList,
    warehousemenList,
    selectedTankAforo,
    selectedTankDetail,
    fetchLoads,
    createLoad,
    updateLoad,
    annulLoad,
    loadFormOptions,
    fetchTankDetail,
  };
});

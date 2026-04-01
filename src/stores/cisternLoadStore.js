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

  // Estado para la tabla de aforo del tanque seleccionado
  const selectedTankAforo = ref(null);
  const selectedTankDetail = ref(null);

  // --- ACTIONS (CRUD) ---

  async function fetchLoads(extraParams = {}) {
    loading.value = true;
    try {
      const params = {
        page: pagination.value.page,
        limit: pagination.value.rowsPerPage,
        sortBy: pagination.value.sortBy,
        descending: pagination.value.descending,
        search: filter.value,
        ...extraParams,
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

  async function revertirCarga(id) {
    loading.value = true;
    try {
      const response = await api.put(`/cargas-cisterna/${id}/revertir`);
      $q.notify({
        type: "positive",
        message: response.data.msg || "Carga revertida. Niveles de tanques restaurados.",
        icon: "undo",
      });
      await fetchLoads();
      return response.data;
    } finally {
      loading.value = false;
    }
  }

  // --- CARGA DE LISTAS ---
  const llenaderosList = ref([]);

  // --- CARGA DE LISTAS ---
  async function fetchLlenaderos() {
    try {
      const response = await api.get("/llenaderos");
      llenaderosList.value = response.data.data || response.data;
    } catch (error) {
      console.error("Error al cargar llenaderos", error);
    }
  }

  async function loadTanksList(id_llenadero) {
    try {
      const params = id_llenadero ? { id_llenadero } : {};
      const response = await api.get("/tanques/lista", { params });
      tanksList.value = Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      $q.notify({
        type: "warning",
        message: "Error cargando lista de tanques.",
      });
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

      // Parsear aforo de forma segura en el objeto principal
      if (typeof tankData.tabla_aforo === "string") {
        try {
          tankData.tabla_aforo = JSON.parse(tankData.tabla_aforo);
        } catch (e) {
          tankData.tabla_aforo = {};
        }
      }

      selectedTankDetail.value = tankData;
      selectedTankAforo.value = tankData.tabla_aforo || {};
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
    llenaderosList,
    tanksList,
    selectedTankAforo,
    selectedTankDetail,
    fetchLoads,
    createLoad,
    updateLoad,
    revertirCarga,
    fetchLlenaderos,
    loadTanksList,
    fetchTankDetail,
  };
});

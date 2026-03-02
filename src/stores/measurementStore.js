import { defineStore } from "pinia";
import { ref, onUnmounted } from "vue";
import { useQuasar } from "quasar";
import api from "../api/index.js";
import socket from "../services/socket";

export const useMeasurementStore = defineStore("measurements", () => {
  const $q = useQuasar();

  // --- STATE ---
  const rows = ref([]);
  const loading = ref(false);
  const filter = ref("");
  const pagination = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: "fecha_medicion",
    descending: true,
    rowsNumber: 0,
  });

  // Listas Auxiliares
  const llenaderosList = ref([]);
  const tanksList = ref([]);

  // Estado para el tanque seleccionado en el formulario (Aforo + Info)
  const selectedTankDetail = ref(null);

  // --- SOCKET IO LISTENERS ---
  function initSocketListeners() {
    socket.on("medicion:creada", () => {
      fetchMeasurements();
    });

    socket.on("medicion:actualizada", () => {
      fetchMeasurements();
    });

    socket.on("tanque:actualizado", (data) => {
      // Si el tanque actualizado es el que tenemos seleccionado, refrescar su detalle
      if (selectedTankDetail.value && selectedTankDetail.value.id_tanque === data.id_tanque) {
        fetchTankDetail(data.id_tanque);
      }
      // También refrescar la lista general de tanques por si acaso
      loadTanksList();
    });
  }

  function removeSocketListeners() {
    socket.off("medicion:creada");
    socket.off("medicion:actualizada");
    socket.off("tanque:actualizado");
  }

  // --- ACTIONS (CRUD) ---

  async function fetchMeasurements(extraParams = {}) {
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
      const response = await api.get("/mediciones", { params });
      rows.value = response.data.data;
      pagination.value.rowsNumber = response.data.pagination.totalItems;
    } finally {
      loading.value = false;
    }
  }

  async function createMeasurement(data) {
    loading.value = true;
    try {
      const response = await api.post("/mediciones", data);
      $q.notify({ type: "positive", message: response.data.msg });

      // Mostrar resumen de ajuste
      const res = response.data.resumen;
      const tipo = res.diferencia > 0 ? "Faltante" : "Sobrante";
      $q.notify({
        type: "info",
        message: `Diferencia: ${Math.abs(res.diferencia).toFixed(
          2
        )} Lts (${tipo})`,
        timeout: 5000,
      });

      await fetchMeasurements();
      return true;
    } catch (error) {
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function updateMeasurement(id, data) {
    loading.value = true;
    try {
      const response = await api.put(`/mediciones/${id}`, data);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchMeasurements();
      return true;
    } catch (error) {
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function annulMeasurement(id) {
    loading.value = true;
    try {
      const response = await api.put(`/mediciones/${id}/anular`);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchMeasurements();
    } finally {
      loading.value = false;
    }
  }

  // --- CARGA DE DATOS ---
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
      // Filtrar por llenadero si se proporciona
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

  async function fetchTankDetail(tankId) {
    if (!tankId) {
      selectedTankDetail.value = null;
      return;
    }
    try {
      const response = await api.get(`/tanques/${tankId}`);
      let tank = response.data;

      // Parsear aforo de forma segura
      if (typeof tank.tabla_aforo === "string") {
        try {
          tank.tabla_aforo = JSON.parse(tank.tabla_aforo);
        } catch (e) {
          tank.tabla_aforo = {};
        }
      }
      selectedTankDetail.value = tank;
    } catch (error) {
      selectedTankDetail.value = null;
      $q.notify({
        type: "negative",
        message: "Error al cargar detalles del tanque.",
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
    selectedTankDetail,
    fetchMeasurements,
    createMeasurement,
    updateMeasurement,
    annulMeasurement,
    fetchLlenaderos,
    loadTanksList,
    fetchTankDetail,
    initSocketListeners,
    removeSocketListeners,
  };
});

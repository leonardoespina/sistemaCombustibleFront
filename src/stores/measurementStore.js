import { defineStore } from "pinia";
import { ref } from "vue";
import { useQuasar } from "quasar";
import api from "../api/index.js";

export const useMeasurementStore = defineStore("measurements", () => {
  const $q = useQuasar();

  // --- STATE ---
  const rows = ref([]);
  const loading = ref(false);
  const filter = ref("");
  const pagination = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: "fecha_hora_medicion",
    descending: true,
    rowsNumber: 0,
  });

  // Listas Auxiliares
  const tanksList = ref([]);

  // Estado para el tanque seleccionado en el formulario (Aforo + Info)
  const selectedTankDetail = ref(null);

  // --- ACTIONS (CRUD) ---

  async function fetchMeasurements() {
    loading.value = true;
    try {
      const params = {
        page: pagination.value.page,
        limit: pagination.value.rowsPerPage,
        sortBy: pagination.value.sortBy,
        descending: pagination.value.descending,
        search: filter.value,
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
      const tipo = res.ajuste_aplicado < 0 ? "Sobrante" : "Faltante";
      $q.notify({
        type: "info",
        message: `Ajuste: ${Math.abs(res.ajuste_aplicado).toFixed(
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

  async function annulMeasurement(id) {
    loading.value = true;
    try {
      const response = await api.delete(`/mediciones/${id}`);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchMeasurements();
    } finally {
      loading.value = false;
    }
  }

  // --- CARGA DE DATOS ---
  async function loadTanksList() {
    try {
      const response = await api.get("/tanques/lista");
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
    tanksList,
    selectedTankDetail,
    fetchMeasurements,
    createMeasurement,
    annulMeasurement,
    loadTanksList,
    fetchTankDetail,
  };
});

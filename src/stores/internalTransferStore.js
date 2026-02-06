import { defineStore } from "pinia";
import { ref } from "vue";
import { useQuasar } from "quasar";
import api from "../api/index.js";

export const useInternalTransferStore = defineStore("internalTransfers", () => {
  const $q = useQuasar();

  // --- STATE ---
  const rows = ref([]);
  const loading = ref(false);
  const filter = ref("");
  const pagination = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: "fecha_transferencia",
    descending: true,
    rowsNumber: 0,
  });

  // Listas Auxiliares
  const llenaderosList = ref([]);
  const tanksList = ref([]); // Todos los tanques o filtrados

  // Detalles de tanques para cálculos
  const sourceTankDetail = ref(null);
  const destinationTankDetail = ref(null);
  const destinationTankAforo = ref(null);

  // --- ACTIONS (CRUD) ---

  async function fetchTransfers(extraParams = {}) {
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
      const response = await api.get("/transferencias-internas", { params });
      rows.value = response.data.data;
      pagination.value.rowsNumber = response.data.pagination.totalItems;
    } finally {
      loading.value = false;
    }
  }

  async function createTransfer(data) {
    loading.value = true;
    try {
      const response = await api.post("/transferencias-internas", data);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchTransfers();
      return true;
    } catch (error) {
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function updateTransfer(id, data) {
    loading.value = true;
    try {
      const response = await api.put(`/transferencias-internas/${id}`, data);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchTransfers();
      return true;
    } catch (error) {
      return false;
    } finally {
      loading.value = false;
    }
  }

  // --- CARGA DE LISTAS ---
  async function fetchLlenaderos() {
    try {
      const response = await api.get("/llenaderos");
      // El backend devuelve directamente el array o envuelto en data
      const data = response.data.data || response.data;
      
      llenaderosList.value = Array.isArray(data) ? data : (data.docs || []);
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
      $q.notify({ type: "warning", message: "Error cargando tanques." });
    }
  }

  async function fetchTankDetail(tankId, target = 'source') {
    if (!tankId) return;
    try {
      const response = await api.get(`/tanques/${tankId}`);
      const tank = response.data;
      
      // Parsear aforo
      if (typeof tank.aforo === "string") {
        try { tank.aforo = JSON.parse(tank.aforo); } catch (e) { tank.aforo = []; }
      }

      if (target === 'source') {
        sourceTankDetail.value = tank;
      } else {
        destinationTankDetail.value = tank;
        destinationTankAforo.value = tank.aforo || [];
      }
    } catch (error) {
      console.error("Error detalle tanque:", error);
    }
  }

  return {
    rows, loading, filter, pagination, llenaderosList, tanksList,
    sourceTankDetail, destinationTankDetail, destinationTankAforo,
    fetchTransfers, createTransfer, updateTransfer,
    fetchLlenaderos, loadTanksList, fetchTankDetail
  };
});

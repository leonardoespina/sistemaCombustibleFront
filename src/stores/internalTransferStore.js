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
    sortBy: "hora_inicio",
    descending: true,
    rowsNumber: 0,
  });

  // Listas
  const tanksList = ref([]);
  const warehousemenList = ref([]);

  // Detalles de tanques seleccionados (para validaciones y aforo destino)
  const sourceTankDetail = ref(null);
  const destinationTankDetail = ref(null);
  const destinationTankAforo = ref(null);

  // --- ACTIONS ---

  async function fetchTransfers() {
    loading.value = true;
    try {
      const params = {
        page: pagination.value.page,
        limit: pagination.value.rowsPerPage,
        sortBy: pagination.value.sortBy,
        descending: pagination.value.descending,
        search: filter.value,
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
      // El interceptor maneja la notificación visual del error, pero retornamos false
      return false;
    } finally {
      loading.value = false;
    }
  }

  // Cargar listas para combos
  async function loadFormOptions() {
    try {
      const [resTanks, resWarehouse] = await Promise.all([
        api.get("/tanques/lista"),
        api.get("/almacenistas/lista"),
      ]);

      tanksList.value = Array.isArray(resTanks.data) ? resTanks.data : [];
      warehousemenList.value = Array.isArray(resWarehouse.data)
        ? resWarehouse.data
        : [];
    } catch (error) {
      console.error("Error listas:", error);
      $q.notify({ type: "warning", message: "Error cargando listas." });
    }
  }

  // Helper para obtener detalle de un tanque (para validaciones y aforo destino)
  async function fetchTankDetail(tankId, isDestination = false) {
    if (!tankId) {
      if (isDestination) {
        destinationTankDetail.value = null;
        destinationTankAforo.value = null;
      } else {
        sourceTankDetail.value = null;
      }
      return;
    }
    try {
      const response = await api.get(`/tanques/${tankId}`);
      const tankData = response.data;

      if (isDestination) {
        destinationTankDetail.value = tankData;
        let aforo = tankData.tabla_aforo;
        if (typeof aforo === "string") {
          try {
            aforo = JSON.parse(aforo);
          } catch (e) {
            aforo = {};
          }
        }
        destinationTankAforo.value = aforo || {};
      } else {
        sourceTankDetail.value = tankData;
      }
    } catch (error) {
      $q.notify({
        type: "negative",
        message: "Error al cargar detalle del tanque.",
      });
    }
  }

  return {
    rows,
    loading,
    filter,
    pagination,
    tanksList,
    warehousemenList,
    sourceTankDetail,
    destinationTankDetail,
    destinationTankAforo,
    fetchTransfers,
    createTransfer,
    loadFormOptions,
    fetchTankDetail,
  };
});

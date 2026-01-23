import { defineStore } from "pinia";
import { ref } from "vue";
import { useQuasar } from "quasar";
import api from "../api/index.js";

export const useDispatchStore = defineStore("dispatches", () => {
  const $q = useQuasar();

  // --- STATE ---
  const rows = ref([]);
  const loading = ref(false);
  const filter = ref("");
  const pagination = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: "fecha_hora",
    descending: true,
    rowsNumber: 0,
  });

  // Listas Auxiliares
  const dispensersList = ref([]);
  const vehiclesList = ref([]);
  const driversList = ref([]);
  const managementsList = ref([]);
  const warehousemenList = ref([]);

  // --- ACTIONS (CRUD) ---

  async function fetchDispatches() {
    loading.value = true;
    try {
      const params = {
        page: pagination.value.page,
        limit: pagination.value.rowsPerPage,
        sortBy: pagination.value.sortBy,
        descending: pagination.value.descending,
        search: filter.value,
      };
      const response = await api.get("/despachos", { params });
      rows.value = response.data.data;
      console.log(rows.value);
      pagination.value.rowsNumber = response.data.pagination.totalItems;
    } finally {
      loading.value = false;
    }
  }

  async function createDispatch(data) {
    loading.value = true;
    try {
      const response = await api.post("/despachos", data);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchDispatches();
      return true;
    } catch (error) {
      return false; // Error manejado por interceptor
    } finally {
      loading.value = false;
    }
  }

  async function annulDispatch(id) {
    loading.value = true;
    try {
      const response = await api.delete(`/despachos/${id}`);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchDispatches();
    } finally {
      loading.value = false;
    }
  }

  async function updateDispatch(id, data) {
    loading.value = true;
    try {
      const response = await api.put(`/despachos/${id}`, data);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchDispatches();
      return true;
    } catch (error) {
      return false;
    } finally {
      loading.value = false;
    }
  }

  // --- CARGA DE LISTAS ---

  async function loadFormOptions() {
    try {
      const [resDisp, resVeh, resDriv, resManag, resWare] = await Promise.all([
        api.get("/dispensadores/lista"),
        api.get("/vehiculos/lista"),
        api.get("/choferes/lista"),
        api.get("/gerencias/lista"),
        api.get("/almacenistas/lista"),
      ]);

      dispensersList.value = Array.isArray(resDisp.data) ? resDisp.data : [];
      console.log(dispensersList.value);
      vehiclesList.value = Array.isArray(resVeh.data)
        ? resVeh.data
        : resVeh.data?.data || [];
      driversList.value = Array.isArray(resDriv.data) ? resDriv.data : [];
      managementsList.value = Array.isArray(resManag.data) ? resManag.data : [];
      warehousemenList.value = Array.isArray(resWare.data) ? resWare.data : [];
    } catch (error) {
      console.error("Error cargando listas:", error);
      $q.notify({
        type: "warning",
        message: "Problemas cargando listas auxiliares.",
      });
    }
  }

  return {
    rows,
    loading,
    filter,
    pagination,
    dispensersList,
    vehiclesList,
    driversList,
    managementsList,
    warehousemenList,
    fetchDispatches,
    createDispatch,
    updateDispatch,
    annulDispatch,
    loadFormOptions,
  };
});

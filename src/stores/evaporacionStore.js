import { defineStore } from "pinia";
import { ref } from "vue";
import { useQuasar } from "quasar";
import api from "../api/index.js";
import socket from "../services/socket";

export const useEvaporacionStore = defineStore("evaporaciones", () => {
  const $q = useQuasar();

  // STATE
  const rows = ref([]);
  const llenaderoOptions = ref([]);
  const loading = ref(false);
  const filter = ref("");
  const pagination = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: "fecha_movimiento",
    descending: true,
    rowsNumber: 0,
  });

  // ACTIONS
  async function fetchEvaporaciones() {
    loading.value = true;
    try {
      const params = {
        page: pagination.value.page,
        limit: pagination.value.rowsPerPage,
        sortBy: pagination.value.sortBy,
        descending: pagination.value.descending,
        search: filter.value 
      };
      const response = await api.get("/evaporaciones", { params });
      rows.value = response.data.data;
      pagination.value.rowsNumber = response.data.pagination.totalItems;
    } catch (error) {
      console.error(error);
      $q.notify({ type: "negative", message: "Error cargando evaporaciones" });
    } finally {
      loading.value = false;
    }
  }

  async function fetchLlenaderosList() {
    try {
      const response = await api.get("/llenaderos/lista");
      llenaderoOptions.value = response.data; 
    } catch (error) {
      console.error("Error cargando lista de llenaderos:", error);
    }
  }

  async function registrarEvaporacion(data) {
    loading.value = true;
    try {
      const response = await api.post("/evaporaciones", data);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchEvaporaciones();
      return true;
    } catch (error) {
      console.error(error);
      $q.notify({ 
        type: "negative", 
        message: error.response?.data?.msg || "Error registrando evaporación" 
      });
      return false;
    } finally {
      loading.value = false;
    }
  }

  function initSocket() {
    socket.on("llenadero:actualizado", () => fetchEvaporaciones());
  }

  function cleanupSocket() {
    socket.off("llenadero:actualizado");
  }

  return {
    rows,
    llenaderoOptions,
    loading,
    filter,
    pagination,
    fetchEvaporaciones,
    fetchLlenaderosList,
    registrarEvaporacion,
    initSocket,
    cleanupSocket
  };
});

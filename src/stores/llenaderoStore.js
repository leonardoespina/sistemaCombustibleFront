// src/stores/llenaderoStore.js
import { defineStore } from "pinia";
import { ref } from "vue";
import { useQuasar } from "quasar";
import api from "../api/index.js";
import socket from "../services/socket";

export const useLlenaderoStore = defineStore("llenaderos", () => {
  const $q = useQuasar();

  // --- STATE ---
  const rows = ref([]);
  const loading = ref(false);
  const filter = ref("");
  const pagination = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: "id_llenadero",
    descending: true,
    rowsNumber: 0,
  });

  // --- ACTIONS ---

  async function fetchLlenaderos() {
    loading.value = true;
    try {
      const params = {
        page: pagination.value.page,
        limit: pagination.value.rowsPerPage,
        sortBy: pagination.value.sortBy,
        descending: pagination.value.descending,
        search: filter.value,
      };
      const response = await api.get("/llenaderos", { params });
      rows.value = response.data.data;
      pagination.value.rowsNumber = response.data.pagination.totalItems;
    } catch (error) {
      console.error(error);
      $q.notify({ type: "negative", message: "Error cargando llenaderos" });
    } finally {
      loading.value = false;
    }
  }

  async function createLlenadero(data) {
    loading.value = true;
    try {
      const response = await api.post("/llenaderos", data);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchLlenaderos();
      return true;
    } catch (error) {
      console.error(error);
      $q.notify({ type: "negative", message: error.response?.data?.msg || "Error creando registro" });
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function updateLlenadero(id, data) {
    loading.value = true;
    try {
      const response = await api.put(`/llenaderos/${id}`, data);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchLlenaderos();
      return true;
    } catch (error) {
      console.error(error);
      $q.notify({ type: "negative", message: error.response?.data?.msg || "Error actualizando registro" });
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteLlenadero(id) {
    loading.value = true;
    try {
      const response = await api.delete(`/llenaderos/${id}`);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchLlenaderos();
    } catch (error) {
        console.error(error);
        $q.notify({ type: "negative", message: error.response?.data?.msg || "Error desactivando registro" });
    } finally {
      loading.value = false;
    }
  }

  // --- SOCKET IO ---
  function initSocket() {
    socket.on("llenadero:creado", () => fetchLlenaderos());
    socket.on("llenadero:actualizado", () => fetchLlenaderos());
    // Es crítico escuchar eventos de tanques aquí, porque el volumen de un tanque 
    // modifica directamente las "estadisticas" del llenadero consultado en el API.
    socket.on("tanque:actualizado", () => fetchLlenaderos());
  }

  function cleanupSocket() {
    socket.off("llenadero:creado");
    socket.off("llenadero:actualizado");
    // Al limpiar, ten cuidado de no des-suscribir globalmente "tanque:actualizado" 
    // Si otros stores lo usan, esto puede causar bugs si no consideramos que socket.off
    // sin el callback remueve TODOS los listeners. 
    // Lo ideal en Socket.IO es pasar la referencia exacta, pero si el flujo permite
    // montado/desmontado global, lo dejamos o no lo desmontamos para no afectar 
    // components hijos o paralelos. Vamos a omitir el off de "tanque:actualizado" 
    // aquí para evitar side-effects en tankStore.
  }

  return {
    rows,
    loading,
    filter,
    pagination,
    fetchLlenaderos,
    createLlenadero,
    updateLlenadero,
    deleteLlenadero,
    initSocket,
    cleanupSocket
  };
});

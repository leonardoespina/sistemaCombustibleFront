<<<<<<< HEAD
// src/stores/dispenserStore.js

=======
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
import { defineStore } from "pinia";
import { ref } from "vue";
import { useQuasar } from "quasar";
import api from "../api/index.js";
<<<<<<< HEAD
import socket from "../services/socket";
=======
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d

export const useDispenserStore = defineStore("dispensers", () => {
  const $q = useQuasar();

  // --- STATE ---
  const rows = ref([]);
  const loading = ref(false);
  const filter = ref("");
  const pagination = ref({
    page: 1,
    rowsPerPage: 10,
<<<<<<< HEAD
    sortBy: "codigo",
    descending: false,
    rowsNumber: 0,
  });

  // --- ACTIONS ---
=======
    sortBy: "id_dispensador",
    descending: true,
    rowsNumber: 0,
  });

  // Lista de Tanques para el select
  const tanksList = ref([]);

  // --- ACTIONS (CRUD) ---
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d

  async function fetchDispensers() {
    loading.value = true;
    try {
      const params = {
        page: pagination.value.page,
        limit: pagination.value.rowsPerPage,
        sortBy: pagination.value.sortBy,
        descending: pagination.value.descending,
        search: filter.value,
      };
      const response = await api.get("/dispensadores", { params });
      rows.value = response.data.data;
      pagination.value.rowsNumber = response.data.pagination.totalItems;
<<<<<<< HEAD
    } catch (error) {
      console.error("Error al obtener dispensadores:", error);
=======
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
    } finally {
      loading.value = false;
    }
  }

<<<<<<< HEAD
  async function createDispenser(dispenserData) {
    loading.value = true;
    try {
      const response = await api.post("/dispensadores", dispenserData);
=======
  async function createDispenser(data) {
    loading.value = true;
    try {
      const response = await api.post("/dispensadores", data);
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchDispensers();
      return true;
    } catch (error) {
      return false;
    } finally {
      loading.value = false;
    }
  }

<<<<<<< HEAD
  async function updateDispenser(id, dispenserData) {
    loading.value = true;
    try {
      const response = await api.put(`/dispensadores/${id}`, dispenserData);
=======
  async function updateDispenser(id, data) {
    loading.value = true;
    try {
      const response = await api.put(`/dispensadores/${id}`, data);
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchDispensers();
      return true;
    } catch (error) {
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteDispenser(id) {
    loading.value = true;
    try {
      const response = await api.delete(`/dispensadores/${id}`);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchDispensers();
    } finally {
      loading.value = false;
    }
  }

<<<<<<< HEAD
  function initSocket() {
    socket.on("dispensador:creado", () => fetchDispensers());
    socket.on("dispensador:actualizado", () => fetchDispensers());
  }

  function cleanupSocket() {
    socket.off("dispensador:creado");
    socket.off("dispensador:actualizado");
=======
  // --- CARGA DE LISTAS AUXILIARES ---
  async function loadTanks() {
    try {
      const response = await api.get("/tanques/lista");
      tanksList.value = Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      $q.notify({
        type: "warning",
        message: "No se pudo cargar la lista de tanques.",
      });
    }
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
  }

  return {
    rows,
    loading,
    filter,
    pagination,
<<<<<<< HEAD
=======
    tanksList,
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
    fetchDispensers,
    createDispenser,
    updateDispenser,
    deleteDispenser,
<<<<<<< HEAD
    initSocket,
    cleanupSocket,
=======
    loadTanks,
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
  };
});

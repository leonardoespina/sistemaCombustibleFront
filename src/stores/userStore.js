// src/stores/userStore.js

import { defineStore } from "pinia";
import { ref } from "vue";
import { useQuasar } from "quasar";
import api from "../api/index.js";
import socket from "../services/socket.js";

export const useUserStore = defineStore("users", () => {
  const $q = useQuasar();

  // --- STATE (Estado) ---
  const rows = ref([]);
  const loading = ref(false);
  const filter = ref("");
  const pagination = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: "id_usuario",
    descending: false,
    rowsNumber: 0,
  });

  // --- ACTIONS (Acciones que modifican el estado) ---

  /**
   * Obtiene los usuarios de la API con paginación y filtros.
   */
  async function fetchUsers() {
    loading.value = true;
    try {
      const params = {
        page: pagination.value.page,
        limit: pagination.value.rowsPerPage,
        sortBy: pagination.value.sortBy,
        descending: pagination.value.descending,
        search: filter.value,
      };
      const response = await api.get("/usuarios", { params });
      rows.value = response.data.data;
      pagination.value.rowsNumber = response.data.pagination.totalItems;
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      // La notificación ya la maneja el interceptor de Axios
    } finally {
      loading.value = false;
    }
  }

  /**
   * Crea un nuevo usuario.
   * @param {object} userData - Datos del nuevo usuario.
   */
  async function createUser(userData) {
    loading.value = true;
    try {
      const response = await api.post("/usuarios", userData);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchUsers(); // Refrescar la tabla
      return true; // Indicar éxito
    } catch (error) {
      return false; // Indicar fallo
    } finally {
      loading.value = false;
    }
  }

  /**
   * Actualiza un usuario existente.
   * @param {number} userId - ID del usuario a actualizar.
   * @param {object} userData - Nuevos datos del usuario.
   */
  async function updateUser(userId, userData) {
    loading.value = true;
    try {
      const response = await api.put(`/usuarios/${userId}`, userData);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchUsers(); // Refrescar la tabla
      return true;
    } catch (error) {
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Desactiva un usuario (Soft Delete).
   * @param {number} userId - ID del usuario a desactivar.
   */
  async function deleteUser(userId) {
    loading.value = true;
    try {
      const response = await api.delete(`/usuarios/${userId}`);
      $q.notify({ type: "positive", message: response.data.msg });
      await fetchUsers(); // Refrescar la tabla
    } catch (error) {
      // Notificación de error manejada por el interceptor
    } finally {
      loading.value = false;
    }
  }

  // --- SOCKETS ---
  function initSocket() {
    socket.on("usuarios:creado", () => {
      fetchUsers();
    });
    socket.on("usuarios:actualizado", () => {
      fetchUsers();
    });
  }

  function cleanupSocket() {
    socket.off("usuarios:creado");
    socket.off("usuarios:actualizado");
  }

  // Exponemos el estado y las acciones para que los componentes puedan usarlos.
  return {
    rows,
    loading,
    filter,
    pagination,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    initSocket,
    cleanupSocket,
  };
});

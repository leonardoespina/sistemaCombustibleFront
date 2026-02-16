// src/stores/userStore.js

import { defineStore } from "pinia";
import { ref } from "vue";
import { useQuasar } from "quasar";
import api from "../api/index.js";

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
      console.error("Error fetching usuarios:", error);
      const errorMsg =
        error.response?.data?.msg || "Error al cargar los usuarios";
      $q.notify({
        type: "negative",
        message: errorMsg,
        icon: "error",
        position: "top-right",
      });
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
      $q.notify({
        type: "positive",
        message: response.data.msg || "Usuario creado exitosamente",
        icon: "check_circle",
        position: "top-right",
      });
      await fetchUsers();
      return true;
    } catch (error) {
      console.error("Error creating usuario:", error);
      const errorMsg = error.response?.data?.msg || "Error al crear el usuario";
      $q.notify({
        type: "negative",
        message: errorMsg,
        icon: "error",
        position: "top-right",
      });
      return false;
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
      $q.notify({
        type: "positive",
        message: response.data.msg || "Usuario actualizado exitosamente",
        icon: "check_circle",
        position: "top-right",
      });
      await fetchUsers();
      return true;
    } catch (error) {
      console.error("Error updating usuario:", error);
      const errorMsg =
        error.response?.data?.msg || "Error al actualizar el usuario";
      $q.notify({
        type: "negative",
        message: errorMsg,
        icon: "error",
        position: "top-right",
      });
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
      $q.notify({
        type: "positive",
        message: response.data.msg || "Usuario desactivado exitosamente",
        icon: "check_circle",
        position: "top-right",
      });
      await fetchUsers();
      return true;
    } catch (error) {
      console.error("Error deleting usuario:", error);
      const errorMsg =
        error.response?.data?.msg || "Error al desactivar el usuario";
      $q.notify({
        type: "negative",
        message: errorMsg,
        icon: "error",
        position: "top-right",
      });
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Cambia la contraseña del usuario actual.
   * @param {string} passwordActual
   * @param {string} nuevaPassword
   */
  async function changePassword(passwordActual, nuevaPassword) {
    loading.value = true;
    try {
      const response = await api.put("/usuarios/cambiar-password", {
        passwordActual,
        nuevaPassword,
      });
      $q.notify({
        type: "positive",
        message: response.data.msg,
        position: "top",
      });
      return true;
    } catch (error) {
      console.error("Error changing password:", error);
      // El error ya es manejado por el interceptor global
      return false;
    } finally {
      loading.value = false;
    }
  }

  // Nota: Los socket listeners se han movido a useUserPage composable
  // para evitar duplicados y tener mejor control del ciclo de vida

  return {
    rows,
    loading,
    filter,
    pagination,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    changePassword,
  };
});

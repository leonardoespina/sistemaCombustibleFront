// src/stores/precioStore.js
import { defineStore } from "pinia";
import { ref } from "vue";
import { useQuasar } from "quasar";
import api from "../api/index.js";

export const usePrecioStore = defineStore("precio", () => {
  const $q = useQuasar();

  // ============================================
  // ESTADO
  // ============================================
  
  // Lista de monedas con paginación
  const monedas = ref([]);
  
  // Lista de precios actuales por combustible (sin paginación)
  const preciosActuales = ref([]);
  
  // Estado de carga
  const loading = ref(false);
  
  // Filtro de búsqueda para monedas
  const filter = ref("");
  
  // Configuración de paginación para tabla de monedas
  const pagination = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: "id_moneda",
    descending: false,
    rowsNumber: 0,
  });

  // ============================================
  // ACCIONES - MONEDAS
  // ============================================

  /**
   * Obtiene la lista de monedas con paginación y filtro
   */
  async function fetchMonedas() {
    loading.value = true;
    try {
      const params = {
        page: pagination.value.page,
        limit: pagination.value.rowsPerPage,
        sortBy: pagination.value.sortBy,
        descending: pagination.value.descending,
        search: filter.value,
      };
      const response = await api.get("/precios/monedas", { params });
      monedas.value = response.data.data;
      pagination.value.rowsNumber = response.data.pagination.totalItems;
    } catch (error) {
      console.error(error);
      $q.notify({ 
        type: "negative", 
        message: "Error cargando monedas",
        icon: "error"
      });
    } finally {
      loading.value = false;
    }
  }

  /**
   * Crea una nueva moneda
   */
  async function createMoneda(data) {
    loading.value = true;
    try {
      const response = await api.post("/precios/monedas", data);
      $q.notify({ 
        type: "positive", 
        message: response.data.msg,
        icon: "check_circle"
      });
      await fetchMonedas();
      return true;
    } catch (error) {
      console.error(error);
      $q.notify({ 
        type: "negative", 
        message: error.response?.data?.msg || "Error creando moneda",
        icon: "error"
      });
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Actualiza una moneda existente
   */
  async function updateMoneda(id, data) {
    loading.value = true;
    try {
      const response = await api.put(`/precios/monedas/${id}`, data);
      $q.notify({ 
        type: "positive", 
        message: response.data.msg,
        icon: "check_circle"
      });
      await fetchMonedas();
      return true;
    } catch (error) {
      console.error(error);
      $q.notify({ 
        type: "negative", 
        message: error.response?.data?.msg || "Error actualizando moneda",
        icon: "error"
      });
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Elimina una moneda
   */
  async function deleteMoneda(id) {
    loading.value = true;
    try {
      const response = await api.delete(`/precios/monedas/${id}`);
      $q.notify({ 
        type: "positive", 
        message: response.data.msg,
        icon: "check_circle"
      });
      await fetchMonedas();
      return true;
    } catch (error) {
      console.error(error);
      $q.notify({ 
        type: "negative", 
        message: error.response?.data?.msg || "Error eliminando moneda",
        icon: "error"
      });
      return false;
    } finally {
      loading.value = false;
    }
  }

  // ============================================
  // ACCIONES - PRECIOS
  // ============================================

  /**
   * Obtiene los precios actuales de todos los combustibles
   * Cada combustible tiene precios en diferentes monedas
   */
  async function fetchPreciosActuales() {
    loading.value = true;
    try {
      const response = await api.get("/precios/actuales");
      preciosActuales.value = response.data;
    } catch (error) {
      console.error(error);
      $q.notify({ 
        type: "negative", 
        message: "Error cargando precios",
        icon: "error"
      });
    } finally {
      loading.value = false;
    }
  }

  /**
   * Actualiza los precios de un combustible
   * @param {Object} data - { id_tipo_combustible, precios: { "Bs": 50, "USD": 1.2 } }
   */
  async function actualizarPrecios(data) {
    loading.value = true;
    try {
      const response = await api.post("/precios/actualizar", data);
      $q.notify({ 
        type: "positive", 
        message: response.data.msg,
        icon: "check_circle"
      });
      await fetchPreciosActuales();
      return true;
    } catch (error) {
      console.error(error);
      $q.notify({ 
        type: "negative", 
        message: error.response?.data?.msg || "Error actualizando precios",
        icon: "error"
      });
      return false;
    } finally {
      loading.value = false;
    }
  }

  // ============================================
  // RETORNO
  // ============================================

  return {
    // Estado
    monedas,
    preciosActuales,
    loading,
    filter,
    pagination,
    
    // Acciones - Monedas
    fetchMonedas,
    createMoneda,
    updateMoneda,
    deleteMoneda,
    
    // Acciones - Precios
    fetchPreciosActuales,
    actualizarPrecios,
  };
});


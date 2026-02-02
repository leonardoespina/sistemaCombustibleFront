// src/stores/movimientoLlenaderoStore.js
import { defineStore } from "pinia";
import { ref } from "vue";
import { useQuasar } from "quasar";
import api from "../api/index.js";

export const useMovimientoLlenaderoStore = defineStore("movimientoLlenadero", () => {
  const $q = useQuasar();

  // --- STATE ---
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

  // --- ACTIONS ---

  async function fetchMovimientos() {
    loading.value = true;
    try {
      const params = {
        page: pagination.value.page,
        limit: pagination.value.rowsPerPage,
        sortBy: pagination.value.sortBy,
        descending: pagination.value.descending,
        // search: filter.value, // El backend espera campos específicos, no search global, pero si lo implementamos:
        // Por ahora backend filtraba por fechas/ids, pero podemos enviar parámetros extra si es necesario.
        // Si el backend usa 'paginate' helper y 'searchableFields', el 'search' funcionará.
        search: filter.value 
      };
      const response = await api.get("/movimientos-llenadero", { params });
      rows.value = response.data.data;
      pagination.value.rowsNumber = response.data.pagination.totalItems;
    } catch (error) {
      console.error(error);
      $q.notify({ type: "negative", message: "Error cargando movimientos" });
    } finally {
      loading.value = false;
    }
  }

  /**
   * Obtiene la lista simple de llenaderos activos para llenar selectores
   */
  async function fetchLlenaderosList() {
    try {
      // Usamos el endpoint '/lista' que suele devolver array simple { id, nombre }
      // Si no existe, usamos el paginado con limit alto.
      // Basado en análisis previo, existe /api/llenaderos/lista
      const response = await api.get("/llenaderos/lista");
      llenaderoOptions.value = response.data; 
    } catch (error) {
      console.error("Error cargando lista de llenaderos:", error);
      $q.notify({ type: "negative", message: "Error cargando llenaderos" });
    }
  }

  /**
   * Crea un nuevo movimiento de inventario (Carga o Evaporación)
   */
  async function createMovimiento(data) {
    loading.value = true;
    try {
      const response = await api.post("/movimientos-llenadero", data);
      $q.notify({ type: "positive", message: response.data.msg });
      return true;
    } catch (error) {
      console.error(error);
      $q.notify({ 
        type: "negative", 
        message: error.response?.data?.msg || "Error registrando movimiento" 
      });
      return false;
    } finally {
      loading.value = false;
    }
  }

  return {
    rows,
    pagination,
    filter,
    llenaderoOptions,
    loading,
    fetchMovimientos,
    fetchLlenaderosList,
    createMovimiento
  };
});

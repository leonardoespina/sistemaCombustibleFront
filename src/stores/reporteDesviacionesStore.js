import { defineStore } from "pinia";
import { ref } from "vue";
import api from "../api";

const firstOfMonthStr = () => {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split("T")[0];
};

const todayStr = () => {
  return new Date().toISOString().split("T")[0];
};

export const useReporteDesviacionesStore = defineStore("reporteDesviaciones", () => {
  const data = ref([]);
  const loading = ref(false);

  const filters = ref({
    fechaDesde: firstOfMonthStr(),
    fechaHasta: todayStr(),
    llenaderoId: null,
    fuelTypeId: null,
    tipoDesviacion: "Ambos",
    origen: "Todos"
  });

  const fetchReport = async () => {
    loading.value = true;
    try {
      const params = {
        fecha_desde: filters.value.fechaDesde,
        fecha_hasta: filters.value.fechaHasta,
        id_llenadero: filters.value.llenaderoId || "",
        id_tipo_combustible: filters.value.fuelTypeId || "",
        tipo_desviacion: filters.value.tipoDesviacion,
        origen: filters.value.origen
      };

      const response = await api.get("/reportes/desviaciones", { params });
      data.value = response.data || [];
    } catch (error) {
      console.error("Error fetching reporte de desviaciones:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const resetFilters = () => {
    filters.value = {
      fechaDesde: firstOfMonthStr(),
      fechaHasta: todayStr(),
      llenaderoId: null,
      fuelTypeId: null,
      tipoDesviacion: "Ambos",
      origen: "Todos"
    };
    data.value = [];
  };

  return {
    data,
    loading,
    filters,
    fetchReport,
    resetFilters
  };
});

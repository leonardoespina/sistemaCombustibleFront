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
      let backendTipo = filters.value.tipoDesviacion;
      let fetchAmbos = false;
      
      if (filters.value.tipoDesviacion === 'Faltantes' || filters.value.tipoDesviacion === 'Sobrantes') {
          if (filters.value.origen === 'Todos') {
              backendTipo = 'Ambos';
              fetchAmbos = true;
          } else if (filters.value.origen === 'Recepción Cisterna') {
              backendTipo = filters.value.tipoDesviacion === 'Faltantes' ? 'Sobrantes' : 'Faltantes';
          }
      }

      const params = {
        fecha_desde: filters.value.fechaDesde,
        fecha_hasta: filters.value.fechaHasta,
        id_llenadero: filters.value.llenaderoId || "",
        id_tipo_combustible: filters.value.fuelTypeId || "",
        tipo_desviacion: backendTipo,
        origen: filters.value.origen
      };

      const response = await api.get("/reportes/desviaciones", { params });
      let resultData = response.data || [];
      
      if (fetchAmbos) {
          let filterSingular = filters.value.tipoDesviacion;
          if (filterSingular === 'Faltantes') filterSingular = 'Faltante';
          if (filterSingular === 'Sobrantes') filterSingular = 'Sobrante';
          
          resultData = resultData.filter(row => {
              let visualType = row.tipo_desviacion;
              if (row.origen === 'Recepción Cisterna') {
                  if (visualType === 'Sobrante') visualType = 'Faltante';
                  else if (visualType === 'Faltante') visualType = 'Sobrante';
              }
              return visualType === filterSingular;
          });
      }

      data.value = resultData;
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

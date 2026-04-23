import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../api';
import { date } from 'quasar';

/** Fecha local correcta sin desfase UTC */
const todayLocal = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000);
};

export const useReporteRecepcionStore = defineStore('reporteRecepcion', () => {
  // State
  const loading = ref(false);
  const reportGroups = ref([]);

  const filters = ref({
    llenaderoId: null,
    fuelTypeId: null,
    fechaDesde: date.formatDate(todayLocal(), 'YYYY-MM-01'),
    fechaHasta: date.formatDate(todayLocal(), 'YYYY-MM-DD')
  });

  // Actions
  const fetchReport = async () => {
    loading.value = true;
    try {
      const params = {
        id_llenadero: filters.value.llenaderoId,
        id_tipo_combustible: filters.value.fuelTypeId,
        fecha_desde: filters.value.fechaDesde,
        fecha_hasta: filters.value.fechaHasta,
      };

      const { data } = await api.get('/reportes/recepcion-cisternas', { params });
      reportGroups.value = data.data;

    } catch (error) {
      console.error('Error fetching reception report:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const resetFilters = () => {
    filters.value.llenaderoId = null;
    filters.value.fuelTypeId = null;
    filters.value.fechaDesde = date.formatDate(todayLocal(), 'YYYY-MM-01');
    filters.value.fechaHasta = date.formatDate(todayLocal(), 'YYYY-MM-DD');
  };

  const clearReportData = () => {
    reportGroups.value = [];
  };

  return {
    loading,
    reportGroups,
    filters,
    fetchReport,
    resetFilters,
    clearReportData,
  };
});

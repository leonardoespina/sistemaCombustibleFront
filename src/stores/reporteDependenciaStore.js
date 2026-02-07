import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../api';
import { date } from 'quasar';
import socket from '../services/socket';

export const useReporteDependenciaStore = defineStore('reporteDependencia', () => {
  // State
  const loading = ref(false);
  const reportData = ref([]);
  
  const filters = ref({
    fechaDesde: date.formatDate(new Date(), 'YYYY-MM-01'),
    fechaHasta: date.formatDate(new Date(), 'YYYY-MM-DD')
  });

  // Actions
  const fetchReport = async () => {
    loading.value = true;
    try {
      const params = {
        fecha_desde: filters.value.fechaDesde,
        fecha_hasta: filters.value.fechaHasta
      };

      const { data } = await api.get('/reportes/consumo-dependencia', { params });
      reportData.value = data;
      
    } catch (error) {
      console.error('Error fetching dependency consumption report:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const resetFilters = () => {
    filters.value.fechaDesde = date.formatDate(new Date(), 'YYYY-MM-01');
    filters.value.fechaHasta = date.formatDate(new Date(), 'YYYY-MM-DD');
  };

  // Socket Integration (Optional but standard for project consistency)
  const initSocket = () => {
    socket.on('solicitud:finalizada', () => {
      // Opcional: Refrescar si hay datos cargados
      // if (reportData.value.length > 0) fetchReport();
    });
  };

  const destroySocket = () => {
    socket.off('solicitud:finalizada');
  };

  return {
    loading,
    reportData,
    filters,
    fetchReport,
    resetFilters,
    initSocket,
    destroySocket
  };
});

import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../api';
import { date } from 'quasar';
import socket from '../services/socket';

export const useReporteDespachoStore = defineStore('reporteDespacho', () => {
  // State
  const loading = ref(false);
  const reportData = ref([]);
  const totalGeneral = ref(0);
  const pagination = ref({
    sortBy: 'fecha',
    descending: false,
    page: 1,
    rowsPerPage: 10,
    rowsNumber: 0
  });
  
  const filters = ref({
    categoryId: null,
    dependencyId: null,
    subdependencyId: null,
    fuelTypeId: null,
    fechaDesde: date.formatDate(new Date(), 'YYYY-MM-01'),
    fechaHasta: date.formatDate(new Date(), 'YYYY-MM-DD')
  });

  // Actions
  const fetchReport = async (page = 1, limit = 10) => {
    loading.value = true;
    try {
      const params = {
        id_dependencia: filters.value.dependencyId,
        id_subdependencia: filters.value.subdependencyId,
        id_tipo_combustible: filters.value.fuelTypeId,
        fecha_desde: filters.value.fechaDesde,
        fecha_hasta: filters.value.fechaHasta,
        page,
        limit
      };

      const { data } = await api.get('/reportes/despachos', { params });
      
      reportData.value = data.data;
      totalGeneral.value = data.total_general;
      
      // Update pagination state
      if (data.pagination) {
        pagination.value.page = data.pagination.currentPage;
        pagination.value.rowsPerPage = data.pagination.limit;
        pagination.value.rowsNumber = data.pagination.totalItems;
      }
      
    } catch (error) {
      console.error('Error fetching report:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const resetFilters = () => {
    filters.value.categoryId = null;
    filters.value.dependencyId = null;
    filters.value.subdependencyId = null;
    filters.value.fuelTypeId = null;
    filters.value.fechaDesde = date.formatDate(new Date(), 'YYYY-MM-01');
    filters.value.fechaHasta = date.formatDate(new Date(), 'YYYY-MM-DD');
    // NO limpiar reportData aquí para que el diálogo pueda mostrar los resultados
  };

  const clearReportData = () => {
    reportData.value = [];
    totalGeneral.value = 0;
  };

  // Socket Integration
  const initSocket = () => {
    socket.on('solicitud:finalizada', () => {
      // Si hay un reporte cargado, refrescar los datos
      if (reportData.value.length > 0) {
        fetchReport(); 
      }
    });
  };

  const destroySocket = () => {
    socket.off('solicitud:finalizada');
  };

  return {
    loading,
    reportData,
    totalGeneral,
    pagination,
    filters,
    fetchReport,
    resetFilters,
    clearReportData,
    initSocket,
    destroySocket
  };
});

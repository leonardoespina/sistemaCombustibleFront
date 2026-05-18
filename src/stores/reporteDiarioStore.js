import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../api';
import socket from '../services/socket';
import { todayStr } from '../utils/dateUtils';

export const useReporteDiarioStore = defineStore('reporteDiario', () => {
    // ─── State ───────────────────────────────────────────────
    const loading = ref(false);
    const reportData = ref(null);
    const llenaderosList = ref([]);

    const filters = ref({
        id_llenadero: null,
        fecha_desde: todayStr(),
        hora_desde: '07:00',
        fecha_hasta: todayStr(),
        hora_hasta: '07:00',
    });

    const pagination = ref({
        page: 1,
        rowsPerPage: 50,
        rowsNumber: 0,
    });

    // ─── Actions ─────────────────────────────────────────────
    const loadLlenaderos = async () => {
        try {
            const { data } = await api.get('/llenaderos');
            llenaderosList.value = data.data || data;
        } catch (error) {
            console.error('Error cargando llenaderos:', error);
            throw error;
        }
    };

    const fetchReport = async (page = 1, limit = 20) => {
        loading.value = true;
        if (page === 1) reportData.value = null;
        try {
            const { data } = await api.get('/reportes/diario', {
                params: {
                    id_llenadero: filters.value.id_llenadero,
                    fecha_desde: filters.value.fecha_desde,
                    hora_desde: filters.value.hora_desde,
                    fecha_hasta: filters.value.fecha_hasta,
                    hora_hasta: filters.value.hora_hasta,
                    tipo_reporte: 'TODOS',
                    page,
                    limit,
                },
            });
            reportData.value = data;
            if (data.pagination) {
                pagination.value.rowsNumber = data.pagination.totalItems;
                pagination.value.page = data.pagination.currentPage;
                pagination.value.rowsPerPage = data.pagination.limit;
            }
        } catch (error) {
            console.error('Error fetching reporte diario:', error);
            throw error;
        } finally {
            loading.value = false;
        }
    };

    const resetFilters = () => {
        filters.value.id_llenadero = null;
        filters.value.fecha_desde = todayStr();
        filters.value.hora_desde = '07:00';
        filters.value.fecha_hasta = todayStr();
        filters.value.hora_hasta = '07:00';
        reportData.value = null;
    };

    // Socket — refresca cuando se finaliza una solicitud en el día actual
    const initSocket = () => {
        socket.on('solicitud:finalizada', () => {
            if (reportData.value && filters.value.id_llenadero) {
                fetchReport(pagination.value.page, pagination.value.rowsPerPage);
            }
        });
    };

    const destroySocket = () => {
        socket.off('solicitud:finalizada');
    };

    return {
        loading, reportData, llenaderosList, filters, pagination,
        loadLlenaderos, fetchReport, resetFilters, initSocket, destroySocket,
    };
});

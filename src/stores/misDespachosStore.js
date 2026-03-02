import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../api';
import socket from '../services/socket';
import { todayStr, firstOfMonthStr } from '../utils/dateUtils';

export const useMisDespachosStore = defineStore('misDespachos', () => {
    // ─── State ───────────────────────────────────────────────
    const loading = ref(false);
    const reportData = ref([]);
    const totalGeneral = ref('0.00');
    const subdependenciasList = ref([]); // opciones del multi-select

    const filters = ref({
        subdependencias: [],    // array de IDs seleccionados
        id_tipo_combustible: null,
        fechaDesde: firstOfMonthStr(),
        fechaHasta: todayStr(),
    });

    const pagination = ref({
        sortBy: 'fecha',
        descending: true,
        page: 1,
        rowsPerPage: 15,
        rowsNumber: 0,
    });

    // ─── Actions ─────────────────────────────────────────────

    /** Carga las subdependencias de la dependencia del usuario (desde token) */
    const loadSubdependencias = async () => {
        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const id_dependencia = userData?.Dependencia?.id_dependencia;
            if (!id_dependencia) return;
            const { data } = await api.get('/subdependencias', { params: { id_dependencia } });
            subdependenciasList.value = data.data || data;
        } catch (error) {
            console.error('Error cargando subdependencias:', error);
        }
    };

    /** Consulta el reporte. La dependencia la toma el backend del token. */
    const fetchReport = async (page = 1, limit = 15) => {
        loading.value = true;
        try {
            const params = {
                fecha_desde: filters.value.fechaDesde,
                fecha_hasta: filters.value.fechaHasta,
                id_tipo_combustible: filters.value.id_tipo_combustible,
                page,
                limit,
            };

            // Serializar el array de subdependencias como query-string array
            const subdependencias = filters.value.subdependencias;
            if (subdependencias && subdependencias.length > 0) {
                params['subdependencias[]'] = subdependencias;
            }

            const { data } = await api.get('/reportes/mis-despachos', { params });
            reportData.value = data.data;
            totalGeneral.value = data.total_general;

            if (data.pagination) {
                pagination.value.page = data.pagination.currentPage;
                pagination.value.rowsPerPage = data.pagination.limit;
                pagination.value.rowsNumber = data.pagination.totalItems;
            }
        } catch (error) {
            console.error('Error fetching mis-despachos:', error);
            throw error;
        } finally {
            loading.value = false;
        }
    };

    const resetFilters = () => {
        filters.value.subdependencias = [];
        filters.value.id_tipo_combustible = null;
        filters.value.fechaDesde = firstOfMonthStr();
        filters.value.fechaHasta = todayStr();

    };

    const clearReportData = () => {
        reportData.value = [];
        totalGeneral.value = '0.00';
    };

    const initSocket = () => {
        socket.on('solicitud:finalizada', () => {
            if (reportData.value.length > 0) fetchReport();
        });
    };

    const destroySocket = () => {
        socket.off('solicitud:finalizada');
    };

    return {
        loading, reportData, totalGeneral, subdependenciasList, filters, pagination,
        loadSubdependencias, fetchReport, resetFilters, clearReportData,
        initSocket, destroySocket,
    };
});

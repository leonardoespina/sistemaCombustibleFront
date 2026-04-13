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
    const subdepPagination = ref({ page: 1, limit: 15, hasMore: true, search: '', loading: false });

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

    /** Carga las subdependencias de la dependencia del usuario asincrónicamente */
    const loadSubdependencias = async (isLoadMore = false) => {
        if (!isLoadMore) {
            subdepPagination.value.page = 1;
            subdepPagination.value.hasMore = true;
            subdependenciasList.value = [];
        }
        if (subdepPagination.value.loading || !subdepPagination.value.hasMore) return;

        subdepPagination.value.loading = true;
        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const id_dependencia = userData?.Dependencia?.id_dependencia;
            if (!id_dependencia) return;

            const params = {
                id_dependencia,
                page: subdepPagination.value.page,
                limit: subdepPagination.value.limit,
                search: subdepPagination.value.search
            };

            const { data } = await api.get('/subdependencias', { params });
            const newItems = data.data || data;

            if (isLoadMore) {
                subdependenciasList.value.push(...newItems);
            } else {
                subdependenciasList.value = newItems;
            }

            subdepPagination.value.hasMore = newItems.length === subdepPagination.value.limit;
            subdepPagination.value.page++;
        } catch (error) {
            console.error('Error cargando subdependencias:', error);
        } finally {
            subdepPagination.value.loading = false;
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

            // Serializar el array de subdependencias como query-string array (extrayendo IDs si son objetos)
            const subdependencias = filters.value.subdependencias;
            if (subdependencias && subdependencias.length > 0) {
                params['subdependencias[]'] = subdependencias.map(s => typeof s === 'object' ? s.id_subdependencia : s);
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
        loading, reportData, totalGeneral, subdependenciasList, subdepPagination, filters, pagination,
        loadSubdependencias, fetchReport, resetFilters, clearReportData,
        initSocket, destroySocket,
    };
});

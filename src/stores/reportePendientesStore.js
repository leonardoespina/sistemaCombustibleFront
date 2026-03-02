import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../api';
import socket from '../services/socket';

export const useReportePendientesStore = defineStore('reportePendientes', () => {
    // ─── State ───────────────────────────────────────────────
    const loading = ref(false);
    const reportData = ref({ GASOLINA: [], GASOIL: [] });

    // ─── Helpers internos ────────────────────────────────────
    function toNumber(value) {
        if (value === null || value === undefined || value === '') return 0;
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
    }

    function sumLitros(data) {
        if (!Array.isArray(data) || data.length === 0) return 0;
        return data.reduce((total, row) => total + toNumber(row.litros_despachados), 0);
    }

    // ─── Getters ─────────────────────────────────────────────
    const gasolinaData = computed(() =>
        Array.isArray(reportData.value.GASOLINA) ? reportData.value.GASOLINA : []
    );

    const gasoilData = computed(() =>
        Array.isArray(reportData.value.GASOIL) ? reportData.value.GASOIL : []
    );

    const stats = computed(() => {
        const gasolinaLitros = sumLitros(gasolinaData.value);
        const gasoilLitros = sumLitros(gasoilData.value);
        return {
            gasolina: { count: gasolinaData.value.length, litros: gasolinaLitros },
            gasoil: { count: gasoilData.value.length, litros: gasoilLitros },
            total: {
                count: gasolinaData.value.length + gasoilData.value.length,
                litros: gasolinaLitros + gasoilLitros
            },
        };
    });

    const oldPendingCount = computed(() => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return [...gasolinaData.value, ...gasoilData.value].filter((row) => {
            const fecha = new Date(row.fecha_hora);
            return !isNaN(fecha.getTime()) && fecha < sevenDaysAgo;
        }).length;
    });

    const hasOldPending = computed(() => oldPendingCount.value > 0);

    // ─── Actions ─────────────────────────────────────────────
    const fetchReport = async () => {
        loading.value = true;
        try {
            const { data } = await api.get('/reportes/pendientes');
            reportData.value = {
                GASOLINA: Array.isArray(data.GASOLINA) ? data.GASOLINA : [],
                GASOIL: Array.isArray(data.GASOIL) ? data.GASOIL : [],
            };
        } catch (error) {
            console.error('Error fetching pendientes report:', error);
            reportData.value = { GASOLINA: [], GASOIL: [] };
            throw error;
        } finally {
            loading.value = false;
        }
    };

    const resetData = () => {
        reportData.value = { GASOLINA: [], GASOIL: [] };
    };

    const initSocket = () => {
        socket.on('solicitud:finalizada', () => {
            fetchReport();
        });
    };

    const destroySocket = () => {
        socket.off('solicitud:finalizada');
    };

    return {
        loading, reportData,
        gasolinaData, gasoilData, stats, oldPendingCount, hasOldPending,
        fetchReport, resetData, initSocket, destroySocket,
    };
});

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../api/index.js';
import socket from '../services/socket';
import { todayStr } from '../utils/dateUtils';

export const useSituacionCombustibleStore = defineStore('situacionCombustible', () => {
    // ─── State ───────────────────────────────────────────────
    const loading = ref(false);
    const reportData = ref(null);
    const generadoEn = ref(null);
    const errorMsg = ref(null);

    const filters = ref({
        fecha_desde: todayStr(),
        fecha_hasta: todayStr(),
    });

    // ─── Getters (Computed) ──────────────────────────────────
    const tiposCombustible = computed(() => {
        return reportData.value?.totales_por_combustible ?? [];
    });

    const tablaResumen = computed(() => {
        const rows = [];
        if (!reportData.value) return rows;

        reportData.value.datos.forEach((ll) => {
            ll.tipos_combustible.forEach((tc) => {
                const pctStock = tc.capacidad_total > 0
                    ? ((tc.stock_actual / tc.capacidad_total) * 100).toFixed(1)
                    : "0.0";
                rows.push({
                    llenadero:         ll.nombre_llenadero,
                    combustible:       tc.nombre_combustible,
                    capacidad:         tc.capacidad_total,
                    stock:             tc.stock_actual,
                    consumido:         tc.consumido_periodo,
                    porcentaje_stock:  pctStock,
                });
            });
        });

        // Filas de totales
        reportData.value.totales_por_combustible.forEach((tc) => {
            const pct = tc.capacidad_total > 0
                ? ((tc.stock_actual / tc.capacidad_total) * 100).toFixed(1)
                : "0.0";
            rows.push({
                llenadero:        `TOTAL ${tc.nombre_combustible}`,
                combustible:      tc.nombre_combustible,
                capacidad:        tc.capacidad_total,
                stock:            tc.stock_actual,
                consumido:        tc.consumido_periodo,
                porcentaje_stock: pct,
                esTotal:          true,
            });
        });

        return rows;
    });

    // ─── Actions ─────────────────────────────────────────────
    const fetchReport = async () => {
        loading.value = true;
        errorMsg.value = null;
        try {
            // Patrón del proyecto: Llamada directa usando la instancia 'api'
            const { data } = await api.get('/reportes/situacion-combustible', {
                params: {
                    fecha_desde: filters.value.fecha_desde,
                    fecha_hasta: filters.value.fecha_hasta,
                }
            });
            reportData.value = data;
            generadoEn.value = data.generado_en;
        } catch (err) {
            console.error('Error fetching situacion combustible:', err);
            errorMsg.value = err?.response?.data?.msg || "Error al obtener el reporte.";
        } finally {
            loading.value = false;
        }
    };

    const resetFilters = () => {
        filters.value.fecha_desde = todayStr();
        filters.value.fecha_hasta = todayStr();
        reportData.value = null;
    };

    // ─── Sockets ─────────────────────────────────────────────
    const initSocket = () => {
        socket.on('tanque:actualizado', () => {
            if (reportData.value) fetchReport();
        });
        socket.on('solicitud:finalizada', () => {
            if (reportData.value) fetchReport();
        });
    };

    const destroySocket = () => {
        socket.off('tanque:actualizado');
        socket.off('solicitud:finalizada');
    };

    return {
        loading, reportData, generadoEn, errorMsg, filters,
        tiposCombustible, tablaResumen,
        fetchReport, resetFilters, initSocket, destroySocket,
    };
});

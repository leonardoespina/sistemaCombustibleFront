import { useSituacionCombustibleStore } from '../stores/situacionCombustibleStore';
import { storeToRefs } from 'pinia';
import { date } from 'quasar';
import { onMounted, onUnmounted } from 'vue';

/**
 * useSituacionCombustible
 * 
 * Composable que actúa como puente entre la vista y el Store de Pinia.
 * Encapsula la lógica de formateo y la gestión del ciclo de vida de los sockets.
 */
export function useSituacionCombustible() {
    const store = useSituacionCombustibleStore();
    
    // Extraemos estado reactivo del Store
    const { 
        filters, reportData, loading, generadoEn, errorMsg,
        tiposCombustible, tablaResumen 
    } = storeToRefs(store);

    // ─── Acciones ─────────────────────────────────────────────
    const fetchReporte = () => store.fetchReport();

    // ─── Helpers de Formato (Lógica de Presentación) ───────────
    function fmt(fechaStr) {
        return fechaStr ? date.formatDate(fechaStr, 'DD/MM/YYYY') : '';
    }

    function fmtTimestamp(iso) {
        if (!iso) return '';
        return new Date(iso).toLocaleString('es-VE', {
            timeZone: 'America/Caracas',
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true,
        });
    }

    function fmtNum(n) {
        return Number(n).toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    }

    // ─── Ciclo de Vida ────────────────────────────────────────
    // Manejamos la inicialización del reporte y los sockets aquí
    onMounted(() => {
        store.initSocket();
        // Solo cargamos si no hay datos previos (evita doble carga si se navega rápido)
        if (!reportData.value) {
            fetchReporte();
        }
    });

    onUnmounted(() => {
        store.destroySocket();
    });

    return {
        filters, reportData, loading, generadoEn, errorMsg,
        tiposCombustible, tablaResumen,
        fetchReporte,
        fmt, fmtTimestamp, fmtNum,
    };
}

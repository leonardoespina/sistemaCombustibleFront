import { ref } from 'vue';
import { date } from 'quasar';
import { useReporteDiarioStore } from '../stores/reporteDiarioStore';
import { onMounted, onUnmounted } from 'vue';

export function useReporteDiarioPage() {
    const store = useReporteDiarioStore();

    // ─── UI State ────────────────────────────────────────────
    const showReportDialog = ref(false);

    // ─── Columnas ────────────────────────────────────────────
    const columnsInstitucional = [
        { name: 'solicitante', label: 'Solicitante', field: 'solicitante', align: 'left' },
        { name: 'vehiculo', label: 'Vehículo', field: 'vehiculo', align: 'left' },
        { name: 'placa', label: 'Placa', field: 'placa', align: 'left' },
        { name: 'dependencia', label: 'Dependencia', field: 'dependencia', align: 'left' },
        { name: 'subdependencia', label: 'Subdependencia', field: 'subdependencia', align: 'left' },
        { name: 'cant_solic', label: 'Cant. Solic', field: 'cant_solic', align: 'right' },
        { name: 'cant_desp', label: 'Cant. Desp', field: 'cant_desp', align: 'right' },
    ];

    const columnsVenta = [
        ...columnsInstitucional,
        { name: 'precio', label: 'Precio', field: 'precio', align: 'right', format: (v) => v ? Number(v).toFixed(2) : '-' },
        { name: 'total_pagar', label: 'Total a Pagar', field: 'total_pagar', align: 'right', format: (v) => v ? Number(v).toFixed(2) : '-' },
        { name: 'saldo_favor', label: 'Saldo a Favor', field: 'saldo_favor', align: 'right', format: (v) => v > 0 ? Number(v).toFixed(2) : '-' },
        { name: 'moneda', label: 'Moneda', field: 'moneda', align: 'center' },
    ];

    // ─── Acciones ────────────────────────────────────────────
    async function consultarReporte(page = 1, limit = 20) {
        try {
            await store.fetchReport(page, limit);
            showReportDialog.value = true;
        } catch {
            $q.notify({ type: 'negative', message: 'Error al generar el reporte' });
        }
    }

    const onRequest = async ({ pagination: p }) => {
        await consultarReporte(p.page, p.rowsPerPage);
    };

    // ─── Helpers ─────────────────────────────────────────────
    function getLlenaderoNombre(id) {
        const l = store.llenaderosList.find((l) => l.id_llenadero === id);
        return l ? l.nombre_llenadero : 'Desconocido';
    }

    function formatDate(fechaStr) {
        return date.formatDate(fechaStr, 'DD/MM/YYYY');
    }

    function printReport() { window.print(); }

    // ─── Lifecycle ───────────────────────────────────────────
    onMounted(async () => {
        store.resetFilters();
        store.initSocket();
        await store.loadLlenaderos();
    });

    onUnmounted(() => {
        store.destroySocket();
    });

    return {
        store, showReportDialog,
        columnsInstitucional, columnsVenta,
        consultarReporte, onRequest,
        getLlenaderoNombre, formatDate,
        printReport,
    };
}

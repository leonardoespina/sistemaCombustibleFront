import { ref, onMounted, onUnmounted, computed } from 'vue';
import { date, useQuasar } from 'quasar';
import { useReporteDiarioStore } from '../stores/reporteDiarioStore';
import { PERMISSIONS, hasPermission } from '../utils/permissions';

export function useReporteDiarioPage() {
    const store = useReporteDiarioStore();
    const $q = useQuasar();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const canViewFinancial = hasPermission(user, PERMISSIONS.VIEW_REPORTE_VENTAS);

    // ─── UI State ────────────────────────────────────────────
    const showReportDialog = ref(false);

    // ─── Columnas ────────────────────────────────────────────
    const columnsInstitucional = [
        {
            name: 'fecha_hora', label: 'Fecha/Hora', align: 'left',
            field: row => `${row.fecha} ${row.hora}`,
            format: (v, row) => {
                if (!row.fecha) return '-';
                return `${date.formatDate(row.fecha, 'DD/MM/YYYY')} ${row.hora || ''}`;
            }
        },
        { name: 'solicitante', label: 'Solicitante', field: 'solicitante', align: 'left' },
        { name: 'aprobador', label: 'Aprobador', field: 'aprobador', align: 'left' },
        { name: 'recibido', label: 'Recibido', field: 'recibido', align: 'left' },
        { name: 'vehiculo', label: 'Vehículo', field: 'vehiculo', align: 'left' },
        { name: 'placa', label: 'Placa', field: 'placa', align: 'left' },
        { name: 'dependencia', label: 'Dependencia', field: 'dependencia', align: 'left' },
        { name: 'subdependencia', label: 'Subdependencia', field: 'subdependencia', align: 'left' },
        { name: 'tipo_combustible', label: 'Combustible', field: 'tipo_combustible', align: 'left' },
        { name: 'cant_solic', label: 'Cant. Solic', field: 'cant_solic', align: 'right', format: v => Number(v).toFixed(2) },
        { name: 'cant_desp', label: 'Cant. Desp', field: 'cant_desp', align: 'right', format: v => Number(v).toFixed(2) },
    ];

    const columnsVenta = [
        ...columnsInstitucional,
        ...(canViewFinancial ? [
            { name: 'precio', label: 'Precio', field: 'precio', align: 'right', format: v => Number(v).toFixed(2) },
            { name: 'moneda', label: 'Moneda', field: 'moneda', align: 'center' },
            { name: 'total_pagar', label: 'Total', field: 'total_pagar', align: 'right', format: v => Number(v).toFixed(2) },
            { name: 'saldo_favor', label: 'Saldo Favor', field: 'saldo_favor', align: 'right' },
        ] : [])
    ];



    // ─── Acciones ────────────────────────────────────────────
    async function consultarReporte(page = 1, limit = 50) {
        try {
            await store.fetchReport(page, limit);
            showReportDialog.value = true;
        } catch {
            $q.notify({ type: 'negative', message: 'Error al generar el reporte' });
        }
    }

    const onRequest = async ({ pagination: p }) => {
        store.pagination.page = p.page;
        store.pagination.rowsPerPage = p.rowsPerPage;
        await consultarReporte(p.page, p.rowsPerPage);
    };

    // ─── Helpers ─────────────────────────────────────────────
    function getLlenaderoNombre(id) {
        const l = store.llenaderosList.find((l) => l.id_llenadero === id);
        return l ? l.nombre_llenadero : 'Desconocido';
    }

    function formatDate(fechaStr) {
        if (!fechaStr) return '';
        return date.formatDate(`${fechaStr}T12:00:00`, 'DD/MM/YYYY');
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
        columnsInstitucional,
        columnsVenta,
        canViewFinancial,
        consultarReporte, onRequest,
        getLlenaderoNombre, formatDate,
        printReport,
    };
}

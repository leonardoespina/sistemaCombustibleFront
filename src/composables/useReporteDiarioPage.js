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

    // ─── Columnas Despachos ──────────────────────────────────
    const columnsInstitucional = [
        {
            name: 'fecha_hora', label: 'Fecha/Hora', align: 'left',
            field: row => `${row.fecha} ${row.hora}`,
            format: (v, row) => {
                if (!row.fecha) return '-';
                return `${date.formatDate(row.fecha, 'DD/MM/YYYY')} ${row.hora || ''}`;
            }
        },
        { name: 'codigo_ticket', label: 'Ticket', field: 'codigo_ticket', align: 'left' },
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
        { name: 'estado_rendicion', label: 'Rendición / Destino', field: row => row.es_nodriza ? row.estado_rendicion : '-', align: 'left' },
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

    // ─── Columnas Hoja de Distribución ───────────────────────
    const columnsDistribucion = [
        { name: 'ticket_maestro', label: 'Ticket Maestro', field: 'ticket_maestro', align: 'left' },
        { name: 'fecha_hora', label: 'Fecha / Hora Entrega', field: 'fecha_hora', align: 'left' },
        { name: 'vehiculo', label: 'Equipo / Vehículo Receptor', field: 'vehiculo', align: 'left' },
        { name: 'placa', label: 'Placa', field: 'placa', align: 'left' },
        { name: 'litros', label: 'Litros Entregados', field: 'litros', align: 'right', format: v => Number(v).toFixed(2) },
        { name: 'frente', label: 'Frente / Ubicación / Observaciones', field: 'frente', align: 'left' },
        { name: 'registrador', label: 'Registrado Por', field: 'registrador', align: 'left' },
    ];

    // ─── Hojas Excel Multi-Pestaña (Opción 1) ─────────────────
    const excelSheetsInstitucional = computed(() => {
        const sheets = [];
        const instRows = store.reportData?.institucional || [];
        if (instRows.length > 0) {
            sheets.push({
                sheetName: 'Despachos Institucional',
                columns: columnsInstitucional,
                rows: instRows,
                meta: [
                    'REPORTE DIARIO DE COMBUSTIBLE — DESPACHOS INSTITUCIONALES',
                    `Periodo: ${formatDate(store.filters.fecha_desde)} al ${formatDate(store.filters.fecha_hasta)}`,
                    `Llenadero: ${getLlenaderoNombre(store.filters.id_llenadero)}`,
                ],
            });
        }

        // Obtener todas las entregas internas de tickets maestros en institucional
        const distRows = (store.reportData?.distribuciones || []).filter(d =>
            instRows.some(i => i.codigo_ticket === d.ticket_maestro)
        );

        if (distRows.length > 0) {
            sheets.push({
                sheetName: 'Detalle Distribución',
                columns: columnsDistribucion,
                rows: distRows,
                meta: [
                    'REPORTE DIARIO DE COMBUSTIBLE — DETALLE DE DISTRIBUCIÓN INTERNA A EQUIPOS',
                    `Periodo: ${formatDate(store.filters.fecha_desde)} al ${formatDate(store.filters.fecha_hasta)}`,
                    `Llenadero: ${getLlenaderoNombre(store.filters.id_llenadero)}`,
                    'Nota: Este detalle refleja la entrega en campo/mina proveniente de los Tickets Maestros.',
                ],
            });
        }

        return sheets;
    });

    const excelSheetsVenta = computed(() => {
        const sheets = [];
        const ventaRows = store.reportData?.venta || [];
        if (ventaRows.length > 0) {
            sheets.push({
                sheetName: 'Despachos Venta',
                columns: columnsVenta,
                rows: ventaRows,
                meta: [
                    'REPORTE DIARIO DE COMBUSTIBLE — VENTAS (S.C.)',
                    `Periodo: ${formatDate(store.filters.fecha_desde)} al ${formatDate(store.filters.fecha_hasta)}`,
                    `Llenadero: ${getLlenaderoNombre(store.filters.id_llenadero)}`,
                ],
            });
        }

        const distRows = (store.reportData?.distribuciones || []).filter(d =>
            ventaRows.some(v => v.codigo_ticket === d.ticket_maestro)
        );

        if (distRows.length > 0) {
            sheets.push({
                sheetName: 'Detalle Distribución',
                columns: columnsDistribucion,
                rows: distRows,
                meta: [
                    'REPORTE DIARIO DE COMBUSTIBLE — DETALLE DE DISTRIBUCIÓN INTERNA A EQUIPOS (VENTAS)',
                    `Periodo: ${formatDate(store.filters.fecha_desde)} al ${formatDate(store.filters.fecha_hasta)}`,
                    `Llenadero: ${getLlenaderoNombre(store.filters.id_llenadero)}`,
                ],
            });
        }

        return sheets;
    });

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
        columnsDistribucion,
        excelSheetsInstitucional,
        excelSheetsVenta,
        canViewFinancial,
        consultarReporte, onRequest,
        getLlenaderoNombre, formatDate,
        printReport,
    };
}

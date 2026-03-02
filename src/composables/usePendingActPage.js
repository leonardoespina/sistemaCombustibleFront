import { ref, computed } from 'vue';
import { date, exportFile, useQuasar } from 'quasar';
import { useReportePendientesStore } from '../stores/reportePendientesStore';
import { onMounted, onUnmounted } from 'vue';

export function usePendingActPage() {
    const $q = useQuasar();
    const store = useReportePendientesStore();

    // ─── UI State ────────────────────────────────────────────
    const selectedFuel = ref('GASOLINA');
    const search = ref('');

    const columns = [
        { name: 'fecha', label: 'Fecha', field: 'fecha_hora', sortable: true, align: 'left' },
        { name: 'placa', label: 'Placa', field: 'placa', sortable: true, align: 'left' },
        { name: 'vehiculo_info', label: 'Vehículo', field: (row) => `${row.marca || ''} ${row.modelo || ''}`.trim(), align: 'left' },
        { name: 'chofer', label: 'Chofer', field: 'chofer', sortable: true, align: 'left' },
        { name: 'gerencia', label: 'Gerencia', field: 'gerencia', sortable: true, align: 'left' },
        { name: 'tipo_destino', label: 'Destino', field: 'tipo_destino', sortable: true, align: 'center' },
        { name: 'litros_despachados', label: 'Litros', field: 'litros_despachados', sortable: true, align: 'right' },
        { name: 'usuario', label: 'Despachador', field: 'usuario', align: 'left' },
    ];

    const pagination = ref({ sortBy: 'fecha', descending: true, page: 1, rowsPerPage: 10 });

    // ─── Computed ────────────────────────────────────────────
    const currentData = computed(() => {
        const data = store.reportData[selectedFuel.value];
        return Array.isArray(data) ? data : [];
    });

    const filteredData = computed(() => {
        if (!search.value?.trim()) return currentData.value;
        const needle = search.value.toLowerCase().trim();
        return currentData.value.filter((row) =>
            [row.placa, row.chofer, row.gerencia, row.usuario, row.marca, row.modelo]
                .some((f) => f && String(f).toLowerCase().includes(needle))
        );
    });

    const filteredCount = computed(() => filteredData.value.length);
    const filteredTotalLitros = computed(() =>
        filteredData.value.reduce((sum, row) => {
            const n = parseFloat(row.litros_despachados);
            return sum + (isNaN(n) ? 0 : n);
        }, 0)
    );

    // ─── Helpers de formato ──────────────────────────────────
    function formatNumber(value) {
        const num = parseFloat(value) || 0;
        return new Intl.NumberFormat('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(num);
    }

    function formatDate(dateStr) {
        if (!dateStr) return '-';
        return date.formatDate(dateStr, 'DD/MM/YYYY HH:mm');
    }

    function getRelativeTime(dateStr) {
        if (!dateStr) return '';
        const diffDays = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays} días`;
        if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
        return `Hace ${Math.floor(diffDays / 30)} meses`;
    }

    function getAgeIcon(dateStr) {
        if (!dateStr) return { icon: 'help', color: 'grey' };
        const diffDays = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
        if (diffDays <= 2) return { icon: 'schedule', color: 'positive' };
        if (diffDays <= 7) return { icon: 'schedule', color: 'warning' };
        return { icon: 'warning', color: 'negative' };
    }

    // ─── Acciones UI ─────────────────────────────────────────
    function filterOld() {
        $q.notify({ message: 'Filtro de antiguos aplicado', color: 'warning', icon: 'filter_list' });
    }

    function wrapCsvValue(val, formatFn, row) {
        let formatted = formatFn !== undefined ? formatFn(val, row) : val;
        formatted = formatted === undefined || formatted === null ? '' : String(formatted);
        return `"${formatted.split('"').join('""')}"`;
    }

    function exportTable(format) {
        if (format === 'csv') {
            const content = [columns.map((col) => wrapCsvValue(col.label))]
                .concat(filteredData.value.map((row) =>
                    columns.map((col) =>
                        wrapCsvValue(
                            typeof col.field === 'function' ? col.field(row) : row[col.field ?? col.name],
                            col.format, row
                        )
                    ).join(',')
                ))
                .join('\r\n');

            const status = exportFile(
                `pendientes-${selectedFuel.value.toLowerCase()}-${date.formatDate(Date.now(), 'YYYYMMDD')}.csv`,
                content, 'text/csv'
            );
            if (status !== true) $q.notify({ message: 'Navegador denegó la descarga', color: 'negative', icon: 'warning' });
        } else {
            $q.notify({ message: 'Generando PDF...', color: 'info', icon: 'picture_as_pdf' });
        }
    }

    function printTable() { window.print(); }

    // ─── Lifecycle ───────────────────────────────────────────
    onMounted(async () => {
        store.initSocket();
        await store.fetchReport();
    });

    onUnmounted(() => {
        store.destroySocket();
    });

    return {
        store,
        selectedFuel, search, columns, pagination,
        filteredData, filteredCount, filteredTotalLitros,
        formatNumber, formatDate, getRelativeTime, getAgeIcon,
        filterOld, exportTable, printTable,
    };
}

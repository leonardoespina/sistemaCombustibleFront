import { ref, computed, onMounted, onUnmounted } from "vue";
import { useQuasar, date } from "quasar";
import { useCierreTurnoStore } from "../../../stores/cierreTurnoStore.js";
import socket from "../../../services/socket";
import api from "../../../api/index.js";
import { pdfService } from "../../../services/pdfService";

export function useCierreTurnoPage() {
    const $q = useQuasar();
    const store = useCierreTurnoStore();

    // ─── ESTADO LOCAL ────────────────────────────────────────
    const showGenerarDialog = ref(false);
    const showReporteDialog = ref(false);
    const showDetalleDialog = ref(false);
    const showActaDialog = ref(false);

    const cargandoTanques = ref(false);
    const tanquesActivos = ref([]);

    const llenaderosList = ref([]);
    const pcpList = ref([]);
    const cierreSeleccionado = ref(null);

    // Filtros
    const filters = ref({
        id_llenadero: null,
        estado: null,
        fecha_inicio: "",
        fecha_fin: "",
    });

    // ─── COMPUTADOS ──────────────────────────────────────────
    const rows = computed(() => store.rows);

    const loading = computed(() => store.loading);
    const reporteActual = computed(() => store.reporteActual);
    const actaActual = computed(() => store.actaActual);

    // ─── AGRUPACIÓN DE TANQUES PARA DETALLE ──────────────────
    const tanquesAgrupadosDetalle = computed(() => {
        const grupos = {};
        const mediciones = cierreSeleccionado.value?.Mediciones || [];
        mediciones.forEach(m => {
            const comb = m.Tanque?.TipoCombustible?.nombre || "Sin Especificar";
            if (!grupos[comb]) grupos[comb] = [];
            grupos[comb].push(m);
        });
        return grupos;
    });

    const filter = computed({
        get: () => store.filter,
        set: (val) => (store.filter = val),
    });
    const pagination = computed({
        get: () => store.pagination,
        set: (val) => (store.pagination = val),
    });

    // ─── COLUMNAS ────────────────────────────────────────────
    const columns = [
        {
            name: "id_cierre",
            label: "#",
            field: "id_cierre",
            align: "left",
            sortable: true,
            style: "width: 60px",
        },
        {
            name: "fecha_lote",
            label: "Fecha Lote",
            field: (r) => date.formatDate(r.fecha_lote, "DD/MM/YYYY"),
            align: "left",
            sortable: true,
        },
        {
            name: "llenadero",
            label: "Llenadero",
            field: (r) => r.Llenadero?.nombre_llenadero ?? "—",
            align: "left",
        },
        { name: "turno", label: "Turno", field: "turno", align: "center" },
        {
            name: "periodo",
            label: "Período",
            field: (r) => `${r.hora_inicio_lote ?? "—"} → ${r.hora_cierre_lote ?? "—"}`,
            align: "center",
        },
        {
            name: "almacenista",
            label: "Almacenista",
            field: (r) =>
                r.Almacenista
                    ? `${r.Almacenista.nombre} ${r.Almacenista.apellido}`
                    : "—",
            align: "left",
        },
        { name: "estado", label: "Estado", field: "estado", align: "center" },
        {
            name: "despachos",
            label: "Despachos",
            field: (r) => r.Solicitudes?.length ?? 0,
            align: "center",
        },
        {
            name: "total_despachado",
            label: "Total Desp. (L)",
            field: (r) =>
                r.Solicitudes?.length
                    ? r.Solicitudes.reduce((s, x) => s + parseFloat(x.cantidad_despachada || 0), 0)
                    : 0,
            format: (val) => val > 0 ? Number(val).toLocaleString() + " L" : "—",
            align: "right",
        },
        { name: "acciones", label: "Acciones", align: "center" },
    ];


    // ─── MÉTODOS ─────────────────────────────────────────────

    function onRequest(props) {
        store.pagination = props.pagination;
        store.filter = props.filter ?? store.filter;
        _fetchWithFilters();
    }

    function applyFilters() {
        store.pagination.page = 1;
        _fetchWithFilters();
    }

    function clearFilters() {
        filters.value = { id_llenadero: null, estado: null, fecha_inicio: "", fecha_fin: "" };
        store.filter = "";
        store.pagination.page = 1;
        _fetchWithFilters();
    }

    function _fetchWithFilters() {
        store.fetchCierres({
            id_llenadero: filters.value.id_llenadero || undefined,
            estado: filters.value.estado || undefined,
            fecha_inicio: filters.value.fecha_inicio || undefined,
            fecha_fin: filters.value.fecha_fin || undefined,
        });
    }

    /** Carga tanques activos del llenadero con su último nivel de cierre */
    async function onLlenaderoChanged(id_llenadero) {
        if (!id_llenadero) { tanquesActivos.value = []; return; }
        cargandoTanques.value = true;
        try {
            tanquesActivos.value = await store.fetchTanquesLlenadero(id_llenadero);
        } catch {
            $q.notify({ type: "negative", message: "Error al cargar los tanques del llenadero." });
            tanquesActivos.value = [];
        } finally {
            cargandoTanques.value = false;
        }
    }

    async function onGenerarCierre(payload) {
        try {
            const result = await store.generarCierre(payload);
            $q.notify({ type: "positive", message: result.msg, icon: "check_circle" });
            showGenerarDialog.value = false;
            tanquesActivos.value = [];
        } catch (error) {
            const msg = error.response?.data?.msg || "Error al generar el cierre.";
            // 409 = cierre pendiente existente → mostrar alert diferenciado
            if (error.response?.status === 409) {
                $q.notify({
                    type: "warning",
                    icon: "warning",
                    message: msg,
                    timeout: 6000,
                    actions: [{ label: "OK", color: "white" }],
                });
            } else {
                $q.notify({ type: "negative", message: msg });
            }
        }
    }

    async function openDetalle(row) {
        cierreSeleccionado.value = row; // Loading state fallback
        showDetalleDialog.value = true;
        try {
            await store.fetchCierre(row.id_cierre);
            // Sobreescribir con el detalle completo (incluye Mediciones)
            cierreSeleccionado.value = store.cierreActual;
        } catch {
            $q.notify({ type: "warning", message: "Error al cargar el detalle completo del cierre." });
        }
    }

    async function verReporte(row) {
        store.reporteActual = null;
        cierreSeleccionado.value = row;
        showReporteDialog.value = true;
        try {
            await store.fetchReporte(row.id_cierre);
        } catch {
            $q.notify({ type: "negative", message: "Error al generar el reporte." });
        }
    }

    async function verActa(row) {
        store.actaActual = null;
        cierreSeleccionado.value = row;
        showActaDialog.value = true;
        try {
            await store.fetchActa(row.id_cierre);
        } catch {
            $q.notify({ type: "negative", message: "Error al cargar los datos del acta." });
        }
    }

    /** Exporta el reporte actual a PDF (Agrupado por Combustible) */
    function exportarReportePDF() {
        if (!reporteActual.value) {
            $q.notify({ type: "warning", message: "No hay datos de reporte para exportar." });
            return;
        }

        const e = reporteActual.value.encabezado;
        const filas = reporteActual.value.filas || [];
        const tanquesGlobal = e.tanques || [];

        // 1. Agrupar filas por combustible_despacho
        const gruposObj = {};
        filas.forEach(row => {
            const comb = row.combustible_despacho || "Sin Especificar";
            if (!gruposObj[comb]) {
                gruposObj[comb] = { title: comb, data: [], totalDespachado: 0 };
            }
            gruposObj[comb].data.push(row);
            if (!row.es_ingreso) {
                gruposObj[comb].totalDespachado += parseFloat(row.cant_despachada || 0);
            }
        });

        // 2. Transformar en Array y generar columnas dinámicas por grupo
        const groupsArray = Object.values(gruposObj).map(grupo => {
            const tanquesGrupo = tanquesGlobal
                .filter(t => (t.combustible || "Sin Especificar") === grupo.title)
                .sort((a, b) => a.codigo.localeCompare(b.codigo));

            const baseColumns = [
                { label: "#", dataKey: "item" },
                { label: "Fecha/Hora", dataKey: "fecha" },
                { label: "Solicitante", dataKey: "nombre_apellido" },
                { label: "Placa", dataKey: "placa" },
                { label: "Sub-dep.", dataKey: "subdependencia" },
                { label: "Solicitado", field: (r) => Number(r.cant_solicitada || 0).toLocaleString() },
                { label: "Despachado", field: (r) => r.es_ingreso ? `+${Number(r.cant_despachada).toLocaleString()}` : Number(r.cant_despachada).toLocaleString() },
                { label: "Diferencia", field: (r) => r.es_ingreso ? "—" : (parseFloat(r.cant_solicitada || 0) - parseFloat(r.cant_despachada || 0)).toLocaleString() },
            ];

            const stockCols = tanquesGrupo.map(t => ({
                label: `Stock ${t.codigo}`,
                cellWidth: 18,
                halign: "right",
                field: (r) => r.stock_tanques?.[t.codigo] != null ? Number(r.stock_tanques[t.codigo]).toLocaleString() : "—"
            }));

            const totalStockCol = {
                label: `Total ${grupo.title}`,
                cellWidth: 22,
                halign: "right",
                field: (r) => {
                    let sum = 0;
                    tanquesGrupo.forEach(t => {
                        sum += parseFloat(r.stock_tanques?.[t.codigo] || 0);
                    });
                    return Number(sum.toFixed(2)).toLocaleString();
                }
            };

            const finalColumns = [
                ...baseColumns,
                ...stockCols,
                totalStockCol,
                { label: "Almacén", dataKey: "almacen", cellWidth: 20, halign: "left" },
                { label: "PCP",     dataKey: "pcp",     cellWidth: 22, halign: "left" },
            ];

            return {
                title: grupo.title,
                columns: finalColumns,
                data: grupo.data,
                total: grupo.totalDespachado
            };
        });

        // 3. Invocar servicio agrupado
        pdfService.exportReporteAgrupado({
            orientation: "l",
            title: "Reporte de Cierre de Turno",
            subtitle: `Conciliación de Inventario y Despachos — Cierre #${cierreSeleccionado.value?.id_cierre}`,
            groups: groupsArray,
            fileName: `Reporte_Cierre_${cierreSeleccionado.value?.id_cierre}_${e.fecha_lote}.pdf`,
            metadata: {
                "Llenadero": e.llenadero || "—",
                "Turno": e.turno || "—",
                "Fecha Lote": e.fecha_lote || "—",
                "Período": `${e.hora_inicio || "—"} → ${e.hora_cierre || "—"}`,
                "Almacenista": e.almacenista || "—",
            }
        });
    }

    // ─── SOCKET ────//──────────────────────────────────────────

    function _onCierreCreado(data) {
        $q.notify({
            type: "info",
            icon: "lock_clock",
            message: `Cierre #${data.id_cierre} generado — Turno ${data.turno}`,
            timeout: 4000,
        });
        _fetchWithFilters();
    }

    // ─── LIFECYCLE ───────────────────────────────────────────

    onMounted(async () => {
        _fetchWithFilters();

        // Socket listeners
        socket.on("cierre:creado", _onCierreCreado);

        // Cargar catálogos
        try {
            const [resL, resU] = await Promise.all([
                api.get("/llenaderos"),
                api.get("/usuarios"),
            ]);
            llenaderosList.value = resL.data.data ?? resL.data;
            pcpList.value = (resU.data.data ?? resU.data).filter((u) =>
                ["ADMIN", "PCP", "GERENTE", "JEFE DIVISION"].includes(u.tipo_usuario)
            );
        } catch { /* silencioso */ }
    });

    onUnmounted(() => {
        socket.off("cierre:creado", _onCierreCreado);
        store.filter = "";
        store.pagination.page = 1;
    });

    return {
        // state
        rows, loading, filter, pagination, reporteActual, actaActual,
        showGenerarDialog, showReporteDialog, showDetalleDialog, showActaDialog,
        filters,
        llenaderosList, pcpList,
        tanquesActivos, cargandoTanques,
        cierreSeleccionado, tanquesAgrupadosDetalle,
        columns,
        // methods
        onRequest, applyFilters, clearFilters,
        onLlenaderoChanged, onGenerarCierre,
        openDetalle, verReporte, verActa, exportarReportePDF,
    };
}

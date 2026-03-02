import { ref, computed, onMounted, onUnmounted } from "vue";
import { useQuasar, date } from "quasar";
import api from "../api/index";
import socket from "../services/socket.js";

export function useIndexPage() {
    const $q = useQuasar();

    // ------------------------------------------------------------------
    // USUARIO — detectar tipo de menú desde localStorage
    // ------------------------------------------------------------------
    const userData = ref(null);

    const isEstandar = computed(() => {
        const tipoMenu = userData.value?.Dependencia?.tipo_acceso_menu;
        const tipoUsuario = userData.value?.tipo_usuario;
        if (tipoUsuario === "ADMIN") return false;
        return !tipoMenu || tipoMenu === "ESTANDAR";
    });

    const isAlmacenOrSeguridad = computed(() => {
        const tipoMenu = userData.value?.Dependencia?.tipo_acceso_menu;
        const tipoUsuario = userData.value?.tipo_usuario;
        if (tipoUsuario === "ADMIN") return false;
        return tipoMenu === "ALMACEN" || tipoMenu === "SEGURIDAD";
    });

    // Módulos de acceso rápido para ALMACEN
    const modulosAlmacen = [
        {
            titulo: "Solicitudes",
            descripcion: "Gestiona las solicitudes de combustible pendientes",
            icon: "local_gas_station",
            color: "primary",
            acciones: [
                { label: "Ver Solicitudes", to: "/solicitudes", icon: "arrow_forward" },
            ],
        },
        {
            titulo: "Despacho",
            descripcion: "Procesa y despacha las solicitudes aprobadas",
            icon: "print",
            color: "deep-purple",
            acciones: [
                { label: "Ir a Despacho", to: "/despacho", icon: "arrow_forward" },
            ],
        },
        {
            titulo: "Inventario",
            descripcion: "Control de movimientos y evaporización de combustible",
            icon: "inventory",
            color: "teal",
            acciones: [
                { label: "Movimientos", to: "/movimientos-llenadero", icon: "compare_arrows" },
                { label: "Evaporización", to: "/evaporaciones", icon: "opacity" },
            ],
        },
        {
            titulo: "Operaciones de Tanques",
            descripcion: "Mediciones, recepciones y transferencias de cisterna",
            icon: "oil_barrel",
            color: "brown",
            acciones: [
                { label: "Medición", to: "/measurements", icon: "straighten" },
                { label: "Cisternas", to: "/loads", icon: "local_shipping" },
                { label: "Transferencias", to: "/internal-transfers", icon: "swap_horiz" },
            ],
        },
        {
            titulo: "Reportes",
            descripcion: "Accede a todos los informes del sistema",
            icon: "analytics",
            color: "indigo",
            acciones: [
                { label: "Mis Cupos", to: "/reportes/mis-cupos", icon: "assignment_ind" },
                { label: "Reporte Diario", to: "/reportes/diario", icon: "today" },
                { label: "Despachos", to: "/reportes/despachos", icon: "list_alt" },
                { label: "Consumo Dep.", to: "/reportes/consumo-dependencia", icon: "bar_chart" },
            ],
        },
    ];

    // Módulos de acceso rápido para SEGURIDAD (sin Inventario, sin Despacho, con Validación)
    const modulosSeguridad = [
        {
            titulo: "Solicitudes",
            descripcion: "Consulta y gestiona las solicitudes de combustible",
            icon: "local_gas_station",
            color: "primary",
            acciones: [
                { label: "Ver Solicitudes", to: "/solicitudes", icon: "arrow_forward" },
            ],
        },
        {
            titulo: "Operaciones de Tanques",
            descripcion: "Mediciones, recepciones y transferencias de cisterna",
            icon: "oil_barrel",
            color: "brown",
            acciones: [
                { label: "Medición", to: "/measurements", icon: "straighten" },
                { label: "Cisternas", to: "/loads", icon: "local_shipping" },
                { label: "Transferencias", to: "/internal-transfers", icon: "swap_horiz" },
            ],
        },
        {
            titulo: "Validación (Cierre)",
            descripcion: "Valida y cierra los periodos de operación",
            icon: "fact_check",
            color: "red-8",
            acciones: [
                { label: "Ir a Validación", to: "/validacion", icon: "arrow_forward" },
            ],
        },
        {
            titulo: "Reportes",
            descripcion: "Accede a todos los informes del sistema",
            icon: "analytics",
            color: "indigo",
            acciones: [
                { label: "Mis Cupos", to: "/reportes/mis-cupos", icon: "assignment_ind" },
                { label: "Reporte Diario", to: "/reportes/diario", icon: "today" },
                { label: "Despachos", to: "/reportes/despachos", icon: "list_alt" },
                { label: "Consumo Dep.", to: "/reportes/consumo-dependencia", icon: "bar_chart" },
            ],
        },
    ];

    // Selecciona el conjunto de módulos según el tipo de usuario
    const modulosDashboard = computed(() => {
        const tipoMenu = userData.value?.Dependencia?.tipo_acceso_menu;
        return tipoMenu === "SEGURIDAD" ? modulosSeguridad : modulosAlmacen;
    });

    const userName = computed(() => {
        if (!userData.value) return "Usuario";
        return `${userData.value.nombre} ${userData.value.apellido || ""}`.trim();
    });

    const userDependency = computed(
        () => userData.value?.Dependencia?.nombre_dependencia || "Sin Dependencia"
    );

    // ------------------------------------------------------------------
    // DASHBOARD OPERATIVO — Estado de llenaderos
    // ------------------------------------------------------------------
    const loading = ref(false);
    const stats = ref({ llenaderos: [] });

    const fetchStats = async () => {
        loading.value = true;
        try {
            const res = await api.get("/dashboard/stats");
            stats.value = res.data;
        } catch (error) {
            console.error("Error Dashboard Stats:", error);
            $q.notify({
                type: "negative",
                message: "Error al cargar estadísticas del dashboard",
                position: "top-right",
            });
        } finally {
            loading.value = false;
        }
    };

    const setupSocketListeners = () => {
        socket.on("llenadero:actualizado", fetchStats);
        socket.on("llenadero:creado", fetchStats);
        socket.on("carga:creada", fetchStats);
        socket.on("solicitud:despachada", fetchStats);
    };

    const cleanupSocketListeners = () => {
        socket.off("llenadero:actualizado");
        socket.off("llenadero:creado");
        socket.off("carga:creada");
        socket.off("solicitud:despachada");
    };

    // ------------------------------------------------------------------
    // DASHBOARD ESTÁNDAR — Cupos del mes
    // ------------------------------------------------------------------
    const loadingCupos = ref(false);
    const cupos = ref([]);
    const periodo = ref(date.formatDate(Date.now(), "YYYY-MM"));

    const periodoDisplay = computed(() => {
        if (!periodo.value) return "";
        const [year, month] = periodo.value.split("-");
        return date
            .formatDate(new Date(year, month - 1), "MMMM YYYY")
            .toUpperCase();
    });

    const totalAsignado = computed(() =>
        cupos.value.reduce((s, c) => s + parseFloat(c.asignado || 0), 0).toFixed(0)
    );

    const totalConsumido = computed(() =>
        cupos.value
            .reduce((s, c) => s + parseFloat(c.consumido || 0), 0)
            .toFixed(0)
    );

    const totalDisponible = computed(() =>
        cupos.value
            .reduce((s, c) => s + parseFloat(c.disponible || 0), 0)
            .toFixed(0)
    );

    const usoPorcentajeGeneral = computed(() => {
        const asig = parseFloat(totalAsignado.value);
        const cons = parseFloat(totalConsumido.value);
        if (!asig) return 0;
        return ((cons / asig) * 100).toFixed(1);
    });

    const colorUsoPorcentaje = computed(() => {
        const pct = parseFloat(usoPorcentajeGeneral.value);
        if (pct >= 90) return "negative";
        if (pct >= 75) return "orange";
        return "positive";
    });

    const fetchCupos = async () => {
        if (!periodo.value) return;
        loadingCupos.value = true;
        try {
            const response = await api.get("/reportes/mis-cupos", {
                params: { periodo: periodo.value },
            });
            cupos.value = response.data.data || [];
        } catch (error) {
            console.error("Error al obtener cupos:", error);
            $q.notify({
                type: "negative",
                message:
                    "Error al consultar sus cupos. Verifique su conexión o intente más tarde.",
                position: "top-right",
            });
        } finally {
            loadingCupos.value = false;
        }
    };

    // ------------------------------------------------------------------
    // HELPERS — colores de tabla
    // ------------------------------------------------------------------
    const getProgressColor = (pct) => {
        if (pct >= 90) return "negative";
        if (pct >= 75) return "orange";
        return "positive";
    };

    const getEstadoColor = (estado) => {
        const map = {
            ACTIVO: "positive",
            AGOTADO: "negative",
            CERRADO: "grey",
        };
        return map[estado] || "primary";
    };

    // ------------------------------------------------------------------
    // COLUMNAS — definición estática
    // ------------------------------------------------------------------
    const columns = [
        { name: "dependencia", label: "Dependencia", field: "dependencia", align: "left", sortable: true },
        { name: "subdependencia", label: "Subdependencia", field: "subdependencia", align: "left", sortable: true },
        { name: "categoria", label: "Categoría", field: "categoria", align: "left", sortable: true },
        { name: "tipo_combustible", label: "Combustible", field: "tipo_combustible", align: "center", sortable: true },
        { name: "asignado", label: "Asignado (L)", field: "asignado", align: "center", sortable: true },
        { name: "consumido", label: "Consumido (L)", field: "consumido", align: "center", sortable: true },
        { name: "recargado", label: "Recargado (L)", field: "recargado", align: "center" },
        { name: "disponibilidad", label: "Disponibilidad / Uso", field: "disponible", align: "center", sortable: true },
        { name: "estado", label: "Estado", field: "estado", align: "center", sortable: true },
    ];

    // ------------------------------------------------------------------
    // LIFECYCLE
    // ------------------------------------------------------------------
    onMounted(() => {
        const stored = localStorage.getItem("user");
        if (stored) userData.value = JSON.parse(stored);

        // Siempre carga estado de llenaderos (ALMACEN y operativos lo necesitan)
        if (!isEstandar.value) {
            fetchStats();
            setupSocketListeners();
        }

        // Solo ESTANDAR carga cupos propios
        if (isEstandar.value) {
            fetchCupos();
        }
    });

    onUnmounted(() => {
        cleanupSocketListeners();
    });

    // ------------------------------------------------------------------
    // API PÚBLICA
    // ------------------------------------------------------------------
    return {
        // Usuario
        isEstandar,
        isAlmacenOrSeguridad,
        userName,
        userDependency,
        // Dashboard operativo / almacen / seguridad
        loading,
        stats,
        fetchStats,
        modulosDashboard,
        // Dashboard estándar
        loadingCupos,
        cupos,
        periodo,
        periodoDisplay,
        totalAsignado,
        totalConsumido,
        totalDisponible,
        usoPorcentajeGeneral,
        colorUsoPorcentaje,
        fetchCupos,
        // Helpers
        columns,
        getProgressColor,
        getEstadoColor,
    };
}

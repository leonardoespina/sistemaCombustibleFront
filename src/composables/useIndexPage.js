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
        const role = userData.value?.rol_sistema;
        const legacyType = userData.value?.tipo_usuario;
        if (role === "ADMIN" || legacyType === "ADMIN") return false;
        // Usuarios Estándar e Inspectores ven el dashboard resumido (cupos)
        return role === "ESTANDAR" || role === "INSPECTOR";
    });

    const isAlmacenOrSeguridad = computed(() => {
        const role = userData.value?.rol_sistema || "ESTANDAR";
        if (role === "ADMIN") return true;
        // Roles con visión operativa del almacén
        return ["ALMACEN", "ALMACENISTA", "SEGURIDAD", "PRESIDENCIA"].includes(role);
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
        const role = userData.value?.rol_sistema || userData.value?.tipo_usuario || "ESTANDAR";
        return (role === "SEGURIDAD") ? modulosSeguridad : modulosAlmacen;
    });

    const userName = computed(() => {
        if (!userData.value) return "Usuario";
        return `${userData.value.nombre} ${userData.value.apellido || ""}`.trim();
    });

    const userDependency = computed(
        () => userData.value?.Dependencia?.nombre_dependencia || "Sin Dependencia"
    );

    const userRole = computed(() => userData.value?.rol_sistema || "");

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

    const llenaderosAgrupados = computed(() => {
        const groups = {};
        stats.value.llenaderos.forEach(tank => {
            const llName = tank.nombre_llenadero || 'S/N';
            const fuelType = tank.tipo_combustible || 'OTROS';
            
            if (!groups[llName]) groups[llName] = {};
            if (!groups[llName][fuelType]) groups[llName][fuelType] = [];
            
            groups[llName][fuelType].push(tank);
        });
        return groups;
    });

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

    const statsPorCombustible = computed(() => {
        const stats = {};
        cupos.value.forEach(c => {
            const tipo = c.tipo_combustible || 'Desconocido';
            if (!stats[tipo]) {
                stats[tipo] = {
                    tipo,
                    asignado: 0,
                    consumido: 0,
                    disponible: 0
                };
            }
            stats[tipo].asignado += parseFloat(c.asignado || 0);
            stats[tipo].consumido += parseFloat(c.consumido || 0);
            stats[tipo].disponible += parseFloat(c.disponible || 0);
        });

        return Object.values(stats).map(s => {
            const pct = s.asignado ? ((s.consumido / s.asignado) * 100) : 0;
            let color = "positive";
            if (pct >= 90) color = "negative";
            else if (pct >= 75) color = "orange";

            return {
                ...s,
                asignado: s.asignado.toFixed(0),
                consumido: s.consumido.toFixed(0),
                disponible: s.disponible.toFixed(0),
                usoPorcentaje: pct.toFixed(1),
                colorUso: color
            };
        });
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
        userRole,
        // Dashboard operativo / almacen / seguridad
        loading,
        stats,
        llenaderosAgrupados,
        fetchStats,
        modulosDashboard,
        // Dashboard estándar
        loadingCupos,
        cupos,
        periodo,
        periodoDisplay,
        statsPorCombustible,
        fetchCupos,
        // Helpers
        columns,
        getProgressColor,
        getEstadoColor,
    };
}

import { defineStore } from "pinia";
import { ref } from "vue";
import api from "../api/index.js";

/**
 * Store de Cierre de Turno — solo estado + API calls.
 * Socket y notificaciones van en composables.
 */
export const useCierreTurnoStore = defineStore("cierreTurno", () => {
    // ─── STATE ───────────────────────────────────────────────
    const rows = ref([]);
    const loading = ref(false);
    const pagination = ref({
        page: 1,
        rowsPerPage: 10,
        sortBy: "fecha_lote",
        descending: true,
        rowsNumber: 0,
    });
    const filter = ref("");
    const cierreActual = ref(null);
    const reporteActual = ref(null);
    const actaActual = ref(null);

    // ─── ACTIONS ─────────────────────────────────────────────

    async function fetchCierres(extraParams = {}) {
        loading.value = true;
        try {
            const params = {
                page: pagination.value.page,
                limit: pagination.value.rowsPerPage,
                sortBy: pagination.value.sortBy,
                descending: pagination.value.descending,
                search: filter.value,
                ...extraParams,
            };
            const res = await api.get("/cierres-turno", { params });
            rows.value = res.data.data;
            pagination.value.rowsNumber = res.data.pagination.totalItems;
        } finally {
            loading.value = false;
        }
    }

    async function fetchCierre(id) {
        loading.value = true;
        try {
            const res = await api.get(`/cierres-turno/${id}`);
            cierreActual.value = res.data;
        } finally {
            loading.value = false;
        }
    }

    /** Obtiene tanques activos del llenadero con su último nivel de cierre */
    async function fetchTanquesLlenadero(id_llenadero) {
        const res = await api.get(`/cierres-turno/tanques-llenadero/${id_llenadero}`);
        return res.data;
    }

    /** Genera el cierre en un único paso */
    async function generarCierre(data) {
        const res = await api.post("/cierres-turno/generar", data);
        return res.data;
    }

    async function fetchReporte(id_cierre) {
        const res = await api.get(`/cierres-turno/${id_cierre}/reporte`);
        reporteActual.value = res.data;
        return res.data;
    }

    async function fetchActa(id_cierre) {
        const res = await api.get(`/cierres-turno/${id_cierre}/acta`);
        actaActual.value = res.data;
        return res.data;
    }

    async function revertirCierre(id_cierre) {
        const res = await api.put(`/cierres-turno/${id_cierre}/revertir`);
        return res.data;
    }

    return {
        rows, loading, pagination, filter, cierreActual, reporteActual, actaActual,
        fetchCierres, fetchCierre, fetchTanquesLlenadero, generarCierre,
        fetchReporte, fetchActa, revertirCierre,
    };
});

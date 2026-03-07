import { ref, reactive, watch, computed } from "vue";
import { date } from "quasar";
import { calcularVolumenTanque } from "../../measurements/formula.js";

/**
 * Composable para el formulario de generación de cierre de turno.
 * Reutiliza la lógica de cálculo volumétrico de useMeasurementForm.
 */
export function useGenerarCierreForm(props, emit) {
    // ─── DATOS DEL LOTE ──────────────────────────────────────
    const lote = ref({
        id_llenadero: null,
        turno: "DIURNO",
        fecha_lote: date.formatDate(new Date(), "YYYY-MM-DD"),
        hora_inicio_lote: "07:00",
        hora_cierre_lote: date.formatDate(new Date(), "HH:mm"),
        id_usuario_pcp: null,
        observaciones: "",
    });

    // ─── ESTADO DEL STEPPER ──────────────────────────────────
    const step = ref(1);

    // ─── TANQUES ACTIVOS DEL LLENADERO ───────────────────────
    // Cada entrada: { ...tankDetail, medida_vara, volumen_calculado, diferencia, merma_evaporacion }
    const tanquesForm = ref([]);
    // IDs de los tanques seleccionados por el usuario para este cierre
    const tanquesSeleccionados = ref([]);

    // ─── RESET AL ABRIR ──────────────────────────────────────
    watch(
        () => props.modelValue,
        (open) => {
            if (open) {
                const now = new Date();
                lote.value = {
                    id_llenadero: null,
                    turno: "DIURNO",
                    fecha_lote: date.formatDate(now, "YYYY-MM-DD"),
                    hora_inicio_lote: "07:00",
                    hora_cierre_lote: date.formatDate(now, "HH:mm"),
                    id_usuario_pcp: null,
                    observaciones: "",
                };
                tanquesForm.value = [];
                tanquesSeleccionados.value = [];
                step.value = 1;
            }
        }
    );

    // ─── CUANDO LLEGAN LOS TANQUES (desde el page composable) ─
    watch(
        () => props.tanques,
        (lista) => {
            tanquesForm.value = (lista || []).map((t) => ({
                ...t,
                medida_vara: null,
                volumen_calculado: null,
                diferencia: null,
                merma_evaporacion: null, // Nuevo campo para evaporación
            }));
            // Por defecto no seleccionamos ninguno, el usuario debe elegirlos
            tanquesSeleccionados.value = [];
        },
        { immediate: true }
    );

    // ─── TANQUES AGRUPADOS POR COMBUSTIBLE ──────────────────
    const tanquesPorCombustible = computed(() => {
        const grupos = {};
        tanquesForm.value.forEach(t => {
            const comb = t.combustible || "Sin Especificar";
            if (!grupos[comb]) grupos[comb] = [];
            grupos[comb].push(t);
        });
        return grupos;
    });

    // ─── CALCULAR VOLUMEN POR TANQUE ─────────────────────────
    // Misma lógica que useMeasurementForm.calculate()
    function calcular(paramsT) {
        const t = typeof paramsT === 'object' ? paramsT : tanquesForm.value[paramsT];
        if (!t) return;

        const medida = parseFloat(t.medida_vara);
        if (isNaN(medida)) {
            t.volumen_calculado = null;
            t.diferencia = null;
            return;
        }

        // Determinar modo igual que useMeasurementForm
        const aforoData = t.aforo || t.tabla_aforo;
        const hasAforo = Array.isArray(aforoData)
            ? aforoData.length > 0
            : aforoData != null && Object.keys(aforoData).length > 0;

        const hasDimensiones =
            t.tipo_tanque === "RECTANGULAR" || t.tipo_tanque === "CUADRADO"
                ? parseFloat(t.largo) > 0 && parseFloat(t.ancho) > 0 && parseFloat(t.alto) > 0
                : parseFloat(t.largo) > 0 && parseFloat(t.radio) > 0;

        let volReal = null;

        if (!hasAforo && hasDimensiones) {
            // ── Modo fórmula matemática ─────────────────────────
            const unidad = (t.unidad_medida || "CM").toUpperCase();
            const scale =
                unidad === "PULGADAS" || unidad === "PULG" ? 0.0254
                    : unidad === "M" || unidad === "METROS" || unidad === "MTS" ? 1
                        : unidad === "MM" ? 0.001
                            : 0.01; // CM por defecto

            const h_m = medida * scale;

            if (t.tipo_tanque === "RECTANGULAR" || t.tipo_tanque === "CUADRADO") {
                const largo_m = parseFloat(t.largo) * scale;
                const ancho_m = parseFloat(t.ancho) * scale;
                const alto_m = parseFloat(t.alto) * scale;
                volReal = parseFloat(calcularVolumenTanque(h_m, largo_m, ancho_m, t.tipo_tanque, alto_m).toFixed(2));
            } else {
                const largo_m = parseFloat(t.largo) * scale;
                const radio_m = parseFloat(t.radio) * scale;
                volReal = parseFloat(calcularVolumenTanque(h_m, largo_m, radio_m, "CILINDRICO").toFixed(2));
            }

        } else if (hasAforo) {
            // ── Modo tabla de aforo ─────────────────────────────
            if (Array.isArray(aforoData)) {
                const entry = aforoData.find((e) => parseFloat(e.altura) === medida);
                volReal = entry ? parseFloat(entry.volumen) : null;
            } else {
                // Objeto clave→valor: {"65": 250.5, "66": 260.0}
                const val = aforoData[String(medida)];
                volReal = val !== undefined ? parseFloat(val) : null;
            }
        }
        // Modo manual: usuario escribe volumen_calculado directamente

        t.volumen_calculado = volReal;
        t.diferencia =
            volReal !== null
                ? parseFloat((parseFloat(t.nivel_actual) - volReal).toFixed(2))
                : null;
    }

    // Si el usuario escribe volumen directamente (modo manual)
    function onVolumenManual(paramsT) {
        const t = typeof paramsT === 'object' ? paramsT : tanquesForm.value[paramsT];
        if (!t) return;
        t.diferencia =
            t.volumen_calculado !== null
                ? parseFloat((t.nivel_actual - t.volumen_calculado).toFixed(2))
                : null;
    }

    // ─── modo del tanque ────────────────────────────────────
    function getModo(t) {
        const aforoData = t.aforo || t.tabla_aforo;
        const hasAforo = Array.isArray(aforoData)
            ? aforoData.length > 0
            : aforoData != null && Object.keys(aforoData).length > 0;
        if (hasAforo) return "AFORO";
        const hasDim =
            t.tipo_tanque === "RECTANGULAR" || t.tipo_tanque === "CUADRADO"
                ? parseFloat(t.largo) > 0 && parseFloat(t.ancho) > 0 && parseFloat(t.alto) > 0
                : parseFloat(t.largo) > 0 && parseFloat(t.radio) > 0;
        return hasDim ? "FORMULA" : "MANUAL";
    }

    // ─── GUARDAR ─────────────────────────────────────────────
    function onSave() {
        // Filtrar solo los tanques que el usuario seleccionó
        const tanquesAEnviar = tanquesForm.value.filter((t) =>
            tanquesSeleccionados.value.includes(t.id_tanque)
        );

        // Construir payload para el backend
        const mediciones = tanquesAEnviar.map((t) => ({
            id_tanque: t.id_tanque,
            id_tipo_combustible: t.id_tipo_combustible,
            medida_vara: t.medida_vara !== null ? parseFloat(t.medida_vara) : null,
            volumen_real: parseFloat(t.volumen_calculado),
            merma_evaporacion: t.merma_evaporacion ? parseFloat(t.merma_evaporacion) : 0,
        }));

        emit("save", {
            ...lote.value,
            mediciones,
        });
    }

    return {
        step,
        lote,
        tanquesForm,
        tanquesPorCombustible,
        tanquesSeleccionados,
        calcular,
        onVolumenManual,
        getModo,
        onSave,
    };
}

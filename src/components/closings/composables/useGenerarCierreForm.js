import { ref, watch, computed } from "vue";
import { date, useQuasar } from "quasar";
import { calcularVolumenTanque } from "../../measurements/formula.js";

/**
 * Composable para el formulario de generación de cierre de turno.
 * Reutiliza la lógica de cálculo volumétrico de useMeasurementForm.
 */
export function useGenerarCierreForm(props, emit) {
    const $q = useQuasar();

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

    // ─── CONFIRMACIÓN DE GUARDADO ────────────────────────────
    function confirmarGuardado() {
        // Validar que los tanques seleccionados tengan un volumen válido
        const tanquesAEnviar = tanquesForm.value.filter((t) =>
            tanquesSeleccionados.value.includes(t.id_tanque)
        );

        const tanquesInvalidos = tanquesAEnviar.filter(t => t.volumen_calculado == null || isNaN(t.volumen_calculado));
        
        if (tanquesInvalidos.length > 0) {
             $q.notify({
                 type: "negative",
                 message: `Error: La medida ingresada para el/los tanque(s) ${tanquesInvalidos.map(t => t.codigo).join(', ')} no se encuentra en la tabla de aforo o es inválida.`
             });
             return; // Abortar confirmación
        }

        // Obtener información del lote para mostrar en el diálogo
        const llenaderoNombre = props.llenaderosList?.find(l => l.id_llenadero === lote.value.id_llenadero)?.nombre_llenadero || 'N/A';
        const tanquesCount = tanquesSeleccionados.value.length;

        // Formatear fecha más legible
        const fechaFormateada = new Date(lote.value.fecha_lote).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Emoji dinámico para el turno
        const turnoEmoji = lote.value.turno === 'DIURNO' ? '☀️' : '🌙';

        // Generar resumen de tanques y mediciones
        const tanquesSeleccionadosData = tanquesForm.value.filter(t =>
            tanquesSeleccionados.value.includes(t.id_tanque)
        );

        const resumenTanques = tanquesSeleccionadosData.map(t => {
            const volumenReal = t.volumen_calculado ? Number(t.volumen_calculado).toLocaleString() : 'No medido';
            const diferencia = t.diferencia !== null ? Number(t.diferencia).toLocaleString() : '--';
            const evaporacion = t.merma_evaporacion ? Number(t.merma_evaporacion).toLocaleString() : '0';

            return `
                <div style="margin-bottom: 8px; padding: 8px; background: white; border-radius: 4px; border: 1px solid #e0e0e0;">
                    <div style="font-weight: bold; color: #1976d2; margin-bottom: 4px;">${t.codigo} - ${t.nombre}</div>
                    <div style="font-size: 13px; color: #666;">
                        <span style="margin-right: 12px;">📊 Real: <strong>${volumenReal} L</strong></span>
                        <span style="margin-right: 12px;">📈 Dif: <strong>${diferencia} L</strong></span>
                        <span>💨 Evap: <strong>${evaporacion} L</strong></span>
                    </div>
                </div>
            `;
        }).join('');

        $q.dialog({
            title: "🔒 Confirmar Cierre de Turno",
            message: `
                <div style="text-align: left; line-height: 1.6;">
                    <div style="margin-bottom: 16px; padding: 12px; background: #f5f5f5; border-radius: 8px; border-left: 4px solid #1976d2;">
                        <div style="font-weight: bold; color: #1976d2; margin-bottom: 8px;">📍 Detalles del Cierre</div>
                        <div style="margin-bottom: 4px;"><strong>🏢 Llenadero:</strong> ${llenaderoNombre}</div>
                        <div style="margin-bottom: 4px;"><strong>${turnoEmoji} Turno:</strong> ${lote.value.turno}</div>
                        <div style="margin-bottom: 4px;"><strong>📅 Fecha:</strong> ${fechaFormateada}</div>
                        <div style="margin-bottom: 4px;"><strong>⏰ Período:</strong> ${lote.value.hora_inicio_lote} → ${lote.value.hora_cierre_lote}</div>
                        <div><strong>🛢️ Tanques:</strong> ${tanquesCount} tanque${tanquesCount !== 1 ? 's' : ''} seleccionado${tanquesCount !== 1 ? 's' : ''}</div>
                    </div>

                    <div style="margin-bottom: 16px; padding: 12px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #28a745;">
                        <div style="font-weight: bold; color: #28a745; margin-bottom: 8px;">📋 Resumen de Mediciones</div>
                        ${resumenTanques}
                    </div>
                    
                    <div style="padding: 12px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107; margin-bottom: 16px;">
                        <div style="font-weight: bold; color: #856404; margin-bottom: 4px;">⚠️ Importante</div>
                        <div style="color: #856404; font-size: 14px;">
                            Esta acción procesará las mediciones físicas y generará el <strong>cierre definitivo</strong> del turno.
                            Una vez confirmado, no podrá ser modificado.
                        </div>
                    </div>
                    
                    <div style="text-align: center; color: #666; font-size: 14px;">
                        ¿Desea continuar con la generación del cierre?
                    </div>
                </div>
            `,
            cancel: {
                label: "❌ Cancelar",
                color: "grey-7",
                flat: true,
                'no-caps': true
            },
            ok: {
                label: "✅ Confirmar Cierre",
                color: "primary",
                unelevated: true,
                'no-caps': true,
                icon: "lock_clock"
            },
            persistent: true,
            html: true,
            style: "min-width: 500px;"
        }).onOk(() => {
            onSave();
        });
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
        confirmarGuardado,
    };
}

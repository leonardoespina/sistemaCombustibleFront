import { ref, reactive, watch } from "vue";
import { date } from "quasar";

/**
 * Composable para el formulario de apertura de lote (medición inicial).
 * Maneja el estado del formulario y las mediciones por tanque activo.
 */
export function useCierreAbrirForm(props, emit) {
    const formData = ref({});
    const medicionesIniciales = reactive({});
    const tanquesActivos = ref([]);

    // Resetear formulario cada vez que se abre el dialog
    watch(
        () => props.modelValue,
        (open) => {
            if (open) {
                const now = new Date();
                formData.value = {
                    id_llenadero: null,
                    turno: "DIURNO",
                    fecha_lote: date.formatDate(now, "YYYY-MM-DD"),
                    hora_inicio_lote: date.formatDate(now, "HH:mm"),
                    observaciones: "",
                };
                tanquesActivos.value = [];
                Object.keys(medicionesIniciales).forEach((k) => delete medicionesIniciales[k]);
            }
        }
    );

    // Cuando cambian los tanques del llenadero (pasados como prop)
    watch(
        () => props.tanquesPorLlenadero,
        (lista) => {
            tanquesActivos.value = lista.filter((t) => t.activo_para_despacho);
            Object.keys(medicionesIniciales).forEach((k) => delete medicionesIniciales[k]);
            for (const t of tanquesActivos.value) {
                medicionesIniciales[t.id_tanque] = {
                    id_tanque: t.id_tanque,
                    id_tipo_combustible: t.id_tipo_combustible,
                    medida_vara: null,
                    volumen_real: t.nivel_actual ?? null,
                };
            }
        },
        { immediate: true }
    );

    function onLlenaderoChange(id_llenadero) {
        emit("llenadero-changed", id_llenadero);
    }

    function onSave() {
        emit("save", {
            ...formData.value,
            mediciones_iniciales: Object.values(medicionesIniciales),
        });
    }

    return {
        formData,
        medicionesIniciales,
        tanquesActivos,
        onLlenaderoChange,
        onSave,
    };
}

import { ref, watch } from "vue";
import { date } from "quasar";

/**
 * Composable para el formulario de cierre de turno (medición final).
 * Inicializa las mediciones por tanque activo desde el cierre registrado.
 */
export function useCierreCerrarForm(props, emit) {
    const formData = ref({
        hora_cierre_lote: "",
        id_usuario_pcp: null,
        observaciones: "",
        mediciones_cierre: [],
    });
    const filteredPcp = ref([]);

    watch(
        () => props.modelValue,
        (open) => {
            if (open && props.cierre) {
                const now = new Date();
                formData.value = {
                    hora_cierre_lote: date.formatDate(now, "HH:mm"),
                    id_usuario_pcp: null,
                    observaciones: "",
                    mediciones_cierre: (props.cierre.Mediciones || []).map((m) => ({
                        id_tanque: m.Tanque?.id_tanque,
                        id_tipo_combustible: m.id_tipo_combustible,
                        codigo: m.Tanque?.codigo,
                        nombre: m.Tanque?.nombre,
                        unidad_medida: m.Tanque?.unidad_medida,
                        nivel_actual_sistema: m.Tanque?.nivel_actual,
                        medida_vara: null,
                        volumen_real: null,
                    })),
                };
                filteredPcp.value = props.pcpList;
            }
        }
    );

    function filterPcp(val, update) {
        update(() => {
            const needle = val.toLowerCase();
            filteredPcp.value = needle
                ? props.pcpList.filter(
                    (u) =>
                        u.nombre.toLowerCase().includes(needle) ||
                        u.apellido.toLowerCase().includes(needle)
                )
                : props.pcpList;
        });
    }

    function onSave() {
        emit("save", { ...formData.value });
    }

    return {
        formData,
        filteredPcp,
        filterPcp,
        onSave,
    };
}

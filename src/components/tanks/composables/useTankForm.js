import { ref, watch, nextTick } from "vue";
import api from "../../../api";

/**
 * Composable para la lógica del Formulario de Tanque
 * 
 * @param {Object} props - Props del componente Vue (initialData, isEditing)
 * @param {Function} emit - Función emit del componente
 * @returns {Object} Estado y métodos para TankFormDialog.vue
 */
export function useTankForm(props, emit) {
    const formData = ref({});
    const llenaderoOptions = ref([]);
    const combustibleOptions = ref([]);

    // --- GESTIÓN DE AFORO ---
    const jsonEditorVisible = ref(false);
    const rawJson = ref("");
    const jsonError = ref("");

    // Catálogos completos
    let allLlenaderos = [];
    let allCombustibles = [];

    /**
     * Inicializa el formulario con datos limpios o existentes
     */
    async function initializeForm() {
        // 1. Reset base
        formData.value = {
            codigo: "",
            nombre: "",
            id_llenadero: null,
            id_tipo_combustible: null,
            tipo_tanque: "RECTANGULAR",
            capacidad_maxima: 0,
            nivel_actual: 0,
            nivel_alarma_bajo: null,
            nivel_alarma_alto: null,
            unidad_medida: "CM",
            alto: null,
            radio: null,
            largo: null,
            ancho: null,
            estado: "ACTIVO",
            activo_para_despacho: true,
            con_aforo: false,
            aforo: []
        };

        const data = props.initialData ? { ...props.initialData } : {};

        // 2. Si estamos editando, inyectamos opciones actuales para evitar campos vacíos
        // mientras carga el catálogo completo
        if (props.isEditing) {
            if (data.Llenadero) {
                llenaderoOptions.value = [{
                    id_llenadero: data.id_llenadero,
                    nombre_llenadero: data.Llenadero.nombre_llenadero
                }];
            }
            if (data.TipoCombustible) {
                combustibleOptions.value = [{
                    id_tipo_combustible: data.id_tipo_combustible,
                    nombre: data.TipoCombustible.nombre
                }];
            }
        }

        // 3. Carga asíncrona de catálogos
        await loadCatalogs();

        // 4. Mapeo final de valores al formulario
        if (Object.keys(data).length > 0) {
            formData.value = {
                ...formData.value,
                ...data,
                // Forzamos tipos numéricos donde sea necesario
                id_llenadero: data.id_llenadero ? Number(data.id_llenadero) : null,
                id_tipo_combustible: data.id_tipo_combustible ? Number(data.id_tipo_combustible) : null,
                capacidad_maxima: Number(data.capacidad_maxima || 0),
                nivel_actual: Number(data.nivel_actual || 0),
                nivel_alarma_bajo: data.nivel_alarma_bajo ? Number(data.nivel_alarma_bajo) : null,
                nivel_alarma_alto: data.nivel_alarma_alto ? Number(data.nivel_alarma_alto) : null,
                alto: data.alto ? Number(data.alto) : null,
                radio: data.radio ? Number(data.radio) : null,
                largo: data.largo ? Number(data.largo) : null,
                ancho: data.ancho ? Number(data.ancho) : null,
                aforo: Array.isArray(data.aforo) ? [...data.aforo] : []
            };
        }
    }

    /**
     * Carga los catálogos necesarios desde el API
     */
    async function loadCatalogs() {
        try {
            const [resLlen, resComb] = await Promise.all([
                api.get("/llenaderos/lista"),
                api.get("/tipos-combustible/lista")
            ]);

            allLlenaderos = Array.isArray(resLlen.data) ? resLlen.data : (resLlen.data?.data || []);
            allCombustibles = Array.isArray(resComb.data) ? resComb.data : (resComb.data?.data || []);

            // Mezclar con selección actual
            if (props.isEditing) {
                llenaderoOptions.value = mergeOptions(llenaderoOptions.value, allLlenaderos, 'id_llenadero');
                combustibleOptions.value = mergeOptions(combustibleOptions.value, allCombustibles, 'id_tipo_combustible');
            } else {
                llenaderoOptions.value = allLlenaderos;
                combustibleOptions.value = allCombustibles;
            }
        } catch (e) {
            console.error("Error cargando catálogos de tanques:", e);
        }
    }

    /**
     * Mezcla la opción seleccionada con la lista completa sin duplicados
     */
    function mergeOptions(selectedList, fullList, key) {
        const selected = selectedList[0];
        if (!selected) return fullList;
        const filteredFull = fullList.filter(item => item[key] !== selected[key]);
        return [selected, ...filteredFull];
    }

    // --- FILTROS DE SELECT ---

    function filterLlenaderos(val, update) {
        update(() => {
            const needle = val.toLowerCase();
            llenaderoOptions.value = needle === ""
                ? allLlenaderos
                : allLlenaderos.filter(v => v.nombre_llenadero.toLowerCase().includes(needle));
        });
    }

    function filterCombustibles(val, update) {
        update(() => {
            const needle = val.toLowerCase();
            combustibleOptions.value = needle === ""
                ? allCombustibles
                : allCombustibles.filter(v => v.nombre.toLowerCase().includes(needle));
        });
    }

    // --- MÉTODOS DE AFORO ---

    function addAforoRow() {
        if (!formData.value.aforo) formData.value.aforo = [];
        formData.value.aforo.push({ altura: 0, volumen: 0 });
    }

    function removeAforoRow(index) {
        formData.value.aforo.splice(index, 1);
    }

    function openJsonEditor() {
        rawJson.value = JSON.stringify(formData.value.aforo, null, 2);
        jsonError.value = "";
        jsonEditorVisible.value = true;
    }

    function applyJson() {
        try {
            const parsed = JSON.parse(rawJson.value);
            if (!Array.isArray(parsed)) throw new Error("Debe ser un arreglo [ { ... } ]");

            const isValid = parsed.every(i => i.hasOwnProperty('altura') && i.hasOwnProperty('volumen'));
            if (!isValid) throw new Error("Cada objeto debe tener 'altura' y 'volumen'");

            formData.value.aforo = parsed;
            jsonEditorVisible.value = false;
        } catch (e) {
            jsonError.value = e.message;
        }
    }

    // --- GUARDADO ---

    async function onSave() {
        await nextTick();
        const payload = { ...formData.value };

        // Limpieza de campos nulos para el backend
        if (!payload.radio) payload.radio = null;
        if (!payload.ancho) payload.ancho = null;

        emit("save", payload);
    }

    // --- PÚBLICO ---
    return {
        formData,
        llenaderoOptions,
        combustibleOptions,
        jsonEditorVisible,
        rawJson,
        jsonError,

        initializeForm,
        filterLlenaderos,
        filterCombustibles,
        addAforoRow,
        removeAforoRow,
        openJsonEditor,
        applyJson,
        onSave
    };
}

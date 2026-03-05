import { ref } from "vue";
import { useQuasar } from "quasar";

/**
 * Composable para la lógica de la página de gestión de tanques
 * 
 * @param {Object} tankStore - Store de tanques (Pinia)
 * @returns {Object} Estado y métodos para TankPage.vue
 */
export function useTankPage(tankStore) {
    const $q = useQuasar();

    // --- ESTADO DE DIÁLOGOS ---
    const isFormDialogVisible = ref(false);
    const editingTank = ref(null);

    // --- HANDLERS DE ACCIONES ---

    /**
     * Abre el diálogo para crear un nuevo tanque
     */
    function openAddDialog() {
        editingTank.value = null;
        isFormDialogVisible.value = true;
    }

    /**
     * Abre el diálogo para editar un tanque existente
     * @param {Object} tank - Datos del tanque a editar
     */
    function openEditDialog(tank) {
        // Clonamos para evitar mutar el objeto original antes de guardar
        editingTank.value = JSON.parse(JSON.stringify(tank));
        isFormDialogVisible.value = true;
    }

    /**
   * Muestra diálogo de confirmación para desactivar un tanque
   * @param {Object} tank - Tanque a desactivar
   */
    function openDeleteDialog(tank) {
        $q.dialog({
            title: "Confirmar desactivación",
            message: `¿Estás seguro de desactivar el tanque "${tank.nombre}"?`,
            cancel: true,
            persistent: true,
            ok: {
                label: "Desactivar",
                color: "negative",
                flat: false
            }
        }).onOk(async () => {
            await tankStore.deleteTank(tank.id_tanque);
        });
    }

    /**
     * Procesa la petición de la tabla (paginación, filtros, sort)
     */
    async function handleRequest(props) {
        tankStore.pagination = props.pagination;
        tankStore.filter = props.filter;
        await tankStore.fetchTanks();
    }

    /**
     * Guarda los datos del formulario (Creación o Edición)
     */
    async function onFormSave(formData) {
        let success = false;
        if (editingTank.value) {
            success = await tankStore.updateTank(editingTank.value.id_tanque, formData);
        } else {
            success = await tankStore.createTank(formData);
        }

        if (success) {
            isFormDialogVisible.value = false;
        }
    }

    // --- HELPERS VISUALES ---

    /**
     * Determina el color de la barra de progreso según ocupación
     */
    function getProgressColor(row) {
        const percent = row.nivel_actual / row.capacidad_maxima;
        if (percent < 0.15) return "negative"; // Crítico bajo
        if (percent < 0.3) return "warning";  // Bajo
        return "positive";                   // Normal/Alto
    }

    /**
     * Retorna el color asociado al estado del tanque
     */
    function getStatusColor(status) {
        const colors = {
            'ACTIVO': 'positive',
            'INACTIVO': 'grey',
            'MANTENIMIENTO': 'orange',
            'CONTAMINADO': 'negative'
        };
        return colors[status] || 'blue';
    }

    // --- PÚBLICO ---
    return {
        // Estado
        isFormDialogVisible,
        editingTank,

        // Métodos
        handleRequest,
        openAddDialog,
        openEditDialog,
        openDeleteDialog,
        onFormSave,

        // Helpers
        getProgressColor,
        getStatusColor
    };
}

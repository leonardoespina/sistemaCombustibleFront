import { ref, onMounted, onUnmounted } from "vue";
import { useQuasar } from "quasar";
import { storeToRefs } from "pinia";
import { useMeasurementStore } from "../../../stores/measurementStore.js";
import { hasPermission } from "../../../utils/permissions";

export function useMeasurementTable() {
  const $q = useQuasar();
  const measStore = useMeasurementStore();
  const { rows, loading, filter, pagination, llenaderosList, tanksList, selectedTankDetail } = storeToRefs(measStore);

  const isFormDialogVisible = ref(false);
  const isDetailDialogVisible = ref(false);
  const isEditing = ref(false);
  const isReadOnly = ref(false);
  const selectedItem = ref(null);

  // Filtros adicionales
  const filters = ref({
    fecha_inicio: "",
    fecha_fin: "",
    id_tanque: null,
    id_llenadero: null
  });

  async function handleRequest(props) {
    pagination.value = props.pagination;
    filter.value = props.filter;
    await measStore.fetchMeasurements({
      ...filters.value
    });
  }

  function openAddDialog() {
    isEditing.value = false;
    isReadOnly.value = false;
    selectedItem.value = null;
    measStore.selectedTankDetail = null;
    measStore.fetchLlenaderos();
    isFormDialogVisible.value = true;
  }

  function openViewDialog(item) {
    selectedItem.value = item;
    isDetailDialogVisible.value = true;
  }

  function openEditDialog(item) {
    isEditing.value = true;
    isReadOnly.value = false;
    selectedItem.value = item;
    measStore.fetchTankDetail(item.id_tanque);
    isFormDialogVisible.value = true;
  }

  function handleLlenaderoChange(llenaderoId) {
    measStore.loadTanksList(llenaderoId);
  }

  function handleTankChange(tankId) {
    measStore.fetchTankDetail(tankId);
  }

  async function onFormSave(formData) {
    let success = false;
    if (isEditing.value) {
      success = await measStore.updateMeasurement(formData.id_medicion, formData);
    } else {
      success = await measStore.createMeasurement(formData);
    }

    if (success) {
      isFormDialogVisible.value = false;
      measStore.loadTanksList();
    }
  }

  function applyFilters() {
    measStore.fetchMeasurements({
      ...filters.value
    });
  }

  function clearFilters() {
    filters.value = {
      fecha_inicio: "",
      fecha_fin: "",
      id_tanque: null,
      id_llenadero: null
    };
    applyFilters();
  }

  function confirmarRevertir(item) {
    $q.dialog({
      title: "\u26a0\ufe0f \u00bfRevertir Medici\u00f3n?",
      message: `Esta acci\u00f3n restaurar\u00e1 el nivel del tanque <b>${item.Tanque?.nombre || ''}</b> al valor 
        previo a esta medici\u00f3n y eliminar\u00e1 su registro del ledger de inventario.<br><br>
        <b>Solo es posible si no existen operaciones posteriores en el tanque.</b>`,
      html: true,
      ok: { label: "Revertir", color: "negative", unelevated: true, icon: "undo" },
      cancel: { label: "Cancelar", flat: true, color: "grey-7" },
      persistent: true,
    }).onOk(async () => {
      await measStore.revertirMedicion(item.id_medicion);
    });
  }

  return {
    // State
    rows,
    loading,
    filter,
    pagination,
    llenaderosList,
    tanksList,
    selectedTankDetail,
    isFormDialogVisible,
    isDetailDialogVisible,
    isEditing,
    isReadOnly,
    selectedItem,
    filters,

    // Methods
    handleRequest,
    openAddDialog,
    openViewDialog,
    openEditDialog,
    handleLlenaderoChange,
    handleTankChange,
    onFormSave,
    applyFilters,
    clearFilters,
    confirmarRevertir,
    measStore,
    can: (p) => hasPermission(JSON.parse(localStorage.getItem("user") || "{}"), p)
  };
}

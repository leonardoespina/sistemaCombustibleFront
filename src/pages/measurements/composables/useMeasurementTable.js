import { ref, onMounted, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { useMeasurementStore } from "../../../stores/measurementStore.js";

export function useMeasurementTable() {
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
    measStore
  };
}

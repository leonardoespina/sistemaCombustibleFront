import { ref, onMounted, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { useVehicleStore } from "../../../stores/vehicleStore.js";

export function useVehicleListPage() {
  const vehicleStore = useVehicleStore();
  const {
    rows,
    loading,
    filter,
    pagination,
    allBrands,
    modelsForSelectedBrand,
    loadingModels,
  } = storeToRefs(vehicleStore);

  const isFormDialogVisible = ref(false);
  const isDeleteDialogVisible = ref(false);
  const editingVehicle = ref(null);

  function handleRequest(props) {
    pagination.value = props.pagination;
    filter.value = props.filter;
    vehicleStore.fetchVehicles();
  }

  function openAddDialog() {
    editingVehicle.value = null;
    isFormDialogVisible.value = true;
  }

  function openEditDialog(vehicle) {
    editingVehicle.value = JSON.parse(JSON.stringify(vehicle));
    isFormDialogVisible.value = true;
  }

  function openDeleteDialog(vehicle) {
    editingVehicle.value = vehicle;
    isDeleteDialogVisible.value = true;
  }

  async function onFormSave(formData) {
    let success = false;
    if (editingVehicle.value) {
      success = await vehicleStore.updateVehicle(
        editingVehicle.value.id_vehiculo,
        formData,
      );
    } else {
      success = await vehicleStore.createVehicle(formData);
    }
    if (success) {
      isFormDialogVisible.value = false;
    }
  }

  async function confirmDelete() {
    await vehicleStore.deleteVehicle(editingVehicle.value.id_vehiculo);
    isDeleteDialogVisible.value = false;
  }

  function handleBrandChange(brandId) {
    vehicleStore.fetchModelsByBrand(brandId);
  }

  onMounted(() => {
    vehicleStore.initSocket();
    vehicleStore.fetchVehicles();
    vehicleStore.fetchAllBrands();
  });

  onUnmounted(() => {
    vehicleStore.cleanupSocket();
    vehicleStore.filter = "";
    vehicleStore.pagination = {
      page: 1,
      rowsPerPage: 10,
      sortBy: "id_vehiculo",
      descending: false,
      rowsNumber: 0,
    };
  });

  return {
    rows,
    loading,
    filter,
    pagination,
    allBrands,
    modelsForSelectedBrand,
    loadingModels,
    isFormDialogVisible,
    isDeleteDialogVisible,
    editingVehicle,
    handleRequest,
    openAddDialog,
    openEditDialog,
    openDeleteDialog,
    onFormSave,
    confirmDelete,
    handleBrandChange,
  };
}

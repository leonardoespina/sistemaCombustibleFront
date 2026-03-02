import { ref, onMounted, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { useBrandStore } from "../../../stores/brandStore";

export function useBrandPage() {
  const brandStore = useBrandStore();
  const { rows, loading, filter, pagination } = storeToRefs(brandStore);

  const isFormDialogVisible = ref(false);
  const isDeleteDialogVisible = ref(false);
  const editingBrand = ref(null);

  function handleRequest(props) {
    pagination.value = props.pagination;
    filter.value = props.filter;
    brandStore.fetchBrands();
  }

  function openAddDialog() {
    editingBrand.value = null;
    isFormDialogVisible.value = true;
  }

  function openEditDialog(brand) {
    editingBrand.value = { ...brand };
    isFormDialogVisible.value = true;
  }

  function openDeleteDialog(brand) {
    editingBrand.value = brand;
    isDeleteDialogVisible.value = true;
  }

  async function onFormSave(formData) {
    let success = false;
    if (editingBrand.value) {
      success = await brandStore.updateBrand(
        editingBrand.value.id_marca,
        formData,
      );
    } else {
      success = await brandStore.createBrand(formData);
    }
    if (success) {
      isFormDialogVisible.value = false;
    }
  }

  async function confirmDelete() {
    await brandStore.deleteBrand(editingBrand.value.id_marca);
    isDeleteDialogVisible.value = false;
  }

  // --- CICLO DE VIDA ---
  onMounted(() => {
    brandStore.initSocket();
    brandStore.fetchBrands();
  });

  onUnmounted(() => {
    brandStore.cleanupSocket();
    brandStore.filter = "";
    brandStore.pagination = {
      page: 1,
      rowsPerPage: 10,
      sortBy: "id_marca",
      descending: false,
      rowsNumber: 0,
    };
  });

  return {
    rows,
    loading,
    filter,
    pagination,
    isFormDialogVisible,
    isDeleteDialogVisible,
    editingBrand,
    handleRequest,
    openAddDialog,
    openEditDialog,
    openDeleteDialog,
    onFormSave,
    confirmDelete,
  };
}

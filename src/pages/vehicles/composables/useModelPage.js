import { ref, onMounted, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { useModelStore } from "../../../stores/modelStore";

export function useModelPage() {
  const modelStore = useModelStore();
  const { rows, loading, filter, pagination, allBrands } =
    storeToRefs(modelStore);

  const isFormDialogVisible = ref(false);
  const isDeleteDialogVisible = ref(false);
  const editingModel = ref(null);

  function handleRequest(props) {
    pagination.value = props.pagination;
    filter.value = props.filter;
    modelStore.fetchModels();
  }

  function openAddDialog() {
    editingModel.value = null;
    isFormDialogVisible.value = true;
  }

  function openEditDialog(model) {
    editingModel.value = { ...model };
    isFormDialogVisible.value = true;
  }

  function openDeleteDialog(model) {
    editingModel.value = model;
    isDeleteDialogVisible.value = true;
  }

  async function onFormSave(formData) {
    let success = false;
    if (editingModel.value) {
      success = await modelStore.updateModel(
        editingModel.value.id_modelo,
        formData,
      );
    } else {
      success = await modelStore.createModel(formData);
    }
    if (success) {
      isFormDialogVisible.value = false;
    }
  }

  async function confirmDelete() {
    await modelStore.deleteModel(editingModel.value.id_modelo);
    isDeleteDialogVisible.value = false;
  }

  onMounted(() => {
    modelStore.initSocket();
    modelStore.fetchModels();
    modelStore.fetchAllBrands();
  });

  onUnmounted(() => {
    modelStore.cleanupSocket();
    modelStore.filter = "";
    modelStore.pagination = {
      page: 1,
      rowsPerPage: 10,
      sortBy: "id_modelo",
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
    isFormDialogVisible,
    isDeleteDialogVisible,
    editingModel,
    handleRequest,
    openAddDialog,
    openEditDialog,
    openDeleteDialog,
    onFormSave,
    confirmDelete,
  };
}

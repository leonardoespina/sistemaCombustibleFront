import { ref, onMounted, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { useCisternLoadStore } from "../../../stores/cisternLoadStore.js";
import socket from "../../../services/socket";

export function useCisternLoadTable() {
  const loadStore = useCisternLoadStore();
  const { rows, loading, filter, pagination, llenaderosList, tanksList, selectedTankAforo, selectedTankDetail } = storeToRefs(loadStore);

  const isFormDialogVisible = ref(false);
  const isDetailDialogVisible = ref(false);
  const isEditing = ref(false);
  const isReadOnly = ref(false);
  const selectedItem = ref(null);

  const filters = ref({
    fecha_inicio: "",
    fecha_fin: "",
    id_tanque: null
  });

  async function handleRequest(props) {
    pagination.value = props.pagination;
    filter.value = props.filter;
    await loadStore.fetchLoads({ ...filters.value });
  }

  function openAddDialog() {
    isEditing.value = false;
    isReadOnly.value = false;
    selectedItem.value = null;
    loadStore.fetchLlenaderos();
    isFormDialogVisible.value = true;
  }

  function openViewDialog(item) {
    isEditing.value = false;
    isReadOnly.value = true;
    selectedItem.value = item;
    loadStore.fetchTankDetail(item.id_tanque);
    isDetailDialogVisible.value = true;
  }

  function openEditDialog(item) {
    isEditing.value = true;
    isReadOnly.value = false;
    selectedItem.value = item;
    loadStore.fetchLlenaderos();
    loadStore.loadTanksList(item.Tanque?.id_llenadero);
    loadStore.fetchTankDetail(item.id_tanque);
    isFormDialogVisible.value = true;
  }

  function handleLlenaderoChange(id) {
    loadStore.loadTanksList(id);
  }

  function handleTankChange(tankId) {
    loadStore.fetchTankDetail(tankId);
  }

  async function onFormSave(formData) {
    let success = false;
    if (isEditing.value) {
      success = await loadStore.updateLoad(formData.id_carga, formData);
    } else {
      success = await loadStore.createLoad(formData);
    }
    if (success) isFormDialogVisible.value = false;
  }

  function applyFilters() {
    loadStore.fetchLoads({ ...filters.value });
  }

  function clearFilters() {
    filters.value = { fecha_inicio: "", fecha_fin: "", id_tanque: null };
    applyFilters();
  }

  // --- SOCKET LISTENERS ---
  function initSocketListeners() {
    socket.on("carga:creada", () => loadStore.fetchLoads());
    socket.on("carga:actualizada", () => loadStore.fetchLoads());
    socket.on("tanque:actualizado", (data) => {
       if (selectedTankDetail.value && selectedTankDetail.value.id_tanque === data.id_tanque) {
         loadStore.fetchTankDetail(data.id_tanque);
       }
    });
  }

  function removeSocketListeners() {
    socket.off("carga:creada");
    socket.off("carga:actualizada");
    socket.off("tanque:actualizado");
  }

  return {
    rows, loading, filter, pagination, llenaderosList, tanksList,
    selectedTankAforo, selectedTankDetail, isFormDialogVisible, isDetailDialogVisible, isEditing, isReadOnly, selectedItem, filters,
    handleRequest, openAddDialog, openViewDialog, openEditDialog, handleLlenaderoChange, handleTankChange, onFormSave,
    applyFilters, clearFilters, initSocketListeners, removeSocketListeners
  };
}

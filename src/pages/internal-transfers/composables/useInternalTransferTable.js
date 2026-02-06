import { ref, onMounted, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { useInternalTransferStore } from "../../../stores/internalTransferStore.js";
import socket from "../../../services/socket";

export function useInternalTransferTable() {
  const transferStore = useInternalTransferStore();
  const { rows, loading, filter, pagination, llenaderosList, tanksList, sourceTankDetail, destinationTankDetail, destinationTankAforo } = storeToRefs(transferStore);

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
    await transferStore.fetchTransfers({ ...filters.value });
  }

  async function openAddDialog() {
    isEditing.value = false;
    isReadOnly.value = false;
    selectedItem.value = null;
    await transferStore.fetchLlenaderos();
    isFormDialogVisible.value = true;
  }

  async function openViewDialog(item) {
    selectedItem.value = item;
    isDetailDialogVisible.value = true;
  }

  function openEditDialog(item) {
    isEditing.value = true;
    isReadOnly.value = false;
    selectedItem.value = item;
    transferStore.fetchTankDetail(item.id_tanque_origen, 'source');
    transferStore.fetchTankDetail(item.id_tanque_destino, 'destination');
    isFormDialogVisible.value = true;
  }

  function handleLlenaderoChange(id) {
    transferStore.loadTanksList(id);
  }

  async function onFormSave(payload) {
    let success = false;
    if (isEditing.value) {
      success = await transferStore.updateTransfer(payload.id_transferencia, payload);
    } else {
      success = await transferStore.createTransfer(payload);
    }
    if (success) isFormDialogVisible.value = false;
  }

  function applyFilters() {
    transferStore.fetchTransfers({ ...filters.value });
  }

  function clearFilters() {
    filters.value = { fecha_inicio: "", fecha_fin: "", id_tanque: null };
    applyFilters();
  }

  // --- SOCKET LISTENERS ---
  function initSocketListeners() {
    socket.on("transferencia:creada", () => transferStore.fetchTransfers());
    socket.on("transferencia:actualizada", () => transferStore.fetchTransfers());
    socket.on("tanque:actualizado", (data) => {
        // Refrescar detalles si el tanque afectado es uno de los seleccionados
        if (sourceTankDetail.value?.id_tanque === data.id_tanque) transferStore.fetchTankDetail(data.id_tanque, 'source');
        if (destinationTankDetail.value?.id_tanque === data.id_tanque) transferStore.fetchTankDetail(data.id_tanque, 'destination');
        transferStore.loadTanksList();
    });
  }

  function removeSocketListeners() {
    socket.off("transferencia:creada");
    socket.off("transferencia:actualizada");
    socket.off("tanque:actualizado");
  }

  return {
    rows, loading, filter, pagination, llenaderosList, tanksList,
    sourceTankDetail, destinationTankDetail, destinationTankAforo,
    isFormDialogVisible, isDetailDialogVisible, isEditing, isReadOnly, selectedItem, filters,
    handleRequest, openAddDialog, openViewDialog, openEditDialog, handleLlenaderoChange,
    onFormSave, applyFilters, clearFilters, initSocketListeners, removeSocketListeners, transferStore
  };
}

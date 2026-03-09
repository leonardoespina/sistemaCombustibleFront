import { ref, onMounted, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { useInternalTransferStore } from "../../../stores/internalTransferStore.js";
import { hasPermission } from "../../../utils/permissions";
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

    // Forzamos limpiar el caché de tanques antes de abrir
    transferStore.fetchTankDetail(null, 'source');
    transferStore.fetchTankDetail(null, 'destination');

    await transferStore.fetchLlenaderos();
    await transferStore.loadTanksList(); // Cargar todos para permitir transferencias cruzadas
    isFormDialogVisible.value = true;
  }

  async function openViewDialog(item) {
    selectedItem.value = item;
    isDetailDialogVisible.value = true;
  }

  async function openEditDialog(item) {
    isEditing.value = true;
    isReadOnly.value = false;
    selectedItem.value = item;
    await transferStore.fetchLlenaderos();
    await transferStore.loadTanksList();
    transferStore.fetchTankDetail(item.id_tanque_origen, 'source');
    transferStore.fetchTankDetail(item.id_tanque_destino, 'destination');
    isFormDialogVisible.value = true;
  }

  function handleLlenaderoChange(id) {
    // Ya no filtramos la lista global del store, el diálogo filtrará localmente
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
    onFormSave,
    applyFilters,
    clearFilters,
    initSocketListeners, removeSocketListeners, transferStore,
    can: (p) => hasPermission(JSON.parse(localStorage.getItem("user") || "{}"), p)
  };
}

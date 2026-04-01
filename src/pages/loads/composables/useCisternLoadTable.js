import { ref } from "vue";
import { useQuasar } from "quasar";
import { storeToRefs } from "pinia";
import { useCisternLoadStore } from "../../../stores/cisternLoadStore.js";
import { hasPermission } from "../../../utils/permissions";
import socket from "../../../services/socket";

export function useCisternLoadTable() {
  const $q = useQuasar();
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

  function confirmarRevertir(item) {
    const tanques = (item.tanques_descarga || []).map(t => t.Tanque?.nombre || `#${t.id_tanque}`).join(", ") || "—";
    $q.dialog({
      title: "\u26a0\ufe0f \u00bfRevertir Carga de Cisterna?",
      message: `Esta acci\u00f3n restaurar\u00e1 los niveles de los tanques (<b>${tanques}</b>) al estado 
        previo a esta recepci\u00f3n y eliminar\u00e1 sus registros del ledger de inventario.<br><br>
        <b>Solo es posible si no hay operaciones posteriores en ninguno de los tanques afectados.</b>`,
      html: true,
      ok: { label: "Revertir", color: "negative", unelevated: true, icon: "undo" },
      cancel: { label: "Cancelar", flat: true, color: "grey-7" },
      persistent: true,
    }).onOk(async () => {
      await loadStore.revertirCarga(item.id_carga);
    });
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
    applyFilters, clearFilters, confirmarRevertir,
    initSocketListeners, removeSocketListeners,
    can: (p) => hasPermission(JSON.parse(localStorage.getItem("user") || "{}"), p)
  };
}

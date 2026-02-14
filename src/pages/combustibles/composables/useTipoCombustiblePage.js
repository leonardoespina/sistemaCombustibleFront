import { ref } from "vue";
import { useQuasar } from "quasar";
import socket from "../../../services/socket.js";

/**
 * Composable para gestión de la página de tipos de combustible
 * @param {Object} store - Store de tipos de combustible
 * @returns {Object} Estado y métodos de la página
 */
export function useTipoCombustiblePage(store) {
  const $q = useQuasar();
  const showDialog = ref(false);
  const selectedItem = ref(null);

  /**
   * Abre el diálogo para crear un nuevo tipo de combustible
   */
  function openCreateDialog() {
    selectedItem.value = null;
    showDialog.value = true;
  }

  /**
   * Abre el diálogo para editar un tipo de combustible existente
   * @param {Object} item - Tipo de combustible a editar
   */
  function openEditDialog(item) {
    selectedItem.value = item;
    showDialog.value = true;
  }

  /**
   * Muestra diálogo de confirmación para eliminar/desactivar
   * @param {Object} row - Tipo de combustible a eliminar
   */
  function confirmDelete(row) {
    $q.dialog({
      title: "Confirmar eliminación",
      message: `¿Estás seguro de eliminar el tipo de combustible "${row.nombre}"?`,
      cancel: true,
      persistent: true,
      ok: {
        label: "Eliminar",
        color: "negative",
      },
      cancel: {
        label: "Cancelar",
        flat: true,
      },
    }).onOk(async () => {
      await store.deleteTipoCombustible(row.id_tipo_combustible);
    });
  }

  /**
   * Configura los listeners de Socket.IO para sincronización en tiempo real
   */
  function setupSocketListeners() {
    socket.on("tipo_combustible:creado", (data) => {
      $q.notify({
        type: "info",
        message: `Nuevo tipo de combustible "${data.nombre}" creado`,
        icon: "add_circle",
        position: "top-right",
      });
      store.fetchTiposCombustible();
    });

    socket.on("tipo_combustible:actualizado", (data) => {
      $q.notify({
        type: "info",
        message: `Tipo de combustible "${data.nombre}" actualizado`,
        icon: "update",
        position: "top-right",
      });
      store.fetchTiposCombustible();
    });

    socket.on("tipo_combustible:eliminado", (data) => {
      $q.notify({
        type: "warning",
        message: `Tipo de combustible "${data.nombre}" desactivado`,
        icon: "delete",
        position: "top-right",
      });
      store.fetchTiposCombustible();
    });
  }

  /**
   * Limpia los listeners de Socket.IO
   */
  function cleanupSocketListeners() {
    socket.off("tipo_combustible:creado");
    socket.off("tipo_combustible:actualizado");
    socket.off("tipo_combustible:eliminado");
  }

  return {
    showDialog,
    selectedItem,
    openCreateDialog,
    openEditDialog,
    confirmDelete,
    setupSocketListeners,
    cleanupSocketListeners,
  };
}

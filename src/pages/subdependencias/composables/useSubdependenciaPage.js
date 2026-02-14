import { ref } from "vue";
import { useQuasar } from "quasar";
import socket from "../../../services/socket.js";

/**
 * Composable para gestión de la página de subdependencias
 * @param {Object} subdependenciaStore - Store de Pinia para subdependencias
 * @returns {Object} Estado y métodos de la página
 */
export function useSubdependenciaPage(subdependenciaStore) {
  const $q = useQuasar();

  // Estados de diálogos
  const isFormDialogVisible = ref(false);
  const isDeleteDialogVisible = ref(false);
  const editingItem = ref(null);

  /**
   * Abre el diálogo para agregar nueva subdependencia
   */
  function openAddDialog() {
    editingItem.value = null;
    isFormDialogVisible.value = true;
  }

  /**
   * Abre el diálogo para editar una subdependencia existente
   * @param {Object} item - Subdependencia a editar
   */
  function openEditDialog(item) {
    editingItem.value = { ...item };
    isFormDialogVisible.value = true;
  }

  /**
   * Abre el diálogo de confirmación para eliminar
   * @param {Object} item - Subdependencia a eliminar
   */
  function openDeleteDialog(item) {
    editingItem.value = item;
    isDeleteDialogVisible.value = true;
  }

  /**
   * Maneja el guardado del formulario (crear o editar)
   * @param {Object} formData - Datos del formulario
   */
  async function onFormSave(formData) {
    let success = false;
    const isEditing = !!editingItem.value;

    try {
      if (isEditing) {
        success = await subdependenciaStore.updateSubdependencia(
          editingItem.value.id_subdependencia,
          formData
        );
      } else {
        success = await subdependenciaStore.createSubdependencia(formData);
      }

      if (success) {
        isFormDialogVisible.value = false;
        $q.notify({
          type: "positive",
          message: `Subdependencia ${isEditing ? "actualizada" : "creada"} exitosamente`,
          icon: "check_circle",
          position: "top-right",
        });
      } else {
        $q.notify({
          type: "negative",
          message: "Error al guardar la subdependencia",
          icon: "error",
          position: "top-right",
        });
      }
    } catch (error) {
      console.error("Error en onFormSave:", error);
      $q.notify({
        type: "negative",
        message: "Error inesperado al guardar",
        icon: "error",
        position: "top-right",
      });
    }
  }

  /**
   * Confirma y ejecuta la eliminación (cambio de estado)
   */
  async function confirmDelete() {
    try {
      await subdependenciaStore.deleteSubdependencia(
        editingItem.value.id_subdependencia
      );
      isDeleteDialogVisible.value = false;
      $q.notify({
        type: "positive",
        message: "Subdependencia desactivada exitosamente",
        icon: "check_circle",
        position: "top-right",
      });
    } catch (error) {
      console.error("Error en confirmDelete:", error);
      $q.notify({
        type: "negative",
        message: "Error al desactivar la subdependencia",
        icon: "error",
        position: "top-right",
      });
    }
  }

  /**
   * Configura listeners de Socket.io para sincronización en tiempo real
   */
  function setupSocketListeners() {
    socket.on("subdependencia:creado", (data) => {
      subdependenciaStore.fetchSubdependencias();
      $q.notify({
        type: "info",
        message: `Nueva subdependencia "${data.nombre}" creada`,
        icon: "add_circle",
        position: "top-right",
        timeout: 2000,
      });
    });

    socket.on("subdependencia:actualizado", (data) => {
      subdependenciaStore.fetchSubdependencias();
      $q.notify({
        type: "info",
        message: `Subdependencia "${data.nombre}" actualizada`,
        icon: "update",
        position: "top-right",
        timeout: 2000,
      });
    });

    socket.on("subdependencia:eliminado", (data) => {
      subdependenciaStore.fetchSubdependencias();
      $q.notify({
        type: "warning",
        message: `Subdependencia "${data.nombre}" desactivada`,
        icon: "delete",
        position: "top-right",
        timeout: 2000,
      });
    });
  }

  /**
   * Limpia listeners de Socket.io al desmontar
   */
  function cleanupSocketListeners() {
    socket.off("subdependencia:creado");
    socket.off("subdependencia:actualizado");
    socket.off("subdependencia:eliminado");
  }

  return {
    // Estados
    isFormDialogVisible,
    isDeleteDialogVisible,
    editingItem,
    // Métodos de diálogos
    openAddDialog,
    openEditDialog,
    openDeleteDialog,
    // Métodos de operaciones
    onFormSave,
    confirmDelete,
    // Socket.io
    setupSocketListeners,
    cleanupSocketListeners,
  };
}

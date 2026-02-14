import { ref } from "vue";
import { useQuasar } from "quasar";
import socket from "../../../services/socket.js";

/**
 * Composable para gestión de la página de dependencias
 * @param {Object} dependenciaStore - Store de Pinia para dependencias
 * @returns {Object} Estado y métodos de la página
 */
export function useDependenciaPage(dependenciaStore) {
  const $q = useQuasar();

  // Estados de diálogos
  const isFormDialogVisible = ref(false);
  const isDeleteDialogVisible = ref(false);
  const editingItem = ref(null);

  /**
   * Abre el diálogo para agregar nueva dependencia
   */
  function openAddDialog() {
    editingItem.value = null;
    isFormDialogVisible.value = true;
  }

  /**
   * Abre el diálogo para editar una dependencia existente
   * @param {Object} item - Dependencia a editar
   */
  function openEditDialog(item) {
    editingItem.value = { ...item };
    isFormDialogVisible.value = true;
  }

  /**
   * Abre el diálogo de confirmación para eliminar
   * @param {Object} item - Dependencia a eliminar
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
        success = await dependenciaStore.updateDependencia(
          editingItem.value.id_dependencia,
          formData
        );
      } else {
        success = await dependenciaStore.createDependencia(formData);
      }

      if (success) {
        isFormDialogVisible.value = false;
        $q.notify({
          type: "positive",
          message: `Dependencia ${isEditing ? "actualizada" : "creada"} exitosamente`,
          icon: "check_circle",
          position: "top-right",
        });
      } else {
        $q.notify({
          type: "negative",
          message: "Error al guardar la dependencia",
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
      await dependenciaStore.deleteDependencia(editingItem.value.id_dependencia);
      isDeleteDialogVisible.value = false;
      $q.notify({
        type: "positive",
        message: "Dependencia desactivada exitosamente",
        icon: "check_circle",
        position: "top-right",
      });
    } catch (error) {
      console.error("Error en confirmDelete:", error);
      $q.notify({
        type: "negative",
        message: "Error al desactivar la dependencia",
        icon: "error",
        position: "top-right",
      });
    }
  }

  /**
   * Configura listeners de Socket.io para sincronización en tiempo real
   */
  function setupSocketListeners() {
    socket.on("dependencia:creado", (data) => {
      dependenciaStore.fetchDependencias();
      $q.notify({
        type: "info",
        message: `Nueva dependencia "${data.nombre_dependencia}" creada`,
        icon: "add_circle",
        position: "top-right",
        timeout: 2000,
      });
    });

    socket.on("dependencia:actualizado", (data) => {
      dependenciaStore.fetchDependencias();
      $q.notify({
        type: "info",
        message: `Dependencia "${data.nombre_dependencia}" actualizada`,
        icon: "update",
        position: "top-right",
        timeout: 2000,
      });
    });

    socket.on("dependencia:eliminado", (data) => {
      dependenciaStore.fetchDependencias();
      $q.notify({
        type: "warning",
        message: `Dependencia "${data.nombre_dependencia}" desactivada`,
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
    socket.off("dependencia:creado");
    socket.off("dependencia:actualizado");
    socket.off("dependencia:eliminado");
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

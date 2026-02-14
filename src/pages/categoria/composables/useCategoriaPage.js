import { ref, onMounted, onUnmounted } from "vue";
import { useQuasar } from "quasar";
import socket from "../../../services/socket.js";

/**
 * Composable para gestión de la página de categorías
 * @param {Object} categoriaStore - Store de Pinia para categorías
 * @returns {Object} Estado y métodos de la página
 */
export function useCategoriaPage(categoriaStore) {
  const $q = useQuasar();

  // Estados de diálogos
  const isFormDialogVisible = ref(false);
  const isDeleteDialogVisible = ref(false);
  const editingItem = ref(null);

  /**
   * Abre el diálogo para agregar nueva categoría
   */
  function openAddDialog() {
    editingItem.value = null;
    isFormDialogVisible.value = true;
  }

  /**
   * Abre el diálogo para editar una categoría existente
   * @param {Object} item - Categoría a editar
   */
  function openEditDialog(item) {
    editingItem.value = { ...item };
    isFormDialogVisible.value = true;
  }

  /**
   * Abre el diálogo de confirmación para eliminar
   * @param {Object} item - Categoría a eliminar
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
        success = await categoriaStore.updateCategoria(
          editingItem.value.id_categoria,
          formData
        );
      } else {
        success = await categoriaStore.createCategoria(formData);
      }

      if (success) {
        isFormDialogVisible.value = false;
        $q.notify({
          type: "positive",
          message: `Categoría ${isEditing ? "actualizada" : "creada"} exitosamente`,
          icon: "check_circle",
          position: "top-right",
        });
      } else {
        $q.notify({
          type: "negative",
          message: "Error al guardar la categoría",
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
      await categoriaStore.deleteCategoria(editingItem.value.id_categoria);
      isDeleteDialogVisible.value = false;
      $q.notify({
        type: "positive",
        message: "Categoría desactivada exitosamente",
        icon: "check_circle",
        position: "top-right",
      });
    } catch (error) {
      console.error("Error en confirmDelete:", error);
      $q.notify({
        type: "negative",
        message: "Error al desactivar la categoría",
        icon: "error",
        position: "top-right",
      });
    }
  }

  /**
   * Configura listeners de Socket.io para sincronización en tiempo real
   */
  function setupSocketListeners() {
    socket.on("categoria:creado", (data) => {
      categoriaStore.fetchCategorias();
      $q.notify({
        type: "info",
        message: `Nueva categoría "${data.nombre}" creada`,
        icon: "add_circle",
        position: "top-right",
        timeout: 2000,
      });
    });

    socket.on("categoria:actualizado", (data) => {
      categoriaStore.fetchCategorias();
      $q.notify({
        type: "info",
        message: `Categoría "${data.nombre}" actualizada`,
        icon: "update",
        position: "top-right",
        timeout: 2000,
      });
    });

    socket.on("categoria:eliminado", (data) => {
      categoriaStore.fetchCategorias();
      $q.notify({
        type: "warning",
        message: `Categoría "${data.nombre}" desactivada`,
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
    socket.off("categoria:creado");
    socket.off("categoria:actualizado");
    socket.off("categoria:eliminado");
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

import { ref } from "vue";
import { useQuasar } from "quasar";
import socket from "../../../services/socket.js";

/**
 * Composable para gestión de la página de categorías.
 * Es el único responsable de los listeners de Socket.io del módulo.
 * @param {Object} categoriaStore - Store de Pinia para categorías
 * @returns {Object} Estado y métodos de la página
 */
export function useCategoriaPage(categoriaStore) {
  const $q = useQuasar();

  // Estados de diálogos
  const isFormDialogVisible = ref(false);
  const isDeleteDialogVisible = ref(false);
  const editingItem = ref(null);

  // Indica que el item en edición fue modificado por otro usuario
  const concurrentEditWarning = ref(false);

  // ---------------------------------------------------------------------------
  // Gestión de diálogos
  // ---------------------------------------------------------------------------

  function openAddDialog() {
    editingItem.value = null;
    concurrentEditWarning.value = false;
    isFormDialogVisible.value = true;
  }

  function openEditDialog(item) {
    editingItem.value = { ...item };
    concurrentEditWarning.value = false;
    isFormDialogVisible.value = true;
  }

  function openDeleteDialog(item) {
    editingItem.value = item;
    isDeleteDialogVisible.value = true;
  }

  // ---------------------------------------------------------------------------
  // Operaciones CRUD
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Paginación / filtro
  // ---------------------------------------------------------------------------

  /**
   * Manejador de peticiones de la q-table (sort, pagination, filter)
   */
  function handleRequest({ pagination: pag, filter: f }) {
    categoriaStore.pagination = pag;
    categoriaStore.filter = f;
    categoriaStore.fetchCategorias();
  }

  /**
   * Reinicia el estado de paginación y filtro al desmontar la página
   */
  function resetPageState() {
    categoriaStore.filter = "";
    categoriaStore.pagination = {
      page: 1,
      rowsPerPage: 10,
      sortBy: "id_categoria",
      descending: false,
      rowsNumber: 0,
    };
  }

  // ---------------------------------------------------------------------------
  // Socket.io — punto único de escucha para todo el módulo
  // ---------------------------------------------------------------------------

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
      // Marcar advertencia si el usuario tiene ese item abierto en el dialog
      if (
        isFormDialogVisible.value &&
        editingItem.value?.id_categoria === data.id_categoria
      ) {
        concurrentEditWarning.value = true;
      }
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

  function cleanupSocketListeners() {
    socket.off("categoria:creado");
    socket.off("categoria:actualizado");
    socket.off("categoria:eliminado");
  }

  return {
    // Estado de diálogos
    isFormDialogVisible,
    isDeleteDialogVisible,
    editingItem,
    concurrentEditWarning,
    // Diálogos
    openAddDialog,
    openEditDialog,
    openDeleteDialog,
    // CRUD
    onFormSave,
    confirmDelete,
    // Página
    handleRequest,
    resetPageState,
    // Socket
    setupSocketListeners,
    cleanupSocketListeners,
  };
}

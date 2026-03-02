import { ref } from "vue";
import { useQuasar } from "quasar";
import socket from "../../../services/socket.js";

/**
 * Composable para gestión de la página de usuarios
 * @param {Object} userStore - Store de Pinia para usuarios
 * @returns {Object} Estado y métodos de la página
 */
export function useUserPage(userStore) {
  const $q = useQuasar();

  // Estados de diálogos
  const isFormDialogVisible = ref(false);
  const isDeleteDialogVisible = ref(false);
  const editingUser = ref(null);

  /**
   * Abre el diálogo para agregar nuevo usuario
   */
  function openAddDialog() {
    editingUser.value = null;
    isFormDialogVisible.value = true;
  }

  /**
   * Abre el diálogo para editar un usuario existente
   * @param {Object} user - Usuario a editar
   */
  function openEditDialog(user) {
    // Copia profunda para asegurar que las relaciones anidadas se pasen correctamente
    editingUser.value = JSON.parse(JSON.stringify(user));
    isFormDialogVisible.value = true;
  }

  /**
   * Abre el diálogo de confirmación para eliminar
   * @param {Object} user - Usuario a eliminar
   */
  function openDeleteDialog(user) {
    editingUser.value = user;
    isDeleteDialogVisible.value = true;
  }

  /**
   * Maneja el guardado del formulario (crear o editar)
   * @param {Object} formData - Datos del formulario
   */
  async function onFormSave(formData) {
    let success = false;
    const isEditing = !!editingUser.value;

    try {
      if (isEditing) {
        success = await userStore.updateUser(
          editingUser.value.id_usuario,
          formData
        );
      } else {
        success = await userStore.createUser(formData);
      }

      if (success) {
        isFormDialogVisible.value = false;
        $q.notify({
          type: "positive",
          message: `Usuario ${isEditing ? "actualizado" : "creado"} exitosamente`,
          icon: "check_circle",
          position: "top-right",
        });
      } else {
        $q.notify({
          type: "negative",
          message: "Error al guardar el usuario",
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
      await userStore.deleteUser(editingUser.value.id_usuario);
      isDeleteDialogVisible.value = false;
      $q.notify({
        type: "positive",
        message: "Usuario desactivado exitosamente",
        icon: "check_circle",
        position: "top-right",
      });
    } catch (error) {
      console.error("Error en confirmDelete:", error);
      $q.notify({
        type: "negative",
        message: "Error al desactivar el usuario",
        icon: "error",
        position: "top-right",
      });
    }
  }

  /**
   * Configura listeners de Socket.io para sincronización en tiempo real
   */
  function setupSocketListeners() {
    socket.on("usuarios:creado", (data) => {
      userStore.fetchUsers();
      $q.notify({
        type: "info",
        message: `Nuevo usuario "${data.nombre} ${data.apellido}" creado`,
        icon: "add_circle",
        position: "top-right",
        timeout: 2000,
      });
    });

    socket.on("usuarios:actualizado", (data) => {
      userStore.fetchUsers();
      $q.notify({
        type: "info",
        message: `Usuario "${data.nombre} ${data.apellido}" actualizado`,
        icon: "update",
        position: "top-right",
        timeout: 2000,
      });
    });

    socket.on("usuarios:eliminado", (data) => {
      userStore.fetchUsers();
      $q.notify({
        type: "warning",
        message: `Usuario "${data.nombre} ${data.apellido}" desactivado`,
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
    socket.off("usuarios:creado");
    socket.off("usuarios:actualizado");
    socket.off("usuarios:eliminado");
  }

  return {
    // Estados
    isFormDialogVisible,
    isDeleteDialogVisible,
    editingUser,
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

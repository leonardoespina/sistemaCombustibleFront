import { ref, watch, onMounted, onUnmounted } from "vue";
import { useUserStore } from "../../../stores/userStore";
import socket from "../../../services/socket";

export function useChangePasswordForm(props, emit) {
  const userStore = useUserStore();

  // --- STATE ---
  const passwordActual = ref("");
  const nuevaPassword = ref("");
  const confirmarPassword = ref("");

  // Visibilidad de contraseñas
  const showCurrent = ref(false);
  const showNew = ref(false);
  const showConfirm = ref(false);

  // --- VALIDATION RULES ---
  const rules = {
    required: (val) => !!val || "Campo obligatorio",
    minLength: (val) => val.length >= 6 || "Mínimo 6 caracteres",
    match: (val) =>
      val === nuevaPassword.value || "Las contraseñas no coinciden",
  };

  /**
   * Limpia los campos del formulario
   */
  function resetForm() {
    passwordActual.value = "";
    nuevaPassword.value = "";
    confirmarPassword.value = "";
    showCurrent.value = false;
    showNew.value = false;
    showConfirm.value = false;
  }

  /**
   * Ejecuta el cambio de contraseña invocando al store
   */
  async function handleSave() {
    const success = await userStore.changePassword(
      passwordActual.value,
      nuevaPassword.value,
    );

    if (success) {
      resetForm();
      emit("update:modelValue", false);
      emit("logout"); // Por seguridad, el backend invalida la sesión
    }
  }

  // --- SOCKET INTEGRATION ---
  function setupSocket() {
    // Ejemplo: Escuchar si la sesión fue invalidada remotamente mientras cambiamos pass
    socket.on("sesion:expulsar", () => {
      emit("update:modelValue", false);
    });
  }

  function cleanupSocket() {
    socket.off("sesion:expulsar");
  }

  onMounted(() => {
    setupSocket();
  });

  onUnmounted(() => {
    cleanupSocket();
  });

  // Limpiar al cerrar el diálogo
  watch(
    () => props.modelValue,
    (val) => {
      if (!val) resetForm();
    },
  );

  return {
    // Estado
    passwordActual,
    nuevaPassword,
    confirmarPassword,
    showCurrent,
    showNew,
    showConfirm,
    loading: userStore.loading,
    // Reglas
    rules,
    // Métodos
    handleSave,
    resetForm,
  };
}

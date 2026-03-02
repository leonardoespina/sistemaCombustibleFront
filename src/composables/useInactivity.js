import { ref, onMounted, onUnmounted } from "vue";
import { useQuasar } from "quasar";
import api from "../api";
import { useRouter } from "vue-router";

/**
 * Composable para gestionar la inactividad del usuario
 * @param {Object} options Configuración de tiempos
 * @param {number} options.idleTime Tiempo total de inactividad antes del cierre (ms)
 * @param {number} options.warningTime Tiempo antes del cierre para mostrar advertencia (ms)
 */
export function useInactivity({
  idleTime = 900000,
  warningTime = 120000,
} = {}) {
  const $q = useQuasar();
  const router = useRouter();

  let idleTimer = null;
  let warningTimer = null;
  let dialogInstance = null; // Para controlar el cierre automático del Dialog

  const isWarningVisible = ref(false);

  // Eventos que reinician el temporizador
  const events = [
    "mousedown",
    "mousemove",
    "keypress",
    "scroll",
    "touchstart",
    "click",
  ];

  /**
   * Cierra la sesión tanto en backend como local
   */
  const logout = async () => {
    try {
      // 1. Cerrar el Dialog si sigue abierto
      if (dialogInstance) {
        dialogInstance.hide();
        dialogInstance = null;
      }

      // 2. Intentar avisar al backend (limpia id_sesion)
      await api.post("/usuarios/logout");
    } catch (e) {
      console.error("Error al cerrar sesión por inactividad:", e);
    } finally {
      // 3. Limpiar localmente siempre
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      $q.notify({
        type: "warning",
        message: "Tu sesión ha expirado por inactividad.",
        position: "top",
        timeout: 5000,
      });

      router.push("/login");
    }
  };

  /**
   * Muestra el diálogo de advertencia
   */
  const showWarning = () => {
    isWarningVisible.value = true;

    dialogInstance = $q
      .dialog({
        title: "Sesión por expirar",
        message:
          "Has estado inactivo por un tiempo. Tu sesión se cerrará automáticamente en breve. ¿Deseas continuar conectado?",
        ok: {
          label: "Seguir conectado",
          color: "primary",
          unelevated: true,
        },
        cancel: {
          label: "Cerrar sesión ahora",
          color: "grey-7",
          flat: true,
        },
        persistent: true,
      })
      .onOk(() => {
        dialogInstance = null;
        resetTimers();
      })
      .onCancel(() => {
        dialogInstance = null;
        logout();
      });
  };

  /**
   * Inicia los temporizadores
   */
  const startTimers = () => {
    // Timer para la advertencia (Tiempo total - Tiempo de margen)
    const timeUntilWarning = idleTime - warningTime;

    idleTimer = setTimeout(() => {
      showWarning();
    }, timeUntilWarning);

    // Timer para el cierre definitivo
    warningTimer = setTimeout(() => {
      logout();
    }, idleTime);
  };

  /**
   * Limpia los temporizadores activos
   */
  const clearTimers = () => {
    if (idleTimer) clearTimeout(idleTimer);
    if (warningTimer) clearTimeout(warningTimer);
  };

  /**
   * Reinicia todo el ciclo de control
   */
  const resetTimers = () => {
    isWarningVisible.value = false;
    clearTimers();
    startTimers();
  };

  // Manejador de eventos
  const handleUserActivity = () => {
    // Si ya estamos mostrando la advertencia, no reiniciamos por simples movimientos
    // El usuario debe interactuar con el diálogo
    if (!isWarningVisible.value) {
      resetTimers();
    }
  };

  onMounted(() => {
    // Solo activar si hay un usuario logueado
    if (localStorage.getItem("token")) {
      events.forEach((event) => {
        window.addEventListener(event, handleUserActivity);
      });
      startTimers();
    }
  });

  onUnmounted(() => {
    events.forEach((event) => {
      window.removeEventListener(event, handleUserActivity);
    });
    clearTimers();
  });

  return {
    resetTimers,
    logout,
  };
}

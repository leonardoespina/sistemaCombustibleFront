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

  let checkInterval = null;
  let dialogInstance = null; // Para controlar el cierre automático del Dialog

  const isWarningVisible = ref(false);

  // Eventos que actualizan el timestamp de última actividad
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
      // 3. Limpiar localmente
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("lastActivity");

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
        updateLastActivity();
        isWarningVisible.value = false;
        // Obliga a que checkInterval no lo vuelva a lanzar por 2 segs.
      })
      .onCancel(() => {
        dialogInstance = null;
        logout();
      });
  };

  /**
   * Actualiza el timestamp en LocalStorage
   */
  const updateLastActivity = () => {
    // Si no hay token, no registrar actividad.
    if (!localStorage.getItem("token")) return;
    localStorage.setItem("lastActivity", Date.now().toString());
  };

  /**
   * Verifica el tiempo transcurrido
   */
  const checkActivity = () => {
    if (!localStorage.getItem("token")) return;

    const lastStr = localStorage.getItem("lastActivity");
    if (!lastStr) return;

    const lastActivity = parseInt(lastStr, 10);
    const now = Date.now();
    const elapsedTime = now - lastActivity;

    // 1. Si pasó del tiempo total, cerrar sin importar estado de ventana
    if (elapsedTime >= idleTime) {
      logout();
      return;
    } 
    
    // 2. Rango de advertencia
    if (elapsedTime >= (idleTime - warningTime)) {
      // Solo mostramos el diálogo si la pestaña está visible/maximizada
      if (!isWarningVisible.value && document.visibilityState === "visible") {
        showWarning();
      }
    } 
    // 3. Multi-pestañas: revivida en otra tab
    else if (elapsedTime < (idleTime - warningTime) && isWarningVisible.value && dialogInstance) {
      dialogInstance.hide();
      dialogInstance = null;
      isWarningVisible.value = false;
    }
  };

  /**
   * Inicia el ciclo
   */
  const startTimers = () => {
    // Si acaba de abrir la ventana (onMounted), verificar si el tiempo expiró
    // mientras estaba cerrada ANTES de reiniciar el temporizador
    const lastStr = localStorage.getItem("lastActivity");
    if (lastStr) {
      const lastActivity = parseInt(lastStr, 10);
      if (Date.now() - lastActivity >= idleTime) {
        logout();
        return; // Terminamos aquí, ya expiró en segundo plano
      }
    }

    updateLastActivity();
    checkInterval = setInterval(checkActivity, 5000);
  };

  const clearTimers = () => {
    if (checkInterval) clearInterval(checkInterval);
  };

  const resetTimers = () => {
    isWarningVisible.value = false;
    clearTimers();
    startTimers();
  };

  /**
   * Manejador de eventos de usuario
   */
  const handleUserActivity = () => {
    // Si ya estamos en estado de alerta, obligamos al click del dialog
    if (!isWarningVisible.value) {
      updateLastActivity();
    }
  };

  /**
   * Maneja retorno tras minimizar
   */
  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      checkActivity();
    }
  };

  onMounted(() => {
    // Solo activar si hay un usuario logueado
    if (localStorage.getItem("token")) {
      events.forEach((event) => {
        window.addEventListener(event, handleUserActivity);
      });
      document.addEventListener("visibilitychange", handleVisibilityChange);
      startTimers();
    }
  });

  onUnmounted(() => {
    events.forEach((event) => {
      window.removeEventListener(event, handleUserActivity);
    });
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    clearTimers();
  });

  return {
    resetTimers,
    logout,
  };
}

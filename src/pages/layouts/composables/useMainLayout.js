import { ref, computed, onMounted, watch } from "vue";
import { useQuasar } from "quasar";
import { useRouter, useRoute } from "vue-router";
import api from "../../../api";
import { useInactivity } from "../../../composables/useInactivity";
import socket from "../../../services/socket";

export function useMainLayout() {
  const $q = useQuasar();
  const router = useRouter();
  const route = useRoute();

  // --- STATE ---
  const leftDrawerOpen = ref(false);
  const userData = ref(null);
  const showChangePassword = ref(false);

  // --- COMPUTED ---
  const isAdmin = computed(() => userData.value?.tipo_usuario === "ADMIN");

  const userName = computed(() => {
    if (!userData.value) return "Usuario";
    return `${userData.value.nombre} ${userData.value.apellido || ""}`;
  });

  const userDependency = computed(() => {
    return userData.value?.Dependencia?.nombre_dependencia || "Sin Dependencia";
  });

  const userRole = computed(() => userData.value?.tipo_usuario || "");

  // --- METHODS ---
  const toggleLeftDrawer = () => {
    leftDrawerOpen.value = !leftDrawerOpen.value;
  };

  const handleLogoutLocal = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/login");
  };

  const handleLogout = async () => {
    try {
      await api.post("/usuarios/logout");
    } catch (error) {
      console.error("Error al notificar logout:", error);
    } finally {
      $q.notify({
        message: "Has cerrado sesión.",
        color: "info",
        icon: "info",
        position: "top",
        timeout: 2000,
      });
      handleLogoutLocal();
    }
  };

  /**
   * Control de Acceso por Tipo de Dependencia
   */
  const canAccess = (moduleName) => {
    if (isAdmin.value) return true;
    const tipoMenu =
      userData.value?.Dependencia?.tipo_acceso_menu || "ESTANDAR";

    const rules = {
      OPERATIVO: ["OPERACIONES", "ALMACEN"],
      SEGURIDAD: ["SEGURIDAD"],
      INVENTARIO: ["ALMACEN", "OPERACIONES"],
      CONFIG: ["OPERACIONES", "ALMACEN", "SEGURIDAD"],
    };

    if (!rules[moduleName]) return true;
    return rules[moduleName].includes(tipoMenu);
  };

  // --- LIFECYCLE & WATCHERS ---
  watch(route, () => {
    leftDrawerOpen.value = false;
  });

  onMounted(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      userData.value = JSON.parse(storedUser);
      socket.emit("usuario:identificar", userData.value.id_usuario);

      socket.on("sesion:expulsar", () => {
        $q.notify({
          type: "negative",
          message: "Tu sesión ha sido cerrada por inicio en otro dispositivo.",
          position: "top",
          timeout: 0,
          actions: [{ label: "Entendido", color: "white" }],
        });
        handleLogoutLocal();
      });
    }
  });

  // Activar control de inactividad (3 min para pruebas, ajustar luego)
  useInactivity({
    idleTime: 180000,
    warningTime: 60000,
  });

  return {
    // State
    leftDrawerOpen,
    userData,
    showChangePassword,
    // Computed
    isAdmin,
    userName,
    userDependency,
    userRole,
    // Methods
    toggleLeftDrawer,
    handleLogout,
    handleLogoutLocal,
    canAccess,
  };
}

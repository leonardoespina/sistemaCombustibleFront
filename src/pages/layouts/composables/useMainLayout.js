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
  const isAdmin = computed(() => userData.value?.rol_sistema === "ADMIN" || userData.value?.tipo_usuario === "ADMIN");

  const userTipoMenu = computed(() => {
    // Si ya existe rol_sistema, lo usamos como tipo de menú para compatibilidad
    return userData.value?.rol_sistema || userData.value?.tipo_usuario || "ESTANDAR";
  });

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
    // Desconectar el socket para que el backend libere la sesión
    if (socket) socket.disconnect();
    window.location.href = "/login";
  };

  const handleLogout = async () => {
    try {
      await api.post("/usuarios/logout");
    } catch (error) {
      console.error("Error al notificar logout:", error);
    } finally {
      handleLogoutLocal();
    }
  };

  /**
   * Control de Acceso por Tipo de Dependencia
   */
  const canAccess = (moduleName) => {
    if (isAdmin.value) return true;

    // Simplificamos: Si tiene rol del sistema, dejamos que SidebarMenu maneje con PERMISSIONS
    // Este método canAccess quedará para compatibilidad o lógica muy genérica
    const role = userTipoMenu.value;

    const rules = {
      OPERATIVO: ["ADMIN", "ALMACEN", "ALMACENISTA", "SEGURIDAD", "PRESIDENCIA", "INSPECTOR"],
      SEGURIDAD: ["ADMIN", "SEGURIDAD"],
      INVENTARIO: ["ADMIN", "ALMACEN", "ALMACENISTA", "PRESIDENCIA"],
      CONFIG: ["ADMIN"],
    };

    if (!rules[moduleName]) return true;
    return rules[moduleName].includes(role);
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
    userTipoMenu,
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

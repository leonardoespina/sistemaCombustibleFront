<template>
  <q-layout view="lHh Lpr lFf">
    <!-- BARRA SUPERIOR (HEADER) -->
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title class="text-weight-bold">SIRECC</q-toolbar-title>

        <q-space />

        <!-- MENÚ DE USUARIO DESPLEGABLE -->
        <q-btn-dropdown
          flat
          no-caps
          stretch
          icon="account_circle"
          :label="userName"
          class="text-weight-bold"
        >
          <q-list style="min-width: 280px">
            <q-item class="q-pa-md bg-grey-1">
              <q-item-section avatar>
                <q-avatar color="primary" text-color="white" icon="person" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-bold text-primary text-h6">
                  {{ userName }}
                </q-item-label>
                <q-item-label caption class="text-grey-9 text-weight-medium">
                  {{ userDependency }}
                </q-item-label>
                <q-chip
                  dense
                  color="blue-1"
                  text-color="primary"
                  class="text-weight-bold q-mt-xs"
                  style="width: fit-content"
                >
                  {{ userRole }}
                </q-chip>
              </q-item-section>
            </q-item>

            <q-separator />

            <q-item clickable v-ripple @click="showChangePassword = true">
              <q-item-section avatar>
                <q-icon name="vpn_key" color="grey-7" />
              </q-item-section>
              <q-item-section>Cambiar Contraseña</q-item-section>
            </q-item>

            <q-item clickable v-ripple @click="handleChangeLlenadero">
              <q-item-section avatar>
                <q-icon name="local_gas_station" color="primary" />
              </q-item-section>
              <q-item-section>Cambiar de Sede (Llenadero)</q-item-section>
            </q-item>

            <q-item
              clickable
              v-ripple
              @click="handleLogout"
              class="text-negative"
            >
              <q-item-section avatar>
                <q-icon name="logout" color="negative" />
              </q-item-section>
              <q-item-section>Cerrar Sesión</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-toolbar>
    </q-header>

    <!-- MENÚ LATERAL (DRAWER) -->
    <q-drawer v-model="leftDrawerOpen" bordered :width="260" class="bg-grey-2">
      <!-- COMPONENTE DE NAVEGACIÓN MODULAR -->
      <SidebarMenu :is-admin="isAdmin" :can-access="canAccess" :user-tipo-menu="userTipoMenu" :user-role="userRole" :user-data="userData" />
    </q-drawer>

    <!-- CONTENEDOR DE LA PÁGINA -->
    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition
          appear
          enter-active-class="animated fadeIn"
          leave-active-class="animated fadeOut"
          mode="out-in"
        >
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>

    <!-- DIALOGOS GLOBALES -->
    <ChangePasswordDialog
      v-model="showChangePassword"
      @logout="handleLogoutLocal"
    />

    <LlenaderoPrompt
      ref="globalLlenaderoPromptRef"
      :llenaderos-list="globalLlenaderosList"
      @saved="onGlobalLlenaderoSaved"
    />
  </q-layout>
</template>

<script setup>
import { ref } from "vue";
import { useQuasar } from "quasar";
import api from "../../api";
import { useMainLayout } from "./composables/useMainLayout.js";
import SidebarMenu from "./components/SidebarMenu.vue";
import ChangePasswordDialog from "../../components/users/ChangePasswordDialog.vue";
import LlenaderoPrompt from "../../components/dispatches/LlenaderoPrompt.vue";

const $q = useQuasar();

// Extraemos toda la lógica al composable (Sockets, Inactividad, Auth, Menú)
const {
  leftDrawerOpen,
  userData,
  showChangePassword,
  isAdmin,
  userTipoMenu,
  userName,
  userDependency,
  userRole,
  toggleLeftDrawer,
  handleLogout,
  handleLogoutLocal,
  canAccess,
} = useMainLayout();

const globalLlenaderoPromptRef = ref(null);
const globalLlenaderosList = ref([]);

const handleChangeLlenadero = async () => {
  try {
    $q.loading.show({ message: 'Cargando sedes disponibles...' });
    const response = await api.get('/llenaderos');
    globalLlenaderosList.value = response.data?.data || response.data || [];
    if (globalLlenaderoPromptRef.value) {
      globalLlenaderoPromptRef.value.openForce();
    }
  } catch (error) {
    console.error("Error cargando llenaderos para menú", error);
    $q.notify({ type: 'negative', message: 'No se pudieron cargar las sedes' });
  } finally {
    $q.loading.hide();
  }
};

const onGlobalLlenaderoSaved = (id) => {
  $q.notify({
    type: 'positive',
    message: 'Sedes actualizadas correctamente',
    position: 'top'
  });
  window.dispatchEvent(new CustomEvent('globalLlenaderoUpdated'));
};
</script>

<style scoped>
/* Estilos mínimos usando clases nativas de Quasar */
:deep(.q-drawer .q-item--active) {
  background-color: var(--q-primary);
  color: white;
}
</style>

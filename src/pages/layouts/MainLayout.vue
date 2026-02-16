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
      <SidebarMenu :is-admin="isAdmin" :can-access="canAccess" />
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
  </q-layout>
</template>

<script setup>
import { useMainLayout } from "./composables/useMainLayout.js";
import SidebarMenu from "./components/SidebarMenu.vue";
import ChangePasswordDialog from "../../components/users/ChangePasswordDialog.vue";

// Extraemos toda la lógica al composable (Sockets, Inactividad, Auth, Menú)
const {
  leftDrawerOpen,
  showChangePassword,
  isAdmin,
  userName,
  userDependency,
  userRole,
  toggleLeftDrawer,
  handleLogout,
  handleLogoutLocal,
  canAccess,
} = useMainLayout();
</script>

<style scoped>
/* Estilos mínimos usando clases nativas de Quasar */
:deep(.q-drawer .q-item--active) {
  background-color: var(--q-primary);
  color: white;
}
</style>

<template>
  <q-layout view="lHh Lpr lFf">
    <!-- ================================== -->
    <!--          BARRA SUPERIOR (HEADER)   -->
    <!-- ================================== -->
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <!-- 
          --- CAMBIO CLAVE AQUÍ ---
          - Se elimina la clase 'lt-md'. Ahora el botón es siempre visible.
          - @click llama a 'toggleLeftDrawer' para abrir/cerrar el menú.
        -->
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>SIRECC</q-toolbar-title>

        <q-space />

        <q-btn flat round dense icon="logout" @click="handleLogout">
          <q-tooltip class="bg-primary text-body2">Cerrar Sesión</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- ================================== -->
    <!--          MENÚ LATERAL (DRAWER)     -->
    <!-- ================================== -->
    <!--
      --- CAMBIOS CLAVE AQUÍ ---
      - Se elimina 'show-if-above', ':mini', '@mouseover', '@mouseout'.
      - El drawer ahora es un menú 'overlay' simple, controlado solo por 'v-model'.
    -->
    <q-drawer v-model="leftDrawerOpen" bordered :width="250" class="bg-grey-2">
      <q-list>
        <q-item-label header class="text-grey-8"> Navegación </q-item-label>

        <!-- El @click para cerrar el menú ahora funciona en todos los tamaños -->
        <q-item clickable v-ripple to="/" @click="leftDrawerOpen = false">
          <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
          <q-item-section>Dashboard</q-item-section>
        </q-item>

        <!-- ================================== -->
        <!--          CONFIGURACIÓN             -->
        <!-- ================================== -->
        <q-expansion-item
          expand-separator
          icon="settings"
          label="Configuración"
          class="text-grey-8"
        >
          <q-expansion-item
            expand-separator
            icon="category"
            label="Gerencias y Entes"
            class="text-grey-8"
          >
            <q-list class="q-pl-md"
              ><q-item clickable v-ripple to="/categorias">
                <q-item-section avatar
                  ><q-icon name="business_center"
                /></q-item-section>
                <q-item-section>Categorías</q-item-section>
              </q-item>
              <q-item clickable v-ripple to="/dependencias">
                <q-item-section avatar><q-icon name="domain" /></q-item-section>
                <q-item-section>Dependencias</q-item-section>
              </q-item>
              <q-item
                clickable
                v-ripple
                to="/subdependencias"
                @click="leftDrawerOpen = false"
              >
                <q-item-section avatar><q-icon name="list" /></q-item-section>
                <q-item-section>Subdependencias</q-item-section>
              </q-item>
            </q-list>
          </q-expansion-item>

          <q-list class="q-pl-md">
            <q-item
              clickable
              v-ripple
              to="/usuarios"
              @click="leftDrawerOpen = false"
            >
              <q-item-section avatar><q-icon name="group" /></q-item-section>
              <q-item-section>Usuarios</q-item-section>
            </q-item>

            <q-item
              clickable
              v-ripple
              to="/tipos-combustible"
              @click="leftDrawerOpen = false"
            >
              <q-item-section avatar><q-icon name="category" /></q-item-section>
              <q-item-section>Tipos de Combustible</q-item-section>
            </q-item>

            <q-item
              clickable
              v-ripple
              to="/cupos"
              @click="leftDrawerOpen = false"
            >
              <q-item-section avatar
                ><q-icon name="assignment"
              /></q-item-section>
              <q-item-section>Gestión de Cupos</q-item-section>
            </q-item>
            <!-- Huella -->
            <q-item
              clickable
              v-ripple
              to="/huella"
              @click="leftDrawerOpen = false"
            >
              <q-item-section avatar
                ><q-icon name="fingerprint"
              /></q-item-section>
              <q-item-section>Huella</q-item-section>
            </q-item>

            <!-- Vehículos -->

            <!-- Tanques -->
          </q-list>
        </q-expansion-item>

        <!-- ================================== -->
        <!--          GESTIÓN DE CUPOS          -->
        <!-- ================================== -->
      </q-list>
    </q-drawer>

    <!-- ================================== -->
    <!--       CONTENEDOR DE LA PÁGINA      -->
    <!-- ================================== -->
    <q-page-container>
      <!-- El <router-view> no necesita cambios -->
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from "vue";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";

const $q = useQuasar();
const router = useRouter();

// El único estado que necesitamos para el drawer
const leftDrawerOpen = ref(false);

// La única función que necesitamos para controlar el drawer
const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};

const handleLogout = () => {
  $q.notify({
    message: "Has cerrado sesión.",
    color: "info",
    icon: "info",
    position: "top",
    timeout: 2000,
  });
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  router.replace("/login");
};
</script>

<style scoped>
/* El estilo para el ítem activo sigue siendo útil */
:deep(.q-drawer .q-item--active) {
  background-color: var(--q-primary);
  color: white;
}

/* Estilo para los ítems de la sub-lista */
:deep(.q-expansion-item__content .q-item) {
  min-height: 48px;
}

:deep(.q-expansion-item__content .q-item__section--avatar) {
  min-width: 40px;
}
</style>

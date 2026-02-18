<template>
  <q-page class="q-pa-md bg-grey-2">
    <div class="row q-col-gutter-md justify-center">
      <!-- HEADER -->
      <div class="col-12 row items-center justify-between q-mb-sm">
        <div class="text-h4 text-weight-bold text-primary">
          Estado de Llenaderos SIRECC
        </div>
        <q-btn
          flat
          icon="refresh"
          color="primary"
          label="Actualizar"
          @click="fetchStats"
          :loading="loading"
        />
      </div>

      <!-- LLENADEROS (LiquidLlenadero con Konva) -->
      <div
        v-for="ll in stats.llenaderos"
        :key="ll.id_llenadero"
        class="col-12 col-sm-6 col-md-3 col-lg-2"
      >
        <LiquidLlenadero :llenadero="ll" class="tank-card-compact" />
      </div>

      <!-- MENSAJE SI NO HAY DATOS -->
      <div
        v-if="stats.llenaderos.length === 0 && !loading"
        class="col-12 flex flex-center q-pa-xl"
      >
        <q-banner class="bg-warning text-white rounded-borders">
          No se encontraron llenaderos activos registrados en el sistema.
        </q-banner>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import api from "../api/index";
import LiquidLlenadero from "../components/LiquidLlenadero.vue";
import socket from "../services/socket.js";
import { useQuasar } from "quasar";

const $q = useQuasar();
const loading = ref(false);
const stats = ref({
  llenaderos: [],
});

async function fetchStats() {
  loading.value = true;
  try {
    const res = await api.get("/dashboard/stats");
    stats.value = res.data;
  } catch (error) {
    console.error("Error Dashboard Stats:", error);
    $q.notify({
      type: "negative",
      message: "Error al cargar estadísticas del dashboard",
      position: "top-right",
    });
  } finally {
    loading.value = false;
  }
}

/**
 * Configura los listeners de Socket.io para actualización en tiempo real
 */
function setupSocketListeners() {
  // Cuando se actualiza un llenadero (movimientos, evaporación)
  socket.on("llenadero:actualizado", (data) => {
    console.log("Socket: llenadero:actualizado", data);
    fetchStats();
  });

  // Cuando se crea un nuevo llenadero
  socket.on("llenadero:creado", () => {
    fetchStats();
  });

  // Cuando se procesa una carga de cisterna
  socket.on("carga:creada", () => {
    fetchStats();
  });

  // Cuando se despacha una solicitud (se resta inventario)
  socket.on("solicitud:despachada", () => {
    fetchStats();
  });
}

/**
 * Limpia los listeners al desmontar el componente
 */
function cleanupSocketListeners() {
  socket.off("llenadero:actualizado");
  socket.off("llenadero:creado");
  socket.off("carga:creada");
  socket.off("solicitud:despachada");
}

onMounted(() => {
  fetchStats();
  setupSocketListeners();
});

onUnmounted(() => {
  cleanupSocketListeners();
});
</script>

<style scoped>
.tank-card-compact {
  max-width: 300px;
  margin: 0 auto;
}
</style>

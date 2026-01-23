<template>
  <q-page class="bg-grey-2 q-pb-xl">
    <!-- Header Dashboard -->
    <div class="bg-white q-py-md q-px-lg shadow-1 q-mb-lg">
      <div class="row items-center justify-between">
        <div>
          <div class="text-h5 text-weight-bold text-grey-9">
            Monitor de Combustible
          </div>
          <div class="text-subtitle2 text-grey-6 flex items-center" v-if="user">
            <q-icon name="person_outline" class="q-mr-xs" />
            Operador: {{ user.nombre }} {{ user.apellido }}
          </div>
        </div>

        
      </div>
    </div>

    
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
//import api from "../api/index.js";
import LiquidTank from "../components/LiquidTank.vue";
import { useQuasar } from "quasar";

const router = useRouter();
const $q = useQuasar();

const user = ref(null);
const tanks = ref([]);
const loading = ref(false);

onMounted(async () => {
  const userData = localStorage.getItem("user");
  if (userData) {
    user.value = JSON.parse(userData);
  }
 // await fetchTanks();
});

/*const fetchTanks = async () => {
  loading.value = true;
  try {
    const response = await api.get("/tanques/lista");
    tanks.value = Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error cargando tanques:", error);
    $q.notify({
      type: "negative",
      message: "Error al cargar datos de tanques",
      position: "bottom-right",
    });
  } finally {
    loading.value = false;
  }
};*/

const handleLogout = () => {
  $q.dialog({
    title: "Cerrar Sesión",
    message: "¿Estás seguro que deseas salir del sistema?",
    cancel: true,
    persistent: true,
  }).onOk(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/login");
  });
};
</script>

<style scoped>
.max-width-container {
  max-width: 1600px;
  margin: 0 auto;
}
</style>

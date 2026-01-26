<!-- src/pages/LoginPage.vue -->

<template>
  <q-layout>
    <q-page-container>
      <q-page class="flex flex-center bg-grey-2">
        <q-card class="q-pa-md shadow-2 my-card" bordered>
          <q-card-section class="text-center">
            <!-- Coloca tu logo en la carpeta `public` -->
            <div class="text-grey-8">
              <b>
                Gerencia de Tecnologia y de Información TI
                <b>Sistema de Registro y Control de Combustible</b></b
              >
            </div>

            <q-img
              src="logo.png"
              alt="Logo del Sistema"
              style="width: 150px; height: 150px; margin-bottom: 20px"
              fit="contain"
            />
            <div class="text-grey-9 text-h5 text-weight-bold">Bienvenido</div>
            <div class="text-grey-8">Inicia sesión para continuar</div>
          </q-card-section>

          <q-card-section>
            <q-form @submit.prevent="handleLogin" class="q-gutter-md">
              <q-input
                filled
                v-model="cedula"
                label="Cédula"
                lazy-rules
                :rules="[(val) => !!val || 'La cédula es obligatoria']"
              >
                <template v-slot:prepend>
                  <q-icon name="person" />
                </template>
              </q-input>

              <q-input
                filled
                v-model="password"
                type="password"
                label="Contraseña"
                lazy-rules
                :rules="[(val) => !!val || 'La contraseña es obligatoria']"
              >
                <template v-slot:prepend>
                  <q-icon name="lock" />
                </template>
              </q-input>

              <q-card-actions class="q-px-md">
                <q-btn
                  unelevated
                  color="light-green-7"
                  size="lg"
                  class="full-width"
                  label="Iniciar Sesión"
                  type="submit"
                  :loading="loading"
                />
              </q-card-actions>
            </q-form>
          </q-card-section>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
// ¡Importante! Importamos nuestra instancia de Axios desde la nueva ubicación
import api from "../api"; // Ajusta la ruta si es necesario

const cedula = ref("");
const password = ref("");
const loading = ref(false);

const router = useRouter();
const $q = useQuasar();

const handleLogin = async () => {
  try {
    loading.value = true;

    const response = await api.post("/usuarios/login", {
      cedula: cedula.value,
      password: password.value,
    });

    // Desestructuramos la respuesta del backend
    const { token, usuario } = response.data;

    // --- ¡CLAVE! GUARDAMOS EL TOKEN EN LOCALSTORAGE ---
    // Esto hace que el token persista aunque se cierre el navegador.
    localStorage.setItem("token", token);

    // También guardamos los datos del usuario para mostrarlos fácilmente
    localStorage.setItem("user", JSON.stringify(usuario));

    $q.notify({
      type: "positive",
      message: `¡Bienvenido, ${usuario.nombre}!`,
      position: "top",
    });

    router.push("/");
  } catch (error) {
    console.error("Error en el login:", error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.my-card {
  width: 100%;
  max-width: 400px;
  border-radius: 20px;
}
</style>

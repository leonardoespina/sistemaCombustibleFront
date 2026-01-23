<!-- src/pages/ErrorNotFound.vue -->

<template>
  <div class="fullscreen bg-blue-grey-1 text-primary text-center q-pa-md flex flex-center">
    <div>
      <div style="font-size: 20vh; opacity: 0.8;">
        404
      </div>

      <div class="text-h2" style="opacity:.6">
        Oops. Nada por aquí...
      </div>

      <q-btn
        class="q-mt-xl"
        color="white"
        text-color="primary"
        unelevated
        to="/"
        label="Volver al Inicio"
        no-caps
        icon="home"
      />
    </div>
  </div>
</template>

<script setup>
// No se necesita lógica de script para esta página estática
</script>

<style scoped>
/* La clase 'fullscreen' de Quasar se encarga de que ocupe toda la pantalla */
</style>
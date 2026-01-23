<template>
  <q-card class="column full-height" style="max-width: 800px; width: 100%">
    <q-card-section class="row items-center q-pb-none">
      <div class="text-h6">Capturar Foto</div>
      <q-space />
      <q-btn icon="close" flat round dense v-close-popup />
    </q-card-section>

    <q-card-section
      class="col q-pa-none relative-position flex flex-center bg-black overflow-hidden"
    >
      <video
        ref="videoElement"
        autoplay
        playsinline
        class="absolute-full full-width full-height"
        style="object-fit: cover"
      ></video>

      <div v-if="isLoading" class="absolute-center text-white">
        <q-spinner size="3em" />
        <div class="q-mt-sm">Iniciando cámara...</div>
      </div>

      <div
        v-if="error"
        class="absolute-center text-negative text-center q-pa-md"
      >
        <q-icon name="error" size="3em" />
        <div class="q-mt-sm">{{ error }}</div>
        <q-btn
          label="Reintentar"
          color="primary"
          class="q-mt-md"
          @click="startCamera(videoElement)"
        />
      </div>
    </q-card-section>

    <q-card-actions align="center" class="q-pa-md bg-grey-2">
      <q-btn
        color="primary"
        icon="camera_alt"
        label="Capturar"
        size="lg"
        @click="handleCapture"
        :disable="isLoading || !!error || !stream"
      />
      <q-btn flat label="Cancelar" color="negative" v-close-popup />
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useCamera } from "../composables/useCamera";

const emit = defineEmits(["capture"]);
const videoElement = ref(null);

const { stream, error, isLoading, startCamera, stopCamera, takePhoto } =
  useCamera();

const handleCapture = async () => {
  try {
    const photoBlob = await takePhoto(videoElement);
    emit("capture", photoBlob);
  } catch (err) {
    console.error("Error al capturar:", err);
  }
};

onMounted(() => {
  startCamera(videoElement);
});

onUnmounted(() => {
  stopCamera();
});
</script>

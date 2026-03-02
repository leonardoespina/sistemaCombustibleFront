import { ref } from "vue";

export function useCamera() {
  const stream = ref(null);
  const error = ref(null);
  const isLoading = ref(false);

  const startCamera = async (videoElement) => {
    isLoading.value = true;
    error.value = null;

    // Constraints ideales (trasera, HD)
    const constraints = {
      audio: false,
      video: {
        facingMode: "environment",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    };

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Tu navegador no soporta acceso a la cámara");
      }

      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr) {
        console.warn(
          "Falló acceso a cámara trasera, intentando configuración básica:",
          firstErr
        );
        // Fallback: Cualquier cámara disponible
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: true,
        });
      }

      stream.value = mediaStream;

      if (videoElement && videoElement.value) {
        videoElement.value.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error al acceder a la cámara:", err);

      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        error.value =
          "Permiso denegado. Habilite el acceso a la cámara en su navegador.";
      } else if (
        err.name === "NotFoundError" ||
        err.name === "DevicesNotFoundError"
      ) {
        error.value = "No se encontró ninguna cámara en este dispositivo.";
      } else if (
        err.name === "NotReadableError" ||
        err.name === "TrackStartError"
      ) {
        error.value =
          "La cámara está siendo usada por otra aplicación o error de hardware.";
      } else if (window.isSecureContext === false) {
        error.value = "La cámara requiere conexión segura (HTTPS) o localhost.";
      } else {
        error.value = `No se pudo acceder a la cámara: ${
          err.message || err.name
        }`;
      }
    } finally {
      isLoading.value = false;
    }
  };

  const stopCamera = () => {
    if (stream.value) {
      stream.value.getTracks().forEach((track) => track.stop());
      stream.value = null;
    }
  };

  const takePhoto = (videoElement) => {
    return new Promise((resolve, reject) => {
      if (!videoElement || !videoElement.value) {
        reject(new Error("Elemento de video no disponible"));
        return;
      }

      const video = videoElement.value;
      const canvas = document.createElement("canvas");

      // Ajustar dimensiones del canvas al video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convertir a Blob (más eficiente que base64 para imágenes grandes)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Error al generar la imagen"));
          }
        },
        "image/jpeg",
        0.85
      ); // Calidad 0.85 para balancear tamaño/calidad
    });
  };

  return {
    stream,
    error,
    isLoading,
    startCamera,
    stopCamera,
    takePhoto,
  };
}

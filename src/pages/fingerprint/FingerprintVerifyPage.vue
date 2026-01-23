<!-- src/pages/FingerprintVerifyPage.vue -->
<template>
  <q-page class="flex flex-center bg-grey-2">
    <q-card style="width: 450px; border-radius: 16px" class="shadow-10">
      <q-card-section class="bg-primary text-white text-center q-pa-lg">
        <q-icon name="fingerprint" size="80px" class="q-mb-md" />
        <div class="text-h5 text-weight-bold text-uppercase">
          Verificación de Identidad
        </div>
        <div class="text-subtitle2 opacity-80">
          Coloque su huella en el lector para continuar
        </div>
      </q-card-section>

      <q-card-section class="q-pa-xl text-center">
        <!-- CI Input (Pass 1) -->
        <div class="q-mb-xl">
          <q-input
            v-model="cedulaBusqueda"
            label="Cédula de Identidad"
            outlined
            rounded
            dense
            bg-color="white"
            class="shadow-2"
            @keyup.enter="toggleSensor"
            :disable="capturing || personaIdentificada"
          >
            <template v-slot:prepend
              ><q-icon name="badge" color="primary"
            /></template>
          </q-input>
          <div class="text-caption text-grey-6 q-mt-xs">
            Ingrese la cédula para habilitar el sensor
          </div>
        </div>

        <!-- Sensor Status Indicator -->
        <div class="column items-center q-mb-xl">
          <q-circular-progress
            indeterminate
            size="120px"
            :thickness="0.1"
            color="primary"
            track-color="grey-3"
            class="q-ma-md"
            v-if="verifying"
          />
          <q-avatar
            size="120px"
            :color="statusColor"
            text-color="white"
            :icon="statusIcon"
            class="shadow-5"
            v-else
          />
          <div :class="`text-h6 q-mt-md text-${statusColor}`">
            {{ statusMessage }}
          </div>
        </div>

        <!-- Identification Result -->
        <q-slide-transition>
          <div
            v-if="personaIdentificada"
            class="bg-blue-1 q-pa-md rounded-borders border-blue"
          >
            <div class="text-subtitle1 text-weight-bold text-blue-9">
              Persona Identificada:
            </div>
            <div class="text-h5 text-dark">
              {{ personaIdentificada.nombre }}
            </div>
            <div class="text-caption text-grey-7">
              Cédula: {{ personaIdentificada.cedula }}
            </div>
            <q-chip dense color="blue-9" text-color="white" class="q-mt-sm">{{
              personaIdentificada.rol
            }}</q-chip>
          </div>
        </q-slide-transition>

        <!-- Action Buttons -->
        <div class="column q-gutter-y-sm q-mt-xl">
          <q-btn
            :label="capturing ? 'Sensor Activo...' : 'Activar Lector'"
            :color="capturing ? 'negative' : 'primary'"
            :icon="capturing ? 'stop' : 'play_arrow'"
            unelevated
            rounded
            size="lg"
            @click="toggleSensor"
          />
          <q-btn
            v-if="personaIdentificada"
            flat
            label="Nueva Verificación"
            color="grey-7"
            @click="reset"
          />
        </div>
      </q-card-section>

      <!-- Connection Alert -->
      <q-inner-loading :showing="!readerConnected">
        <q-spinner-gears size="50px" color="primary" />
        <div class="text-grey-9 q-mt-md text-weight-bold">
          Esperando Lector USB...
        </div>
      </q-inner-loading>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useQuasar } from "quasar";
import api from "../../api";
import websdkUrl from "../../components/fingerprint/websdk.client.ui.js?url";
import fingerprintSdkUrl from "../../components/fingerprint/fingerprint.sdk.min.js?url";

const $q = useQuasar();

// Estados de UI
const verifying = ref(false);
const capturing = ref(false);
const readerConnected = ref(false);
const statusColor = ref("grey-5");
const statusIcon = ref("fingerprint");
const statusMessage = ref("Lector en espera");
const personaIdentificada = ref(null);
const cedulaBusqueda = ref("");

let fingerprintApi = null;
let Fingerprint = null;

// Lógica de Verificación
const toggleSensor = async () => {
  if (capturing.value) {
    await stopCapture();
  } else {
    if (!cedulaBusqueda.value) {
      $q.notify({ type: "warning", message: "Debe ingresar una cédula" });
      return;
    }
    personaIdentificada.value = null;
    statusColor.value = "primary";
    statusMessage.value = "Coloque su dedo...";
    await startCapture();
  }
};

const startCapture = async () => {
  try {
    // IMPORTANTE: Usar PngImage para compatibilidad con SourceAFIS
    await fingerprintApi.startAcquisition(Fingerprint.SampleFormat.PngImage);
    capturing.value = true;
  } catch (e) {
    $q.notify({ type: "negative", message: "Error al activar sensor" });
  }
};

const stopCapture = async () => {
  try {
    await fingerprintApi.stopAcquisition();
    capturing.value = false;
  } catch (e) {}
};

const onSamplesAcquired = async (event) => {
  const sampleDataArr = JSON.parse(event.samples);
  if (sampleDataArr.length > 0) {
    const sampleObj = sampleDataArr[0];
    const rawData = typeof sampleObj === "string" ? sampleObj : sampleObj.Data;

    if (!rawData) return;

    // Convertir datos del SDK a imagen PNG Base64 estándar
    let pngBase64 = "";
    if (event.sampleFormat === Fingerprint.SampleFormat.PngImage) {
      const pngData = Fingerprint.b64UrlToUtf8(rawData);
      pngBase64 = btoa(pngData);
      console.log("PNG Base64 para verificación, longitud:", pngBase64.length);
    } else {
      console.warn("Formato no esperado:", event.sampleFormat);
      return;
    }

    await verifyFmd(pngBase64);
  }
};

const verifyFmd = async (fmd) => {
  verifying.value = true;
  statusMessage.value = "Procesando...";

  try {
    // 1. Intentar matching via backend (comparación 1:1 optimizada)
    const { data } = await api.post("/biometria/verificar", {
      cedula: cedulaBusqueda.value,
      muestraActual: fmd,
    });

    if (data.match) {
      statusColor.value = "positive";
      statusIcon.value = "check_circle";
      statusMessage.value = "¡Verificación Exitosa!";
      personaIdentificada.value = data.persona;
      await stopCapture();
    } else {
      handleVerificationFailure();
    }
  } catch (error) {
    console.error("Error en verificación:", error);
    handleVerificationFailure();
  } finally {
    verifying.value = false;
  }
};

const handleVerificationFailure = () => {
  statusColor.value = "warning";
  statusIcon.value = "replay";
  statusMessage.value = "No coincide. Intente de nuevo...";

  $q.notify({
    color: "orange-8",
    message: "Huella no reconocida, intente con otro dedo",
    icon: "fingerprint",
    timeout: 1500,
  });

  setTimeout(() => {
    if (capturing.value && !personaIdentificada.value) {
      statusColor.value = "primary";
      statusIcon.value = "fingerprint";
      statusMessage.value = "Coloque su dedo...";
    }
  }, 2000);
};

const reset = () => {
  personaIdentificada.value = null;
  cedulaBusqueda.value = "";
  statusColor.value = "grey-5";
  statusIcon.value = "fingerprint";
  statusMessage.value = "Lector en espera";
};

// Inicialización de SDK (Reutilizado de FingerprintCapture)
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const initApi = async () => {
  try {
    if (!window.WebSdk) await loadScript(websdkUrl);
    if (!window.Fingerprint) await loadScript(fingerprintSdkUrl);
    Fingerprint = window.Fingerprint;
    fingerprintApi = new Fingerprint.WebApi();

    fingerprintApi.onSamplesAcquired = onSamplesAcquired;
    fingerprintApi.onDeviceConnected = () => {
      readerConnected.value = true;
    };
    fingerprintApi.onDeviceDisconnected = () => {
      readerConnected.value = false;
    };

    const devices = await fingerprintApi.enumerateDevices();
    if (devices.length > 0) readerConnected.value = true;
  } catch (e) {
    console.error(e);
  }
};

// Función de comparación de templates FMD (Fuzzy Binary Match)

onMounted(initApi);
onBeforeUnmount(stopCapture);
</script>

<style scoped>
.border-blue {
  border: 1px solid #90caf9;
}
</style>

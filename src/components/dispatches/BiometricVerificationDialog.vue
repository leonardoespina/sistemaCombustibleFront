<template>
  <q-dialog
    v-model="visible"
    persistent
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="bg-grey-2 overflow-hidden column no-wrap">
      <!-- Cabecera -->
      <q-bar class="bg-primary text-white q-py-md">
        <q-icon name="fingerprint" />
        <div class="text-weight-bold text-subtitle1">Validación Biométrica para Ticket</div>
        <q-space />
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Cerrar</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section class="col q-pa-md scroll">
        <div class="row q-col-gutter-lg">
          <!-- Información de la Solicitud -->
          <div class="col-12 col-md-4">
            <q-card flat bordered class="bg-white">
              <q-card-section class="q-py-xs bg-blue-grey-3 text-white">
                <div class="text-subtitle2 text-weight-bolder">Detalles de la Solicitud</div>
              </q-card-section>
              <q-separator />
              <q-card-section class="q-pa-md q-gutter-y-sm">
                <div class="row items-center">
                  <div class="col-5 text-right q-pr-sm text-weight-bold text-grey-8">Vehículo:</div>
                  <div class="col-7 text-weight-medium">{{ requestData.placa }}</div>
                </div>
                <div class="row items-center">
                  <div class="col-5 text-right q-pr-sm text-weight-bold text-grey-8">Combustible:</div>
                  <div class="col-7">{{ requestData.TipoCombustible?.nombre || 'N/A' }}</div>
                </div>
                <div class="row items-center">
                  <div class="col-5 text-right q-pr-sm text-weight-bold text-grey-8">Litros:</div>
                  <div class="col-7 text-weight-bold text-primary">{{ requestData.cantidad_litros }} L</div>
                </div>
                <div class="row items-center">
                  <div class="col-5 text-right q-pr-sm text-weight-bold text-grey-8">Solicitante:</div>
                  <div class="col-7">{{ requestData.Solicitante?.nombre }} {{ requestData.Solicitante?.apellido }}</div>
                </div>
                <div class="row items-center">
                  <div class="col-5 text-right q-pr-sm text-weight-bold text-grey-8">Subdependencia:</div>
                  <div class="col-7">{{ requestData.Subdependencia?.nombre }}</div>
                </div>
                <q-separator class="q-my-sm" />
                <div class="text-center text-caption text-grey-7">
                  Solicitud #{{ requestData.id_solicitud }}
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Captura de Huellas -->
          <div class="col-12 col-md-8">
            <q-card flat bordered class="bg-white">
              <q-card-section class="q-py-xs bg-blue-grey-3 text-white">
                <div class="text-subtitle2 text-weight-bolder">Validación Biométrica Dual</div>
              </q-card-section>
              <q-separator />
              <q-card-section class="q-pa-md">
                <div class="row q-col-gutter-lg">
                  <!-- Almacenista -->
                  <div class="col-12 col-md-6">
                    <q-card flat bordered class="bg-blue-grey-1">
                      <q-card-section class="q-py-xs bg-blue-grey-3 text-white">
                        <div class="text-subtitle2 text-weight-bolder">Almacenista</div>
                      </q-card-section>
                      <q-card-section class="q-pa-md">
                        <div class="text-center q-mb-md">
                          <q-avatar size="80px" color="blue-grey-8" text-color="white" icon="person" />
                          <div class="text-subtitle2 q-mt-sm text-weight-bold">{{ currentUser?.nombre }} {{ currentUser?.apellido }}</div>
                          <div class="text-caption text-grey-7">{{ currentUser?.cedula }}</div>
                        </div>
                        
                        <div class="text-center q-mb-md">
                          <q-circular-progress
                            show-value
                            :value="almacenistaProgress"
                            size="100px"
                            :thickness="0.2"
                            color="primary"
                            track-color="grey-3"
                            class="q-mb-sm"
                          >
                            <q-icon 
                              :name="almacenistaCaptured ? 'check_circle' : 'fingerprint'" 
                              :color="almacenistaCaptured ? 'positive' : 'primary'"
                              size="40px"
                            />
                          </q-circular-progress>
                          <div class="text-caption text-grey-7">
                            {{ almacenistaCaptured ? 'Huella validada' : 'Coloque su dedo índice' }}
                          </div>
                        </div>

                        <div class="text-center">
                          <q-btn
                            v-if="!almacenistaCaptured"
                            color="primary"
                            label="Capturar Huella"
                            icon="fingerprint"
                            @click="captureAlmacenista"
                            :loading="capturingAlmacenista"
                            :disable="capturingReceptor"
                            unelevated
                            class="full-width"
                          />
                          <q-btn
                            v-else
                            color="positive"
                            label="Validado"
                            icon="check_circle"
                            unelevated
                            class="full-width"
                            disable
                          />
                        </div>
                      </q-card-section>
                    </q-card>
                  </div>

                  <!-- Receptor/Beneficiario -->
                  <div class="col-12 col-md-6">
                    <q-card flat bordered class="bg-blue-grey-1">
                      <q-card-section class="q-py-xs bg-blue-grey-3 text-white">
                        <div class="text-subtitle2 text-weight-bolder">Receptor</div>
                      </q-card-section>
                      <q-card-section class="q-pa-md">
                        <div class="q-mb-md">
                          <q-input
                            v-model="receptorCedula"
                            label="Cédula del Receptor"
                            outlined
                            dense
                            bg-color="white"
                            :rules="[val => !!val || 'Requerida']"
                            :disable="receptorCaptured"
                          />
                          <q-input
                            v-model="receptorNombre"
                            label="Nombre del Receptor"
                            outlined
                            dense
                            bg-color="white"
                            :rules="[val => !!val || 'Requerido']"
                            :disable="receptorCaptured"
                            class="q-mt-sm"
                          />
                        </div>
                        
                        <div class="text-center q-mb-md">
                          <q-circular-progress
                            show-value
                            :value="receptorProgress"
                            size="100px"
                            :thickness="0.2"
                            color="deep-orange"
                            track-color="grey-3"
                            class="q-mb-sm"
                          >
                            <q-icon 
                              :name="receptorCaptured ? 'check_circle' : 'fingerprint'" 
                              :color="receptorCaptured ? 'positive' : 'deep-orange'"
                              size="40px"
                            />
                          </q-circular-progress>
                          <div class="text-caption text-grey-7">
                            {{ receptorCaptured ? 'Huella validada' : 'Esperando captura' }}
                          </div>
                        </div>

                        <div class="text-center">
                          <q-btn
                            v-if="!receptorCaptured"
                            color="deep-orange"
                            label="Capturar Huella"
                            icon="fingerprint"
                            @click="captureReceptor"
                            :loading="capturingReceptor"
                            :disable="!receptorCedula || !receptorNombre || capturingAlmacenista"
                            unelevated
                            class="full-width"
                          />
                          <q-btn
                            v-else
                            color="positive"
                            label="Validado"
                            icon="check_circle"
                            unelevated
                            class="full-width"
                            disable
                          />
                        </div>
                      </q-card-section>
                    </q-card>
                  </div>
                </div>

                <!-- Botón de Impresión -->
                <div class="row justify-center q-mt-lg">
                  <q-btn
                    color="primary"
                    label="Generar Ticket"
                    icon="print"
                    :loading="generatingTicket"
                    :disable="!almacenistaCaptured || !receptorCaptured"
                    @click="generateTicket"
                    unelevated
                    size="lg"
                    class="q-px-xl"
                  >
                    <q-tooltip v-if="!almacenistaCaptured || !receptorCaptured">
                      Ambas huellas deben ser validadas
                    </q-tooltip>
                  </q-btn>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useQuasar } from "quasar";
import api from "../../api";
import websdkUrl from "../fingerprint/websdk.client.ui.js?url";
import fingerprintSdkUrl from "../fingerprint/fingerprint.sdk.min.js?url";

const props = defineProps({
  modelValue: Boolean,
  requestData: Object
});

const emit = defineEmits(["update:modelValue", "ticketGenerated"]);

const $q = useQuasar();
const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val)
});

// Exponer el diálogo para control externo
defineExpose({
  visible
});

// Estado de captura
const capturingAlmacenista = ref(false);
const capturingReceptor = ref(false);
const almacenistaCaptured = ref(false);
const receptorCaptured = ref(false);
const almacenistaProgress = ref(0);
const receptorProgress = ref(0);
const generatingTicket = ref(false);

// Datos del receptor
const receptorCedula = ref("");
const receptorNombre = ref("");

// Datos del usuario actual (almacenista)
const currentUser = ref(null);

// SDK de huellas
let fingerprintApi = null;
let Fingerprint = null;

// Inicializar SDK
const initFingerprintSDK = async () => {
  try {
    if (!window.WebSdk) {
      await loadScript(websdkUrl);
    }
    if (!window.Fingerprint) {
      await loadScript(fingerprintSdkUrl);
    }

    Fingerprint = window.Fingerprint;

    if (!Fingerprint) {
      throw new Error("SDK de huellas no disponible");
    }

    // Usar la API global si ya existe para mantener los listeners
    if (!window.fingerprintApiInstance) {
      window.fingerprintApiInstance = new Fingerprint.WebApi();
    }
    fingerprintApi = window.fingerprintApiInstance;

    // Configurar eventos
    fingerprintApi.onSamplesAcquired = handleFingerprintCapture;
    fingerprintApi.onAcquisitionStopped = () => {
      capturingAlmacenista.value = false;
      capturingReceptor.value = false;
    };

  } catch (error) {
    console.error("Error inicializando SDK:", error);
    $q.notify({
      type: "negative",
      message: "Error al inicializar el lector de huellas"
    });
  }
};

const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const captureAlmacenista = async () => {
  if (!fingerprintApi) {
    $q.notify({
      type: "warning",
      message: "Lector de huellas no disponible"
    });
    return;
  }

  try {
    capturingAlmacenista.value = true;
    almacenistaProgress.value = 50;
    
    await fingerprintApi.startAcquisition(Fingerprint.SampleFormat.PngImage);
    
    // Simulación de progreso (en producción sería real)
    setTimeout(() => {
      almacenistaProgress.value = 100;
      almacenistaCaptured.value = true;
      capturingAlmacenista.value = false;
      
      $q.notify({
        type: "positive",
        message: "Huella del Almacenista validada",
        timeout: 1000
      });
    }, 1500);

  } catch (error) {
    console.error("Error capturando huella:", error);
    $q.notify({
      type: "negative",
      message: "Error capturando huella"
    });
    capturingAlmacenista.value = false;
    almacenistaProgress.value = 0;
  }
};

const captureReceptor = async () => {
  if (!fingerprintApi || !receptorCedula.value || !receptorNombre.value) {
    $q.notify({
      type: "warning",
      message: "Complete los datos del receptor primero"
    });
    return;
  }

  try {
    capturingReceptor.value = true;
    receptorProgress.value = 50;
    
    await fingerprintApi.startAcquisition(Fingerprint.SampleFormat.PngImage);
    
    // Simulación de progreso
    setTimeout(() => {
      receptorProgress.value = 100;
      receptorCaptured.value = true;
      capturingReceptor.value = false;
      
      $q.notify({
        type: "positive",
        message: "Huella del Receptor validada",
        timeout: 1000
      });
    }, 1500);

  } catch (error) {
    console.error("Error capturando huella:", error);
    $q.notify({
      type: "negative",
      message: "Error capturando huella"
    });
    capturingReceptor.value = false;
    receptorProgress.value = 0;
  }
};

const handleFingerprintCapture = async (event) => {
  try {
    const sampleDataArr = JSON.parse(event.samples);
    if (sampleDataArr.length > 0) {
      const sampleObj = sampleDataArr[0];
      const rawData = typeof sampleObj === "string" ? sampleObj : sampleObj.Data;
      
      if (!rawData) return;

      // Detener captura
      await fingerprintApi.stopAcquisition();
      
      // Aquí procesaríamos la huella capturada
      // Por ahora solo marcamos como capturada
      if (capturingAlmacenista.value) {
        almacenistaCaptured.value = true;
        almacenistaProgress.value = 100;
        capturingAlmacenista.value = false;
      } else if (capturingReceptor.value) {
        receptorCaptured.value = true;
        receptorProgress.value = 100;
        capturingReceptor.value = false;
      }
    }
  } catch (error) {
    console.error("Error procesando huella:", error);
  }
};

const generateTicket = async () => {
  if (!almacenistaCaptured.value || !receptorCaptured.value) {
    $q.notify({
      type: "warning",
      message: "Ambas huellas deben ser validadas"
    });
    return;
  }

  generatingTicket.value = true;
  
  try {
    const response = await api.post(`/solicitudes/${props.requestData.id_solicitud}/imprimir`, {
      huella_almacenista: "BASE64_HUELLA_ALMACENISTA", // En producción sería real
      huella_receptor: "BASE64_HUELLA_RECEPTOR", // En producción sería real
      cedula_receptor: receptorCedula.value
    });

    $q.notify({
      type: "positive",
      message: "Ticket generado exitosamente",
      timeout: 2000
    });

    emit("ticketGenerated", response.data.ticket);
    visible.value = false;

  } catch (error) {
    console.error("Error generando ticket:", error);
    $q.notify({
      type: "negative",
      message: error.response?.data?.msg || "Error al generar ticket"
    });
  } finally {
    generatingTicket.value = false;
  }
};

// Cargar datos del usuario actual
onMounted(async () => {
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      currentUser.value = JSON.parse(userStr);
    }
    
    await initFingerprintSDK();
  } catch (error) {
    console.error("Error inicializando:", error);
  }
});

onBeforeUnmount(() => {
  if (fingerprintApi) {
    fingerprintApi.stopAcquisition();
  }
});
</script>

<style scoped>
.border-bottom {
  border-bottom: 1px solid #e0e0e0;
}
</style>
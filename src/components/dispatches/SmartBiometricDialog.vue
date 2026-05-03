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
        <div class="text-weight-bold text-subtitle1">Validación Biométrica Inteligente</div>
        <q-space />
        <q-btn dense flat icon="close" v-close-popup :disable="generatingTicket">
          <q-tooltip>Cancelar</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section class="col q-pa-lg scroll flex flex-center">
        <!-- ESTADO 1: AUTENTICACIÓN INICIAL (Solicitante) -->
        <div v-if="step === 1" class="column items-center q-gutter-y-md" style="max-width: 500px">
          <div class="text-h5 text-primary text-weight-bold">Firma del Solicitante</div>
          <div class="text-subtitle1 text-grey-7 text-center">
            <strong>(Rol Retiro)</strong><br>
            Ingrese la cédula del Solicitante y coloque su huella para iniciar.
          </div>
          
          <q-card flat bordered class="bg-white full-width q-pa-md">
            <q-input
              v-model="cedulaInput"
              label="Cédula de Identidad"
              outlined
              dense
              class="q-mb-md"
              autofocus
              @keyup.enter="captureFingerprint(1)"
              :disable="capturing"
            >
              <template v-slot:prepend><q-icon name="badge" /></template>
            </q-input>

            <div class="text-center">
               <q-circular-progress
                  show-value
                  :value="progress"
                  size="140px"
                  :thickness="0.15"
                  :color="statusColor"
                  track-color="grey-3"
                  class="q-mb-md cursor-pointer shadow-2"
                  @click="captureFingerprint(1)"
               >
                 <!-- Previsualización de huella -->
                 <div v-if="capturedImageSolicitante" class="flex flex-center overflow-hidden" style="width: 100px; height: 100px; border-radius: 50%">
                    <img :src="`data:image/png;base64,${capturedImageSolicitante}`" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.8" />
                 </div>
                 <q-icon 
                   v-else
                   :name="statusIcon" 
                   size="50px" 
                   :color="statusColor"
                 />
               </q-circular-progress>
               <div class="text-caption text-grey-8">
                  <template v-if="validating">
                    <q-spinner-dots :color="statusColor" size="20px" class="q-mr-xs" />
                    {{ statusMessage }}
                  </template>
                  <template v-else>
                    {{ statusMessage }}
                  </template>
                </div>
            </div>
          </q-card>
        </div>

        <!-- ESTADO 2: PROMPT DUAL (Solo si tiene permisos duales) -->
        <div v-if="step === 2" class="column items-center q-gutter-y-md" style="max-width: 600px">
          <q-card flat bordered class="bg-white q-pa-lg text-center">
            <q-avatar size="80px" color="blue-1" text-color="primary" icon="admin_panel_settings" class="q-mb-md" />
            <div class="text-h5 text-weight-bold q-mb-sm">Privilegios de Almacenista Detectados</div>
            <div class="text-body1 text-grey-8 q-mb-lg">
              Hola <strong>{{ usuarioIdentificado?.nombre }}</strong>, el sistema ha detectado que tienes permisos de Almacenista.
              <br><br>
              ¿Deseas autorizar y finalizar la impresión de este ticket en este momento?
            </div>
            
            <div class="row justify-center q-gutter-x-md">
              <q-btn outline color="primary" label="No, solo firmar como Solicitante" @click="proceedAsSolicitante" />
              <q-btn unelevated color="primary" label="SÍ, AUTORIZAR E IMPRIMIR" icon="print" @click="proceedDualAuth" />
            </div>
          </q-card>
        </div>

        <!-- ESTADO 3: AUTENTICACIÓN ALMACENISTA (Segundo Rol) -->
        <div v-if="step === 3" class="column items-center q-gutter-y-md" style="max-width: 500px">
          <div class="text-h5 text-primary text-weight-bold">Firma del Almacenista</div>
          <div class="text-subtitle1 text-grey-7 text-center">
            <strong>(Rol Almacén)</strong><br>
            Debe autorizar el despacho con su huella dactilar.
          </div>

          <q-card flat bordered class="bg-white full-width q-pa-md text-center">
             <div class="q-mb-md">
               <q-input 
                 v-model="cedulaAlmacenistaInput" 
                 label="Cédula del Almacenista" 
                 outlined 
                 dense 
                 :readonly="!!currentUser"
                 :bg-color="currentUser ? 'grey-2' : 'white'"
               >
                 <template v-slot:prepend><q-icon name="badge" /></template>
               </q-input>
             </div>

             <q-circular-progress
                  show-value
                  :value="progress"
                  size="140px"
                  :thickness="0.15"
                  :color="statusColor"
                  track-color="grey-3"
                  class="cursor-pointer shadow-2"
                  @click="captureFingerprint(2)"
               >
                 <div v-if="capturedImageAlmacenista" class="flex flex-center overflow-hidden" style="width: 100px; height: 100px; border-radius: 50%">
                    <img :src="`data:image/png;base64,${capturedImageAlmacenista}`" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.8" />
                 </div>
                 <q-icon v-else :name="statusIcon" size="50px" :color="statusColor" />
              </q-circular-progress>
              
              <div class="text-caption text-grey-8 q-mt-sm">
                 <template v-if="validating">
                   <q-spinner-dots :color="statusColor" size="20px" class="q-mr-xs" />
                   {{ statusMessage }}
                 </template>
                 <template v-else>
                   {{ statusMessage }}
                 </template>
               </div>
               
               <div v-if="currentUser" class="text-caption text-primary q-mt-md">
                  Usuario en sesión: {{ currentUser.nombre }} {{ currentUser.apellido }}
               </div>
          </q-card>
        </div>

        <!-- GENERANDO -->
        <div v-if="step === 4" class="column items-center">
            <q-spinner-dots size="60px" color="primary" />
            <div class="text-h6 q-mt-md text-grey-7">Generando Ticket...</div>
        </div>

      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useQuasar } from "quasar";
import api from "../../api";
import axios from "axios";

const props = defineProps({
  modelValue: Boolean,
  requestData: Object
});

const emit = defineEmits(["update:modelValue", "ticketGenerated"]);
const $q = useQuasar();

// --- STATE ---
const step = ref(1); 
const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val)
});

const progress = ref(0);
const capturing = ref(false);
const validating = ref(false); 
const generatingTicket = ref(false);

// Feedback Visual Dinámico
const statusColor = ref("primary");
const statusIcon = ref("fingerprint");
const statusMessage = ref("Inicie la captura...");

const cedulaInput = ref("");
const cedulaAlmacenistaInput = ref("");
const usuarioIdentificado = ref(null);
const biometriaSolicitante = ref(null); 
const biometriaAlmacenista = ref(null);

const rawFingerprintSolicitante = ref(null);
const rawFingerprintAlmacenista = ref(null);
const capturedImageSolicitante = ref(null); 
const capturedImageAlmacenista = ref(null); 

const currentUser = ref(null); 

// Control de cancelación para peticiones Axios
let captureAbortController = null;
const LOCAL_BIO_API = "http://localhost:8081/api";
let retryTimer = null;

const clearPendingTimers = () => {
    if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
    }
};

const resetState = () => {
  clearPendingTimers();
  step.value = 1;
  progress.value = 0;
  capturing.value = false;
  validating.value = false;
  statusColor.value = "primary";
  statusIcon.value = "fingerprint";
  statusMessage.value = "Inicie la captura...";
  
  cedulaInput.value = "";
  usuarioIdentificado.value = null;
  biometriaSolicitante.value = null;
  biometriaAlmacenista.value = null;
  rawFingerprintSolicitante.value = null;
  rawFingerprintAlmacenista.value = null;
  capturedImageSolicitante.value = null;
  capturedImageAlmacenista.value = null;
  
  if (currentUser.value) {
    cedulaAlmacenistaInput.value = currentUser.value.cedula;
  }
};

// Auto-captura al cambiar de paso
watch(() => step.value, (newStep) => {
  if (!props.modelValue) return;
  clearPendingTimers();
  if (newStep === 1) {
      retryTimer = setTimeout(() => captureFingerprint(1), 500);
  } else if (newStep === 3) {
      retryTimer = setTimeout(() => captureFingerprint(2), 500);
  }
});

// Reiniciar cuando el diálogo se abre
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    resetState();
    checkBiometricReader();
    retryTimer = setTimeout(() => captureFingerprint(1), 800);
  } else {
    clearPendingTimers();
    if (captureAbortController) {
      captureAbortController.abort();
      captureAbortController = null;
    }
  }
});

// --- LIFECYCLE ---
onMounted(async () => {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    currentUser.value = JSON.parse(userStr);
    cedulaAlmacenistaInput.value = currentUser.value.cedula; 
  }
  await checkBiometricReader();
});

onBeforeUnmount(() => {
  clearPendingTimers();
  if (captureAbortController) {
    captureAbortController.abort();
    captureAbortController = null;
  }
});

// --- LOGIC ---
const checkBiometricReader = async () => {
    try {
        await axios.get(`${LOCAL_BIO_API}/status`, { timeout: 3000 });
    } catch (e) {
        $q.notify({
            type:'warning', 
            message: 'No se detecta el servicio biométrico. Verifique que BioMiddleware esté activo.',
            timeout: 3000
        });
    }
};

const captureFingerprint = async (phase) => {
    if (!props.modelValue || capturing.value || validating.value) return;

    if (phase === 1 && !cedulaInput.value) {
        return $q.notify({type:'warning', message: 'Ingrese la cédula del solicitante'});
    }
    
    try {
        statusColor.value = "primary";
        statusIcon.value = "fingerprint";
        statusMessage.value = "Coloque su dedo en el lector...";
        capturing.value = true;
        progress.value = 30;
        
        captureAbortController = new AbortController();
        const res = await axios.get(`${LOCAL_BIO_API}/capture`, {
            signal: captureAbortController.signal
        });
        
        if (res.data && res.data.success) {
             const imageData = res.data.base64Image;
             statusMessage.value = "Huella capturada. Procesando...";
             progress.value = 70;
             
             if (step.value === 1) {
                 capturedImageSolicitante.value = imageData;
                 await validarFase1(imageData); 
             } else if (step.value === 3) {
                 capturedImageAlmacenista.value = imageData;
                 await validarFase3(imageData); 
             }
        } else {
             throw new Error(res.data?.message || "Error al capturar");
        }
    } catch (e) {
        if (axios.isCancel(e)) return;
        statusColor.value = "warning";
        statusIcon.value = "error_outline";
        statusMessage.value = "Intente de nuevo...";
        if (props.modelValue) {
            retryTimer = setTimeout(() => captureFingerprint(phase), 1000);
        }
    } finally {
        capturing.value = false;
        captureAbortController = null;
    }
};

const validarFase1 = async (huellaBase64) => {
    progress.value = 75;
    validating.value = true;
    statusMessage.value = "Validando Solicitante...";
    try {
        const res = await api.post("/despacho/validar-firma", {
            cedula: cedulaInput.value,
            huella: huellaBase64,
            id_solicitud: props.requestData.id_solicitud,
            id_subdependencia: props.requestData.id_subdependencia,
            validar_pertenencia: true
        });

        usuarioIdentificado.value = res.data.usuario;
        biometriaSolicitante.value = res.data.id_biometria;
        rawFingerprintSolicitante.value = huellaBase64;
        
        statusColor.value = "positive";
        statusIcon.value = "check_circle";
        statusMessage.value = "¡Identidad Confirmada!";
        progress.value = 100;
        
        const rol = res.data.usuario.rol_biometrico;
        setTimeout(() => {
            if (rol === "AMBOS") step.value = 2;
            else if (rol === "RETIRO") proceedAsSolicitante();
            else {
                $q.notify({type:'warning', message: 'Se requiere rol Retiro/Solicitante'});
                resetState();
            }
        }, 800);
    } catch (error) {
        statusColor.value = "negative";
        statusMessage.value = "No autorizado. Reintentando...";
        $q.notify({type: 'negative', message: error.response?.data?.msg || 'Error'});
        if (props.modelValue) retryTimer = setTimeout(() => captureFingerprint(1), 1000);
    } finally {
        validating.value = false;
    }
};

const validarFase3 = async (huellaBase64) => {
    progress.value = 75;
    validating.value = true;
    statusMessage.value = "Validando Almacenista...";
    const cedula = cedulaAlmacenistaInput.value || currentUser.value?.cedula;
    
    try {
        const res = await api.post("/despacho/validar-firma", {
            cedula: cedula,
            huella: huellaBase64,
            id_solicitud: props.requestData.id_solicitud
        });
        
        const rol = res.data.usuario.rol_biometrico;
        if (rol === "ALMACEN" || rol === "AMBOS") {
            statusColor.value = "positive";
            statusIcon.value = "check_circle";
            statusMessage.value = "¡Autorización Concedida!";
            biometriaAlmacenista.value = res.data.id_biometria;
            rawFingerprintAlmacenista.value = huellaBase64;
            await finalizeTicketGeneration();
        } else {
            throw new Error("Se requiere rol Almacén");
        }
    } catch (error) {
        statusColor.value = "negative";
        statusMessage.value = "Error. Reintentando...";
        $q.notify({type: 'negative', message: error.response?.data?.msg || 'Fallo de validación'});
        if (props.modelValue) retryTimer = setTimeout(() => captureFingerprint(2), 1000);
    } finally {
        validating.value = false;
    }
};

const proceedAsSolicitante = () => { step.value = 3; progress.value = 0; };
const proceedDualAuth = async () => {
    biometriaAlmacenista.value = biometriaSolicitante.value;
    rawFingerprintAlmacenista.value = rawFingerprintSolicitante.value;
    await finalizeTicketGeneration();
};

const finalizeTicketGeneration = async () => {
    step.value = 4;
    generatingTicket.value = true;
    try {
        const response = await api.post(`/despacho/imprimir/${props.requestData.id_solicitud}`, {
           huella_almacenista: rawFingerprintAlmacenista.value,
           huella_receptor: rawFingerprintSolicitante.value,
           cedula_receptor: usuarioIdentificado.value.cedula,
           cedula_almacenista: cedulaAlmacenistaInput.value || currentUser.value?.cedula
        }, { timeout: 30000 }); // 30s: evita colgar si hay mala conexión
        emit("ticketGenerated", response.data.ticket);
        visible.value = false;
        $q.notify({ type: 'positive', message: 'Despacho procesado con éxito' });
    } catch (error) {
        $q.notify({ type: 'negative', message: 'Error al finalizar ticket' });
        step.value = 3;
    } finally {
        generatingTicket.value = false;
    }
};
</script>
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
        <!-- ESTADO 1: AUTENTICACIÓN INICIAL -->
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
                  size="120px"
                  :thickness="0.2"
                  color="primary"
                  track-color="grey-3"
                  class="q-mb-md cursor-pointer"
                  @click="captureFingerprint(1)"
               >
                 <q-icon 
                   :name="capturing ? 'fingerprint' : 'touch_app'" 
                   size="50px" 
                   :color="capturing ? 'primary' : 'grey-8'"
                 />
               </q-circular-progress>
               <div class="text-caption text-grey-8">
                 {{ capturing ? 'Escaneando huella...' : 'Haga clic o presione ENTER para escanear' }}
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

        <!-- ESTADO 3: ESPERANDO ALMACENISTA (Flujo normal) -->
        <div v-if="step === 3" class="column items-center q-gutter-y-md" style="max-width: 500px">
          <div class="text-h5 text-orange-9 text-weight-bold">Firma del Almacenista</div>
          <div class="text-subtitle1 text-grey-7 text-center">
            <strong>(Rol Almacén)</strong><br>
            Solicitante Validado. Ahora se requiere la cédula y huella del Almacenista para autorizar.
          </div>

          <q-card flat bordered class="bg-white full-width q-pa-md row items-center no-wrap q-mb-md">
            <q-icon name="check_circle" color="positive" size="md" class="q-mr-md" />
            <div>
              <div class="text-weight-bold">Solicitante Validado</div>
              <div class="text-caption">{{ usuarioIdentificado?.nombre }} {{ usuarioIdentificado?.apellido }}</div>
            </div>
          </q-card>
          
          <q-card flat bordered class="bg-white full-width q-pa-md text-center">
            <div class="text-subtitle2 q-mb-sm text-left">Almacenista:</div>
            
             <div class="q-mb-md">
               <q-input 
                 v-model="cedulaAlmacenistaInput" 
                 label="Cédula del Almacenista (Usuario en Sesión)" 
                 outlined 
                 dense 
                 readonly
                 bg-color="grey-2"
               >
                 <template v-slot:prepend><q-icon name="badge" /></template>
               </q-input>
             </div>

             <q-circular-progress
                  show-value
                  :value="progress"
                  size="120px"
                  :thickness="0.2"
                  color="orange-9"
                  track-color="grey-3"
                  class="cursor-pointer"
                  @click="captureFingerprint(2)"
               >
                 <q-icon name="fingerprint" size="50px" color="orange-9" />
               </q-circular-progress>
                <div class="text-caption text-grey-8 q-mt-sm">
                  Coloque la huella del Almacenista
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
import websdkUrl from "../fingerprint/websdk.client.ui.js?url";
import fingerprintSdkUrl from "../fingerprint/fingerprint.sdk.min.js?url";

const props = defineProps({
  modelValue: Boolean,
  requestData: Object
});

const emit = defineEmits(["update:modelValue", "ticketGenerated"]);
const $q = useQuasar();

// --- STATE ---
const step = ref(1); // 1: Inicio, 2: Dual Prompt, 3: Almacenista, 4: Generando
const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val)
});

const progress = ref(0);
const capturing = ref(false);
const generatingTicket = ref(false);

const cedulaInput = ref("");
const cedulaAlmacenistaInput = ref("");
const usuarioIdentificado = ref(null);
const biometriaSolicitante = ref(null); // ID Biometria o Data
const biometriaAlmacenista = ref(null);

const rawFingerprintSolicitante = ref(null);
const rawFingerprintAlmacenista = ref(null);

const currentUser = ref(null); // Usuario logueado (Almacenista potencial)

// SDK
let fingerprintApi = null;
let Fingerprint = null;

const resetState = () => {
  step.value = 1;
  progress.value = 0;
  capturing.value = false;
  generatingTicket.value = false;
  cedulaInput.value = "";
  usuarioIdentificado.value = null;
  biometriaSolicitante.value = null;
  biometriaAlmacenista.value = null;
  rawFingerprintSolicitante.value = null;
  rawFingerprintAlmacenista.value = null;
  
  if (currentUser.value) {
    cedulaAlmacenistaInput.value = currentUser.value.cedula;
  } else {
    cedulaAlmacenistaInput.value = "";
  }
};

// Reiniciar cuando el diálogo se abre
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    resetState();
  }
});

// --- LIFECYCLE ---
onMounted(async () => {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    currentUser.value = JSON.parse(userStr);
    cedulaAlmacenistaInput.value = currentUser.value.cedula; 
  }
  await initFingerprintSDK();
});

onBeforeUnmount(() => {
  if (fingerprintApi) fingerprintApi.stopAcquisition();
});

// --- LOGIC ---

const initFingerprintSDK = async () => {
    try {
        if (!window.WebSdk) await loadScript(websdkUrl);
        if (!window.Fingerprint) await loadScript(fingerprintSdkUrl);
        Fingerprint = window.Fingerprint;
        if (!Fingerprint) throw new Error("SDK no disponible");
        
        if (!window.fingerprintApiInstance) window.fingerprintApiInstance = new Fingerprint.WebApi();
        fingerprintApi = window.fingerprintApiInstance;
        
        fingerprintApi.onSamplesAcquired = handleSample;
        fingerprintApi.onAcquisitionStopped = () => { capturing.value = false; };
    } catch (e) {
        console.error("SDK Error", e);
        $q.notify({type:'negative', message: 'Error cargando lector de huellas'});
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

const captureFingerprint = async (phase) => {
    if (!fingerprintApi) return;
    
    if (phase === 1 && !cedulaInput.value) {
        return $q.notify({type:'warning', message: 'Ingrese la cédula primero'});
    }
    if (phase === 2 && !cedulaAlmacenistaInput.value && !currentUser.value) {
        return $q.notify({type:'warning', message: 'Se requiere cédula de almacenista'});
    }

    try {
        capturing.value = true;
        progress.value = 50;
        await fingerprintApi.startAcquisition(Fingerprint.SampleFormat.PngImage);
    } catch (e) {
        console.error(e);
        capturing.value = false;
        progress.value = 0;
    }
};

const handleSample = async (event) => {
    try {
        const samples = JSON.parse(event.samples);
        if (samples.length > 0) {
            const rawData = typeof samples[0] === "string" ? samples[0] : samples[0].Data;
            await fingerprintApi.stopAcquisition();
            
            if (step.value === 1) {
                await validarFase1(rawData);
            } else if (step.value === 3) {
                await validarFase3(rawData);
            }
        }
    } catch (e) {
        console.error(e);
    }
}

const validarFase1 = async (huellaBase64) => {
    progress.value = 75;
    try {
        const res = await api.post("/despacho/validar-firma", {
            cedula: cedulaInput.value,
            huella: huellaBase64,
            id_solicitud: props.requestData.id_solicitud,
            id_subdependencia: props.requestData.id_subdependencia
        });

        usuarioIdentificado.value = res.data.usuario;
        biometriaSolicitante.value = res.data.id_biometria;
        rawFingerprintSolicitante.value = huellaBase64;

        const rol = res.data.usuario.rol_biometrico;
        
        if (rol === "AMBOS") {
            step.value = 2;
        } else if (rol === "RETIRO") {
            proceedAsSolicitante();
        } else {
            $q.notify({
                type: 'warning', 
                message: 'La primera huella debe ser del Solicitante (Rol Retiro). Usted tiene Rol Almacén.'
            });
            progress.value = 0;
        }

    } catch (error) {
        const msg = error.response?.data?.msg || "Error de autenticación";
        $q.notify({type: 'negative', message: msg});
        progress.value = 0;
    } finally {
        capturing.value = false;
    }
};

const validarFase3 = async (huellaBase64) => {
    progress.value = 75;
    const cedula = cedulaAlmacenistaInput.value || currentUser.value?.cedula;
    
    try {
        const res = await api.post("/despacho/validar-firma", {
            cedula: cedula,
            huella: huellaBase64,
            id_solicitud: props.requestData.id_solicitud
        });
        
        const rol = res.data.usuario.rol_biometrico;
        if (rol === "ALMACEN" || rol === "AMBOS") {
            biometriaAlmacenista.value = res.data.id_biometria;
            rawFingerprintAlmacenista.value = huellaBase64;
            await finalizeTicketGeneration();
        } else {
            $q.notify({
                type: 'negative', 
                message: 'No autorizado: Se requiere la huella de un Almacenista (Rol Almacén).'
            });
        }

    } catch (error) {
         const msg = error.response?.data?.msg || "Error de autorización";
        $q.notify({type: 'negative', message: msg});
    } finally {
        capturing.value = false;
        progress.value = 0;
    }
};

const proceedAsSolicitante = () => {
    step.value = 3;
    progress.value = 0;
};

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
           cedula_almacenista: cedulaAlmacenistaInput.value || usuarioIdentificado.value.cedula
        });
        
        $q.notify({type:'positive', message: 'Ticket generado exitosamente'});
        emit("ticketGenerated", response.data.ticket);
        visible.value = false;

    } catch (error) {
        const errorMsg = error.response?.data?.msg || "Error generando ticket";
        const details = error.response?.data?.details || error.response?.data?.error || "";
        $q.notify({
            type:'negative', 
            message: `${errorMsg} ${details ? ': ' + details : ''}`,
            timeout: 5000
        });
        step.value = (biometriaAlmacenista.value === biometriaSolicitante.value) ? 2 : 3;
    } finally {
        generatingTicket.value = false;
    }
};
</script>
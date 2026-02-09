<template>
  <q-card flat bordered class="bg-grey-1 full-height overflow-hidden no-shadow">
    <!-- Status Header - Muy compacto -->
    <q-card-section
      class="row items-center justify-between bg-white q-py-xs border-bottom"
    >
      <div class="row items-center q-gutter-sm">
        <q-icon name="fingerprint" color="primary" size="sm" />
        <div class="text-subtitle1 text-primary text-weight-bold uppercase">
          Registro Biométrico
        </div>
      </div>
      <q-chip
        :color="readers.length > 0 ? 'positive' : 'negative'"
        text-color="white"
        icon="usb"
        dense
        size="sm"
        class="text-weight-bold"
      >
        {{ readers.length > 0 ? "CONECTADO" : "DESCONECTADO" }}
      </q-chip>
    </q-card-section>

    <q-card-section class="q-pa-sm">
      <q-form @submit="onSubmit" class="row q-col-gutter-sm">
        <!-- COLUMNA IZQUIERDA: DATOS -->
        <div class="col-12 col-md-5 column q-gutter-y-sm">
          <!-- DATOS DE IDENTIDAD -->
          <q-card flat bordered class="bg-white">
            <q-card-section class="q-pa-sm">
              <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">
                IDENTIDAD
              </div>
              <div class="row q-col-gutter-sm">
                <div class="col-5">
                  <q-input
                    v-model="form.cedula"
                    label="Cédula"
                    outlined
                    dense
                    bg-color="grey-1"
                    :rules="[
                      (val) => !!val || 'Requerido',
                      (val) => !cedulaExists || 'Cédula ya registrada'
                    ]"
                    :error="cedulaExists"
                    :loading="validatingCedula"
                    @blur="validateCedula"
                    hide-bottom-space
                  />
                </div>
                <div class="col-7">
                  <q-input
                    v-model="form.nombre"
                    label="Nombre Completo"
                    outlined
                    dense
                    bg-color="grey-1"
                    :rules="[(val) => !!val || 'Requerido']"
                    hide-bottom-space
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- ESTRUCTURA ORGANIZACIONAL -->
          <q-card flat bordered class="bg-white">
            <q-card-section class="q-pa-sm">
              <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">
                UBICACIÓN
              </div>
              <div class="column q-gutter-y-xs">
                <q-select
                  v-model="form.rol"
                  :options="['RETIRO', 'ALMACEN', 'AMBOS']"
                  label="Rol"
                  outlined
                  dense
                  bg-color="grey-1"
                  :rules="[(val) => !!val || 'Requerido']"
                  hide-bottom-space
                />
                <div class="bg-grey-1 q-pa-xs rounded-borders border-light">
                  <OrganizationalHierarchy
                    v-model:categoryId="form.categoria"
                    v-model:dependencyId="form.dependencia"
                    v-model:subdependencyId="form.subdependencia"
                    :initial-category="mappedCategory"
                    :initial-dependency="mappedDependency"
                    :initial-subdependency="mappedSubdependency"
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- BOTÓN GUARDAR -->
          <div class="row justify-center q-mt-xs">
            <q-btn
              :label="isEditing ? 'Actualizar Registro' : 'Guardar Registro'"
              type="submit"
              color="primary"
              icon="save"
              :disable="!isEditing && samples.length < 4"
              dense
              class="q-px-lg shadow-2"
              unelevated
            />
          </div>
        </div>

        <!-- COLUMNA DERECHA: CAPTURA -->
        <div class="col-12 col-md-7">
          <q-card flat bordered class="bg-white full-height column">
            <q-card-section class="bg-primary text-white q-py-xs text-center">
              <div class="text-caption text-weight-bold uppercase">
                Proceso de Captura
              </div>
            </q-card-section>

            <q-card-section
              class="col column items-center justify-center q-pa-sm"
            >
              <!-- Indicadores de Paso Compactos -->
              <div class="row q-gutter-md justify-center q-mb-sm">
                <div v-for="n in 4" :key="n" class="column items-center">
                  <q-circular-progress
                    show-value
                    :value="
                      samples.length >= n
                        ? 100
                        : capturing && samples.length === n - 1
                          ? 100
                          : 0
                    "
                    size="50px"
                    :thickness="0.15"
                    :color="
                      samples.length >= n
                        ? 'positive'
                        : capturing && samples.length === n - 1
                          ? 'primary'
                          : 'grey-3'
                    "
                    track-color="grey-2"
                    :indeterminate="capturing && samples.length === n - 1"
                  >
                    <q-icon
                      :name="samples.length >= n ? 'check' : 'fingerprint'"
                      :color="
                        samples.length >= n
                          ? 'positive'
                          : capturing && samples.length === n - 1
                            ? 'primary'
                            : 'grey-4'
                      "
                      size="22px"
                    />
                  </q-circular-progress>
                  <div
                    class="text-overline q-mt-xs"
                    :class="
                      samples.length >= n ? 'text-positive' : 'text-grey-6'
                    "
                  >
                    P{{ n }}
                  </div>
                </div>
              </div>

              <!-- Estado -->
              <div class="text-subtitle2 text-grey-8 q-mb-sm text-center">
                <template v-if="validating">
                  <q-spinner-dots color="primary" size="20px" />
                  Validando consistencia...
                </template>
                <template v-else-if="isEditing && samples.length === 0">
                   <q-icon name="fingerprint" color="grey" />
                   Huellas registradas. <br/>
                   <span class="text-caption">Pulse Capturar para reemplazarlas.</span>
                </template>
                <template v-else>
                  {{
                    samples.length === 4
                      ? "Captura Completa"
                      : `Muestra ${samples.length + 1} de 4`
                  }}
                </template>
              </div>

              <!-- Controles -->
              <div class="row q-gutter-sm">
                <q-btn
                  color="primary"
                  label="Capturar"
                  icon="play_arrow"
                  @click="startCapture"
                  :disable="capturing || samples.length >= 4 || validating"
                  size="sm"
                  unelevated
                />
                <q-btn
                  color="negative"
                  label="Parar"
                  icon="stop"
                  @click="stopCapture"
                  :disable="!capturing"
                  size="sm"
                  flat
                />
                <q-btn
                  color="grey-7"
                  icon="refresh"
                  flat
                  round
                  dense
                  @click="clearSamples"
                  v-if="samples.length > 0"
                >
                  <q-tooltip>Reiniciar</q-tooltip>
                </q-btn>
              </div>
            </q-card-section>

            <q-separator />

            <!-- Grid de Muestras muy compacto -->
            <q-card-section class="bg-grey-1 q-pa-sm">
              <div class="row q-col-gutter-xs justify-center">
                <div
                  v-for="(sample, index) in samples"
                  :key="index"
                  class="col-auto"
                >
                  <q-card bordered flat class="bg-white overflow-hidden">
                    <q-img
                      :src="sample.image"
                      style="width: 70px; height: 95px"
                    />
                    <div class="bg-grey-3 text-center text-overline q-py-none">
                      M{{ index + 1 }}
                    </div>
                  </q-card>
                </div>

                <div
                  v-for="n in 4 - samples.length"
                  :key="'empty-' + n"
                  class="col-auto"
                >
                  <div
                    class="column items-center justify-center border-dashed rounded-borders bg-white"
                    style="width: 70px; height: 50px"
                  >
                    <q-icon name="fingerprint" color="grey-2" size="30px" />
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </q-form>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, reactive, computed, watch } from "vue";
import { useQuasar } from "quasar";
import websdkUrl from "./websdk.client.ui.js?url";
import fingerprintSdkUrl from "./fingerprint.sdk.min.js?url";
import api from "../../api";
import OrganizationalHierarchy from "../OrganizationalHierarchy.vue";

const $q = useQuasar();

const props = defineProps({
  initialData: Object,
});

const emit = defineEmits(["success"]);

const isEditing = computed(() => !!props.initialData && !!props.initialData.id_biometria);

const form = reactive({
  id_biometria: null,
  cedula: "",
  nombre: "",
  rol: null,
  categoria: null,
  dependencia: null,
  subdependencia: null,
});

// Mapeo manual de objetos iniciales para OrganizationalHierarchy
const mappedCategory = computed(() => {
  if (!props.initialData?.Categoria) return null;
  return {
    id_categoria: props.initialData.id_categoria,
    nombre: props.initialData.Categoria.nombre,
  };
});

const mappedDependency = computed(() => {
  if (!props.initialData?.Dependencia) return null;
  return {
    id_dependencia: props.initialData.id_dependencia,
    nombre_dependencia: props.initialData.Dependencia.nombre_dependencia,
  };
});

const mappedSubdependency = computed(() => {
  if (!props.initialData?.Subdependencia) return null;
  return {
    id_subdependencia: props.initialData.id_subdependencia,
    nombre: props.initialData.Subdependencia.nombre,
  };
});

const capturing = ref(false);
const validating = ref(false);
const validationError = ref(false);
const errorMessage = ref("");
const readers = ref([]);
const samples = ref([]);
const cedulaExists = ref(false);
const validatingCedula = ref(false);
let fingerprintApi = null;
let Fingerprint = null;

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
    if (!window.WebSdk) {
      await loadScript(websdkUrl);
    }
    if (!window.Fingerprint) {
      await loadScript(fingerprintSdkUrl);
    }

    Fingerprint = window.Fingerprint;

    if (!Fingerprint) {
      errorMessage.value = "SDK no cargado.";
      return;
    }

    // Usar la API global si ya existe para mantener los listeners
    if (!window.fingerprintApiInstance) {
      window.fingerprintApiInstance = new Fingerprint.WebApi();
    }
    fingerprintApi = window.fingerprintApiInstance;

    fingerprintApi.onCommunicationFailed = (event) => {
      readers.value = [];
      setTimeout(refreshReadersView, 3000);
    };

    fingerprintApi.onAcquisitionStopped = () => {
      capturing.value = false;
    };

    fingerprintApi.onSamplesAcquired = onSamplesAcquired;

    // EVENTOS DE HARDWARE EN TIEMPO REAL
    fingerprintApi.onDeviceConnected = (event) => {
      console.log("Hardware detectado:", event);
      refreshReadersView();
    };

    fingerprintApi.onDeviceDisconnected = (event) => {
      console.log("Hardware removido:", event);
      refreshReadersView();
    };

    // Primera detección
    await refreshReadersView();

  } catch (e) {
    errorMessage.value = "Error: " + e.message;
  }
};

const validateCedula = async () => {
  if (!form.cedula || isEditing.value) return;
  
  validatingCedula.value = true;
  cedulaExists.value = false;
  try {
    const { data } = await api.get('/biometria', { params: { search: form.cedula } });
    if (data.data && data.data.some(r => r.cedula === form.cedula)) {
      cedulaExists.value = true;
      $q.notify({ type: 'warning', message: 'Esta cédula ya se encuentra registrada.' });
    }
  } catch (error) {
    console.error("Error validando cédula", error);
  } finally {
    validatingCedula.value = false;
  }
};

const startCapture = async () => {
  if (capturing.value || !fingerprintApi) return;
  if (samples.value.length >= 4) return;
  try {
    await fingerprintApi.startAcquisition(Fingerprint.SampleFormat.PngImage);
    capturing.value = true;
    errorMessage.value = "";
  } catch (error) {
    handleError(error);
  }
};

const stopCapture = async () => {
  if (!capturing.value || !fingerprintApi) return;
  try {
    await fingerprintApi.stopAcquisition();
    capturing.value = false;
  } catch (error) {
    handleError(error);
  }
};

const clearSamples = () => {
  samples.value = [];
};

const resetComponentState = () => {
  form.id_biometria = null;
  form.cedula = "";
  form.nombre = "";
  form.rol = null;
  form.categoria = null;
  form.dependencia = null;
  form.subdependencia = null;
  samples.value = [];
  errorMessage.value = "";
  capturing.value = false;
  cedulaExists.value = false;
};

const refreshReadersView = async () => {
  try {
    if (!fingerprintApi) return;
    const devices = await fingerprintApi.enumerateDevices();
    readers.value = devices || [];
    console.log("Lectores actualizados:", readers.value.length);
  } catch (error) {
    readers.value = [];
    console.error("Error enumerando:", error);
  }
};

const onSamplesAcquired = async (event) => {
  try {
    const sampleDataArr = JSON.parse(event.samples);
    if (sampleDataArr.length > 0) {
      const sampleObj = sampleDataArr[0];
      const rawData = typeof sampleObj === "string" ? sampleObj : sampleObj.Data;

      if (!rawData) return;

      let imageBase64 = "";
      let imageDataUrl = "";

      if (event.sampleFormat === Fingerprint.SampleFormat.PngImage) {
        const pngData = Fingerprint.b64UrlToUtf8(rawData);
        imageBase64 = btoa(pngData);
        imageDataUrl = `data:image/png;base64,${imageBase64}`;
      } else {
        return;
      }

      // VALIDACIÓN DE CONSISTENCIA (Match contra la primera huella)
      if (samples.value.length > 0) {
        validating.value = true;
        validationError.value = false;
        try {
          const response = await api.post("/biometria/comparar", {
            muestra1: samples.value[0].data,
            muestra2: imageBase64,
          });

          if (!response.data.match) {
            validationError.value = true;
            $q.notify({
              type: "warning",
              message: "La huella no coincide con la primera muestra. Use el mismo dedo.",
              position: "bottom",
            });
            return; // No agregar la huella
          }
        } catch (err) {
          console.error("Error validando consistencia:", err);
          $q.notify({
            type: "negative",
            message: "Error al validar consistencia de la huella",
          });
          return;
        } finally {
          validating.value = false;
        }
      }

      if (samples.value.length < 4) {
        samples.value.push({
          image: imageDataUrl,
          data: imageBase64,
        });

        if (samples.value.length === 4) {
          stopCapture();
          $q.notify({
            type: "positive",
            message: "Captura consistente completada",
            timeout: 1000,
          });
        }
      }
    }
  } catch (error) {
    console.error("Error en onSamplesAcquired:", error);
    handleError(error);
  }
};

const handleError = (error) => {
  errorMessage.value = error?.message || "Error sensor";
  console.error(error);
};

const onSubmit = async () => {
  if (cedulaExists.value && !isEditing.value) {
    $q.notify({ type: 'negative', message: 'Corrija la cédula antes de guardar.' });
    return;
  }

  $q.loading.show({ message: "Guardando..." });
  try {
    const payload = {
      id_biometria: form.id_biometria,
      cedula: form.cedula,
      nombre: form.nombre,
      rol: form.rol,
      id_categoria: form.categoria,
      id_dependencia: form.dependencia,
      id_subdependencia: form.subdependencia,
      huellas: samples.value.length > 0 ? samples.value.map((s) => s.data) : null,
    };
    await api.post("/biometria/registrar", payload);
    $q.notify({
      type: "positive",
      message: isEditing.value ? "Actualización Exitosa" : "Registro Exitoso",
    });
    resetComponentState();
    emit("success");
  } catch (error) {
    $q.notify({
      type: "negative",
      message: error.response?.data?.msg || "Error",
    });
  } finally {
    $q.loading.hide();
  }
};

const loadInitialData = () => {
  if (props.initialData) {
    Object.assign(form, props.initialData);
    form.id_biometria = props.initialData.id_biometria;
    if (props.initialData.id_categoria)
      form.categoria = props.initialData.id_categoria;
    if (props.initialData.id_dependencia)
      form.dependencia = props.initialData.id_dependencia;
    if (props.initialData.id_subdependencia)
      form.subdependencia = props.initialData.id_subdependencia;
  } else {
    resetComponentState();
  }
};

watch(() => props.initialData, () => {
  loadInitialData();
}, { deep: true });

onMounted(async () => {
  loadInitialData();
  await initApi();
});

onBeforeUnmount(async () => {
  if (capturing.value) await stopCapture();
});
</script>

<style scoped>
.border-bottom {
  border-bottom: 1px solid #e0e0e0;
}
.border-light {
  border: 1px solid #f0f0f0;
}
.border-dashed {
  border: 1px dashed #ccc;
}
.uppercase {
  text-transform: uppercase;
}
</style>

<template>
  <q-card flat bordered class="q-pa-md bg-grey-1">
    <!-- Status Header -->
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h6 text-primary">
        <q-icon name="fingerprint" size="md" /> Registro Biométricos
      </div>
      <q-chip
        :color="readers.length > 0 ? 'positive' : 'negative'"
        text-color="white"
        icon="usb"
        outline
      >
        {{ readers.length > 0 ? "Lector Conectado" : "Lector Desconectado" }}
      </q-chip>
    </div>

    <q-form @submit="onSubmit">
      <!-- Datos Personales Section -->
      <q-list bordered class="rounded-borders bg-white q-mb-md">
        <q-item-label header class="text-weight-bold text-uppercase"
          >Datos de Identidad</q-item-label
        >
        <q-item>
          <q-item-section>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-4">
                <q-input
                  v-model="form.cedula"
                  label="Cédula"
                  outlined
                  dense
                  :rules="[(val) => !!val || 'Campo requerido']"
                >
                  <template v-slot:prepend><q-icon name="badge" /></template>
                </q-input>
              </div>
              <div class="col-12 col-md-8">
                <q-input
                  v-model="form.nombre"
                  label="Nombre Completo"
                  outlined
                  dense
                  :rules="[(val) => !!val || 'Campo requerido']"
                >
                  <template v-slot:prepend><q-icon name="person" /></template>
                </q-input>
              </div>
            </div>
          </q-item-section>
        </q-item>
      </q-list>

      <!-- Ubicación Organizacional Section -->
      <q-list bordered class="rounded-borders bg-white q-mb-md">
        <q-item-label header class="text-weight-bold text-uppercase"
          >Estructura Organizacional</q-item-label
        >
        <q-item>
          <q-item-section>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-3">
                <q-select
                  v-model="form.rol"
                  :options="['RETIRO', 'ALMACEN', 'AMBOS']"
                  label="Rol"
                  outlined
                  dense
                  :rules="[(val) => !!val || 'Campo requerido']"
                >
                  <template v-slot:prepend
                    ><q-icon name="assignment_ind"
                  /></template>
                </q-select>
              </div>
              <div class="col-12 col-md-3">
                <q-select
                  v-model="form.categoria"
                  :options="categoriaOptions"
                  label="Categoría"
                  outlined
                  dense
                  use-input
                  @filter="filterCategoria"
                  option-label="nombre"
                  option-value="id_categoria"
                  emit-value
                  map-options
                  :rules="[(val) => !!val || 'Campo requerido']"
                />
              </div>
              <div class="col-12 col-md-3">
                <q-select
                  v-model="form.dependencia"
                  :options="dependenciaOptions"
                  label="Dependencia"
                  outlined
                  dense
                  :disable="!form.categoria"
                  use-input
                  @filter="filterDependencia"
                  option-label="nombre_dependencia"
                  option-value="id_dependencia"
                  emit-value
                  map-options
                  :rules="[(val) => !!val || 'Campo requerido']"
                />
              </div>
              <div class="col-12 col-md-3">
                <q-select
                  v-model="form.subdependencia"
                  :options="subdependenciaOptions"
                  label="Subdependencia"
                  outlined
                  dense
                  :disable="
                    !form.dependencia || subdependenciaOptions.length === 0
                  "
                  use-input
                  @filter="filterSubdependencia"
                  option-label="nombre"
                  option-value="id_subdependencia"
                  emit-value
                  map-options
                />
              </div>
            </div>
          </q-item-section>
        </q-item>
      </q-list>

      <!-- Biometría Section -->
      <q-card flat bordered class="bg-white q-mb-md">
        <q-card-section class="bg-primary text-white q-py-xs">
          <div class="text-subtitle2">CAPTURA DE HUELLAS</div>
        </q-card-section>

        <q-card-section class="column items-center">
          <!-- Circular Progress Dashboard -->
          <div class="row q-gutter-md q-py-md">
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
                size="60px"
                :thickness="0.2"
                :color="
                  samples.length >= n
                    ? 'positive'
                    : capturing && samples.length === n - 1
                      ? 'primary'
                      : 'grey-4'
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
                  size="24px"
                />
              </q-circular-progress>
              <div class="text-caption q-mt-xs">Paso {{ n }}</div>
            </div>
          </div>

          <div class="text-h6 text-grey-8 q-mb-md">
            {{
              samples.length === 4
                ? "Captura Completa"
                : `Huella ${samples.length + 1} de 4`
            }}
          </div>

          <!-- Controls -->
          <div class="row q-gutter-sm">
            <q-btn
              color="primary"
              label="Iniciar Sensor"
              icon="play_arrow"
              @click="startCapture"
              :disable="capturing || samples.length >= 4"
            />
            <q-btn
              color="negative"
              label="Detener"
              icon="stop"
              @click="stopCapture"
              :disable="!capturing"
            />
            <q-btn
              color="grey-7"
              label="Reiniciar"
              icon="refresh"
              flat
              @click="clearSamples"
              v-if="samples.length > 0"
            />
          </div>
        </q-card-section>

        <q-separator />

        <!-- Preview Grid -->
        <q-card-section>
          <div class="row q-col-gutter-md justify-center">
            <div
              v-for="(sample, index) in samples"
              :key="index"
              class="col-auto"
            >
              <q-card bordered flat>
                <q-img :src="sample.image" style="width: 80px; height: 110px" />
                <div class="bg-grey-2 text-center text-caption">
                  Muestra {{ index + 1 }}
                </div>
              </q-card>
            </div>
            <div
              v-for="n in 4 - samples.length"
              :key="'empty-' + n"
              class="col-auto"
            >
              <q-card
                bordered
                flat
                class="bg-grey-1"
                style="
                  width: 80px;
                  height: 110px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                "
              >
                <q-icon name="fingerprint" color="grey-3" size="40px" />
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Submit Footer -->
      <div class="row justify-end q-mt-lg">
        <q-btn
          label="Guardar Registro"
          type="submit"
          color="primary"
          icon-right="save"
          :disable="samples.length < 4"
          size="md"
        />
      </div>
    </q-form>
  </q-card>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, reactive, watch } from "vue";
import { useQuasar } from "quasar";
import websdkUrl from "./websdk.client.ui.js?url";
import fingerprintSdkUrl from "./fingerprint.sdk.min.js?url";
import api from "../../api";

const $q = useQuasar();

const props = defineProps({
  initialData: Object,
});

const emit = defineEmits(["success"]);

const form = reactive({
  cedula: "",
  nombre: "",
  rol: null,
  categoria: null,
  dependencia: null,
  subdependencia: null,
});

const categoriaOptions = ref([]);
const dependenciaOptions = ref([]);
const subdependenciaOptions = ref([]);

watch(
  () => form.categoria,
  async (newVal) => {
    form.dependencia = null;
    form.subdependencia = null;
    dependenciaOptions.value = [];
    subdependenciaOptions.value = [];
    if (newVal) {
      try {
        const { data } = await api.get("/categorias/jerarquia", {
          params: { type: "categoria", parentId: newVal },
        });
        dependenciaOptions.value = data.data;
      } catch (error) {
        console.error("Error precargando dependencias:", error);
      }
    }
  },
);
/////refactorizar
watch(
  () => form.dependencia,
  async (newVal) => {
    form.subdependencia = null;
    subdependenciaOptions.value = [];
    if (newVal) {
      try {
        const { data } = await api.get("/categorias/jerarquia", {
          params: { type: "dependencia", parentId: newVal },
        });
        subdependenciaOptions.value = data.data;
      } catch (error) {
        console.error("Error precargando subdependencias:", error);
      }
    }
  },
);

const filterCategoria = async (val, update) => {
  update(async () => {
    try {
      const { data } = await api.get("/categorias/jerarquia", {
        params: { search: val },
      });
      categoriaOptions.value = data.data;
    } catch (error) {
      console.error("Error cargando categorías:", error);
    }
  });
};

const filterDependencia = async (val, update) => {
  if (!form.categoria) {
    update(() => {
      dependenciaOptions.value = [];
    });
    return;
  }
  update(async () => {
    try {
      const { data } = await api.get("/categorias/jerarquia", {
        params: {
          type: "categoria",
          parentId: form.categoria,
          search: val,
        },
      });
      dependenciaOptions.value = data.data;
    } catch (error) {
      console.error("Error cargando dependencias:", error);
    }
  });
};

const filterSubdependencia = async (val, update) => {
  if (!form.dependencia) {
    update(() => {
      subdependenciaOptions.value = [];
    });
    return;
  }
  update(async () => {
    try {
      const { data } = await api.get("/categorias/jerarquia", {
        params: {
          type: "dependencia",
          parentId: form.dependencia,
          search: val,
        },
      });
      subdependenciaOptions.value = data.data;
    } catch (error) {
      console.error("Error cargando subdependencias:", error);
    }
  });
};

const capturing = ref(false);
const errorMessage = ref("");
const readers = ref([]);
const samples = ref([]);
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
      errorMessage.value = "Fingerprint SDK no cargado correctamente.";
      return;
    }

    fingerprintApi = new Fingerprint.WebApi({
      debug: true,
    });

    fingerprintApi.onCommunicationFailed = (event) => handleError(event.error);
    fingerprintApi.onAcquisitionStarted = (event) =>
      console.log(`Iniciado en ${event.deviceUid}`);
    fingerprintApi.onAcquisitionStopped = (event) => {
      console.log(`Detenido en ${event.deviceUid}`);
      capturing.value = false;
    };
    fingerprintApi.onSamplesAcquired = onSamplesAcquired;
    fingerprintApi.onQualityReported = (event) =>
      console.log(`Calidad: ${event.quality}`);
    fingerprintApi.onErrorOccurred = (event) => handleError(event.error);
    fingerprintApi.onDeviceConnected = async (event) => {
      console.log(`Conectado: ${event.deviceUid}`);
      await refreshReadersView();
    };
    fingerprintApi.onDeviceDisconnected = async (event) => {
      console.log(`Desconectado: ${event.deviceUid}`);
      await refreshReadersView();
    };
  } catch (e) {
    errorMessage.value = "Error inicializando API: " + e.message;
  }
};

const startCapture = async () => {
  if (capturing.value || !fingerprintApi) return;
  if (samples.value.length >= 4) {
    $q.notify({ type: "warning", message: "Ya se han capturado 4 huellas" });
    return;
  }
  try {
    // SEGÚN ANALISIS, EL FORMATO 5 (PNG) ES EL MÁS ESTABLE PARA ESTE CLIENTE LITE
    // Para el matching usaremos un algoritmo de comparación de imágenes o FMD extraído de la imagen.
    console.log(
      "Iniciando captura en formato PngImage (Format 5) para estabilidad...",
    );
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

const refreshReadersView = async () => {
  try {
    const devices = await fingerprintApi.enumerateDevices();
    readers.value = devices;
  } catch (error) {
    handleError(error);
  }
};

const onSamplesAcquired = (event) => {
  try {
    const sampleDataArr = JSON.parse(event.samples);
    console.log("=== EVENTO DE CAPTURA RECIBIDO ===");
    console.log("Formato de muestra (SampleFormat):", event.sampleFormat);

    if (sampleDataArr.length > 0) {
      const sampleObj = sampleDataArr[0];
      const rawData =
        typeof sampleObj === "string" ? sampleObj : sampleObj.Data;

      if (!rawData) return;

      console.log("Dato crudo (Base64):", rawData.substring(0, 100) + "...");
      console.log("Longitud Total:", rawData.length);

      let imageBase64 = "";
      let imageDataUrl = "";

      if (event.sampleFormat === Fingerprint.SampleFormat.PngImage) {
        // Convertir los datos del SDK a imagen PNG real
        const pngData = Fingerprint.b64UrlToUtf8(rawData);
        imageBase64 = btoa(pngData); // Base64 estándar de la imagen PNG
        imageDataUrl = `data:image/png;base64,${imageBase64}`;
        console.log("PNG Base64 length:", imageBase64.length);
      } else {
        // Si no es PNG, saltar
        console.warn("Formato no soportado, solo se acepta PngImage");
        return;
      }

      if (samples.value.length < 4) {
        samples.value.push({
          image: imageDataUrl, // Para previsualización
          data: imageBase64, // ESTE ES EL PNG BASE64 REAL para el backend
        });

        if (samples.value.length === 4) {
          stopCapture();
        }
      }
    }
  } catch (error) {
    console.error("Error en onSamplesAcquired:", error);
    handleError(error);
  }
};

const handleError = (error) => {
  errorMessage.value =
    error?.message || error?.type || "Error de comunicación con el sensor";
  console.error(error);
};

const onSubmit = async () => {
  $q.loading.show({ message: "Guardando..." });
  try {
    const payload = {
      cedula: form.cedula,
      nombre: form.nombre,
      rol: form.rol,
      id_categoria: form.categoria,
      id_dependencia: form.dependencia,
      id_subdependencia: form.subdependencia,
      huellas: samples.value.map((s) => s.data),
    };
    await api.post("/biometria/registrar", payload);
    $q.notify({
      type: "positive",
      message: "Registro Exitoso",
      icon: "check",
    });
    emit("success");
  } catch (error) {
    $q.notify({
      type: "negative",
      message: error.response?.data?.msg || "Error en el servidor",
    });
  } finally {
    $q.loading.hide();
  }
};

onMounted(async () => {
  if (props.initialData) {
    Object.assign(form, props.initialData);
    if (props.initialData.id_categoria)
      form.categoria = props.initialData.id_categoria;
    if (props.initialData.id_dependencia)
      form.dependencia = props.initialData.id_dependencia;
    if (props.initialData.id_subdependencia)
      form.subdependencia = props.initialData.id_subdependencia;
  }
  await initApi();
  if (fingerprintApi) {
    await refreshReadersView();
  }
});

onBeforeUnmount(async () => {
  if (capturing.value) await stopCapture();
});
</script>

<style scoped>
/* Estilos mínimos para complementar Quasar */
.q-card {
  border-radius: 8px;
}
</style>

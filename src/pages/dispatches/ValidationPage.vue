<template>
  <q-page class="q-pa-md bg-grey-2">
    <div class="row justify-center">
      <div class="col-12 col-md-8 col-lg-6">
        <!-- Header -->
        <q-card class="q-mb-md">
          <q-card-section>
            <div class="text-h5 text-primary text-weight-bold">
              Validación y Cierre de Ticket
            </div>
            <div class="text-subtitle2 text-grey-7">
              Escanee el código QR del ticket despachado
            </div>
          </q-card-section>

          <q-card-section>
            <div class="row q-col-gutter-md items-center">
              <div class="col-grow">
                <q-input
                  v-model="searchCode"
                  label="Código de Ticket"
                  outlined
                  dense
                  autofocus
                  @keyup.enter="searchTicket"
                  bg-color="white"
                  :loading="loading"
                >
                  <template v-slot:append>
                    <q-btn
                      flat
                      dense
                      round
                      icon="qr_code_scanner"
                      @click="showScanner = true"
                    >
                      <q-tooltip>Escanear QR con Cámara</q-tooltip>
                    </q-btn>
                  </template>
                </q-input>
              </div>
              <div class="col-auto">
                <q-btn
                  icon="search"
                  label="Buscar"
                  color="primary"
                  unelevated
                  @click="searchTicket"
                  :loading="loading"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Ticket Info -->
        <q-card v-if="ticket" class="q-mb-md slide-fade">
          <q-card-section class="bg-primary text-white">
            <div class="row items-center justify-between">
              <div class="text-h6">Ticket #{{ ticket.codigo_ticket }}</div>
              <q-badge
                color="white"
                text-color="primary"
                :label="ticket.estado"
              />
            </div>
          </q-card-section>

          <q-card-section>
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <div class="text-caption text-grey">Dependencia</div>
                <div class="text-body2">
                  {{ ticket.Dependencia?.nombre_dependencia }}
                </div>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey">Subdependencia</div>
                <div class="text-body2">
                  {{ ticket.Subdependencia?.nombre }}
                </div>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey">Combustible</div>
                <div class="text-body2">
                  {{ ticket.TipoCombustible?.nombre }}
                </div>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey">Llenadero</div>
                <div class="text-body2">
                  {{ ticket.Llenadero?.nombre_llenadero }}
                </div>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey">Conductor</div>
                <div class="text-body2">
                  {{ ticket.Solicitante?.nombre }}
                  {{ ticket.Solicitante?.apellido }}
                </div>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey">Placa</div>
                <div class="text-body2 text-weight-bold">
                  {{ ticket.placa || "N/A" }}
                </div>
              </div>

              <q-separator class="col-12 q-my-sm" />

              <div class="col-12 text-center">
                <div class="text-caption text-grey">Cantidad Aprobada</div>
                <div class="text-h3 text-primary text-weight-bolder">
                  {{ ticket.cantidad_litros }} <span class="text-h6">Lts</span>
                </div>
              </div>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-actions align="center" class="q-pa-md q-gutter-md">
            <q-btn
              push
              color="positive"
              icon="check_circle"
              label="Carga Completa (Confirmar)"
              size="lg"
              class="col-grow"
              @click="openDialog('CONFIRMATION')"
            />
            <q-btn
              push
              color="warning"
              text-color="dark"
              icon="warning"
              label="Reportar Diferencia"
              size="lg"
              class="col-grow"
              @click="openDialog('DIFFERENCE')"
            />
          </q-card-actions>
        </q-card>

        <!-- Mensaje si no hay ticket -->
        <div
          v-else-if="searched && !ticket"
          class="text-center text-grey-6 q-mt-xl"
        >
          <q-icon name="search_off" size="4rem" />
          <div class="text-h6">
            No se encontró el ticket o no es válido para validación.
          </div>
        </div>
      </div>
    </div>

    <!-- Dialogo de Validación -->
    <ValidationDialog
      v-model="showDialog"
      :mode="dialogMode"
      :ticket="ticket || {}"
      @confirm="handleValidation"
    />

    <!-- Dialogo Scanner QR (Vue Qrcode Reader) -->
    <q-dialog v-model="showScanner">
      <q-card style="width: 350px; max-width: 90vw">
        <q-card-section
          class="row items-center q-pb-none bg-primary text-white"
        >
          <div class="text-h6">Escanear Ticket</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup color="white" />
        </q-card-section>

        <q-card-section class="q-pa-none bg-black">
          <div style="height: 300px; width: 100%; position: relative">
            <qrcode-stream
              v-if="showScanner"
              @detect="onDetect"
              @error="onError"
            >
              <div
                class="scan-overlay row justify-center items-center full-height"
              >
                <div class="scan-box"></div>
              </div>
            </qrcode-stream>
          </div>
        </q-card-section>

        <q-card-section class="text-caption text-center text-grey">
          Coloque el código QR dentro del recuadro
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import { useQuasar } from "quasar";
import { QrcodeStream } from "vue-qrcode-reader";
import api from "../../api";
import ValidationDialog from "../../components/dispatches/ValidationDialog.vue";

const $q = useQuasar();
const searchCode = ref("");
const ticket = ref(null);
const loading = ref(false);
const searched = ref(false);
const showDialog = ref(false);
const dialogMode = ref("CONFIRMATION");
const showScanner = ref(false);

const searchTicket = async () => {
  if (!searchCode.value) return;

  loading.value = true;
  ticket.value = null;
  searched.value = false;

  try {
    // Usamos el endpoint definido en validacionRoutes
    const response = await api.get(`/validacion/ticket/${searchCode.value}`);

    if (response.data.status === "READY") {
      ticket.value = response.data.ticket;
      $q.notify({
        type: "positive",
        message: "Ticket recuperado exitosamente",
      });
    } else {
      // Casos como ALREADY_FINALIZED o INVALID_STATE
      $q.notify({ type: "warning", message: response.data.msg });
    }
  } catch (error) {
    console.error(error);
    const msg = error.response?.data?.msg || "Error buscando ticket";
    $q.notify({ type: "negative", message: msg });
  } finally {
    loading.value = false;
    searched.value = true;
  }
};

const openDialog = (mode) => {
  dialogMode.value = mode;
  showDialog.value = true;
};

const handleValidation = async (payload) => {
  try {
    $q.loading.show({ message: "Procesando cierre..." });

    const body = {
      codigo_ticket: ticket.value.codigo_ticket,
      cantidad_real_cargada: payload.cantidad_real,
      observaciones: payload.observaciones,
      password_confirmacion: payload.password,
    };

    const response = await api.post("/validacion/finalizar", body);

    $q.notify({
      type: "positive",
      message: response.data.msg,
      caption: response.data.detalle,
    });

    // Reset
    showDialog.value = false;
    ticket.value = null;
    searchCode.value = "";
    searched.value = false;
  } catch (error) {
    console.error(error);
    const msg = error.response?.data?.msg || "Error finalizando ticket";
    $q.notify({ type: "negative", message: msg });
  } finally {
    $q.loading.hide();
  }
};

// --- QR SCANNER ---
const onDetect = (detectedCodes) => {
  // detectedCodes es un array de objetos { rawValue, format, cornerPoints }
  const code = detectedCodes[0]?.rawValue;
  if (code) {
    console.log("QR Detectado:", code);
    searchCode.value = code;
    showScanner.value = false;
    searchTicket();
  }
};

const onError = (error) => {
  console.error("QR Error:", error);
  if (error.name === "NotAllowedError") {
    $q.notify({ type: "negative", message: "Permiso de cámara denegado" });
  } else if (error.name === "NotFoundError") {
    $q.notify({ type: "negative", message: "No se encontró cámara" });
  } else {
    $q.notify({
      type: "warning",
      message: "Error de cámara: " + error.message,
    });
  }
};
</script>

<style scoped>
.scan-box {
  width: 200px;
  height: 200px;
  border: 2px solid rgba(0, 255, 0, 0.5);
  box-shadow: 0 0 0 1000px rgba(0, 0, 0, 0.5); /* Oscurece el resto */
  border-radius: 12px;
}
.slide-fade {
  animation: slide-in 0.3s ease-out;
}
@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

<template>
  <q-dialog
    v-model="visible"
    persistent
    transition-show="scale"
    transition-hide="scale"
  >
    <q-card class="bg-white" style="width: 500px; max-width: 90vw;">
      <!-- Cabecera -->
      <q-card-section class="bg-primary text-white">
        <div class="text-h6 text-weight-bold">Ticket Generado</div>
        <div class="text-caption">Código: {{ ticketData?.codigo }}</div>
      </q-card-section>

      <q-separator />

      <!-- Contenido del Ticket -->
      <q-card-section class="q-pa-lg">
        <div class="column items-center q-gutter-y-md">
          <!-- Código QR (simulado) -->
          <div class="bg-grey-2 q-pa-lg rounded-borders">
            <div class="text-center text-grey-7 text-caption q-mb-sm">
              Código QR del Ticket
            </div>
            <div class="row justify-center">
              <q-icon name="qr_code" size="150px" color="primary" />
            </div>
            <div class="text-center text-h6 text-weight-bold q-mt-sm">
              {{ ticketData?.codigo }}
            </div>
          </div>

          <!-- Información del Ticket -->
          <div class="full-width">
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <div class="text-caption text-grey-7">Vehículo:</div>
                <div class="text-subtitle2 text-weight-bold">{{ ticketData?.solicitud?.placa }}</div>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey-7">Litros:</div>
                <div class="text-subtitle2 text-weight-bold text-primary">
                  {{ ticketData?.solicitud?.cantidad_litros }} L
                </div>
              </div>
            </div>

            <q-separator class="q-my-sm" />

            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <div class="text-caption text-grey-7">Solicitante:</div>
                <div class="text-subtitle2">
                  {{ ticketData?.solicitud?.Solicitante?.nombre }} {{ ticketData?.solicitud?.Solicitante?.apellido }}
                </div>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey-7">Receptor:</div>
                <div class="text-subtitle2">
                  {{ ticketData?.receptor?.nombre || 'N/A' }}
                </div>
              </div>
            </div>

            <q-separator class="q-my-sm" />

            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <div class="text-caption text-grey-7">Fecha Impresión:</div>
                <div class="text-subtitle2">
                  {{ formatDate(ticketData?.solicitud?.fecha_impresion) }}
                </div>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey-7">Estado:</div>
                <q-badge color="indigo" class="q-pa-xs">
                  IMPRESO
                </q-badge>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- Acciones -->
      <q-card-actions align="right" class="q-pa-md">
        <q-btn
          flat
          label="Cerrar"
          color="grey-7"
          v-close-popup
        />
        <q-btn
          color="primary"
          label="Imprimir"
          icon="print"
          @click="onPrint"
        />
        <q-btn
          color="deep-orange"
          label="Reimprimir"
          icon="content_copy"
          @click="onReimprimir"
          v-if="ticketData?.solicitud?.id_solicitud"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed } from "vue";
import { useQuasar } from "quasar";
import api from "../../api";

const props = defineProps({
  modelValue: Boolean,
  ticketData: Object
});

const emit = defineEmits(["update:modelValue", "reprinted"]);

const $q = useQuasar();
const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val)
});

const loading = ref(false);

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const onPrint = () => {
  // Aquí se implementaría la lógica de impresión real
  $q.notify({
    type: 'info',
    message: 'Enviando a impresora...',
    timeout: 1000
  });
  
  // Simulación de impresión
  setTimeout(() => {
    $q.notify({
      type: 'positive',
      message: 'Ticket enviado a impresora',
      timeout: 2000
    });
  }, 1000);
};

const onReimprimir = async () => {
  if (!props.ticketData?.solicitud?.id_solicitud) return;
  
  loading.value = true;
  
  try {
    const response = await api.post(`/solicitudes/${props.ticketData.solicitud.id_solicitud}/reimprimir`);
    
    $q.notify({
      type: 'positive',
      message: 'Copia del ticket generada exitosamente',
      timeout: 2000
    });
    
    emit("reprinted", response.data);
    
  } catch (error) {
    console.error("Error reimprimiendo ticket:", error);
    $q.notify({
      type: 'negative',
      message: error.response?.data?.msg || 'Error al reimprimir ticket'
    });
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.rounded-borders {
  border-radius: 8px;
}
</style>
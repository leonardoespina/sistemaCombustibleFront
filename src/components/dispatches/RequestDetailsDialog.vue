<template>
  <q-dialog v-model="visible" persistent backdrop-filter="blur(4px)">
    <q-card style="width: 100%; max-width: 500px; border-radius: 8px" class="q-mx-sm">
      <q-card-section
        class="row items-center q-py-xs q-px-md bg-primary text-white"
      >
        <div class="text-subtitle1 text-weight-bold">
          Solicitud #{{ requestData?.id_solicitud }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pa-sm">
        <div class="column q-gutter-y-sm">
          <!-- ESTATUS Y FECHA -->
          <div
            class="row justify-between items-center bg-grey-2 q-pa-sm rounded-borders"
          >
            <div class="row items-center q-gutter-x-xs">
              <q-badge
                :color="getStatusColor(requestData?.estado)"
                class="text-weight-bold"
              >
                {{ (requestData?.estado || "S/E").replace("_", " ") }}
              </q-badge>
              <div class="text-weight-bolder text-primary">
                {{ requestData?.codigo_ticket || "SIN TICKET" }}
              </div>
            </div>
            <div class="text-caption text-grey-8">
              {{ formatDateTime(requestData?.fecha_solicitud) }}
            </div>
          </div>

          <!-- SECCIÓN: SOLICITANTE -->
          <div
            class="q-pa-xs border-primary rounded-borders bg-grey-1"
            style="border-left: 4px solid var(--q-primary)"
          >
            <div class="text-caption text-primary text-weight-bold q-mb-xs">
              Solicitante
            </div>
            <div class="row q-col-gutter-xs">
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">Nombre</div>
                <div class="text-weight-medium">
                  {{
                    requestData?.Solicitante
                      ? `${requestData.Solicitante.nombre} ${requestData.Solicitante.apellido}`
                      : "N/A"
                  }}
                </div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">Unidad</div>
                <div class="text-weight-medium text-truncate">
                  {{ requestData?.Subdependencia?.nombre || "N/A" }}
                </div>
              </div>
            </div>
          </div>

          <!-- SECCIÓN: VEHÍCULO -->
          <div
            class="q-pa-xs rounded-borders bg-blue-1 border-blue-2"
            style="border: 1px solid #bbdefb"
          >
            <div class="text-caption text-blue-9 text-weight-bold q-mb-xs">
              Vehículo
            </div>
            <div class="row items-center q-col-gutter-sm">
              <div class="col-4 col-sm-4">
                <div
                  class="bg-white text-center rounded-borders q-pa-xs shadow-1"
                >
                  <div class="text-h6 text-weight-bolder text-primary">
                    {{ requestData?.placa || "N/A" }}
                  </div>
                </div>
              </div>
              <div class="col-8 col-sm-8">
                <div class="text-caption text-grey-7">Marca/Modelo</div>
                <div class="text-weight-medium text-subtitle2">
                  {{ requestData?.marca || "N/A" }}
                  {{ requestData?.modelo || "" }}
                </div>
              </div>
            </div>
          </div>

          <!-- SECCIÓN: COMBUSTIBLE -->
          <div
            class="q-pa-xs rounded-borders bg-orange-1"
            style="border: 1px solid #ffe0b2"
          >
            <div class="row items-center q-col-gutter-sm">
              <div class="col-4 col-sm-4">
                <div class="text-caption text-orange-9 text-weight-bold">
                  Combustible
                </div>
                <div class="text-weight-bold">
                  {{ requestData?.TipoCombustible?.nombre || "N/A" }}
                </div>
              </div>
              <div class="col-4 col-sm-4 text-center">
                <div class="text-caption text-orange-9 text-weight-bold">
                  Llenadero
                </div>
                <div class="text-weight-bold text-truncate">
                  {{ requestData?.Llenadero?.nombre_llenadero || "N/A" }}
                </div>
              </div>
              <div class="col-4 col-sm-4 text-right">
                <div class="text-caption text-orange-9 text-weight-bold">
                  Cantidad
                </div>
                <div class="text-h6 text-weight-bolder text-orange-10">
                  {{ requestData?.cantidad_litros }} L
                </div>
              </div>

              <!-- Detalles Suministro Especial / Venta -->
              <div
                class="col-12 q-mt-xs q-pt-xs row justify-between items-center"
                v-if="
                  requestData?.tipo_solicitud === 'VENTA' ||
                  requestData?.tipo_suministro === 'BIDON'
                "
                style="border-top: 1px dashed #ffe0b2"
              >
                <div>
                  <q-badge
                    v-if="requestData?.tipo_solicitud === 'VENTA'"
                    color="primary"
                    label="VENTA"
                    class="q-mr-xs"
                  />
                  <q-badge
                    v-if="requestData?.tipo_suministro === 'BIDON'"
                    outline
                    color="orange-10"
                    label="BIDÓN"
                  />
                </div>
                <div
                  v-if="requestData?.tipo_solicitud === 'VENTA'"
                  class="text-subtitle2 text-weight-bolder text-orange-10"
                >
                  Total: {{ formatCurrency(requestData?.monto_total) }}
                </div>
              </div>
            </div>
          </div>

          <!-- AUDITORÍA Y OBSERVACIONES -->
          <div
            class="q-pa-xs"
            v-if="requestData?.Aprobador || requestData?.observaciones"
          >
            <div class="row q-col-gutter-xs">
              <div class="col-12" v-if="requestData?.Aprobador">
                <div class="text-caption text-grey-6">
                  Aprobado por:
                  <span class="text-weight-bold text-grey-9"
                    >{{ requestData.Aprobador.nombre }}
                    {{ requestData.Aprobador.apellido }}</span
                  >
                </div>
              </div>
              <div class="col-12" v-if="requestData?.observaciones">
                <div
                  class="q-mt-xs q-pa-xs bg-grey-2 rounded-borders text-italic text-grey-8 text-caption"
                  style="border: 1px dashed #ccc"
                >
                  {{ requestData.observaciones }}
                </div>
              </div>
            </div>
          </div>

          <!-- SECCIÓN: RESULTADO DESPACHO (Real) -->
          <div
            class="q-pa-xs rounded-borders bg-green-1 border-green-2"
            v-if="
              ['FINALIZADA', 'DESPACHADA'].includes(requestData?.estado) ||
              requestData?.cantidad_despachada
            "
            style="border: 1px solid #c8e6c9"
          >
            <div class="row items-center q-col-gutter-sm">
              <div class="col-6 col-sm-6">
                <div class="text-caption text-green-9 text-weight-bold">
                  Litros Despachados (Real)
                </div>
                <div class="text-h6 text-weight-bolder text-green-10">
                  {{ requestData?.cantidad_despachada }} L
                </div>
              </div>
              <div class="col-6 col-sm-6 text-right">
                <div class="text-caption text-grey-7">Fecha CierreS</div>
                <div class="text-weight-medium">
                  {{
                    formatDateTime(
                      requestData?.fecha_validacion ||
                        requestData?.fecha_despacho,
                    )
                  }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pt-none q-pb-sm q-px-md">
        <q-btn
          v-if="
            ['IMPRESA', 'FINALIZADA', 'DESPACHADA'].includes(
              requestData?.estado,
            )
          "
          outline
          label="Imprimir Ticket"
          color="indigo"
          icon="print"
          dense
          @click="$emit('print', requestData)"
        />
        <q-btn flat label="Cerrar" color="grey-8" v-close-popup dense />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: Boolean,
  requestData: Object,
});

const emit = defineEmits(["update:modelValue", "print"]);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const formatDateTime = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const getStatusColor = (status) => {
  switch (status) {
    case "PENDIENTE":
      return "orange";
    case "APROBADA":
      return "blue";
    case "IMPRESA":
      return "indigo";
    case "DESPACHADA":
      return "green";
    case "FINALIZADA":
      return "green-9";
    case "RECHAZADA":
      return "red";
    case "VENCIDA":
      return "grey-9";
    case "ANULADA":
      return "grey-7";
    default:
      return "black";
  }
};

const formatCurrency = (val) => {
  if (!val) return "0.00";
  return new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency: "USD",
  }).format(val);
};
</script>

<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card style="width: 100%; max-width: 500px; border-radius: 8px" class="q-mx-sm">
      <q-card-section class="row items-center q-py-xs q-px-md bg-primary text-white">
        <div class="text-subtitle1 text-weight-bold">
          Transferencia #{{ data?.id_transferencia }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pa-sm" v-if="data">
        <div class="column q-gutter-y-sm">
          <!-- ESTATUS Y FECHA -->
          <div class="row justify-between items-center bg-grey-2 q-pa-sm rounded-borders">
            <div class="row items-center q-gutter-x-xs">
              <q-badge
                :color="data.estado === 'PROCESADO' ? 'positive' : 'warning'"
                class="text-weight-bold"
              >
                {{ data.estado }}
              </q-badge>
            </div>
            <div class="text-caption text-grey-8 font-mono">
              {{ formatDateTime(data.fecha_transferencia) }}
            </div>
          </div>

          <!-- SECCIÓN: ORIGEN -->
          <div
            class="q-pa-xs border-negative-left rounded-borders bg-red-1"
            style="border-left: 4px solid var(--q-negative)"
          >
            <div class="text-caption text-negative text-weight-bold q-mb-xs">
              Tanque Origen (Salida)
            </div>
            <div class="row q-col-gutter-xs items-center">
              <div class="col-4 col-sm-3">
                <div class="bg-white text-center rounded-borders q-pa-xs shadow-1">
                  <div class="text-h6 text-weight-bolder text-negative">
                    {{ data.TanqueOrigen?.codigo }}
                  </div>
                </div>
              </div>
              <div class="col-8 col-sm-9">
                <div class="text-caption text-grey-7">Nombre / Llenadero</div>
                <div class="text-weight-medium text-subtitle2 text-truncate">
                  {{ data.TanqueOrigen?.nombre }}
                </div>
                <div class="text-caption text-grey-6 text-truncate">
                   {{ data.TanqueOrigen?.Llenadero?.nombre_llenadero }}
                </div>
              </div>
            </div>
          </div>

          <!-- SECCIÓN: DESTINO -->
          <div
            class="q-pa-xs border-positive-left rounded-borders bg-green-1"
            style="border-left: 4px solid var(--q-positive)"
          >
            <div class="text-caption text-positive text-weight-bold q-mb-xs">
              Tanque Destino (Entrada)
            </div>
            <div class="row q-col-gutter-xs items-center">
              <div class="col-4 col-sm-3">
                <div class="bg-white text-center rounded-borders q-pa-xs shadow-1">
                  <div class="text-h6 text-weight-bolder text-positive">
                    {{ data.TanqueDestino?.codigo }}
                  </div>
                </div>
              </div>
              <div class="col-8 col-sm-9">
                <div class="text-caption text-grey-7">Nombre / Llenadero</div>
                <div class="text-weight-medium text-subtitle2 text-truncate">
                  {{ data.TanqueDestino?.nombre }}
                </div>
                <div class="text-caption text-grey-6 text-truncate">
                   {{ data.TanqueDestino?.Llenadero?.nombre_llenadero }}
                </div>
              </div>
            </div>
          </div>

          <!-- SECCIÓN: MOVIMIENTO -->
          <div
            class="q-pa-xs rounded-borders bg-orange-1"
            style="border: 1px solid #ffe0b2"
          >
            <div class="text-caption text-orange-9 text-weight-bold q-mb-xs">
              Detalle del Movimiento
            </div>
            <div class="row q-col-gutter-sm">
                <div class="col-12 text-center q-pb-xs">
                     <div class="text-h5 text-weight-bolder text-orange-10">
                        {{ formatNumber(data.cantidad_transferida) }} L
                    </div>
                </div>
                <div class="col-6" style="border-right: 1px dashed #ffe0b2">
                    <div class="text-caption text-grey-7 text-center text-uppercase">Origen</div>
                    <div class="row justify-between text-caption q-mt-xs">
                        <span>Antes:</span>
                        <span class="text-weight-bold">{{ formatNumber(data.nivel_origen_antes) }} L</span>
                    </div>
                    <div class="row justify-between text-subtitle2 text-negative">
                        <span>Después:</span>
                        <span class="text-weight-bolder">{{ formatNumber(data.nivel_origen_despues) }} L</span>
                    </div>
                </div>
                <div class="col-6">
                    <div class="text-caption text-grey-7 text-center text-uppercase">Destino</div>
                    <div class="row justify-between text-caption q-mt-xs">
                        <span>Antes:</span>
                        <span class="text-weight-bold">{{ formatNumber(data.nivel_destino_antes) }} L</span>
                    </div>
                    <div class="row justify-between text-subtitle2 text-positive">
                        <span>Después:</span>
                        <span class="text-weight-bolder">{{ formatNumber(data.nivel_destino_despues) }} L</span>
                    </div>
                </div>
            </div>
          </div>

          <!-- AUDITORÍA Y OBSERVACIONES -->
          <div class="q-pa-xs">
            <div class="row q-col-gutter-xs">
              <div class="col-12">
                <div class="text-caption text-grey-6">
                  Registrado por:
                  <span class="text-weight-bold text-grey-9">
                    {{ data.Almacenista?.nombre }} {{ data.Almacenista?.apellido }}
                  </span>
                </div>
              </div>
              <div class="col-12" v-if="data.observacion">
                <div
                  class="q-mt-xs q-pa-sm bg-grey-2 rounded-borders text-italic text-grey-8 text-caption"
                  style="border: 1px dashed #ccc"
                >
                  {{ data.observacion }}
                </div>
              </div>
              <div class="col-12" v-if="data.medida_vara_destino">
                 <div class="text-caption text-grey-6">
                  Medida Vara Destino (Ref):
                  <span class="text-weight-bold text-grey-9">{{ data.medida_vara_destino }} cm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pt-none q-pb-sm q-px-md">
        <q-btn
          outline
          label="Imprimir Comprobante"
          color="indigo"
          icon="print"
          dense
          @click="handlePrint"
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
  data: Object
});

const emit = defineEmits(["update:modelValue"]);

const formatDateTime = (dateStr) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

function formatNumber(val) {
  return parseFloat(val || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function handlePrint() {
  window.print();
}
</script>

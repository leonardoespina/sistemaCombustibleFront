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
          Carga de Cisterna #{{ data?.id_carga }}
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
              <div class="text-weight-bolder text-primary">
                GUÍA: {{ data.numero_guia }}
              </div>
            </div>
            <div class="text-caption text-grey-8 font-mono">
              {{ formatDateTime(data.fecha_llegada) }}
            </div>
          </div>

          <!-- SECCIÓN: CISTERNA -->
          <div
            class="q-pa-xs border-primary-left rounded-borders bg-blue-1"
            style="border-left: 4px solid var(--q-primary)"
          >
            <div class="text-caption text-primary text-weight-bold q-mb-xs">
              Cisterna / Vehículo
            </div>
            <div class="row q-col-gutter-xs items-center">
              <div class="col-4 col-sm-3">
                <div class="bg-white text-center rounded-borders q-pa-xs shadow-1">
                  <div class="text-h6 text-weight-bolder text-primary">
                    {{ data.placa_cisterna || 'S/I' }}
                  </div>
                </div>
              </div>
              <div class="col-8 col-sm-9">
                <div class="text-caption text-grey-7">Conductor</div>
                <div class="text-weight-medium text-subtitle2 text-truncate">
                  {{ data.nombre_chofer || 'No Registrado' }}
                </div>
              </div>
            </div>
          </div>

          <!-- SECCIÓN: TANQUE RECEPTOR -->
          <div
            class="q-pa-xs border-positive-left rounded-borders bg-green-1"
            style="border-left: 4px solid var(--q-positive)"
          >
            <div class="text-caption text-positive text-weight-bold q-mb-xs">
              Tanque Receptor
            </div>
            <div class="row q-col-gutter-xs items-center">
              <div class="col-4 col-sm-3">
                <div class="bg-white text-center rounded-borders q-pa-xs shadow-1">
                  <div class="text-h6 text-weight-bolder text-positive">
                    {{ data.Tanque?.codigo }}
                  </div>
                </div>
              </div>
              <div class="col-8 col-sm-9">
                <div class="text-caption text-grey-7">Nombre / Llenadero</div>
                <div class="text-weight-medium text-subtitle2 text-truncate">
                  {{ data.Tanque?.nombre }}
                </div>
                <div class="text-caption text-grey-6 text-truncate">
                   {{ data.Tanque?.Llenadero?.nombre_llenadero }}
                </div>
              </div>
            </div>
          </div>

          <!-- SECCIÓN: RECEPCIÓN REAL -->
          <div
            class="q-pa-xs rounded-borders bg-orange-1"
            style="border: 1px solid #ffe0b2"
          >
            <div class="text-caption text-orange-9 text-weight-bold q-mb-xs">
              Resultado de Recepción (Vara)
            </div>
            <div class="row q-col-gutter-sm items-center">
                <div class="col-12 text-center q-pb-xs">
                     <div class="text-h5 text-weight-bolder text-orange-10">
                        {{ formatNumber(data.litros_recibidos) }} L
                    </div>
                </div>
                <div class="col-6" style="border-right: 1px dashed #ffe0b2">
                    <div class="text-caption text-grey-7 text-center">MEDIDAS (cm)</div>
                    <div class="row justify-between text-caption q-mt-xs">
                        <span>Inicial:</span>
                        <span class="text-weight-bold">{{ data.medida_inicial }}</span>
                    </div>
                    <div class="row justify-between text-subtitle2 text-primary">
                        <span>Final:</span>
                        <span class="text-weight-bolder">{{ data.medida_final }}</span>
                    </div>
                </div>
                <div class="col-6">
                    <div class="text-caption text-grey-7 text-center">COMPARATIVA GUÍA</div>
                    <div class="row justify-between text-caption q-mt-xs">
                        <span>Guía:</span>
                        <span class="text-weight-bold">{{ formatNumber(data.litros_segun_guia) }} L</span>
                    </div>
                    <div 
                        class="row justify-between text-subtitle2"
                        :class="parseFloat(data.diferencia_guia) > 0 ? 'text-negative' : 'text-positive'"
                    >
                        <span>Dif:</span>
                        <span class="text-weight-bolder">
                            {{ parseFloat(data.diferencia_guia) > 0 ? '+' : '' }}{{ formatNumber(data.diferencia_guia) }} L
                        </span>
                    </div>
                </div>
            </div>
          </div>

          <!-- FLUJÓMETRO (SI EXISTE) -->
          <div
            class="q-pa-xs rounded-borders bg-indigo-1"
            style="border: 1px solid #c5cae9"
            v-if="data.litros_flujometro"
          >
            <div class="text-caption text-indigo-9 text-weight-bold q-mb-xs">
              Dato de Flujómetro (Opcional)
            </div>
            <div class="row items-center justify-between">
                <div>
                    <span class="text-caption text-grey-7 q-mr-xs">Lectura:</span>
                    <span class="text-subtitle1 text-weight-bold text-indigo-10">{{ formatNumber(data.litros_flujometro) }} L</span>
                </div>
                <div class="text-right">
                    <span class="text-caption text-grey-7 q-mr-xs">Desviación:</span>
                    <span class="text-subtitle1 text-weight-bold text-indigo-10">{{ formatNumber(data.diferencia_vara_flujometro) }} L</span>
                </div>
            </div>
          </div>

          <!-- AUDITORÍA Y OBSERVACIONES -->
          <div class="q-pa-xs">
            <div class="row q-col-gutter-xs">
              <div class="col-12">
                <div class="text-caption text-grey-6">
                  Recibido por:
                  <span class="text-weight-bold text-grey-9">
                    {{ data.Almacenista?.nombre }} {{ data.Almacenista?.apellido }}
                  </span>
                </div>
              </div>
              <div class="col-12">
                <div class="text-caption text-grey-6">
                  Registrado por:
                  <span class="text-weight-bold text-grey-9">
                    {{ data.Usuario?.nombre }} {{ data.Usuario?.apellido }}
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

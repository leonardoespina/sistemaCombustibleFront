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
          Medición #{{ data?.id_medicion }}
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
              {{ formatDateTime(data.fecha_medicion, data.hora_medicion) }}
            </div>
          </div>

          <!-- SECCIÓN: TANQUE -->
          <div
            class="q-pa-xs border-primary-left rounded-borders bg-blue-1"
            style="border-left: 4px solid var(--q-primary)"
          >
            <div class="text-caption text-primary text-weight-bold q-mb-xs">
              Tanque Medido
            </div>
            <div class="row q-col-gutter-xs items-center">
              <div class="col-4 col-sm-3">
                <div class="bg-white text-center rounded-borders q-pa-xs shadow-1">
                  <div class="text-h6 text-weight-bolder text-primary">
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

          <!-- SECCIÓN: RESULTADOS DE MEDICIÓN -->
          <div
            class="q-pa-xs rounded-borders"
            :class="parseFloat(data.diferencia) > 0 ? 'bg-red-1' : 'bg-green-1'"
            :style="parseFloat(data.diferencia) > 0 ? 'border: 1px solid #ffcdd2' : 'border: 1px solid #c8e6c9'"
          >
            <div 
                class="text-caption text-weight-bold q-mb-xs"
                :class="parseFloat(data.diferencia) > 0 ? 'text-negative' : 'text-positive'"
            >
              Resultado de Inventario ({{ parseFloat(data.diferencia) > 0 ? 'FALTANTE' : 'SOBRANTE' }})
            </div>
            
            <div class="row q-col-gutter-sm items-center">
                <div class="col-6">
                    <div class="text-caption text-grey-7">Volumen Sistema (Teórico)</div>
                    <div class="text-subtitle1 text-weight-bold">{{ formatNumber(data.volumen_teorico) }} L</div>
                </div>
                <div class="col-6 text-right">
                    <div class="text-caption text-grey-7">Volumen Real (Físico)</div>
                    <div class="text-subtitle1 text-weight-bold">{{ formatNumber(data.volumen_real) }} L</div>
                </div>
                <div class="col-12 q-pt-none">
                     <q-separator :color="parseFloat(data.diferencia) > 0 ? 'red-2' : 'green-2'" class="q-my-xs" />
                </div>
                <div class="col-6">
                    <div class="text-caption text-grey-7">Medida de Vara</div>
                    <div class="text-h6 text-weight-bold">{{ data.medida_vara }} <small>cm</small></div>
                </div>
                <div class="col-6 text-right">
                    <div class="text-caption text-grey-7">Diferencia Neta</div>
                    <div 
                        class="text-h5 text-weight-bolder"
                        :class="parseFloat(data.diferencia) > 0 ? 'text-negative' : 'text-positive'"
                    >
                        {{ parseFloat(data.diferencia) > 0 ? '+' : '' }}{{ formatNumber(data.diferencia) }} L
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
                    {{ data.Usuario?.nombre }} {{ data.Usuario?.apellido }}
                  </span>
                </div>
              </div>
              <div class="col-12" v-if="data.observaciones">
                <div
                  class="q-mt-xs q-pa-sm bg-grey-2 rounded-borders text-italic text-grey-8 text-caption"
                  style="border: 1px dashed #ccc"
                >
                  {{ data.observaciones }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pt-none q-pb-sm q-px-md">
        <q-btn
          outline
          label="Imprimir Acta"
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

const formatDateTime = (fecha, hora) => {
  if (!fecha) return "N/A";
  const dateStr = hora ? `${fecha}T${hora}` : fecha;
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

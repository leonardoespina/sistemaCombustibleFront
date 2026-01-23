<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
  >
    <q-card style="width: 600px; max-width: 90vw">
      <q-toolbar class="bg-primary text-white">
        <q-toolbar-title>Detalle de Carga de Cisterna</q-toolbar-title>
        <q-btn flat round dense icon="close" v-close-popup />
      </q-toolbar>

      <q-card-section class="q-pa-md">
        <!-- ENCABEZADO -->
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6">Guía N° {{ load?.numero_guia }}</div>
          <q-badge
            :color="load?.estado === 'PROCESADO' ? 'green' : 'red'"
            :label="load?.estado"
          />
        </div>

        <!-- DATOS GENERALES -->
        <div class="row q-col-gutter-y-sm text-body2 border-section q-mb-md">
          <div class="col-12 text-caption text-grey-8 text-uppercase q-mb-xs">
            Datos Generales
          </div>

          <div class="col-6 text-grey-8">Fecha/Hora:</div>
          <div class="col-6 text-right">
            {{ formatDate(load?.fecha_hora_llegada) }}
          </div>

          <div class="col-6 text-grey-8">Cisterna:</div>
          <div class="col-6 text-right">
            {{ load?.Vehiculo?.placa || "N/A" }}
          </div>

          <div class="col-6 text-grey-8">Tanque Receptor:</div>
          <div class="col-6 text-right">
            {{ load?.Tanque?.nombre || "N/A" }} ({{ load?.Tanque?.codigo }})
          </div>
        </div>

        <!-- MEDICIONES -->
        <div
          class="row q-col-gutter-y-sm text-body2 border-section q-mb-md bg-grey-1 q-pa-sm rounded-borders"
        >
          <div
            class="col-12 text-caption text-primary text-uppercase text-weight-bold q-mb-xs"
          >
            Medición Física (Vara)
          </div>

          <div class="col-6 text-grey-8">Medida Inicial:</div>
          <div class="col-6 text-right">{{ load?.medida_inicial }}</div>

          <div class="col-6 text-grey-8">Medida Final:</div>
          <div class="col-6 text-right">{{ load?.medida_final }}</div>

          <div class="col-12 q-my-xs"><q-separator /></div>

          <div class="col-6 text-weight-bold">Volumen Ingresado:</div>
          <div
            class="col-6 text-right text-weight-bold text-primary"
            style="font-size: 1.1em"
          >
            {{ load?.litros_recibidos_real }} Lts
          </div>
        </div>

        <!-- COMPARATIVAS -->
        <div class="row q-col-gutter-y-sm text-body2 border-section q-mb-md">
          <div class="col-12 text-caption text-grey-8 text-uppercase q-mb-xs">
            Comparativas
          </div>

          <!-- VS GUÍA -->
          <div class="col-6 text-grey-8">Según Guía:</div>
          <div class="col-6 text-right">{{ load?.litros_segun_guia }} Lts</div>

          <div class="col-6 text-grey-8">Diferencia Guía:</div>
          <div
            class="col-6 text-right"
            :class="getColor(load?.litros_faltantes)"
          >
            {{ load?.litros_faltantes }} Lts
          </div>

          <!-- VS FLUJÓMETRO -->
          <div class="col-12 q-my-xs"><q-separator dashed /></div>

          <div class="col-6 text-grey-8">Según Flujómetro:</div>
          <div class="col-6 text-right">
            {{ load?.litros_flujometro || "---" }} Lts
          </div>

          <div v-if="load?.litros_flujometro" class="col-6 text-grey-8">
            Desviación Flujo:
          </div>
          <div v-if="load?.litros_flujometro" class="col-6 text-right">
            {{ load?.diferencia_vara_flujometro }} Lts
          </div>
        </div>

        <!-- RESPONSABLES -->
        <div class="text-caption text-grey-6 q-mt-lg text-center">
          <div>
            Almacenista: {{ load?.Almacenista?.nombre }}
            {{ load?.Almacenista?.apellido }}
          </div>
          <!-- USUARIO QUE ELABORÓ -->
          <div class="q-mt-xs">
            Elaborado por:
            <strong
              >{{ load?.Usuario?.nombre }} {{ load?.Usuario?.apellido }}</strong
            >
            (CI: {{ load?.Usuario?.cedula || "N/A" }})
          </div>
          <div v-if="load?.observacion" class="q-mt-sm text-italic">
            "{{ load?.observacion }}"
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { date } from "quasar";

const props = defineProps({
  modelValue: Boolean,
  load: Object,
});

const emit = defineEmits(["update:modelValue"]);

function formatDate(dateString) {
  return date.formatDate(dateString, "DD/MM/YYYY HH:mm");
}

function getColor(val) {
  return val > 0 ? "text-negative" : "text-positive";
}
</script>

<style scoped>
.border-section {
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}
</style>

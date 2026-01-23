<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
  >
    <q-card style="width: 400px; max-width: 90vw">
      <q-toolbar class="bg-primary text-white">
        <q-toolbar-title>Ticket de Despacho</q-toolbar-title>
        <q-btn flat round dense icon="close" v-close-popup />
      </q-toolbar>

      <q-card-section class="q-pa-md">
        <div class="text-h5 text-center text-weight-bold q-mb-md">
          N° {{ dispatch?.numero_ticket }}
        </div>

        <div class="row q-col-gutter-y-sm text-body2">
          <div class="col-6 text-grey-8">Fecha:</div>
          <div class="col-6 text-right">
            {{ formatDate(dispatch?.fecha_hora) }}
          </div>

          <div class="col-6 text-grey-8">Dispensador:</div>
          <div class="col-6 text-right">
            {{ dispatch?.Dispensador?.nombre }}
          </div>

          <q-separator class="col-12 q-my-sm" />

          <div class="col-6 text-grey-8">Cant. Solicitada:</div>
          <div class="col-6 text-right">
            {{ dispatch?.cantidad_solicitada }} Lts
          </div>

          <div class="col-6 text-bold text-primary" style="font-size: 1.1em">
            Despachado:
          </div>
          <div
            class="col-6 text-right text-bold text-primary"
            style="font-size: 1.1em"
          >
            {{ dispatch?.cantidad_despachada }} Lts
          </div>

          <q-separator class="col-12 q-my-sm" />

          <div class="col-12 text-center q-mb-xs text-weight-bold">
            BENEFICIARIO
          </div>

          <!-- CASO VEHÍCULO: MUESTRA CHOFER -->
          <template v-if="dispatch?.tipo_destino === 'VEHICULO'">
            <div class="col-12 text-center">
              {{ dispatch?.Chofer?.nombre }} {{ dispatch?.Chofer?.apellido }}
            </div>
            <div class="col-12 text-center text-caption">
              CI: {{ dispatch?.Chofer?.cedula }}
            </div>
            <div class="col-12 text-center q-mt-xs text-caption">
              Vehículo: {{ dispatch?.Vehiculo?.placa }}
            </div>
          </template>

          <!-- CASO BIDÓN: MUESTRA GERENCIA -->
          <template v-if="dispatch?.tipo_destino === 'BIDON'">
            <div class="col-12 text-center">
              {{ dispatch?.Gerencia?.nombre }}
            </div>
            <div class="col-12 text-center text-caption">(Bidón)</div>
          </template>

          <q-separator class="col-12 q-my-sm" />

          <div class="col-12 text-caption text-center text-grey-6">
            Despachado por: {{ dispatch?.Almacenista?.nombre }}
            {{ dispatch?.Almacenista?.apellido }}
          </div>
          <div
            class="col-12 text-caption text-center text-grey-6"
            v-if="dispatch?.observacion"
          >
            Obs: {{ dispatch?.observacion }}
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
  dispatch: Object,
});

const emit = defineEmits(["update:modelValue"]);

function formatDate(dateString) {
  return date.formatDate(dateString, "DD/MM/YYYY HH:mm");
}
</script>

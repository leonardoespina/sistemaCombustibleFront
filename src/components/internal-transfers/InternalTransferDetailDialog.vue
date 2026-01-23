<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
  >
    <q-card style="width: 500px; max-width: 90vw">
      <q-toolbar class="bg-primary text-white">
        <q-toolbar-title>Detalle de Transferencia Interna</q-toolbar-title>
        <q-btn flat round dense icon="close" v-close-popup />
      </q-toolbar>

      <q-card-section class="q-pa-md">
        <!-- ENCABEZADO -->
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6">ID #{{ transfer?.id_transferencia }}</div>
          <div class="text-caption text-grey-6">
            {{ formatDate(transfer?.hora_inicio) }}
          </div>
        </div>

        <!-- FLUJO DE TRANSFERENCIA -->
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-5 text-center">
            <div class="text-caption text-grey-8">ORIGEN</div>
            <div class="text-subtitle1 text-weight-bold">
              {{ transfer?.TanqueOrigen?.codigo }}
            </div>
            <div class="text-caption text-grey-6">
              {{ transfer?.TanqueOrigen?.nombre }}
            </div>
          </div>
          <div class="col-2 flex flex-center">
            <q-icon name="arrow_forward" size="md" color="primary" />
          </div>
          <div class="col-5 text-center">
            <div class="text-caption text-grey-8">DESTINO</div>
            <div class="text-subtitle1 text-weight-bold">
              {{ transfer?.TanqueDestino?.codigo }}
            </div>
            <div class="text-caption text-grey-6">
              {{ transfer?.TanqueDestino?.nombre }}
            </div>
          </div>
        </div>

        <!-- VOLUMENES -->
        <div class="bg-blue-1 q-pa-md rounded-borders q-mb-md">
          <div class="row items-center justify-between">
            <span class="text-subtitle2 text-grey-8">Volumen Transferido:</span>
            <span class="text-h5 text-primary text-weight-bold"
              >{{ transfer?.litros_transferidos }} L</span
            >
          </div>
          <q-separator class="q-my-sm bg-blue-2" />
          <div class="row q-gutter-y-xs text-caption">
            <div class="col-6 text-grey-8">Nivel Origen Antes:</div>
            <div class="col-6 text-right">
              {{ transfer?.litros_antes_origen }} L
            </div>

            <div class="col-6 text-grey-8">Nivel Destino Después:</div>
            <div class="col-6 text-right">
              {{ transfer?.litros_despues_destino }} L
            </div>

            <div class="col-6 text-grey-8">Vara Final Destino:</div>
            <div class="col-6 text-right">
              {{ transfer?.medida_vara_destino || "---" }}
              {{ transfer?.medida_vara_destino ? "cm" : "" }}
            </div>
          </div>
        </div>

        <!-- RESPONSABLES -->
        <div class="text-caption text-grey-6 q-mt-md text-center">
          <div>
            Almacenista: {{ transfer?.Almacenista?.nombre }}
            {{ transfer?.Almacenista?.apellido }}
          </div>
          <div class="q-mt-xs">
            Registrado por:
            <strong
              >{{ transfer?.Usuario?.nombre }}
              {{ transfer?.Usuario?.apellido }}</strong
            >
          </div>
          <div
            v-if="transfer?.observacion"
            class="q-mt-sm text-italic bg-grey-2 q-pa-xs rounded-borders"
          >
            "{{ transfer?.observacion }}"
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
  transfer: Object,
});

const emit = defineEmits(["update:modelValue"]);

function formatDate(dateString) {
  return date.formatDate(dateString, "DD/MM/YYYY HH:mm");
}
</script>

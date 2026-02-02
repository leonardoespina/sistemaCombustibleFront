<!-- src/components/dispatches/request-sections/RequestQuotaSection.vue -->
<template>
  <q-card flat bordered class="bg-blue-grey-1 col">
    <q-card-section class="q-py-xs bg-blue-grey-3 text-white">
      <div class="text-subtitle2 text-weight-bolder">
        Cupo Mensual Disponible
      </div>
    </q-card-section>
    <q-separator />
    <q-card-section class="q-pa-md q-gutter-y-md">
      <div class="row q-col-gutter-lg">
        <!-- Asignado -->
        <div class="col-6">
          <div class="text-overline text-blue-grey-8 leading-none q-mb-xs">
            Asignado
          </div>
          <div class="text-h5 text-primary text-weight-bolder">
            {{ formatVolume(quotaInfo?.asignado) }}
            <small class="text-caption">LTS</small>
          </div>
        </div>

        <!-- Disponible -->
        <div class="col-6 text-right">
          <div class="text-overline text-blue-grey-8 leading-none q-mb-xs">
            Disponible
          </div>
          <div
            class="text-h5 text-weight-bolder"
            :class="
              quotaInfo?.disponible > 0 ? 'text-green-8' : 'text-negative'
            "
          >
            {{ formatVolume(quotaInfo?.disponible) }}
          </div>
        </div>
      </div>

      <q-separator dotted />

      <!-- Consumo Acumulado -->
      <div
        class="row bg-white q-pa-md rounded-borders shadow-1 items-center"
      >
        <div class="col-7">
          <div class="text-overline text-grey-7 leading-none q-mb-xs">
            Consumo Acumulado
          </div>
          <div class="text-h5 text-deep-orange-9 text-weight-bolder">
            {{ formatVolume(quotaInfo?.consumido) }}
            <small class="text-caption">LTS</small>
          </div>
        </div>
        <div class="col-5 column items-center">
          <q-circular-progress
            show-value
            font-size="12px"
            :value="Number(quotaInfo?.porcentaje || 0)"
            size="70px"
            :thickness="0.25"
            color="deep-orange-9"
            track-color="grey-2"
            class="text-weight-bolder"
          >
            {{ quotaInfo?.porcentaje || 0 }}%
          </q-circular-progress>
          <div
            class="text-caption text-weight-bold text-grey-8 q-mt-xs text-uppercase"
          >
            % Consumo
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
defineProps({
  quotaInfo: {
    type: Object,
    default: () => ({
      disponible: 0,
      asignado: 0,
      consumido: 0,
      porcentaje: 0,
    }),
  },
  formatVolume: {
    type: Function,
    required: true,
  },
});
</script>

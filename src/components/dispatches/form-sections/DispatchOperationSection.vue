<template>
  <div v-show="!isMobile || currentStep === 1">
    <div class="section-header">
      <q-icon name="receipt_long" color="primary" size="sm" />
      <span class="text-subtitle1 text-weight-medium q-ml-sm">
        Datos de Operación
      </span>
    </div>

    <div class="row q-col-gutter-md q-mt-sm">
      <!-- Ticket -->
      <div class="col-12" :class="{ 'col-md-4': !isMobile }">
        <q-input
          outlined
          :dense="!isMobile"
          v-model="formData.numero_ticket"
          label="Número de Ticket"
          :rules="[rules.required]"
        >
          <template #prepend>
            <q-icon name="confirmation_number" />
          </template>
        </q-input>
      </div>

      <!-- Fecha -->
      <div class="col-6" :class="{ 'col-md-4': !isMobile }">
        <q-input
          outlined
          :dense="!isMobile"
          v-model="formData.fecha"
          label="Fecha"
          readonly
          :rules="[rules.required]"
        >
          <template #prepend>
            <q-icon name="event" />
          </template>
          <template #append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy
                cover
                transition-show="scale"
                transition-hide="scale"
              >
                <q-date v-model="formData.fecha" mask="YYYY-MM-DD">
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="OK" color="primary" flat />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
      </div>

      <!-- Hora -->
      <div class="col-6" :class="{ 'col-md-4': !isMobile }">
        <q-input
          outlined
          :dense="!isMobile"
          v-model="formData.hora"
          label="Hora"
          readonly
          :rules="[rules.required]"
        >
          <template #prepend>
            <q-icon name="schedule" />
          </template>
          <template #append>
            <q-icon name="schedule" class="cursor-pointer">
              <q-popup-proxy
                cover
                transition-show="scale"
                transition-hide="scale"
              >
                <q-time v-model="formData.hora" format24h>
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="OK" color="primary" flat />
                  </div>
                </q-time>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
      </div>

      <!-- Dispensador -->
      <div class="col-12" :class="{ 'col-md-6': !isMobile }">
        <q-select
          outlined
          :dense="!isMobile"
          v-model="formData.id_dispensador"
          :options="dispensersList"
          option-value="id_dispensador"
          :option-label="(opt) => opt?.nombre || ''"
          label="Dispensador"
          emit-value
          map-options
          :rules="[rules.required]"
        >
          <template #prepend>
            <q-icon name="local_gas_station" />
          </template>
        </q-select>
      </div>

      <!-- Cantidad Solicitada -->
      <div class="col-6" :class="{ 'col-md-3': !isMobile }">
        <q-input
          outlined
          :dense="!isMobile"
          v-model.number="formData.cantidad_solicitada"
          label="Solicitada"
          type="number"
          suffix="Lts"
          :rules="[rules.positive]"
        >
          <template #prepend>
            <q-icon name="water_drop" />
          </template>
        </q-input>
      </div>

      <!-- Cantidad Despachada -->
      <div class="col-6" :class="{ 'col-md-3': !isMobile }">
        <q-input
          outlined
          :dense="!isMobile"
          v-model.number="formData.cantidad_despachada"
          label="Despachada"
          type="number"
          suffix="Lts"
          class="highlight-field"
          :rules="[rules.positive]"
        >
          <template #prepend>
            <q-icon name="local_drink" color="warning" />
          </template>
        </q-input>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  formData: { type: Object, required: true },
  isMobile: Boolean,
  currentStep: Number,
  rules: Object,
  dispensersList: { type: Array, default: () => [] },
});
</script>

<style lang="scss" scoped>
.section-header {
  display: flex;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--q-primary);
  margin-bottom: 8px;
}

.highlight-field {
  :deep(.q-field__control) {
    background: rgba(255, 193, 7, 0.1) !important;
  }
}
</style>

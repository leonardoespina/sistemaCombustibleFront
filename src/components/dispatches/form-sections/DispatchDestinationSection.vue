<template>
  <div
    v-show="!isMobile || currentStep === 2"
    :class="{ 'q-mt-lg': !isMobile }"
  >
    <div class="section-header">
      <q-icon name="place" color="primary" size="sm" />
      <span class="text-subtitle1 text-weight-medium q-ml-sm">
        Destino y Beneficiario
      </span>
    </div>

    <div class="row q-col-gutter-md q-mt-sm">
      <!-- Toggle Tipo Destino -->
      <div class="col-12">
        <!-- Versión Desktop: Botones toggle -->
        <div v-if="!isMobile" class="destination-toggle">
          <q-btn-toggle
            v-model="formData.tipo_destino"
            spread
            no-caps
            rounded
            unelevated
            toggle-color="primary"
            color="grey-3"
            text-color="grey-8"
            :options="destinoOptions"
            @update:model-value="$emit('resetDestinoFields')"
          />
        </div>

        <!-- Versión Mobile: Cards seleccionables -->
        <div v-else class="destination-cards row q-gutter-md">
          <q-card
            v-for="opt in destinoOptions"
            :key="opt.value"
            flat
            bordered
            class="col destination-card cursor-pointer"
            :class="{ selected: formData.tipo_destino === opt.value }"
            @click="$emit('selectDestino', opt.value)"
          >
            <q-card-section class="text-center">
              <q-icon
                :name="opt.icon"
                size="xl"
                :color="
                  formData.tipo_destino === opt.value ? 'primary' : 'grey-5'
                "
              />
              <div class="text-subtitle1 q-mt-sm">{{ opt.label }}</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Campos para VEHÍCULO -->
      <template v-if="formData.tipo_destino === 'VEHICULO'">
        <div class="col-12" :class="{ 'col-md-6': !isMobile }">
          <q-select
            outlined
            :dense="!isMobile"
            use-input
            hide-selected
            fill-input
            input-debounce="0"
            v-model="formData.id_vehiculo"
            label="Vehículo"
            :options="vehicleOptions"
            @filter="(val, update) => $emit('filterVehicles', val, update)"
            option-value="id_vehiculo"
            :option-label="getVehicleLabel"
            emit-value
            map-options
            :rules="[rules.required]"
          >
            <template #prepend>
              <q-icon name="directions_car" />
            </template>
            <template #no-option>
              <q-item>
                <q-item-section class="text-grey text-center">
                  <q-icon name="search_off" class="q-mb-sm" size="md" />
                  No encontrado
                </q-item-section>
              </q-item>
            </template>
            <template #option="{ opt, itemProps }">
              <q-item v-bind="itemProps">
                <q-item-section avatar>
                  <q-icon name="directions_car" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ opt.placa }}</q-item-label>
                  <q-item-label caption>
                    {{ opt.nombre_marca || opt.Marca?.nombre || "" }}
                    {{ opt.nombre_modelo || opt.Modelo?.nombre || "" }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>

        <div class="col-12" :class="{ 'col-md-6': !isMobile }">
          <q-select
            outlined
            :dense="!isMobile"
            use-input
            hide-selected
            fill-input
            input-debounce="0"
            v-model="formData.id_chofer"
            label="Chofer Responsable"
            :options="driverOptions"
            @filter="(val, update) => $emit('filterDrivers', val, update)"
            option-value="id_chofer"
            :option-label="getDriverLabel"
            emit-value
            map-options
            :rules="[rules.required]"
          >
            <template #prepend>
              <q-icon name="person" />
            </template>
            <template #no-option>
              <q-item>
                <q-item-section class="text-grey text-center">
                  <q-icon name="search_off" class="q-mb-sm" size="md" />
                  No encontrado
                </q-item-section>
              </q-item>
            </template>
            <template #option="{ opt, itemProps }">
              <q-item v-bind="itemProps">
                <q-item-section avatar>
                  <q-icon name="person" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label
                    >{{ opt.nombre }} {{ opt.apellido }}</q-item-label
                  >
                  <q-item-label caption>CI: {{ opt.cedula }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>
      </template>

      <!-- Campos para BIDÓN -->
      <template v-if="formData.tipo_destino === 'BIDON'">
        <div class="col-12" :class="{ 'col-md-6': !isMobile }">
          <q-select
            outlined
            :dense="!isMobile"
            v-model="formData.id_gerencia"
            :options="managementsList"
            option-value="id_gerencia"
            :option-label="(opt) => opt?.nombre || ''"
            label="Gerencia Solicitante"
            emit-value
            map-options
            :rules="[rules.required]"
          >
            <template #prepend>
              <q-icon name="business" />
            </template>
          </q-select>
        </div>

        <div class="col-12" :class="{ 'col-md-6': !isMobile }">
          <q-banner dense class="bg-blue-1 text-blue-8 rounded-borders">
            <template #avatar>
              <q-icon name="info" color="blue" />
            </template>
            El beneficiario será la Gerencia seleccionada.
          </q-banner>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
defineProps({
  formData: { type: Object, required: true },
  isMobile: Boolean,
  currentStep: Number,
  rules: Object,
  destinoOptions: Array,
  vehicleOptions: Array,
  driverOptions: Array,
  managementsList: Array,
  getVehicleLabel: Function,
  getDriverLabel: Function,
});

defineEmits([
  "resetDestinoFields",
  "selectDestino",
  "filterVehicles",
  "filterDrivers",
]);
</script>

<style lang="scss" scoped>
.section-header {
  display: flex;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--q-primary);
  margin-bottom: 8px;
}

.destination-toggle {
  max-width: 400px;
}

.destination-cards {
  .destination-card {
    transition: all 0.2s ease;
    border: 2px solid #e0e0e0;

    &.selected {
      border-color: var(--q-primary);
      background: rgba(25, 118, 210, 0.05);
    }
  }
}

.body--dark {
  .destination-card.selected {
    background: rgba(25, 118, 210, 0.15);
  }
}
</style>

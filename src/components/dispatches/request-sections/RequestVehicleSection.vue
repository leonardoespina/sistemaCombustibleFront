<!-- src/components/dispatches/request-sections/RequestVehicleSection.vue -->
<template>
  <q-card flat bordered class="bg-white col">
    <q-card-section class="q-py-xs bg-grey-3 row items-center">
      <div class="text-subtitle2 text-weight-bolder text-grey-9">
        Vehículo a Despachar
      </div>
      <q-space />
      <q-input
        :model-value="filterPlaca"
        @update:model-value="$emit('update:filterPlaca', $event)"
        placeholder="Filtrar por Placa..."
        dense
        outlined
        square
        bg-color="white"
        class="q-my-xs"
        style="width: 200px"
      >
        <template v-slot:append>
          <q-icon name="search" size="xs" color="primary" />
        </template>
      </q-input>
    </q-card-section>
    <q-separator />
    <q-card-section class="q-pa-none overflow-hidden">
      <q-markup-table
        dense
        flat
        square
        class="full-width scroll"
        style="height: 170px"
      >
        <thead class="bg-grey-9 text-white">
          <tr>
            <th class="text-left" style="width: 50px">No</th>
            <th class="text-left" style="width: 80px">ID</th>
            <th class="text-left">Placa / Modelo de Vehículo</th>
            <th class="text-left" style="width: 120px">Tipo Comb.</th>
          </tr>
        </thead>
        <tbody class="bg-white">
          <tr
            v-for="(v, index) in vehicleOptions"
            :key="v.id_vehiculo"
            @click="$emit('select:vehicle', v)"
            class="cursor-pointer transition-all"
            :class="
              selectedVehicle?.id_vehiculo === v.id_vehiculo
                ? 'bg-blue-1 text-primary text-weight-bolder'
                : 'hover-bg-grey-1'
            "
          >
            <td class="text-caption text-grey-6 text-center">
              #{{ index + 1 }}
            </td>
            <td class="text-weight-medium">{{ v.id_vehiculo }}</td>
            <td>
              <div class="text-weight-bold">{{ v.placa }}</div>
              <div class="text-caption text-grey-7">
                {{ v.Modelo?.nombre || "S/M" }}
              </div>
            </td>
            <td>
              <q-badge
                :color="getFuelColor(v.TipoCombustible?.nombre)"
                label-color="white"
              >
                {{ v.TipoCombustible?.nombre || "N/A" }}
              </q-badge>
            </td>
          </tr>
          <tr v-if="vehicleOptions.length === 0">
            <td colspan="4" class="text-center text-grey q-pa-xl">
              <q-icon
                name="directions_car"
                size="lg"
                color="grey-4"
                class="q-mb-sm display-block"
              />
              <div class="text-weight-medium">
                Seleccione Dependencia y Combustible para listar vehículos
              </div>
            </td>
          </tr>
        </tbody>
      </q-markup-table>
    </q-card-section>
  </q-card>
</template>

<script setup>
defineProps({
  vehicleOptions: {
    type: Array,
    default: () => [],
  },
  selectedVehicle: {
    type: Object,
    default: null,
  },
  filterPlaca: {
    type: String,
    default: "",
  },
  getFuelColor: {
    type: Function,
    required: true,
  },
});

defineEmits(["select:vehicle", "update:filterPlaca"]);
</script>

<style scoped>
.hover-bg-grey-1:hover {
  background-color: #f5f5f5;
}
</style>

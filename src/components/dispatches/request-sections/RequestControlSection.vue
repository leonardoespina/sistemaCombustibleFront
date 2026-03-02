<!-- src/components/dispatches/request-sections/RequestControlSection.vue -->
<template>
  <q-card flat bordered class="bg-white">
    <q-card-section class="q-pa-md q-gutter-y-sm">
      <!-- Cantidad Litros -->
      <div class="row items-center">
        <div class="col-5 text-right q-pr-lg text-weight-bold text-grey-8">
          Cantidad Litros:
        </div>
        <div class="col-7">
          <q-input
            :model-value="formData.cantidad_litros"
            @update:model-value="$emit('update:cantidadLitros', $event)"
            type="number"
            outlined
            dense
            square
            bg-color="white"
            class="text-weight-bolder"
            :rules="[(val) => !!val || 'Requerido']"
            hide-bottom-space
          />
        </div>
      </div>

      <!-- Modalidad -->
      <div class="row items-center">
        <div class="col-5 text-right q-pr-lg text-weight-bold text-grey-8">
          Modalidad:
        </div>
        <div class="col-7">
          <q-select
            :model-value="formData.tipo_solicitud"
            @update:model-value="$emit('update:tipoSolicitud', $event)"
            outlined
            dense
            square
            bg-color="white"
            :options="availableModalities"
            disable
            readonly
          />
        </div>
      </div>

      <!-- SECCIÓN DE VENTA (CONDICIONAL) -->
      <template v-if="formData.tipo_solicitud === 'VENTA'">
        <div class="row items-center">
          <div class="col-5 text-right q-pr-lg text-weight-bold text-grey-8">
            Precio / Moneda:
          </div>
          <div class="col-7">
            <q-select
              :model-value="selectedPrecioObj"
              @update:model-value="$emit('update:precioObj', $event)"
              outlined
              dense
              square
              bg-color="white"
              :options="precioOptions"
              option-label="etiqueta_precio"
              :rules="[(val) => !!val || 'Requerido']"
              hide-bottom-space
            >
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>{{ scope.opt.Moneda?.nombre }}</q-item-label>
                    <q-item-label caption
                      >{{ scope.opt.precio_formateado || scope.opt.precio }} por Litro</q-item-label
                    >
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>
        </div>
        <div class="row items-center bg-blue-1 q-pa-sm rounded-borders">
          <div class="col-5 text-right q-pr-lg text-weight-bolder text-primary">
            TOTAL A PAGAR:
          </div>
          <div class="col-7 text-h6 text-weight-bolder text-primary">
            {{ calculatedTotal }}
            <small>{{ selectedPrecioObj?.Moneda?.simbolo || "" }}</small>
          </div>
        </div>
      </template>

      <q-separator class="q-my-sm" />

      <!-- Solicitante -->
      <div class="row items-center">
        <div class="col-5 text-right q-pr-lg text-weight-bold text-grey-8">
          Solicitante:
        </div>
        <div class="col-7">
          <q-input
            :model-value="solicitanteName"
            outlined
            dense
            square
            readonly
            bg-color="grey-1"
            class="text-uppercase"
          />
        </div>
      </div>

      <!-- Fecha / Hora -->
      <div class="row items-center">
        <div class="col-5 text-right q-pr-lg text-weight-bold text-grey-8">
          Fecha / Hora:
        </div>
        <div class="col-7">
          <div class="row q-col-gutter-xs">
            <div class="col-7">
              <q-input
                :model-value="currentDate"
                outlined
                dense
                square
                readonly
                bg-color="grey-1"
                class="text-center"
              />
            </div>
            <div class="col-5">
              <q-input
                :model-value="currentTime"
                outlined
                dense
                square
                readonly
                bg-color="grey-1"
                class="text-center"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Tipo Suministro -->
      <div class="row items-center">
        <div class="col-5 text-right q-pr-lg text-weight-bold text-grey-8">
          Tipo Suministro:
        </div>
        <div class="col-7">
          <q-select
            :model-value="formData.tipo_suministro"
            @update:model-value="$emit('update:tipoSuministro', $event)"
            outlined
            dense
            square
            bg-color="white"
            :options="['REGULAR', 'BIDON']"
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
defineProps({
  formData: {
    type: Object,
    required: true,
  },
  availableModalities: {
    type: Array,
    default: () => [],
  },
  precioOptions: {
    type: Array,
    default: () => [],
  },
  selectedPrecioObj: {
    type: Object,
    default: null,
  },
  calculatedTotal: {
    type: String,
    default: "0",
  },
  solicitanteName: {
    type: String,
    default: "",
  },
  currentDate: {
    type: String,
    default: "",
  },
  currentTime: {
    type: String,
    default: "",
  },
});

defineEmits([
  "update:cantidadLitros",
  "update:tipoSolicitud",
  "update:precioObj",
  "update:tipoSuministro",
]);
</script>

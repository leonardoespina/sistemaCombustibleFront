<!-- src/components/dispatches/request-sections/RequestConfigSection.vue -->
<template>
  <q-card flat bordered class="bg-white">
    <q-card-section class="q-py-xs bg-grey-3">
      <div class="text-subtitle2 text-weight-bolder text-grey-9">
        Configuración de Solicitud
      </div>
    </q-card-section>
    <q-separator />
    <q-card-section class="q-pa-md q-gutter-y-md">
      <div class="row q-col-gutter-md">
        <!-- Subdependencia / Unidad -->
        <div class="col-12 col-sm-6">
          <div class="text-caption text-weight-bold text-grey-8 q-mb-xs">
            Dependencia / Unidad:
          </div>
          <q-select
            :model-value="modelValue.selectedSubdependencia"
            @update:model-value="$emit('update:selectedSubdependencia', $event)"
            outlined
            dense
            square
            bg-color="white"
            use-input
            :options="filteredSubdependenciaOptions"
            option-value="id_subdependencia"
            option-label="nombre"
            emit-value
            map-options
            @filter="onFilterSubdependencias"
            :loading="loadingSubdependencias"
          />
        </div>

        <!-- Tipo Combustible -->
        <div class="col-12 col-sm-6">
          <div class="text-caption text-weight-bold text-grey-8 q-mb-xs">
            Tipo Combustible:
          </div>
          <q-select
            :model-value="modelValue.selectedCombustible"
            @update:model-value="$emit('update:selectedCombustible', $event)"
            outlined
            dense
            square
            bg-color="white"
            :options="combustibleOptions"
            option-value="id_tipo_combustible"
            option-label="nombre"
            emit-value
            map-options
          />
        </div>
      </div>

      <!-- Llenadero de Despacho -->
      <div class="row">
        <div class="col-12">
          <div class="text-caption text-weight-bold text-grey-8 q-mb-xs">
            Llenadero de Despacho:
          </div>
          <q-select
            :model-value="modelValue.id_llenadero"
            @update:model-value="$emit('update:llenadero', $event)"
            outlined
            dense
            square
            bg-color="white"
            :options="llenaderoOptions"
            option-value="id_llenadero"
            option-label="nombre_llenadero"
            emit-value
            map-options
            :disable="!modelValue.selectedCombustible"
            :loading="loadingLlenaderos"
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  filteredSubdependenciaOptions: {
    type: Array,
    default: () => [],
  },
  combustibleOptions: {
    type: Array,
    default: () => [],
  },
  llenaderoOptions: {
    type: Array,
    default: () => [],
  },
  loadingSubdependencias: {
    type: Boolean,
    default: false,
  },
  loadingLlenaderos: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "update:selectedSubdependencia",
  "update:selectedCombustible",
  "update:llenadero",
  "filter:subdependencias",
]);

function onFilterSubdependencias(val, update) {
  emit("filter:subdependencias", val, update);
}
</script>

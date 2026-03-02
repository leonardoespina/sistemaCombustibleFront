<!-- src/components/dispatches/request-sections/RequestActionsSection.vue -->
<template>
  <div class="row justify-between items-center q-mt-sm q-col-gutter-sm">
    <!-- Grupo Izquierdo: Acciones Secundarias -->
    <div class="col-12 col-sm-auto row q-gutter-sm justify-center justify-sm-start order-last order-sm-first">
      <q-btn
        unelevated
        color="negative"
        class="shadow-1 col-auto"
        padding="sm lg"
        @click="$emit('close')"
      >
        <div class="row items-center no-wrap">
          <q-icon name="power_settings_new" size="xs" class="q-mr-sm" />
          <div class="text-caption text-weight-bolder text-uppercase">
            Salir
          </div>
        </div>
      </q-btn>

      <q-btn
        unelevated
        color="cyan-8"
        class="shadow-1 col-auto"
        padding="sm lg"
        @click="$emit('note')"
      >
        <div class="row items-center no-wrap">
          <q-icon name="note_add" size="xs" class="q-mr-sm" />
          <div class="text-caption text-weight-bolder text-uppercase">
            Nota
          </div>
        </div>
      </q-btn>
    </div>

    <!-- Grupo Derecho: Acciones Principales -->
    <div class="col-12 col-sm-auto row q-gutter-sm justify-center justify-sm-end">
      <q-btn
        unelevated
        color="grey-8"
        class="shadow-1 col-auto"
        padding="sm lg"
        @click="$emit('reset')"
      >
        <div class="row items-center no-wrap">
          <q-icon name="refresh" size="xs" class="q-mr-sm" />
          <div class="text-caption text-weight-bolder text-uppercase">
            Limpiar
          </div>
        </div>
      </q-btn>

      <q-btn
        unelevated
        color="primary"
        class="shadow-1 col-auto"
        padding="sm lg"
        type="submit"
        :loading="loading"
        :disable="!canSubmit"
      >
        <div class="row items-center no-wrap">
          <q-icon name="send" size="xs" class="q-mr-sm" />
          <div class="text-caption text-weight-bolder text-uppercase">
            Enviar Solicitud
          </div>
        </div>
      </q-btn>
    </div>
  </div>
</template>

<script setup>
defineProps({
  canSubmit: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["submit", "reset", "note", "close"]);
</script>

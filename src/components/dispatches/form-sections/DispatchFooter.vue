<template>
  <div>
    <!-- Desktop Footer -->
    <template v-if="!isMobile">
      <q-separator />
      <q-card-actions align="right" class="q-pa-md dialog-footer">
        <q-btn flat label="Cancelar" @click="$emit('close')" class="q-px-lg" />
        <q-btn
          unelevated
          label="Registrar Despacho"
          type="submit"
          color="primary"
          icon="save"
          class="q-px-xl"
        />
      </q-card-actions>
    </template>

    <!-- Mobile Navigation -->
    <div v-else class="mobile-navigation">
      <q-btn
        v-if="currentStep > 1"
        flat
        icon="arrow_back"
        label="Anterior"
        @click="$emit('prev')"
        class="q-px-md"
      />
      <q-space />
      <q-btn
        v-if="currentStep < 3"
        unelevated
        color="primary"
        label="Siguiente"
        icon-right="arrow_forward"
        @click="$emit('next')"
        class="q-px-lg"
      />
      <q-btn
        v-else
        unelevated
        color="primary"
        label="Registrar"
        icon="save"
        type="submit"
        class="q-px-xl"
      />
    </div>
  </div>
</template>

<script setup>
defineProps({
  isMobile: Boolean,
  currentStep: Number,
});

defineEmits(["close", "next", "prev"]);
</script>

<style lang="scss" scoped>
.dialog-footer {
  position: sticky;
  bottom: 0;
  background: white;
}

.mobile-navigation {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  background: white;
  border-top: 1px solid #e0e0e0;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.body--dark {
  .dialog-footer,
  .mobile-navigation {
    background: var(--q-dark);
  }
}
</style>

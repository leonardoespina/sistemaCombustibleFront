<template>
  <q-card-section class="dialog-header q-py-md">
    <div class="row items-center no-wrap">
      <q-btn
        v-if="isMobile"
        flat
        round
        dense
        icon="close"
        @click="$emit('close')"
      />
      <div :class="{ 'q-ml-sm': isMobile }">
        <div class="text-h6">Registrar Nuevo Despacho</div>
        <div v-if="isMobile" class="text-caption text-grey">
          Paso {{ currentStep }} de 3
        </div>
      </div>
      <q-space />
      <div v-if="isMobile" class="step-indicators">
        <span
          v-for="n in 3"
          :key="n"
          class="step-dot"
          :class="{ active: n === currentStep, completed: n < currentStep }"
        />
      </div>
    </div>
  </q-card-section>
</template>

<script setup>
defineProps({
  isMobile: Boolean,
  currentStep: Number,
});

defineEmits(["close"]);
</script>

<style lang="scss" scoped>
.dialog-header {
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}

.step-indicators {
  display: flex;
  gap: 8px;

  .step-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #e0e0e0;
    transition: all 0.3s ease;

    &.active {
      width: 24px;
      border-radius: 4px;
      background: var(--q-primary);
    }

    &.completed {
      background: var(--q-primary);
    }
  }
}

.body--dark {
  .dialog-header {
    background: var(--q-dark);
  }
}
</style>

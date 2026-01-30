<template>
  <div class="tank-header">
    <!-- Icono del tipo de combustible -->
    <div class="tank-icon-wrapper" :style="{ background: gradientColor }">
      <q-icon :name="fuelIcon" size="24px" color="white" />
    </div>

    <!-- Badge de estado del tanque -->
    <div class="tank-status">
      <q-badge
        :color="statusBadgeColor"
        :label="statusLabel"
        class="status-badge"
      />
    </div>
  </div>
</template>

<script setup>
defineProps({
  fuelIcon: {
    type: String,
    required: true,
  },
  gradientColor: {
    type: String,
    required: true,
  },
  statusBadgeColor: {
    type: String,
    required: true,
  },
  statusLabel: {
    type: String,
    required: true,
  },
});
</script>

<style scoped>
.tank-header {
  display: flex;
  justify-content: space-between;
  padding: 16px 16px 0;
}

.tank-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.status-badge {
  font-weight: 600;
  border-radius: 20px;
}
</style>

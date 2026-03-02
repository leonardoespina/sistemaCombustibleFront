<template>
  <q-card-section class="tank-stats">
    <!-- Nivel actual -->
    <div class="stat-item">
      <div class="stat-icon">
        <q-icon name="water_drop" :color="primaryColor" />
      </div>
      <div class="stat-content">
        <div class="stat-value">{{ formattedCurrentLevel }}</div>
        <div class="stat-label">Nivel Actual</div>
      </div>
    </div>

    <div class="stat-divider"></div>

    <!-- Capacidad máxima -->
    <div class="stat-item">
      <div class="stat-icon">
        <q-icon name="storage" color="grey-6" />
      </div>
      <div class="stat-content">
        <div class="stat-value">{{ formattedMaxCapacity }}</div>
        <div class="stat-label">Capacidad</div>
      </div>
    </div>
  </q-card-section>
</template>

<script setup>
defineProps({
  formattedCurrentLevel: {
    type: String,
    required: true,
  },
  formattedMaxCapacity: {
    type: String,
    required: true,
  },
  primaryColor: {
    type: String,
    required: true,
  },
});
</script>

<style lang="scss" scoped>
.tank-stats {
  display: flex;
  justify-content: space-around;
  padding: 12px 16px !important;
  background: #f9fafb;
  margin: 0 12px 16px;
  border-radius: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-content {
  .stat-value {
    font-size: 1rem;
    font-weight: 700;
    color: #1f2937;
    line-height: 1.2;
  }

  .stat-label {
    font-size: 0.7rem;
    color: #9ca3af;
    text-transform: uppercase;
  }
}

.stat-divider {
  width: 1px;
  height: 30px;
  background: #e5e7eb;
}
</style>

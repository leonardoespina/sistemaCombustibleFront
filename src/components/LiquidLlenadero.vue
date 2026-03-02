<template>
  <q-card class="tank-card" :class="statusClass">
    <!-- ==================== HEADER ==================== -->
    <TankHeader
      :fuel-icon="fuelIcon"
      :gradient-color="gradientColor"
      :status-badge-color="statusBadgeColor"
      :status-label="statusLabel"
    />

    <!-- ==================== INFORMACIÓN DEL LLENADERO ==================== -->
    <q-card-section class="tank-info q-pb-none">
      <div class="tank-name text-subtitle2">{{ llenadero.nombre }}</div>
      <div class="tank-meta">
        <q-chip
          dense
          size="xs"
          :color="fuelChipColor"
          text-color="white"
          icon="local_gas_station"
        >
          {{ llenadero.tipo_combustible }}
        </q-chip>
        <span class="tank-code text-caption">{{ llenadero.codigo }}</span>
      </div>
    </q-card-section>

    <!-- ==================== VISUALIZACIÓN GRÁFICA ==================== -->
    <q-card-section class="chart-section q-py-xs">
      <div ref="containerRef" class="chart-container"></div>
      <div class="percentage-overlay">{{ percentageText }}</div>
    </q-card-section>

    <!-- ==================== ESTADÍSTICAS ==================== -->
    <TankStats
      :formatted-current-level="formattedCurrentLevel"
      :formatted-max-capacity="formattedMaxCapacity"
      :primary-color="primaryColor"
    />
  </q-card>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount, nextTick } from "vue";
import { TankRenderer } from "./tanks/utils/tankGraphics";
import { FUEL_CONFIGS, STATUS_THRESHOLDS } from "./tanks/utils/tankConfig";
import { formatNumber, normalizeTankShape } from "./tanks/utils/tankUtils";

import TankHeader from "./tanks/components/TankHeader.vue";
import TankStats from "./tanks/components/TankStats.vue";

const props = defineProps({
  llenadero: {
    type: Object,
    required: true,
  },
});

const containerRef = ref(null);
let tankRenderer = null;

const percentage = computed(() => {
  const current = parseFloat(props.llenadero.nivel_actual || 0);
  const max = parseFloat(props.llenadero.capacidad_maxima || 1);
  if (max <= 0) return 0;
  return Math.min(Math.max(current / max, 0), 1);
});

const percentageText = computed(() => `${(percentage.value * 100).toFixed(0)}%`);

const fuelConfig = computed(() => {
  const tipo = props.llenadero.tipo_combustible?.toUpperCase();
  return FUEL_CONFIGS[tipo] || FUEL_CONFIGS.default;
});

const primaryColor = computed(() => fuelConfig.value.color);
const gradientColor = computed(() => fuelConfig.value.gradient);
const fuelIcon = computed(() => fuelConfig.value.icon);
const fuelChipColor = computed(() => fuelConfig.value.chipColor);

const statusClass = computed(() => {
  const pct = percentage.value;
  if (pct <= STATUS_THRESHOLDS.CRITICAL) return "status-critical";
  if (pct <= STATUS_THRESHOLDS.WARNING) return "status-warning";
  return "status-normal";
});

const statusLabel = computed(() => {
  const pct = percentage.value;
  if (pct <= STATUS_THRESHOLDS.CRITICAL) return "Crítico";
  if (pct <= STATUS_THRESHOLDS.WARNING) return "Bajo";
  if (pct >= STATUS_THRESHOLDS.FULL) return "Lleno";
  return "Normal";
});

const statusBadgeColor = computed(() => {
  const pct = percentage.value;
  if (pct <= STATUS_THRESHOLDS.CRITICAL) return "negative";
  if (pct <= STATUS_THRESHOLDS.WARNING) return "warning";
  if (pct >= STATUS_THRESHOLDS.FULL) return "positive";
  return "primary";
});

const formattedCurrentLevel = computed(() => formatNumber(props.llenadero.nivel_actual));
const formattedMaxCapacity = computed(() => formatNumber(props.llenadero.capacidad_maxima));

function initRenderer() {
  if (!containerRef.value) return;
  if (tankRenderer) tankRenderer.destroy();
  const width = containerRef.value.clientWidth || 300;
  tankRenderer = new TankRenderer(containerRef.value, width, 120);
  drawTank();
}

function drawTank() {
  if (!tankRenderer) return;
  const forma = normalizeTankShape(props.llenadero.tipo_tanque);
  tankRenderer.draw(forma, primaryColor.value, percentage.value);
}

function updateLevel(animate = true) {
  if (!tankRenderer) return;
  const forma = normalizeTankShape(props.llenadero.tipo_tanque);
  tankRenderer.updateLevel(percentage.value, forma, animate);
}

onMounted(() => {
  nextTick(() => initRenderer());
  window.addEventListener("resize", initRenderer);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", initRenderer);
  if (tankRenderer) tankRenderer.destroy();
});

watch(() => props.llenadero, (newVal, oldVal) => {
    if (newVal.tipo_tanque !== oldVal?.tipo_tanque || newVal.tipo_combustible !== oldVal?.tipo_combustible) {
      nextTick(() => initRenderer());
    } else {
      updateLevel(true);
    }
  }, { deep: true }
);
</script>

<style lang="scss" scoped>
.tank-card {
  width: 100%;
  border-radius: 20px;
  background: white;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  }

  &.status-critical {
    border-left: 4px solid #ef4444;
  }

  &.status-warning {
    border-left: 4px solid #f59e0b;
  }
}

.tank-info {
  padding: 8px 12px 0 !important;
}

.tank-name {
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 2px;
}

.tank-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tank-code {
  color: #6b7280;
  font-weight: 500;
}

.chart-section {
  position: relative;
  padding: 4px 0 !important;
}

.chart-container {
  width: 100%;
  height: 120px;
}

.percentage-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 32px;
  font-weight: 900;
  color: rgba(51, 65, 85, 0.15);
  pointer-events: none;
  z-index: 0;
  font-family: sans-serif;
  letter-spacing: -1px;
}
</style>

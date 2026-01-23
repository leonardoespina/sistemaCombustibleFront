<template>
  <q-card class="tank-card" :class="statusClass">
    <!-- ==================== HEADER ==================== -->
    <TankHeader
      :fuel-icon="fuelIcon"
      :gradient-color="gradientColor"
      :status-badge-color="statusBadgeColor"
      :status-label="statusLabel"
    />

    <!-- ==================== INFORMACIÓN DEL TANQUE ==================== -->
    <q-card-section class="tank-info">
      <div class="tank-name">{{ tank.nombre }}</div>
      <div class="tank-meta">
        <!-- Chip con tipo de combustible -->
        <q-chip
          dense
          size="sm"
          :color="fuelChipColor"
          text-color="white"
          icon="local_gas_station"
        >
          {{ tank.tipo_combustible }}
        </q-chip>
        <span class="tank-code">{{ tank.codigo }}</span>
      </div>
    </q-card-section>

    <!-- ==================== VISUALIZACIÓN GRÁFICA ==================== -->
    <q-card-section class="chart-section">
      <!-- Contenedor para Konva Stage -->
      <div ref="containerRef" class="chart-container"></div>
      <!-- Overlay con porcentaje -->
      <div class="percentage-overlay">{{ percentageText }}</div>
    </q-card-section>

    <!-- ==================== ESTADÍSTICAS ==================== -->
    <TankStats
      :formatted-current-level="formattedCurrentLevel"
      :formatted-max-capacity="formattedMaxCapacity"
      :primary-color="primaryColor"
    />

    <!-- ==================== ACCIONES ==================== -->
    <TankActions
      :tank="tank"
      @view="$emit('view', tank)"
      @edit="$emit('edit', tank)"
      @history="$emit('history', tank)"
    />
  </q-card>
</template>

<script setup>
// ============================================================================
// IMPORTS
// ============================================================================
import {
  ref,
  computed,
  onMounted,
  watch,
  onBeforeUnmount,
  nextTick,
} from "vue";
import { TankRenderer } from "./tanks/utils/tankGraphics";
import { FUEL_CONFIGS, STATUS_THRESHOLDS } from "./tanks/utils/tankConfig";
import { formatNumber, normalizeTankShape } from "./tanks/utils/tankUtils";

import TankHeader from "./tanks/components/TankHeader.vue";
import TankStats from "./tanks/components/TankStats.vue";
import TankActions from "./tanks/components/TankActions.vue";

// ============================================================================
// PROPS Y EMITS
// ============================================================================

const props = defineProps({
  tank: {
    type: Object,
    required: true,
  },
});

defineEmits(["view", "edit", "history"]);

// ============================================================================
// REFERENCIAS REACTIVAS
// ============================================================================

/** Referencia al contenedor DOM para Konva */
const containerRef = ref(null);

/** Instancia del Renderer del tanque */
let tankRenderer = null;

// ============================================================================
// COMPUTED PROPERTIES
// ============================================================================

/** Porcentaje de llenado (0-1) */
const percentage = computed(() => {
  const current = parseFloat(props.tank.nivel_actual || 0);
  const max = parseFloat(props.tank.capacidad_maxima || 1);
  if (max <= 0) return 0;
  return Math.min(Math.max(current / max, 0), 1);
});

/** Texto del porcentaje */
const percentageText = computed(
  () => `${(percentage.value * 100).toFixed(0)}%`
);

/** Configuración visual según tipo de combustible */
const fuelConfig = computed(() => {
  const tipo = props.tank.tipo_combustible?.toUpperCase();
  return FUEL_CONFIGS[tipo] || FUEL_CONFIGS.default;
});

// Propiedades derivadas
const primaryColor = computed(() => fuelConfig.value.color);
const gradientColor = computed(() => fuelConfig.value.gradient);
const fuelIcon = computed(() => fuelConfig.value.icon);
const fuelChipColor = computed(() => fuelConfig.value.chipColor);

/** Clase CSS según estado */
const statusClass = computed(() => {
  const pct = percentage.value;
  if (pct <= STATUS_THRESHOLDS.CRITICAL) return "status-critical";
  if (pct <= STATUS_THRESHOLDS.WARNING) return "status-warning";
  return "status-normal";
});

/** Etiqueta de estado */
const statusLabel = computed(() => {
  const pct = percentage.value;
  if (pct <= STATUS_THRESHOLDS.CRITICAL) return "Crítico";
  if (pct <= STATUS_THRESHOLDS.WARNING) return "Bajo";
  if (pct >= STATUS_THRESHOLDS.FULL) return "Lleno";
  return "Normal";
});

/** Color del badge de estado */
const statusBadgeColor = computed(() => {
  const pct = percentage.value;
  if (pct <= STATUS_THRESHOLDS.CRITICAL) return "negative";
  if (pct <= STATUS_THRESHOLDS.WARNING) return "warning";
  if (pct >= STATUS_THRESHOLDS.FULL) return "positive";
  return "primary";
});

/** Nivel actual formateado */
const formattedCurrentLevel = computed(() =>
  formatNumber(props.tank.nivel_actual)
);

/** Capacidad máxima formateada */
const formattedMaxCapacity = computed(() =>
  formatNumber(props.tank.capacidad_maxima)
);

// ============================================================================
// MÉTODOS DE DIBUJO
// ============================================================================

/**
 * Inicializa el renderizado del tanque
 */
function initRenderer() {
  if (!containerRef.value) return;

  // Limpiar instancia previa si existe
  if (tankRenderer) {
    tankRenderer.destroy();
  }

  // Crear nueva instancia
  const width = containerRef.value.clientWidth;
  const height = 180; // Altura fija del canvas según config

  tankRenderer = new TankRenderer(containerRef.value, width, height);

  // Dibujar estado inicial
  drawTank();
}

/**
 * Dibuja el tanque con los datos actuales
 */
function drawTank() {
  if (!tankRenderer) return;

  // CORREGIDO: Usar tipo_tanque en lugar de forma
  const forma = normalizeTankShape(props.tank.tipo_tanque);

  tankRenderer.draw(forma, primaryColor.value, percentage.value);
}

/**
 * Actualiza solo el nivel del líquido (animación)
 */
function updateLevel(animate = true) {
  if (!tankRenderer) return;

  // CORREGIDO: Usar tipo_tanque en lugar de forma
  const forma = normalizeTankShape(props.tank.tipo_tanque);
  tankRenderer.updateLevel(percentage.value, forma, animate);
}

// ============================================================================
// LIFECYCLE HOOKS
// ============================================================================

onMounted(() => {
  nextTick(() => {
    initRenderer();
  });
  window.addEventListener("resize", initRenderer);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", initRenderer);
  if (tankRenderer) {
    tankRenderer.destroy();
    tankRenderer = null;
  }
});

// Observar cambios en el tanque
watch(
  () => props.tank,
  (newVal, oldVal) => {
    // Si cambia la forma o el tipo, redibujar completo
    if (
      newVal.tipo_tanque !== oldVal?.tipo_tanque || // CORREGIDO
      newVal.tipo_combustible !== oldVal?.tipo_combustible
    ) {
      nextTick(() => {
        initRenderer(); // O drawTank() si el tamaño no cambia, pero init es más seguro
      });
    } else {
      // Si solo cambia el nivel, animar
      updateLevel(true);
    }
  },
  { deep: true }
);
</script>

<style lang="scss" scoped>
/* --- TARJETA PRINCIPAL --- */
.tank-card {
  width: 100%;
  max-width: 340px;
  min-width: 280px;
  border-radius: 20px;
  background: white;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.05);

  /* Efecto hover */
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);

    /* Los estilos de .card-actions ahora están en el componente hijo
       pero necesitamos aplicar el efecto hover desde aquí */
    :deep(.card-actions) {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  /* Estado crítico (≤15%) */
  &.status-critical {
    border-left: 4px solid #ef4444;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #ef4444, transparent);
      animation: pulse 2s infinite;
    }
  }

  /* Estado de advertencia (≤30%) */
  &.status-warning {
    border-left: 4px solid #f59e0b;
  }
}

/* Animación de pulso para estado crítico */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* --- INFORMACIÓN DEL TANQUE --- */
.tank-info {
  padding: 12px 16px 0 !important;
}

.tank-name {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 6px;
}

.tank-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tank-code {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 500;
}

/* --- SECCIÓN DEL GRÁFICO --- */
.chart-section {
  position: relative;
  padding: 10px 0 !important;
}

.chart-container {
  width: 100%;
  height: 180px;
}

/* Overlay del porcentaje */
.percentage-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 48px;
  font-weight: 900;
  color: rgba(51, 65, 85, 0.25);
  pointer-events: none;
  z-index: 0;
  font-family: sans-serif;
  letter-spacing: -2px;
  mix-blend-mode: multiply;
}
</style>

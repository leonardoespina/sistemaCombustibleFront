<template>
  <!--
    TankCylinder.vue
    Cilindro SVG animado que representa el estado de un tanque:
      - Azul claro  → espacio vacío (capacidad no usada)
      - Azul oscuro → stock actual
      - Amarillo    → consumido en el período (franja sobre el stock)
    Completamente dinámico: no asume tipo de combustible.
  -->
  <div class="tank-wrapper">
    <!-- Etiqueta de consumo (flecha exterior) -->
    <div v-if="consumido > 0" class="consumo-label">
      <span class="consumo-value">Consumo<br />{{ fmtNum(consumido) }} L</span>
      <svg class="arrow-svg" width="28" height="36" viewBox="0 0 28 36">
        <line x1="14" y1="0" x2="14" y2="30" stroke="#F5A623" stroke-width="2" />
        <polyline points="6,22 14,32 22,22" fill="none" stroke="#F5A623" stroke-width="2" />
      </svg>
    </div>

    <!-- Cilindro SVG -->
    <svg
      :width="width"
      :height="height"
      :viewBox="`0 0 ${width} ${height}`"
      class="tank-svg"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <!-- Clip para que el líquido no desborde el cilindro -->
        <clipPath :id="`clip-${uid}`">
          <rect :x="bodyX" :y="bodyY" :width="bodyW" :height="bodyH" rx="6" />
        </clipPath>
        <!-- Gradiente para la zona vacía -->
        <linearGradient :id="`grad-empty-${uid}`" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stop-color="#C8DCF0" />
          <stop offset="100%" stop-color="#D9EAF8" />
        </linearGradient>
        <!-- Gradiente para el stock -->
        <linearGradient :id="`grad-stock-${uid}`" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stop-color="#1565C0" />
          <stop offset="100%" stop-color="#1976D2" />
        </linearGradient>
        <!-- Gradiente para consumo -->
        <linearGradient :id="`grad-consumo-${uid}`" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stop-color="#F5A623" />
          <stop offset="100%" stop-color="#FFB74D" />
        </linearGradient>
      </defs>

      <!-- Cuerpo vacío (fondo del cilindro) -->
      <rect
        :x="bodyX" :y="bodyY"
        :width="bodyW" :height="bodyH"
        rx="6"
        :fill="`url(#grad-empty-${uid})`"
        stroke="#B0C8E0"
        stroke-width="1.5"
      />

      <!-- Zona de stock (de abajo hacia arriba) -->
      <rect
        :x="bodyX" :y="stockY"
        :width="bodyW" :height="stockH"
        :fill="`url(#grad-stock-${uid})`"
        :clip-path="`url(#clip-${uid})`"
        class="anim-stock"
      />

      <!-- Franja de consumo (encima del stock) -->
      <rect
        v-if="consumidoH > 0"
        :x="bodyX" :y="consumidoY"
        :width="bodyW" :height="consumidoH"
        :fill="`url(#grad-consumo-${uid})`"
        :clip-path="`url(#clip-${uid})`"
        class="anim-consumo"
      />

      <!-- Efecto de brillo lateral -->
      <rect
        :x="bodyX + 6" :y="bodyY + 4"
        width="8" :height="bodyH - 8"
        rx="4"
        fill="white"
        fill-opacity="0.15"
      />

      <!-- Tapa superior (elipse 3D) -->
      <ellipse
        :cx="width / 2" :cy="bodyY"
        :rx="bodyW / 2" ry="12"
        :fill="`url(#grad-empty-${uid})`"
        stroke="#B0C8E0"
        stroke-width="1.5"
      />

      <!-- Tapa inferior -->
      <ellipse
        :cx="width / 2" :cy="bodyY + bodyH"
        :rx="bodyW / 2" ry="12"
        fill="#A8C4DC"
        stroke="#90AFC8"
        stroke-width="1.2"
        opacity="0.7"
      />

      <!-- Valor de stock centrado en el cuerpo -->
      <text
        :x="width / 2" :y="stockTextY"
        text-anchor="middle"
        font-family="'Inter', sans-serif"
        font-weight="700"
        :font-size="stockH > 40 ? 14 : 11"
        fill="white"
      >{{ fmtNum(stock) }} L</text>
    </svg>

    <!-- Nombre del llenadero -->
    <div class="tank-name">{{ nombre }}</div>
    <!-- Capacidad total debajo del nombre -->
    <div class="tank-cap">Cap: {{ fmtNum(capacidad) }} L</div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  uid:       { type: String, required: true },   // ID único para evitar colisiones SVG
  nombre:    { type: String, default: "" },
  capacidad: { type: Number, default: 0 },
  stock:     { type: Number, default: 0 },
  consumido: { type: Number, default: 0 },
  width:     { type: Number, default: 100 },
  height:    { type: Number, default: 220 },
});

// ─── Helpers de formato ─────────────────────────────────────────────────────
function fmtNum(n) {
  return Number(n).toLocaleString("es-VE", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// ─── Geometría del cilindro ─────────────────────────────────────────────────
const bodyX = computed(() => 10);
const bodyW = computed(() => props.width - 20);
const bodyY = computed(() => 20);  // espacio para elipse superior
const bodyH = computed(() => props.height - 55); // espacio para elipse inf + textos

/** Porcentaje de llenado (clamped 0–1) */
const pctStock = computed(() => {
  if (!props.capacidad) return 0;
  return Math.min(Math.max(props.stock / props.capacidad, 0), 1);
});

/** Porcentaje de consumo (clamped para no desbordar la zona disponible) */
const pctConsumo = computed(() => {
  if (!props.capacidad) return 0;
  const max = 1 - pctStock.value;
  return Math.min(props.consumido / props.capacidad, max);
});

// Posición Y y altura de la barra de stock (grows upward)
const stockH = computed(() => Math.max(pctStock.value   * bodyH.value, 0));
const consumidoH = computed(() => Math.max(pctConsumo.value * bodyH.value, 0));

const stockY     = computed(() => bodyY.value + bodyH.value - stockH.value);
const consumidoY = computed(() => stockY.value - consumidoH.value);

// Posición del texto de stock
const stockTextY = computed(() => {
  const mid = stockY.value + stockH.value / 2 + 5;
  return mid;
});
</script>

<style scoped>
.tank-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  min-width: 80px;
}

.consumo-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2px;
}

.consumo-value {
  background: #FFF8E1;
  border: 1.5px solid #F5A623;
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 700;
  color: #E65100;
  text-align: center;
  white-space: nowrap;
  line-height: 1.3;
}

.arrow-svg {
  display: block;
  margin-top: -2px;
}

.tank-svg {
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.15));
}

.tank-name {
  margin-top: 6px;
  font-weight: 700;
  font-size: 13px;
  color: #1a237e;
  text-align: center;
}

.tank-cap {
  font-size: 11px;
  color: #607D8B;
  margin-top: 2px;
}

/* Animaciones de entrada */
.anim-stock {
  animation: riseUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) both;
}
.anim-consumo {
  animation: riseUp 0.9s 0.1s cubic-bezier(0.4, 0, 0.2, 1) both;
}
@keyframes riseUp {
  from { opacity: 0; transform: scaleY(0); transform-origin: bottom; }
  to   { opacity: 1; transform: scaleY(1); transform-origin: bottom; }
}
</style>

/**
 * Configuración visual para cada tipo de combustible
 * Define colores, gradientes e iconos específicos
 */
export const FUEL_CONFIGS = {
  GASOLINA: {
    color: "#ef4444",
    gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    icon: "local_gas_station",
    chipColor: "red-6",
  },
  GASOIL: {
    color: "#f59e0b",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    icon: "local_gas_station",
    chipColor: "amber-8",
  },
  DIESEL: {
    color: "#78716c",
    gradient: "linear-gradient(135deg, #78716c 0%, #57534e 100%)",
    icon: "local_shipping",
    chipColor: "brown-6",
  },
  default: {
    color: "#3b82f6",
    gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    icon: "water_drop",
    chipColor: "blue-6",
  },
};

/**
 * Umbrales para determinar el estado del tanque
 */
export const STATUS_THRESHOLDS = {
  CRITICAL: 0.15, // 15% o menos = Crítico
  WARNING: 0.3, // 30% o menos = Bajo
  FULL: 0.9, // 90% o más = Lleno
};

/**
 * Colores utilizados en el dibujo del tanque
 */
export const TANK_COLORS = {
  stroke: "#334155", // Color del contorno
  metal: "#e2e8f0", // Color metálico claro
  metalDark: "#94a3b8", // Color metálico oscuro
  background: "#f8fafc", // Fondo de la tarjeta
  shadow: "rgba(0,0,0,0.1)", // Sombra
};

/**
 * Dimensiones del canvas
 */
export const CANVAS_CONFIG = {
  height: 180,
  padding: 10,
  tankWidthRatio: 0.75, // 75% del ancho del canvas
  tankHeightRatio: 0.5, // 50% de la altura del canvas
};

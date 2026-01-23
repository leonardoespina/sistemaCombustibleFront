/**
 * Funciones utilitarias para el componente de tanques
 * @module tankUtils
 */

// ============================================================================
// FORMATEO DE NÚMEROS
// ============================================================================

/**
 * Formatea un número con separadores de miles según locale venezolano
 * @param {number|string} value - Valor a formatear
 * @returns {string} Número formateado
 * @example
 * formatNumber(1234567) // "1.234.567"
 */
export function formatNumber(value) {
  return parseFloat(value || 0).toLocaleString("es-VE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

// ============================================================================
// MANIPULACIÓN DE COLORES
// ============================================================================

/**
 * Ajusta el brillo de un color hexadecimal
 * @param {string} hex - Color en formato hexadecimal (#RRGGBB)
 * @param {number} percent - Porcentaje de ajuste (-100 a 100)
 * @returns {string} Color ajustado en formato hexadecimal
 * @example
 * adjustColorBrightness("#3b82f6", 20)  // Color más claro
 * adjustColorBrightness("#3b82f6", -30) // Color más oscuro
 */
export function adjustColorBrightness(hex, percent) {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);

  let R = (num >> 16) + amt;
  let G = ((num >> 8) & 0x00ff) + amt;
  let B = (num & 0x0000ff) + amt;

  // Limitar valores entre 0 y 255
  R = Math.max(0, Math.min(255, R));
  G = Math.max(0, Math.min(255, G));
  B = Math.max(0, Math.min(255, B));

  return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

// ============================================================================
// CÁLCULOS MATEMÁTICOS
// ============================================================================

/**
 * Calcula el porcentaje de llenado del tanque
 * @param {number} current - Nivel actual
 * @param {number} max - Capacidad máxima
 * @returns {number} Porcentaje entre 0 y 1
 */
export function calculatePercentage(current, max) {
  const currentVal = parseFloat(current || 0);
  const maxVal = parseFloat(max || 1);

  if (maxVal <= 0) return 0;

  return Math.min(Math.max(currentVal / maxVal, 0), 1);
}

/**
 * Limita un valor entre un mínimo y máximo
 * @param {number} value - Valor a limitar
 * @param {number} min - Valor mínimo
 * @param {number} max - Valor máximo
 * @returns {number} Valor limitado
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// ============================================================================
// NORMALIZACIÓN
// ============================================================================

/**
 * Normaliza el tipo de forma del tanque
 * @param {string} forma - Forma del tanque
 * @returns {string} Forma normalizada en mayúsculas
 */
export function normalizeTankShape(forma) {
  return forma?.toUpperCase() || "CILINDRO";
}

/**
 * Verifica si la forma es rectangular/cúbica
 * @param {string} forma - Forma del tanque
 * @returns {boolean}
 */
export function isRectangularShape(forma) {
  const normalized = normalizeTankShape(forma);
  return normalized === "RECTANGULAR" || normalized === "CUADRADO";
}

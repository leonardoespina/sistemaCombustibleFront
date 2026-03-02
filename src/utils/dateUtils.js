import { date } from 'quasar';

/**
 * Retorna un objeto Date ajustado a la hora local del navegador,
 * evitando el desfase UTC que hace que new Date() muestre el día siguiente
 * en zonas horarias negativas como Venezuela (UTC-4).
 *
 * Uso: todayLocal() en lugar de new Date()
 */
export const todayLocal = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000);
};

/** Fecha de hoy en formato YYYY-MM-DD (hora local) */
export const todayStr = () => date.formatDate(todayLocal(), 'YYYY-MM-DD');

/** Primer día del mes actual en formato YYYY-MM-DD (hora local) */
export const firstOfMonthStr = () => date.formatDate(todayLocal(), 'YYYY-MM-01');

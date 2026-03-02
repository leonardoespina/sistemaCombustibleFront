import { ref } from "vue";
import { useQuasar } from "quasar";
import socket from "../../../services/socket.js";

/**
 * Composable para gestión de la página de cupos
 * 
 * Este es el composable más complejo del sistema porque maneja:
 * - 2 tablas independientes (Cupos Actuales y Cupos Base)
 * - 3 diálogos diferentes (Form, Recarga, Reinicio)
 * - Socket.IO con 8 eventos diferentes
 * - Helpers visuales para progress bars y estados
 * - Operaciones admin (reinicio mensual)
 * 
 * @param {Object} store - Store de cupos
 * @returns {Object} Estado y métodos de la página
 */
export function useCupoPage(store) {
  const $q = useQuasar();

  // ============================================
  // ESTADO DE DIÁLOGOS
  // ============================================
  
  // Control del diálogo de formulario (crear/editar configuración base)
  const isFormDialogVisible = ref(false);
  
  // Control del diálogo de recarga de cupo extra
  const isRecargaDialogVisible = ref(false);
  
  // Cupo base que se está editando (null si es creación)
  const editingCupo = ref(null);
  
  // Cupo actual seleccionado para recarga
  const selectedCupoActual = ref(null);

  // ============================================
  // GESTIÓN DE DIÁLOGOS
  // ============================================
  
  /**
   * Abre el diálogo para crear una nueva configuración de cupo base
   */
  function openAddDialog() {
    editingCupo.value = null;
    isFormDialogVisible.value = true;
  }

  /**
   * Abre el diálogo para editar una configuración de cupo base existente
   * @param {Object} row - Fila de la tabla de cupos base
   */
  function openEditDialog(row) {
    editingCupo.value = { ...row };
    isFormDialogVisible.value = true;
  }

  /**
   * Abre el diálogo para recargar litros extra a un cupo actual
   * @param {Object} row - Fila de la tabla de cupos actuales
   */
  function openRecargaDialog(row) {
    selectedCupoActual.value = row;
    isRecargaDialogVisible.value = true;
  }

  /**
   * Muestra diálogo de confirmación para reiniciar el mes
   * SOLO ADMIN: Esta operación cierra el periodo anterior y genera nuevos cupos
   */
  function confirmarReinicio() {
    $q.dialog({
      title: "⚠️ Confirmar Reinicio Mensual",
      message: "Esto cerrará los cupos del mes anterior y creará los nuevos basados en la configuración base. ¿Deseas continuar?",
      cancel: true,
      persistent: true,
      ok: {
        label: "Reiniciar Mes",
        color: "negative",
        icon: "autorenew"
      },
      cancel: {
        label: "Cancelar",
        flat: true
      }
    }).onOk(async () => {
      await store.reiniciarMes();
    });
  }

  // ============================================
  // HELPERS VISUALES
  // ============================================
  
  /**
   * Determina el color del progress bar según el porcentaje disponible
   * 
   * @param {number} percent - Porcentaje de cupo disponible (0-1)
   * @returns {string} Color del progress bar ('positive', 'warning', 'negative')
   * 
   * Lógica:
   * - Verde (positive): Más del 50% disponible  
   * - Amarillo (warning): Entre 20% y 50% disponible
   * - Rojo (negative): Menos del 20% disponible
   */
  function getProgressColor(percent) {
    if (percent > 0.5) return "positive";   // > 50%: Verde
    if (percent > 0.2) return "warning";    // 20-50%: Amarillo
    return "negative";                       // < 20%: Rojo
  }

  /**
   * Determina el color del chip de estado
   * 
   * @param {string} estado - Estado del cupo ('ACTIVO', 'AGOTADO', 'CERRADO')
   * @returns {string} Color del chip
   * 
   * Estados posibles:
   * - ACTIVO: Cupo disponible y en uso
   * - AGOTADO: Cupo consumido en su totalidad
   * - CERRADO: Periodo finalizado
   */
  function getEstadoColor(estado) {
    switch (estado) {
      case "ACTIVO":
        return "positive";  // Verde
      case "AGOTADO":
        return "negative";  // Rojo
      case "CERRADO":
        return "grey-7";    // Gris
      default:
        return "primary";   // Azul (fallback)
    }
  }

  // ============================================
  // SOCKET.IO - SINCRONIZACIÓN EN TIEMPO REAL
  // ============================================
  
  /**
   * Configura todos los listeners de Socket.IO para actualizaciones en tiempo real
   * 
   * El módulo de cupos escucha 8 eventos diferentes porque los cupos se afectan por:
   * 1. Operaciones CRUD de configuración base
   * 2. Recargas extraordinarias
   * 3. Consumo por solicitudes de combustible
   * 4. Reinicio mensual (cierre de periodo)
   */
  function setupSocketListeners() {
    
    // ========== EVENTOS DE CUPOS BASE ==========
    
    /**
     * Evento: Se creó una nueva configuración de cupo base
     * Efecto: Actualiza ambas tablas y muestra notificación
     */
    socket.on("cupo:creado", (data) => {
      $q.notify({
        type: "info",
        message: `Nueva configuración de cupo creada`,
        icon: "add_circle",
        position: "top-right",
      });
      store.fetchCuposBase();
      store.fetchCuposActuales();
    });

    /**
     * Evento: Se actualizó una configuración de cupo base
     * Efecto: Actualiza ambas tablas y muestra notificación
     */
    socket.on("cupo:actualizado", (data) => {
      $q.notify({
        type: "info",
        message: `Configuración de cupo actualizada`,
        icon: "update",
        position: "top-right",
      });
      store.fetchCuposBase();
      store.fetchCuposActuales();
    });

    // ========== EVENTOS DE CUPOS ACTUALES ==========
    
    /**
     * Evento: Se consumió cupo (por una solicitud aprobada)
     * Efecto: Actualiza solo la tabla de cupos actuales
     */
    socket.on("cupo:consumo", (data) => {
      $q.notify({
        type: "warning",
        message: `Cupo consumido: ${data.cantidad || ''} L`,
        icon: "remove_circle",
        position: "top-right",
      });
      store.fetchCuposActuales();
    });

    /**
     * Evento: Se recargó cupo extra
     * Efecto: Actualiza tabla de cupos actuales con notificación positiva
     */
    socket.on("cupo:recarga", (data) => {
      $q.notify({
        type: "positive",
        message: `Cupo recargado: +${data.cantidad || ''} L`,
        icon: "add_card",
        position: "top-right",
      });
      store.fetchCuposActuales();
    });

    /**
     * Evento: Se ejecutó el reinicio mensual (cierre de periodo)
     * Efecto: Actualiza cupos actuales (los del nuevo mes)
     */
    socket.on("cupo:reinicio-mensual", (data) => {
      $q.notify({
        type: "info",
        message: `Reinicio mensual ejecutado. Nuevos cupos generados.`,
        icon: "autorenew",
        position: "top",
        timeout: 5000,
      });
      store.fetchCuposActuales();
    });

    // ========== EVENTOS DE SOLICITUDES ==========
    // Las solicitudes de combustible afectan los cupos actuales
    
    /**
     * Evento: Se creó una solicitud de combustible
     * Efecto: El cupo se reserva temporalmente
     */
    socket.on("solicitud:creada", (data) => {
      store.fetchCuposActuales();
    });

    /**
     * Evento: Se actualizó una solicitud (aprobada/rechazada)
     * Efecto: El cupo se confirma o se libera
     */
    socket.on("solicitud:actualizada", (data) => {
      store.fetchCuposActuales();
    });

    /**
     * Evento: Se finalizó una solicitud (despachada o vencida)
     * Efecto: El cupo se consume definitivamente o se devuelve
     */
    socket.on("solicitud:finalizada", (data) => {
      store.fetchCuposActuales();
    });
  }

  /**
   * Limpia todos los listeners de Socket.IO
   * CRÍTICO: Debe llamarse en onUnmounted para evitar memory leaks
   */
  function cleanupSocketListeners() {
    socket.off("cupo:creado");
    socket.off("cupo:actualizado");
    socket.off("cupo:consumo");
    socket.off("cupo:recarga");
    socket.off("cupo:reinicio-mensual");
    socket.off("solicitud:creada");
    socket.off("solicitud:actualizada");
    socket.off("solicitud:finalizada");
  }

  // ============================================
  // RETORNO
  // ============================================
  
  return {
    // Estado de diálogos
    isFormDialogVisible,
    isRecargaDialogVisible,
    editingCupo,
    selectedCupoActual,
    
    // Métodos de diálogos
    openAddDialog,
    openEditDialog,
    openRecargaDialog,
    confirmarReinicio,
    
    // Helpers visuales
    getProgressColor,
    getEstadoColor,
    
    // Socket.IO
    setupSocketListeners,
    cleanupSocketListeners,
  };
}

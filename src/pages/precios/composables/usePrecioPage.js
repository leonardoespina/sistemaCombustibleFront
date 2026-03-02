import { ref } from "vue";
import { useQuasar } from "quasar";
import socket from "../../../services/socket.js";

/**
 * Composable para gestión de la página de precios
 * 
 * Este composable maneja toda la lógica de la página que incluye:
 * - 2 tablas independientes (Monedas y Precios por Combustible)
 * - Layout split (2-columnas): Izq=Monedas, Der=Precios
 * - Socket.IO con 3 eventos
 * - Helper de formateo de números con alta precisión
 * - Sistema multi-moneda dinámico
 * 
 * @param {Object} store - Store de precios
 * @returns {Object} Estado y métodos de la página
 */
export function usePrecioPage(store) {
  const $q = useQuasar();

  // ============================================
  // ESTADO DE DIÁLOGOS
  // ============================================
  
  // Control del diálogo de formulario de moneda (crear/editar)
  const showMonedaDialog = ref(false);
  
  // Control del diálogo de formulario de precios
  const showPrecioDialog = ref(false);
  
  // Moneda que se está editando (null si es creación)
  const selectedMoneda = ref(null);
  
  // Combustible seleccionado para configurar precios
  const selectedCombustible = ref(null);

  // ============================================
  // GESTIÓN DE DIÁLOGOS - MONEDAS
  // ============================================
  
  /**
   * Abre el diálogo para crear una nueva moneda
   */
  function openCreateMonedaDialog() {
    selectedMoneda.value = null;
    showMonedaDialog.value = true;
  }

  /**
   * Abre el diálogo para editar una moneda existente
   * @param {Object} row - Fila de la tabla de monedas
   */
  function openEditMonedaDialog(row) {
    selectedMoneda.value = row;
    showMonedaDialog.value = true;
  }

  /**
   * Muestra diálogo de confirmación para eliminar una moneda
   * 
   * IMPORTANTE: Eliminar una moneda puede afectar todos los precios
   * configurados en esa moneda. Se debe advertir al usuario.
   * 
   * @param {Object} row - Fila de la tabla de monedas
   */
  function confirmDeleteMoneda(row) {
    $q.dialog({
      title: "⚠️ Confirmar eliminación de moneda",
      message: `¿Estás seguro de eliminar la moneda "${row.nombre}" (${row.simbolo})?\n\nEsto eliminará todos los precios configurados en esta moneda.`,
      cancel: true,
      persistent: true,
      ok: {
        label: "Eliminar",
        color: "negative",
        icon: "delete"
      },
      cancel: {
        label: "Cancelar",
        flat: true
      }
    }).onOk(async () => {
      await store.deleteMoneda(row.id_moneda);
    });
  }

  // ============================================
  // GESTIÓN DE DIÁLOGOS - PRECIOS
  // ============================================
  
  /**
   * Abre el diálogo para configurar precios de un combustible
   * 
   * El diálogo mostrará campos dinámicos para cada moneda activa
   * 
   * @param {Object} row - Fila de la tabla de precios (combustible)
   */
  function openEditPrecioDialog(row) {
    selectedCombustible.value = row;
    showPrecioDialog.value = true;
  }

  // ============================================
  // HELPERS VISUALES
  // ============================================
  
  /**
   * Formatea un número con alta precisión para mostrar precios
   * 
   * Características:
   * - Mínimo 2 decimales (para monedas como USD, Bs)
   * - Máximo 8 decimales (para monedas como Au - Oro, BTC - Bitcoin)
   * - Formato español (coma como separador decimal)
   * 
   * Ejemplos:
   * - 50 → "50,00"
   * - 1.234567 → "1,23456700"
   * - 0.00025 → "0,00025000"
   * - null → "-"
   * 
   * @param {number|null} valor - Valor numérico a formatear
   * @returns {string} Número formateado
   */
  function formatearNumero(valor) {
    if (valor === null || valor === undefined) return "-";
    
    return new Intl.NumberFormat("es-ES", {
      minimumFractionDigits: 2,  // Mínimo 2 decimales
      maximumFractionDigits: 8,  // Máximo 8 decimales (alta precisión)
    }).format(valor);
  }

  // ============================================
  // SOCKET.IO - SINCRONIZACIÓN EN TIEMPO REAL
  // ============================================
  
  /**
   * Configura todos los listeners de Socket.IO para actualizaciones en tiempo real
   * 
   * El módulo de precios escucha 3 eventos:
   * 1. Cambios en monedas (afectan ambas tablas)
   * 2. Cambios en precios (afectan solo tabla de precios)
   */
  function setupSocketListeners() {
    
    // ========== EVENTOS DE MONEDAS ==========
    
    /**
     * Evento: Se creó una nueva moneda
     * Efecto: Actualiza tabla de monedas Y tabla de precios
     * 
     * ¿Por qué actualizar ambas tablas?
     * - La tabla de precios muestra chips por cada moneda
     * - Al agregar una moneda, los chips deben actualizarse
     */
    socket.on("moneda:creado", (data) => {
      $q.notify({
        type: "info",
        message: `Nueva moneda "${data.nombre || ''}" (${data.simbolo || ''}) creada`,
        icon: "add_circle",
        position: "top-right",
      });
      store.fetchMonedas();
      store.fetchPreciosActuales(); // Actualizar para mostrar nueva columna de precios
    });

    /**
     * Evento: Se actualizó una moneda existente
     * Efecto: Actualiza ambas tablas
     */
    socket.on("moneda:actualizado", (data) => {
      $q.notify({
        type: "info",
        message: `Moneda "${data.nombre || ''}" actualizada`,
        icon: "update",
        position: "top-right",
      });
      store.fetchMonedas();
      store.fetchPreciosActuales(); // Actualizar por si cambiaron símbolos
    });

    // ========== EVENTOS DE PRECIOS ==========
    
    /**
     * Evento: Se actualizaron precios de un combustible
     * Efecto: Actualiza solo la tabla de precios
     * 
     * Este evento se dispara cuando se configuran/modifican los precios
     * de un tipo de combustible en una o más monedas
     */
    socket.on("precio:actualizado", (data) => {
      $q.notify({
        type: "positive",
        message: `Precios actualizados para "${data.combustible || 'combustible'}"`,
        icon: "price_change",
        position: "top-right",
      });
      store.fetchPreciosActuales();
    });
  }

  /**
   * Limpia todos los listeners de Socket.IO
   * CRÍTICO: Debe llamarse en onUnmounted para evitar memory leaks
   */
  function cleanupSocketListeners() {
    socket.off("moneda:creado");
    socket.off("moneda:actualizado");
    socket.off("precio:actualizado");
  }

  // ============================================
  // MÉTODOS AUXILIARES
  // ============================================
  
  /**
   * Refresca manualmente la tabla de precios
   * Se usa en el botón "Actualizar" de la tabla de precios
   */
  function actualizarPrecios() {
    store.fetchPreciosActuales();
  }

  // ============================================
  // RETORNO
  // ============================================
  
  return {
    // Estado de diálogos
    showMonedaDialog,
    showPrecioDialog,
    selectedMoneda,
    selectedCombustible,
    
    // Métodos de diálogos - Monedas
    openCreateMonedaDialog,
    openEditMonedaDialog,
    confirmDeleteMoneda,
    
    // Métodos de diálogos - Precios
    openEditPrecioDialog,
    
    // Helpers visuales
    formatearNumero,
    
    // Métodos auxiliares
    actualizarPrecios,
    
    // Socket.IO
    setupSocketListeners,
    cleanupSocketListeners,
  };
}

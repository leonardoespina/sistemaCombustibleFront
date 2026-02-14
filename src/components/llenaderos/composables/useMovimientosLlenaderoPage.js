import { ref, onMounted, onUnmounted } from "vue";
import { date } from "quasar";
import { useMovimientoLlenaderoStore } from "../../../stores/movimientoLlenaderoStore";
import socket from "../../../services/socket";

/**
 * Composable para lógica de la página de movimientos de llenaderos (CARGA)
 * 
 * Maneja la gestión de la tabla de recepciones de cisternas,
 * paginación, diálogos, y actualizaciones en tiempo real vía Socket.IO
 * 
 * @returns {Object} Estado y métodos de la página
 */
export function useMovimientosLlenaderoPage() {
  // ============================================
  // STORE
  // ============================================
  
  const store = useMovimientoLlenaderoStore();

  // ============================================
  // ESTADO LOCAL
  // ============================================
  
  const showDialog = ref(false);
  const showDetailDialog = ref(false);
  const selectedMovement = ref(null);

  // ============================================
  // DEFINICIÓN DE COLUMNAS
  // ============================================
  
  const columns = [
    {
      name: "fecha_movimiento",
      label: "Fecha",
      field: "fecha_movimiento",
      align: "left",
      sortable: true,
      format: (val) => date.formatDate(val, "DD/MM/YYYY HH:mm"),
    },
    {
      name: "llenadero",
      label: "Llenadero",
      field: (row) => row.Llenadero?.nombre_llenadero || "N/A",
      align: "left",
      sortable: false, 
    },
    {
      name: "cantidad",
      label: "Recibido",
      field: "cantidad",
      align: "right",
      sortable: true,
    },
    {
      name: "porcentaje_anterior",
      label: "% Ant.",
      field: "porcentaje_anterior",
      align: "center",
      sortable: true,
    },
    {
      name: "saldo_nuevo",
      label: "Saldo Final",
      field: "saldo_nuevo",
      align: "right",
      sortable: true,
    },
    {
      name: "porcentaje_nuevo",
      label: "% Final",
      field: "porcentaje_nuevo",
      align: "center",
      sortable: true,
    },
    {
      name: "observacion",
      label: "Observación",
      field: "observacion",
      align: "left",
    },
    {
      name: "usuario",
      label: "Registrado Por",
      field: "id_usuario",
      align: "left",
    },
    {
      name: "actions",
      label: "Acciones",
      field: "actions",
      align: "center",
    },
  ];

  // ============================================
  // MÉTODOS
  // ============================================
  
  /**
   * Handler para paginación/ordenamiento de la tabla
   */
  function onRequest(props) {
    store.pagination = props.pagination;
    store.fetchMovimientos();
  }

  /**
   * Abre el diálogo de detalles de un movimiento
   */
  function openDetail(row) {
    selectedMovement.value = row;
    showDetailDialog.value = true;
  }

  // ============================================
  // SOCKET.IO LISTENERS
  // ============================================
  
  /**
   * Inicializa listeners de Socket.IO para actualizaciones en tiempo real
   */
  function initSocket() {
    socket.on("llenadero:actualizado", () => store.fetchMovimientos());
  }

  /**
   * Limpia listeners de Socket.IO
   */
  function cleanupSocket() {
    socket.off("llenadero:actualizado");
  }

  // ============================================
  // LIFECYCLE
  // ============================================
  
  onMounted(() => {
    store.fetchMovimientos();
    initSocket();
  });

  onUnmounted(() => {
    cleanupSocket();
  });

  // ============================================
  // RETORNO
  // ============================================
  
  return {
    // Estado del store
    store,
    
    // Estado local
    showDialog,
    showDetailDialog,
    selectedMovement,
    
    // Columnas
    columns,
    
    // Métodos
    onRequest,
    openDetail,
  };
}

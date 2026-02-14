import { ref, computed, onMounted, onUnmounted } from "vue";
import { useQuasar } from "quasar";
import { useLlenaderoStore } from "../../../stores/llenaderoStore";
import socket from "../../../services/socket";

/**
 * Composable para lógica de la página de llenaderos
 * 
 * Maneja la gestión de la tabla, paginación, diálogos,
 * y actualizaciones en tiempo real vía Socket.IO
 * 
 * @returns {Object} Estado y métodos de la página
 */
export function useLlenaderoPage() {
  // ============================================
  // STORE Y QUASAR
  // ============================================
  
  const $q = useQuasar();
  const store = useLlenaderoStore();

  // ============================================
  // ESTADO LOCAL
  // ============================================
  
  const showDialog = ref(false);
  const selectedItem = ref(null);

  // ============================================
  // COMPUTADOS
  // ============================================
  
  const rows = computed(() => store.rows);
  const loading = computed(() => store.loading);
  
  const filter = computed({
    get: () => store.filter,
    set: (val) => (store.filter = val),
  });
  
  const pagination = computed({
    get: () => store.pagination,
    set: (val) => (store.pagination = val),
  });

  // ============================================
  // DEFINICIÓN DE COLUMNAS
  // ============================================
  
  const columns = [
    {
      name: "id_llenadero",
      label: "ID",
      field: "id_llenadero",
      sortable: true,
      align: "left",
    },
    {
      name: "nombre_llenadero",
      label: "Nombre del Llenadero",
      field: "nombre_llenadero",
      sortable: true,
      align: "left",
    },
    {
      name: "capacidad",
      label: "Capacidad (litros)",
      field: "capacidad",
      sortable: true,
      align: "right",
      format: (val) => val ? `${val} L` : 'No especificado'
    },
    {
      name: "disponibilidadActual",
      label: "Disponibilidad Actual (litros)",
      field: "disponibilidadActual",
      sortable: true,
      align: "right",
      format: (val) => val ? `${val} L` : 'No especificado'
    },
    {
      name: "tipo_combustible",
      label: "Tipo de Combustible",
      field: (row) => row.TipoCombustible?.nombre || 'No especificado',
      sortable: true,
      align: "left",
    },
    {
      name: "estado",
      label: "Estado",
      field: "estado",
      sortable: true,
      align: "center",
    },
    { name: "actions", label: "Acciones", align: "center" },
  ];

  // ============================================
  // MÉTODOS
  // ============================================
  
  /**
   * Handler para paginación/ordenamiento de la tabla
   */
  function onRequest(props) {
    store.pagination = props.pagination;
    store.filter = props.filter;
    store.fetchLlenaderos();
  }

  /**
   * Abre el diálogo para crear nuevo llenadero
   */
  function openCreateDialog() {
    selectedItem.value = null;
    showDialog.value = true;
  }

  /**
   * Abre el diálogo para editar llenadero existente
   */
  function openEditDialog(row) {
    selectedItem.value = row;
    showDialog.value = true;
  }

  /**
   * Muestra confirmación antes de desactivar llenadero
   */
  function confirmDelete(row) {
    $q.dialog({
      title: "Confirmar acción",
      message: `¿Estás seguro de desactivar el llenadero "${row.nombre_llenadero}"?`,
      cancel: true,
      persistent: true,
    }).onOk(() => {
      store.deleteLlenadero(row.id_llenadero);
    });
  }

  // ============================================
  // SOCKET.IO LISTENERS
  // ============================================
  
  /**
   * Inicializa listeners de Socket.IO para actualizaciones en tiempo real
   */
  function initSocket() {
    socket.on("llenadero:creado", () => store.fetchLlenaderos());
    socket.on("llenadero:actualizado", () => store.fetchLlenaderos());
  }

  /**
   * Limpia listeners de Socket.IO
   */
  function cleanupSocket() {
    socket.off("llenadero:creado");
    socket.off("llenadero:actualizado");
  }

  // ============================================
  // LIFECYCLE
  // ============================================
  
  onMounted(() => {
    store.fetchLlenaderos();
    initSocket();
  });

  onUnmounted(() => {
    cleanupSocket();
    // Resetear filtros y paginación
    store.filter = "";
    store.pagination = {
      page: 1,
      rowsPerPage: 10,
      sortBy: "id_llenadero",
      descending: false,
      rowsNumber: 0,
    };
  });

  // ============================================
  // RETORNO
  // ============================================
  
  return {
    // Estado
    showDialog,
    selectedItem,
    rows,
    loading,
    filter,
    pagination,
    
    // Columnas
    columns,
    
    // Métodos
    onRequest,
    openCreateDialog,
    openEditDialog,
    confirmDelete,
  };
}

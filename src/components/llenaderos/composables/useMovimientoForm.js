import { ref, computed, watch } from "vue";
import { useQuasar, date } from "quasar";

/**
 * Composable genérico para gestión de movimientos de llenaderos (CARGA o EVAPORACIÓN)
 * 
 * Este composable maneja lógica compartida entre recepciones de cisternas (CARGA)
 * y registros de evaporación, incluyendo cálculos de stock, validaciones dinámicas
 * y confirmación de guardado.
 * 
 * @param {Function} emit - Función emit del componente
 * @param {String} tipoMovimiento - Tipo de movimiento: "CARGA" o "EVAPORACIÓN"
 * @param {Object} store - Store a utilizar (movimientoLlenaderoStore o evaporacionStore)
 * @returns {Object} Estado y métodos del formulario
 */
export function useMovimientoForm(emit, tipoMovimiento = "CARGA", store) {
  const $q = useQuasar();

  // ============================================
  // ESTADO DEL FORMULARIO
  // ============================================
  
  const formData = ref({
    tipo_movimiento: tipoMovimiento,
    id_llenadero: null,
    cantidad: "",
    observacion: "",
    fecha_movimiento: date.formatDate(new Date(), "YYYY/MM/DD HH:mm"),
    // Campos condicionales (solo para CARGA)
    numero_factura: "",
    litros_factura: "",
    datos_gandola: "",
    nombre_conductor: "",
    cedula_conductor: ""
  });

  // ============================================
  // COMPUTADOS
  // ============================================
  
  /**
   * Objeto del llenadero seleccionado con toda su información
   */
  const selectedLlenaderoObj = computed(() => {
    return store.llenaderoOptions.find(l => l.id_llenadero === formData.value.id_llenadero) || null;
  });

  /**
   * Stock actual del llenadero seleccionado
   */
  const currentStock = computed(() => {
    return selectedLlenaderoObj.value ? parseFloat(selectedLlenaderoObj.value.disponibilidadActual || 0) : 0;
  });

  /**
   * Capacidad máxima del llenadero seleccionado
   */
  const capacity = computed(() => {
    return selectedLlenaderoObj.value ? parseFloat(selectedLlenaderoObj.value.capacidad || 0) : 0;
  });

  /**
   * Cantidad ingresada convertida a número
   */
  const inputAmount = computed(() => {
    const val = parseFloat(formData.value.cantidad);
    return isNaN(val) ? 0 : val;
  });

  /**
   * Stock proyectado después del movimiento
   * CARGA: suma la cantidad
   * EVAPORACIÓN: resta la cantidad
   */
  const newStock = computed(() => {
    if (!selectedLlenaderoObj.value) return 0;

    if (tipoMovimiento === "CARGA") {
      return currentStock.value + inputAmount.value;
    } else {
      // EVAPORACIÓN
      return currentStock.value - inputAmount.value;
    }
  });

  /**
   * Porcentaje de disponibilidad actual
   */
  const currentPercentage = computed(() => {
    if (capacity.value === 0) return 0;
    return (currentStock.value / capacity.value) * 100;
  });

  /**
   * Porcentaje de disponibilidad proyectado
   */
  const percentage = computed(() => {
    if (capacity.value === 0) return 0;
    return (newStock.value / capacity.value) * 100;
  });

  /**
   * Indica si requiere campos administrativos (solo CARGA)
   */
  const requiresAdminFields = computed(() => tipoMovimiento === "CARGA");

  /**
   * Validación completa del formulario
   * Validaciones condicionales según el tipo de movimiento
   */
  const isValid = computed(() => {
    // Validaciones comunes
    if (!formData.value.id_llenadero) return false;
    if (inputAmount.value <= 0) return false;
    if (!formData.value.observacion) return false;

    // Validaciones específicas por tipo de movimiento
    if (tipoMovimiento === "CARGA") {
      // No exceder capacidad
      if (newStock.value > capacity.value) return false;
      
      // Campos administrativos requeridos
      if (!formData.value.numero_factura || !formData.value.datos_gandola ||
        !formData.value.nombre_conductor || !formData.value.cedula_conductor) return false;
    } else {
      // EVAPORACIÓN: No permitir stock negativo
      if (newStock.value < 0) return false;
    }

    return true;
  });

  // ============================================
  // MÉTODOS
  // ============================================
  
  /**
   * Resetea el formulario a valores iniciales
   */
  function resetForm() {
    formData.value = {
      tipo_movimiento: tipoMovimiento,
      id_llenadero: null,
      cantidad: "",
      observacion: "",
      fecha_movimiento: date.formatDate(new Date(), "YYYY/MM/DD HH:mm"),
      numero_factura: "",
      litros_factura: "",
      datos_gandola: "",
      nombre_conductor: "",
      cedula_conductor: ""
    };
  }

  /**
   * Maneja el guardado del movimiento con confirmación
   * Muestra diálogo de confirmación antes de enviar
   */
  async function submit() {
    if (!isValid.value) return;

    // Mensaje de confirmación dinámico
    const movementLabel = tipoMovimiento === "CARGA" ? "recepción" : "evaporación";
    
    $q.dialog({
      title: "Confirmar Movimiento",
      message: `<div class="text-center">
                  ¿Está seguro de registrar esta ${movementLabel}?<br/>
                  <b>Nuevo Stock: ${newStock.value.toFixed(2)} Lts</b><br/><br/>
                  <span class="text-negative text-weight-bold">ADVERTENCIA: Una vez almacenado, el registro no podrá ser modificado.</span>
                </div>`,
      html: true,
      cancel: true,
      persistent: true
    }).onOk(async () => {
      // Llamar al método apropiado del store
      let success;
      if (tipoMovimiento === "CARGA") {
        success = await store.createMovimiento(formData.value);
      } else {
        // EVAPORACIÓN
        success = await store.registrarEvaporacion(formData.value);
      }
      
      if (success) {
        emit("save");
        emit("update:modelValue", false);
      }
    });
  }

  // ============================================
  // RETORNO
  // ============================================
  
  return {
    // Estado
    formData,
    selectedLlenaderoObj,
    
    // Cálculos de stock
    currentStock,
    currentPercentage,
    capacity,
    newStock,
    percentage,
    
    // Validaciones
    isValid,
    requiresAdminFields,
    
    // Métodos
    resetForm,
    submit
  };
}

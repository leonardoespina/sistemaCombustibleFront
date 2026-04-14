import { ref, watch, nextTick, reactive, computed } from "vue";
import { date } from "quasar";
import { calcularVolumenTanque } from "../formula.js";

/**
 * Composable para gestión del formulario de mediciones físicas
 * 
 * Este composable maneja la lógica para el registro de mediciones,
 * incluyendo múltiples modos (teórico, fórmula matemática y tabla de aforo),
 * además de lidiar con las conversiones de unidades.
 * 
 * @param {Object} props - Props del componente
 * @param {Function} emit - Función emit del componente
 * @returns {Object} Estado y métodos del formulario
 */
export function useMeasurementForm(props, emit) {
  // ============================================
  // ESTADO DEL FORMULARIO Y VARIABLES LOCALES
  // ============================================

  const formData = ref({});
  const autoEvaporacion = ref(false);

  // Referencias a inputs para enfocar al editar
  const inputReal = ref(null);
  const inputDiferencia = ref(null);

  // Estados de edición UI
  const editing = reactive({
    real: false,
    diferencia: false,
  });

  // Flag persistente de si la edición fue manual por el usuario
  const manualEdit = reactive({
    real: false,
    diferencia: false,
  });

  // Valores originales para rollback en cancelación
  const originalValues = reactive({
    real: 0,
    diferencia: 0,
  });

  // Contenedor principal de cálculos de volumen
  const liters = reactive({
    real: 0,
    diferencia: 0,
  });

  // ============================================
  // COMPUTED PROPERTIES
  // ============================================

  // Detecta si el tanque es de gasolina para la regla de evaporación automática
  const isGasolina = computed(() => {
    return props.currentTankDetail?.tipo_combustible === "GASOLINA";
  });

  // Determinar si aplica cálculo por fórmula matemática
  const isFormulaMode = computed(() => {
    const t = props.currentTankDetail;
    if (!t) return false;

    const aforoData = t.aforo || t.tabla_aforo;
    const hasAforo = Array.isArray(aforoData)
      ? aforoData.length > 0
      : aforoData && Object.keys(aforoData).length > 0;

    if (hasAforo) return false;

    if (t.tipo_tanque === "RECTANGULAR" || t.tipo_tanque === "CUADRADO") {
      return t.largo > 0 && t.ancho > 0 && t.alto > 0;
    } else {
      return t.largo > 0 && t.radio > 0;
    }
  });

  // Determinar si es modo 100% manual (sin tabla ni dimensiones matemáticas)
  const isManualMode = computed(() => {
    if (!props.currentTankDetail) return false;
    const t = props.currentTankDetail;

    const aforoData = t.aforo || t.tabla_aforo;
    const hasAforo = Array.isArray(aforoData)
      ? aforoData.length > 0
      : aforoData && Object.keys(aforoData).length > 0;

    if (hasAforo) return false;
    if (isFormulaMode.value) return false;
    return true;
  });

  // ============================================
  // INICIALIZACIÓN
  // ============================================

  function initializeForm() {
    const now = new Date();
    const init = props.initialData || {};

    formData.value = {
      fecha: init.fecha_medicion || date.formatDate(now, "YYYY-MM-DD"),
      hora: init.hora_medicion || date.formatDate(now, "HH:mm"),
      id_llenadero: init.Tanque?.id_llenadero || null,
      id_tanque: init.id_tanque || null,
      medida_vara: init.medida_vara || null,
      litros_manuales_ingresados: null,
      litros_evaporacion: init.merma_evaporacion || 0,
      observacion: init.observaciones || "",
    };

    if (props.isEditing || props.isReadOnly) {
      liters.real = parseFloat(init.volumen_real || 0);
      liters.diferencia = parseFloat(init.diferencia || 0);
      manualEdit.real = true;
      manualEdit.diferencia = true;
    } else {
      resetCalculos();
    }

    autoEvaporacion.value = false;
    editing.real = false;
    editing.diferencia = false;
  }

  function resetCalculos() {
    liters.real = 0;
    liters.diferencia = 0;
    manualEdit.real = false;
    manualEdit.diferencia = false;
  }

  // ============================================
  // METODOS INTERFAZ DE USUARIO INLINE (EDIT / CANCEL)
  // ============================================

  async function startEdit(field) {
    originalValues[field] = liters[field];
    editing[field] = true;

    await nextTick();

    if (field === "real" && inputReal.value) {
      inputReal.value.focus();
      inputReal.value.select();
    } else if (field === "diferencia" && inputDiferencia.value) {
      inputDiferencia.value.focus();
      inputDiferencia.value.select();
    }
  }

  function finishEdit(field) {
    editing[field] = false;

    if (liters[field] === null || liters[field] === "" || isNaN(liters[field])) {
      liters[field] = 0;
    }

    const finalVal = parseFloat(parseFloat(liters[field]).toFixed(2));
    liters[field] = finalVal;

    // Si se confirmó la edición, se marca como operación manual del usuario
    manualEdit[field] = true;

    // Recalcular diferencia estática si solo se editó los litros reales
    if (field === "real") {
      if (!manualEdit.diferencia) {
        recalculateDiferencia();
      }
    }
  }

  function cancelEdit(field) {
    liters[field] = originalValues[field];
    editing[field] = false;
  }

  function recalculateDiferencia() {
    const sistema = parseFloat(props.currentTankDetail?.nivel_actual || 0);
    const evap = parseFloat(formData.value.litros_evaporacion || 0);
    const esperado = sistema - evap;
    liters.diferencia = parseFloat((esperado - liters.real).toFixed(2));
  }

  // ============================================
  // CÁLCULO CORE DE VOLUMETRÍA 
  // ============================================

  function calculate() {
    if (!props.currentTankDetail) return;

    const sistema = parseFloat(props.currentTankDetail.nivel_actual || 0);
    let volReal = liters.real;

    if (!manualEdit.real) {
      if (isManualMode.value) {
        const litrosManuales = parseFloat(formData.value.litros_manuales_ingresados);
        volReal = isNaN(litrosManuales) ? 0 : litrosManuales;
      } else if (isFormulaMode.value) {
        const medida = parseFloat(formData.value.medida_vara);
        if (!isNaN(medida)) {
          const t = props.currentTankDetail;
          const unidad = (t.unidad_medida || "CM").toUpperCase();
          let scale = 1;

          if (unidad === "PULGADAS" || unidad === "PULG") {
            scale = 0.0254;
          } else if (unidad === "M" || unidad === "METROS" || unidad === "MTS") {
            scale = 1;
          } else if (unidad === "MM") {
            scale = 0.001;
          } else {
            scale = 0.01;
          }

          // La medida de la vara escala acordemente
          const h_m = medida * scale;

          if (t.tipo_tanque === "RECTANGULAR" || t.tipo_tanque === "CUADRADO") {
            const largo_m = parseFloat(t.largo) * scale;
            const ancho_m = parseFloat(t.ancho) * scale;
            const alto_m = parseFloat(t.alto) * scale;

            // Guard: si alguna dimensión es inválida (ej. alto = null en BD), no calcular
            if (isNaN(largo_m) || isNaN(ancho_m) || isNaN(alto_m) || largo_m <= 0 || ancho_m <= 0 || alto_m <= 0) {
              console.warn("[Medición] Tanque rectangular con dimensiones inválidas o incompletas:", {
                largo: t.largo, ancho: t.ancho, alto: t.alto, unidad: t.unidad_medida
              });
              volReal = 0;
            } else {
              const calc = calcularVolumenTanque(h_m, largo_m, ancho_m, t.tipo_tanque, alto_m);
              volReal = parseFloat(calc.toFixed(2));
            }
          } else {
            // CILÍNDRICOS — sin cambios
            const largo_m = parseFloat(t.largo) * scale;
            const radio_m = parseFloat(t.radio) * scale;

            const calc = calcularVolumenTanque(h_m, largo_m, radio_m, "CILINDRICO");
            volReal = parseFloat(calc.toFixed(2));
          }
        } else {
          volReal = 0;
        }
      } else {
        // Modo por Tabla de Aforo Array
        const aforoData = props.currentTankDetail.aforo || props.currentTankDetail.tabla_aforo || [];
        const medida = parseFloat(formData.value.medida_vara);

        if (Array.isArray(aforoData)) {
          const entry = aforoData.find((e) => parseFloat(e.altura) === medida);
          volReal = entry ? parseFloat(entry.volumen) : 0;
        } else {
          volReal = aforoData[String(medida)] || 0;
        }
      }
      liters.real = volReal;
    } else {
      volReal = liters.real;
    }

    // 2. Automático de Evaporación
    if (isGasolina.value && autoEvaporacion.value) {
      const evapCalc = (0.25 * volReal) / 100;
      formData.value.litros_evaporacion = parseFloat(evapCalc.toFixed(2));
    }

    // 3. Diferencia entre Sistema vs Físico
    if (!manualEdit.diferencia) {
      const evap = parseFloat(formData.value.litros_evaporacion || 0);
      const esperado = sistema - evap;
      liters.diferencia = parseFloat((esperado - volReal).toFixed(2));
    }
  }

  // ============================================
  // EVENTOS DEL FORMULARIO
  // ============================================

  function onLlenaderoSelect(llenaderoId) {
    formData.value.id_tanque = null;
    emit("llenadero-changed", llenaderoId);
    resetCalculos();
  }

  function onTankSelect(tankId) {
    emit("tank-changed", tankId);
    formData.value.medida_vara = null;
    formData.value.litros_manuales_ingresados = null;
    formData.value.litros_evaporacion = 0;
    autoEvaporacion.value = false;
    resetCalculos();
  }

  async function onSave() {
    await nextTick();

    const payload = {
      id_medicion: props.initialData?.id_medicion,
      id_tanque: formData.value.id_tanque,
      fecha_medicion: formData.value.fecha,
      hora_medicion: formData.value.hora,
      medida_vara: formData.value.medida_vara,
      volumen_real: liters.real,
      merma_evaporacion: formData.value.litros_evaporacion,
      observaciones: formData.value.observacion,
    };

    if (isManualMode.value) {
      payload.litros_manuales_ingresados = parseFloat(payload.litros_manuales_ingresados);
      if (payload.medida_vara !== null && payload.medida_vara !== "") {
        payload.medida_vara = parseFloat(payload.medida_vara);
      }
    } else {
      payload.medida_vara = parseFloat(payload.medida_vara);
      delete payload.litros_manuales_ingresados;
    }

    payload.litros_evaporacion = parseFloat(payload.litros_evaporacion || 0);

    emit("save", payload);
  }

  // ============================================
  // WATCHERS Y LIFECYCLE
  // ============================================

  watch(
    () => props.modelValue,
    (isNowOpen) => {
      if (isNowOpen) {
        initializeForm();
      }
    }
  );

  return {
    // Estado y variables expuestas
    formData,
    autoEvaporacion,
    editing,
    liters,

    // UI Refs
    inputReal,
    inputDiferencia,

    // Computeds  
    isGasolina,
    isFormulaMode,
    isManualMode,

    // Métodos core
    calculate,
    startEdit,
    finishEdit,
    cancelEdit,
    onLlenaderoSelect,
    onTankSelect,
    onSave,
  };
}

import { ref, reactive, computed, nextTick } from "vue";
import { date } from "quasar";
import { calcularVolumenTanque } from "../formula.js";

export function useMeasurementForm(props, emit) {
  const formData = ref({});
  const autoEvaporacion = ref(false);

  // Estados de edición y valores para cálculos
  const editing = reactive({
    real: false,
    diferencia: false,
    inicial: false,
    final: false,
  });

  const manualEdit = reactive({
    real: false,
    diferencia: false,
    inicial: false,
    final: false,
  });

  const originalValues = reactive({
    real: 0,
    diferencia: 0,
    inicial: 0,
    final: 0,
  });

  const liters = reactive({
    real: 0,
    diferencia: 0,
    inicial: 0,
    final: 0,
  });

  // --- COMPUTED PROPERTIES ---
  const isGasolina = computed(() => {
    return props.currentTankDetail?.tipo_combustible === "GASOLINA";
  });

  const tieneAforo = computed(() => {
    const t = props.currentTankDetail;
    if (!t) return false;
    const aforoData = t.aforo || t.tabla_aforo;
    return Array.isArray(aforoData) ? aforoData.length > 0 : (aforoData && Object.keys(aforoData).length > 0);
  });

  const isFormulaMode = computed(() => {
    const t = props.currentTankDetail;
    if (!t) return false;
    if (tieneAforo.value) return false;
    if (t.tipo_tanque === "RECTANGULAR" || t.tipo_tanque === "CUADRADO") {
      return t.largo > 0 && t.ancho > 0 && t.alto > 0;
    } else {
      return t.largo > 0 && t.radio > 0;
    }
  });

  const isManualMode = computed(() => {
    if (!props.currentTankDetail) return false;
    if (tieneAforo.value || isFormulaMode.value) return false;
    return true;
  });

  // --- MÉTODOS DE CÁLCULO ---
  function calculate() {
    if (!props.currentTankDetail) return;

    const sistema = parseFloat(props.currentTankDetail.nivel_actual || 0);
    const t = props.currentTankDetail;
    const aforoData = t.aforo || t.tabla_aforo || [];
    const unidad = (t.unidad_medida || "CM").toUpperCase();

    const getVol = (medida) => {
      const m = parseFloat(medida);
      if (isNaN(m)) return 0;
      
      if (tieneAforo.value) {
        if (Array.isArray(aforoData)) {
          const entry = aforoData.find((e) => parseFloat(e.altura) === m);
          return entry ? parseFloat(entry.volumen) : 0;
        } else {
          return parseFloat(aforoData[String(m)]) || 0;
        }
      } else if (isFormulaMode.value) {
        let h_m = unidad === "PULGADAS" ? m * 0.0254 : m / 100;
        return calcularVolumenTanque(
          h_m,
          parseFloat(t.largo),
          t.tipo_tanque === 'CILINDRICO' ? parseFloat(t.radio) : parseFloat(t.ancho),
          t.tipo_tanque,
          parseFloat(t.alto)
        );
      }
      return m; // Manual
    };

    // Calcular volúmenes si no son manuales
    if (!manualEdit.inicial) liters.inicial = parseFloat(getVol(formData.value.medida_inicial).toFixed(2));
    if (!manualEdit.final) liters.final = parseFloat(getVol(formData.value.medida_final).toFixed(2));

    // El volumen REAL de la medición es el final
    if (!manualEdit.real) {
      if (isManualMode.value) {
        const manual = parseFloat(formData.value.litros_manuales_ingresados);
        liters.real = isNaN(manual) ? 0 : manual;
      } else {
        liters.real = liters.final;
      }
    }

    if (isGasolina.value && autoEvaporacion.value) {
      const evapCalc = (0.25 * liters.real) / 100;
      formData.value.litros_evaporacion = parseFloat(evapCalc.toFixed(2));
    }

    if (!manualEdit.diferencia) {
      const evap = parseFloat(formData.value.litros_evaporacion || 0);
      const esperado = sistema - evap;
      liters.diferencia = parseFloat((esperado - liters.real).toFixed(2));
    }
  }

  // --- MÉTODOS DE EDICIÓN INLINE ---
  function startEdit(field) {
    originalValues[field] = liters[field];
    editing[field] = true;
  }

  function finishEdit(field) {
    editing[field] = false;
    if (liters[field] === null || liters[field] === "" || isNaN(liters[field])) {
      liters[field] = 0;
    }
    const finalVal = parseFloat(parseFloat(liters[field]).toFixed(2));
    liters[field] = finalVal;
    manualEdit[field] = true;
    if ((field === "real" || field === "final") && !manualEdit.diferencia) {
        if (field === 'final') liters.real = liters.final;
        recalculateDiferencia();
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

  // --- GESTIÓN DE FORMULARIO ---
  function resetCalculos() {
    liters.real = 0;
    liters.diferencia = 0;
    liters.inicial = 0;
    liters.final = 0;
    manualEdit.real = false;
    manualEdit.diferencia = false;
    manualEdit.inicial = false;
    manualEdit.final = false;
  }

  function initializeForm() {
    const now = new Date();
    const init = props.initialData || {};

    formData.value = {
      fecha: init.fecha_medicion || date.formatDate(now, "YYYY-MM-DD"),
      hora: init.hora_medicion || date.formatDate(now, "HH:mm"),
      id_llenadero: init.Tanque?.id_llenadero || null,
      id_tanque: init.id_tanque || null,
      medida_inicial: init.medida_inicial || null,
      medida_final: init.medida_final || null,
      medida_vara: init.medida_vara || null,
      litros_manuales_ingresados: null,
      litros_evaporacion: init.merma_evaporacion || 0,
      observacion: init.observaciones || "",
    };

    if (props.isEditing || props.isReadOnly) {
      liters.real = parseFloat(init.volumen_real || 0);
      liters.diferencia = parseFloat(init.diferencia || 0);
      liters.inicial = parseFloat(init.litros_iniciales || 0); // Asumiendo que el modelo los tiene o se guardan
      liters.final = parseFloat(init.volumen_real || 0);
      manualEdit.real = true;
      manualEdit.diferencia = true;
      manualEdit.inicial = true;
      manualEdit.final = true;
    } else {
      resetCalculos();
    }

    autoEvaporacion.value = false;
    Object.keys(editing).forEach(k => editing[k] = false);
  }

  async function handleSave() {
    await nextTick();
    const payload = {
      id_medicion: props.initialData?.id_medicion,
      id_tanque: formData.value.id_tanque,
      fecha_medicion: formData.value.fecha,
      hora_medicion: formData.value.hora,
      medida_inicial: formData.value.medida_inicial,
      medida_final: formData.value.medida_final,
      medida_vara: formData.value.medida_final, // Vara final es la referencia
      volumen_real: liters.real,
      merma_evaporacion: formData.value.litros_evaporacion,
      observaciones: formData.value.observacion,
    };

    if (isManualMode.value) {
      payload.litros_manuales_ingresados = parseFloat(formData.value.litros_manuales_ingresados);
    }
    emit("save", payload);
  }

  return {
    formData, autoEvaporacion, editing, manualEdit, liters,
    isGasolina, tieneAforo, isFormulaMode, isManualMode,
    calculate, startEdit, finishEdit, cancelEdit, initializeForm, handleSave, resetCalculos,
  };
}

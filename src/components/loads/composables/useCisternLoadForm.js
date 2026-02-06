import { ref, reactive, computed, nextTick, watch } from "vue";
import { date } from "quasar";
import { calcularVolumenTanque } from "../../measurements/formula.js";

export function useCisternLoadForm(props, emit) {
  const formData = ref({});
  const isInternalCistern = ref(false);
  const tipoCombustible = ref("");
  const pesoNeto = ref(null);

  // Estados de edición para litros
  const editing = reactive({
    inicial: false,
    final: false,
  });

  const litersWereEdited = reactive({
    inicial: false,
    final: false,
  });

  const originalValues = reactive({
    inicial: 0,
    final: 0,
  });

  const liters = reactive({
    inicial: 0,
    final: 0,
    recibido: "0.00",
    faltante: "0.00",
    dif_flujo: "0.00",
  });

  // --- COMPUTED PROPERTIES ---
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

  // --- MÉTODOS DE CÁLCULO ---
  function calculate() {
    if (!props.currentTankDetail) return;

    const medIni = formData.value.medida_inicial;
    const medFin = formData.value.medida_final;
    const guia = formData.value.litros_segun_guia || 0;
    const flujo = formData.value.litros_flujometro;

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
      return m;
    };

    if (!litersWereEdited.inicial) liters.inicial = parseFloat(getVol(medIni).toFixed(2));
    if (!litersWereEdited.final) liters.final = parseFloat(getVol(medFin).toFixed(2));

    recalculateDerivedVolumes(guia, flujo);
  }

  function recalculateDerivedVolumes(guia, flujo) {
    const ini = parseFloat(liters.inicial) || 0;
    const fin = parseFloat(liters.final) || 0;
    const recibido = fin - ini > 0 ? fin - ini : 0;
    liters.recibido = recibido.toFixed(2);
    liters.faltante = (parseFloat(guia || 0) - recibido).toFixed(2);

    if (flujo !== null && flujo !== "" && !isNaN(parseFloat(flujo))) {
      liters.dif_flujo = (recibido - parseFloat(flujo)).toFixed(2);
    } else {
      liters.dif_flujo = "0.00";
    }
  }

  function startEdit(field) {
    originalValues[field] = liters[field];
    editing[field] = true;
  }

  function finishEdit(field) {
    editing[field] = false;
    if (liters[field] === null || liters[field] === "" || isNaN(liters[field])) {
      liters[field] = 0;
    }
    liters[field] = parseFloat(parseFloat(liters[field]).toFixed(2));
    if (liters[field] !== originalValues[field]) {
      litersWereEdited[field] = true;
    }
    recalculateDerivedVolumes(formData.value.litros_segun_guia, formData.value.litros_flujometro);
  }

  function cancelEdit(field) {
    liters[field] = originalValues[field];
    editing[field] = false;
    recalculateDerivedVolumes(formData.value.litros_segun_guia, formData.value.litros_flujometro);
  }

  function calcularPesoNeto() {
    const entrada = parseFloat(formData.value.peso_entrada) || 0;
    const salida = parseFloat(formData.value.peso_salida) || 0;
    pesoNeto.value = entrada && salida ? entrada - salida : null;
  }

  function resetAllStates() {
    liters.inicial = 0;
    liters.final = 0;
    liters.recibido = "0.00";
    liters.faltante = "0.00";
    liters.dif_flujo = "0.00";
    editing.inicial = false;
    editing.final = false;
    litersWereEdited.inicial = false;
    litersWereEdited.final = false;
    pesoNeto.value = null;
  }

  function initializeForm() {
    const now = new Date();
    const init = props.initialData || {};

    formData.value = {
      numero_guia: init.numero_guia || "",
      fecha_emision: init.fecha_emision || date.formatDate(now, "YYYY-MM-DD"),
      fecha_recepcion: init.fecha_recepcion || date.formatDate(now, "YYYY-MM-DD"),
      fecha: init.fecha_llegada ? date.formatDate(init.fecha_llegada, "YYYY-MM-DD") : date.formatDate(now, "YYYY-MM-DD"),
      hora: init.fecha_llegada ? date.formatDate(init.fecha_llegada, "HH:mm") : date.formatDate(now, "HH:mm"),
      id_vehiculo: init.id_vehiculo || null,
      placa_cisterna: init.placa_cisterna || "",
      nombre_chofer: init.nombre_chofer || "",
      id_chofer: init.id_chofer || null,
      id_almacenista: init.id_almacenista || null,
      id_tanque: init.id_tanque || null,
      medida_inicial: init.medida_inicial || null,
      medida_final: init.medida_final || null,
      litros_segun_guia: init.litros_segun_guia || null,
      litros_flujometro: init.litros_flujometro || null,
      peso_entrada: init.peso_entrada || null,
      peso_salida: init.peso_salida || null,
      hora_inicio_descarga: init.hora_inicio_descarga || "08:00",
      hora_fin_descarga: init.hora_fin_descarga || "09:00",
      observacion: init.observacion || "",
    };

    isInternalCistern.value = formData.value.numero_guia === "cisterna interna";
    
    if (props.isEditing || props.isReadOnly) {
        liters.inicial = parseFloat(init.litros_iniciales || 0);
        liters.final = parseFloat(init.litros_finales || 0);
        liters.recibido = parseFloat(init.litros_recibidos || 0).toFixed(2);
        liters.faltante = parseFloat(init.diferencia_guia || 0).toFixed(2);
        litersWereEdited.inicial = true;
        litersWereEdited.final = true;
    } else {
        resetAllStates();
    }
    calcularPesoNeto();
  }

  return {
    formData, isInternalCistern, tipoCombustible, pesoNeto, editing, litersWereEdited, liters,
    tieneAforo, isFormulaMode, calculate, startEdit, finishEdit, cancelEdit,
    calcularPesoNeto, initializeForm, resetAllStates
  };
}

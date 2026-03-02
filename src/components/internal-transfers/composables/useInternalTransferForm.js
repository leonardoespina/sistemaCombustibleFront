import { ref, reactive, computed, nextTick, watch } from "vue";
import { date } from "quasar";
import { calcularVolumenTanque } from "../../measurements/formula.js";

export function useInternalTransferForm(props, emit) {
  const formData = ref({});
  const calculationMode = ref("final"); // 'final' | 'amount'
  const litersToTransfer = ref(null);

  // Estados de edición para volumen final
  const editing = reactive({ final: false });
  const manualEdit = reactive({ final: false });
  const originalValues = reactive({ final: 0 });
  const liters = reactive({ final: 0 });

  // --- COMPUTED PROPERTIES ---
  const tieneAforo = computed(() => {
    const aforo = props.destinationTankAforo || [];
    return Array.isArray(aforo) ? aforo.length > 0 : (aforo && Object.keys(aforo).length > 0);
  });

  const isFormulaMode = computed(() => {
    const t = props.destinationTankDetail;
    if (!t || tieneAforo.value) return false;
    if (t.tipo_tanque === "RECTANGULAR" || t.tipo_tanque === "CUADRADO") {
      return t.largo > 0 && t.ancho > 0 && t.alto > 0;
    } else {
      return t.largo > 0 && t.radio > 0;
    }
  });

  const computedLitersTransferidos = computed(() => {
    if (!props.destinationTankDetail) return "0.00";
    const antes = parseFloat(props.destinationTankDetail.nivel_actual) || 0;
    const despues = parseFloat(liters.final) || 0;
    return (despues - antes).toFixed(2);
  });

  const litersOrigenDespues = computed(() => {
    if (!props.sourceTankDetail) return "0.00";
    const origenAntes = parseFloat(props.sourceTankDetail.nivel_actual) || 0;
    const transferido = parseFloat(computedLitersTransferidos.value);
    return (origenAntes - transferido).toFixed(2);
  });

  // --- MÉTODOS DE CÁLCULO ---
  function calculate() {
    if (!props.destinationTankDetail || calculationMode.value !== 'final' || manualEdit.final) return;

    const vara = parseFloat(formData.value.medida_vara_destino);
    const t = props.destinationTankDetail;
    const aforoData = props.destinationTankAforo || [];
    const unidad = (t.unidad_medida || "CM").toUpperCase();

    let vol = 0;
    if (isNaN(vara)) {
        liters.final = 0;
        return;
    }

    if (tieneAforo.value) {
      if (Array.isArray(aforoData)) {
        const entry = aforoData.find(e => parseFloat(e.altura) === vara);
        vol = entry ? parseFloat(entry.volumen) : 0;
      } else {
        vol = aforoData[String(vara)] || 0;
      }
    } else if (isFormulaMode.value) {
      let h_m = unidad === "PULGADAS" ? vara * 0.0254 : vara / 100;
      vol = calcularVolumenTanque(
        h_m,
        parseFloat(t.largo),
        t.tipo_tanque === 'CILINDRICO' ? parseFloat(t.radio) : parseFloat(t.ancho),
        t.tipo_tanque,
        parseFloat(t.alto)
      );
    }

    liters.final = parseFloat(vol.toFixed(2));
  }

  function calculateFinalFromAmount() {
    if (calculationMode.value !== "amount") return;
    const current = parseFloat(props.destinationTankDetail?.nivel_actual || 0);
    const amount = parseFloat(litersToTransfer.value || 0);
    liters.final = parseFloat((current + amount).toFixed(2));
    manualEdit.final = true; // Marcamos como manual al forzar desde cantidad
  }

  // --- EDICIÓN INLINE ---
  function startEdit() {
    originalValues.final = liters.final;
    editing.final = true;
  }

  function finishEdit() {
    editing.final = false;
    if (liters.final === null || liters.final === "" || isNaN(liters.final)) {
      liters.final = 0;
    }
    liters.final = parseFloat(parseFloat(liters.final).toFixed(2));
    if (liters.final !== originalValues.final) {
      manualEdit.final = true;
    }
  }

  function cancelEdit() {
    liters.final = originalValues.final;
    editing.final = false;
  }

  // --- GESTIÓN ---
  function resetAllStates() {
    liters.final = 0;
    editing.final = false;
    manualEdit.final = false;
    calculationMode.value = "final";
    litersToTransfer.value = null;
  }

  function initializeForm() {
    const now = new Date();
    const init = props.initialData || {};
    formData.value = {
      fecha: init.fecha_transferencia ? date.formatDate(init.fecha_transferencia, "YYYY-MM-DD") : date.formatDate(now, "YYYY-MM-DD"),
      hora: init.fecha_transferencia ? date.formatDate(init.fecha_transferencia, "HH:mm") : date.formatDate(now, "HH:mm"),
      id_llenadero: init.TanqueOrigen?.id_llenadero || null,
      id_tanque_origen: init.id_tanque_origen || null,
      id_tanque_destino: init.id_tanque_destino || null,
      medida_vara_destino: init.medida_vara_destino || null,
      observacion: init.observacion || "",
    };

    if (props.isEditing || props.isReadOnly) {
      liters.final = parseFloat(init.nivel_destino_despues || 0);
      manualEdit.final = true;
    } else {
      resetAllStates();
    }
  }

  return {
    formData, calculationMode, litersToTransfer, editing, manualEdit, liters,
    tieneAforo, isFormulaMode, computedLitersTransferidos, litersOrigenDespues,
    calculate, calculateFinalFromAmount, startEdit, finishEdit, cancelEdit, initializeForm, resetAllStates
  };
}

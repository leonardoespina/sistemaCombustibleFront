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
    const diff = despues - antes;
    return diff.toFixed(2);
  });

  const isTransferValid = computed(() => {
    const transferido = parseFloat(computedLitersTransferidos.value);
    const balanceOrigen = parseFloat(litersOrigenDespues.value);
    // Válido si se transfiere algo positivo y el origen no queda negativo
    return transferido > 0 && balanceOrigen >= 0;
  });

  const litersOrigenDespues = computed(() => {
    if (!props.sourceTankDetail) return "0.00";
    const origenAntes = parseFloat(props.sourceTankDetail.nivel_actual) || 0;
    const transferido = parseFloat(computedLitersTransferidos.value);

    // Si la transferencia no es válida (negativa), no mostramos un incremento ficticio en el origen
    if (transferido <= 0) return origenAntes.toFixed(2);

    return (origenAntes - transferido).toFixed(2);
  });

  // --- MÉTODOS DE CÁLCULO ---
  function calculate() {
    if (!props.destinationTankDetail || calculationMode.value !== 'final' || manualEdit.final) return;

    const vara = parseFloat(formData.value.medida_vara_destino);
    const t = props.destinationTankDetail;
    const unidad = (t.unidad_medida || "CM").toUpperCase();

    let vol = 0;
    if (isNaN(vara)) {
      liters.final = 0;
      return;
    }

    if (tieneAforo.value) {
      // Normalizar aforo (sea object o array)
      let aforoData = props.destinationTankAforo || [];
      if (!Array.isArray(aforoData) && typeof aforoData === "object") {
        aforoData = Object.entries(aforoData).map(([alt, vl]) => ({
          altura: parseFloat(alt),
          volumen: parseFloat(vl)
        }));
      }

      // Ordenar por altura para asegurar interpolación correcta
      aforoData.sort((a, b) => a.altura - b.altura);

      // Búsqueda o interpolación
      const matchExacto = aforoData.find(e => e.altura === vara);
      if (matchExacto) {
        vol = matchExacto.volumen;
      } else {
        const inf = [...aforoData].reverse().find(e => e.altura <= vara);
        const sup = aforoData.find(e => e.altura >= vara);

        if (inf && sup && inf.altura !== sup.altura) {
          vol = inf.volumen + ((vara - inf.altura) * (sup.volumen - inf.volumen)) / (sup.altura - inf.altura);
        } else if (inf) {
          vol = inf.volumen;
        } else if (sup) {
          vol = (vara / sup.altura) * sup.volumen; // aprox desde 0
        } else {
          vol = 0;
        }
      }
    } else if (isFormulaMode.value) {
      // Conversión a metros de la lectura de vara
      let h_m = vara;
      if (unidad === "CM") h_m = vara / 100;
      else if (unidad === "PULGADAS") h_m = vara * 0.0254;

      /**
       * Heurística de Escala Geométrica:
       * Si las dimensiones en la BD (largo, radio, ancho) son > 50,
       * es muy probable que estén guardadas en Centímetros, no Metros.
       * Ejemplo: Largo 4900 -> 4.9m. Radio 1150 -> 1.15m.
       */
      const normalize = (val) => {
        const n = parseFloat(val) || 0;
        return n > 50 ? n / 1000 : n; // Si > 50 asumimos milímetros o centímetros escalados
      };

      const largo_m = normalize(t.largo);
      const ancho_m = normalize(t.ancho);
      const radio_m = normalize(t.radio);
      const alto_m = normalize(t.alto);

      vol = calcularVolumenTanque(
        h_m,
        largo_m,
        t.tipo_tanque === 'CILINDRICO' ? radio_m : ancho_m,
        t.tipo_tanque,
        alto_m
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
    tieneAforo, isFormulaMode, computedLitersTransferidos, litersOrigenDespues, isTransferValid,
    calculate, calculateFinalFromAmount, startEdit, finishEdit, cancelEdit, initializeForm, resetAllStates
  };
}

import { ref, reactive, computed, watch } from "vue";
import { date, useQuasar } from "quasar";
import { calcularVolumenTanque } from "../../measurements/formula.js";
import api from "../../../api/index.js";

export function useCisternLoadForm(props, emit) {
  const $q = useQuasar();
  const formData = ref({});
  const isInternalCistern = ref(false);
  const tipoCombustible = ref("");
  const pesoNeto = ref(null);
  const step = ref(1);

  // Estados locales para la tabla dinámica de aforo de cisterna
  const newAforoCompartimiento = ref(1);
  const newAforoAltura = ref(null);
  const newAforoVol = ref(null);

  // ARREGLO PRINCIPAL PARA MÚLTIPLES TANQUES DE DESCARGA
  const tanquesForm = ref([]);

  // Métricas globales
  const globalLiters = reactive({
    recibido: "0.00",
    faltante: "0.00",
    dif_flujo: "0.00",
  });

  // --- MÉTODOS DE TANQUES DE DESCARGA ---
  function getEmptyTanqueForm() {
    return {
      id_llenadero: null,
      id_tanque: null,
      tanksList: [], // Lista temporal de tanques basada en llenadero
      detail: null,
      aforo: {},
      tieneAforo: false,
      isFormulaMode: false,

      medida_inicial: null,
      medida_final: null,

      liters: { inicial: 0, final: 0, recibido: "0.00" },
      editing: { inicial: false, final: false },
      litersWereEdited: { inicial: false, final: false },
      originalValues: { inicial: 0, final: 0 }
    };
  }

  function addTanqueRow() {
    tanquesForm.value.push(getEmptyTanqueForm());
  }

  function removeTanqueRow(index) {
    if (tanquesForm.value.length > 1) {
      tanquesForm.value.splice(index, 1);
      calculateAll();
    } else {
      $q.notify({ type: "warning", message: "Debe haber al menos un tanque receptor." });
    }
  }

  // Cargar lista de tanques por Llenadero (aislado por tab)
  async function loadTanksListFor(index, id_llenadero) {
    try {
      const params = id_llenadero ? { id_llenadero } : {};
      const response = await api.get("/tanques/lista", { params });
      tanquesForm.value[index].tanksList = Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      $q.notify({ type: "warning", message: "Error cargando lista de tanques locales." });
    }
  }

  function handleLlenaderoChange(index, id) {
    tanquesForm.value[index].id_tanque = null;
    tanquesForm.value[index].detail = null;
    tanquesForm.value[index].aforo = {};
    tanquesForm.value[index].tieneAforo = false;
    tanquesForm.value[index].isFormulaMode = false;
    loadTanksListFor(index, id);
    calculateAll();
  }

  // Obtener aforo y detalle cuando se seleccione un tanque
  async function handleTanqueChange(index, id_tanque) {
    if (!id_tanque) {
      tanquesForm.value[index].detail = null;
      return;
    }
    try {
      const response = await api.get(`/tanques/${id_tanque}`);
      const tankData = response.data;

      // El campo real en el modelo Tanque es "aforo" (JSONB), no "tabla_aforo"
      const aforoRaw = tankData.aforo ?? tankData.tabla_aforo ?? null;
      let aforoData = aforoRaw;
      if (typeof aforoRaw === "string") {
        try { aforoData = JSON.parse(aforoRaw); } catch (e) { aforoData = {}; }
      }
      aforoData = aforoData || {};

      const hasAforo = Array.isArray(aforoData)
        ? aforoData.length > 0
        : (aforoData && Object.keys(aforoData).length > 0);

      const L = parseFloat(tankData.largo) || 0;
      const W = parseFloat(tankData.ancho) || 0;
      const H = parseFloat(tankData.alto) || 0;
      const R = parseFloat(tankData.radio) || 0;

      let formulaMode = false;
      if (!hasAforo) {
        if (tankData.tipo_tanque === "RECTANGULAR" || tankData.tipo_tanque === "CUADRADO") {
          formulaMode = L > 0 && W > 0 && H > 0;
        } else {
          formulaMode = L > 0 && R > 0;
        }
      }

      tanquesForm.value[index].detail = tankData;
      tanquesForm.value[index].aforo = aforoData;
      tanquesForm.value[index].tieneAforo = hasAforo;
      tanquesForm.value[index].isFormulaMode = formulaMode;

      calculateAll();
    } catch (error) {
      $q.notify({ type: "negative", message: "Error cargando el aforo de ese tanque." });
    }
  }

  // --- MÉTODOS DE CÁLCULO ---
  function calculateTank(index) {
    const tq = tanquesForm.value[index];
    if (!tq.detail) return;

    const medIni = tq.medida_inicial;
    const medFin = tq.medida_final;
    const unidad = (tq.detail.unidad_medida || "CM").toUpperCase();

    const getVol = (medida) => {
      const m = parseFloat(medida);
      if (isNaN(m)) return 0;

      if (tq.tieneAforo) {
        // Normalizar aforo a Array de objetos {altura, volumen}
        let aforoArr = [];
        if (Array.isArray(tq.aforo)) {
          aforoArr = tq.aforo.map((e) => ({ altura: parseFloat(e.altura), volumen: parseFloat(e.volumen) }));
        } else if (tq.aforo && typeof tq.aforo === "object") {
          aforoArr = Object.entries(tq.aforo).map(([k, v]) => ({ altura: parseFloat(k), volumen: parseFloat(v) }));
        }

        if (aforoArr.length === 0) return 0;

        // Ordenar por altura ascendente
        aforoArr.sort((a, b) => a.altura - b.altura);

        // Coincidencia exacta (tolerancia flotante pequeña)
        const exact = aforoArr.find((e) => Math.abs(e.altura - m) < 0.0001);
        if (exact) return exact.volumen;

        // Si está fuera del rango de la tabla
        if (m <= aforoArr[0].altura) return aforoArr[0].volumen;
        if (m >= aforoArr[aforoArr.length - 1].altura) return aforoArr[aforoArr.length - 1].volumen;

        // Interpolación lineal entre los dos puntos más cercanos
        let lower = null, upper = null;
        for (let i = 0; i < aforoArr.length - 1; i++) {
          if (aforoArr[i].altura <= m && aforoArr[i + 1].altura >= m) {
            lower = aforoArr[i];
            upper = aforoArr[i + 1];
            break;
          }
        }

        if (lower && upper) {
          const ratio = (m - lower.altura) / (upper.altura - lower.altura);
          return lower.volumen + ratio * (upper.volumen - lower.volumen);
        }

        return 0;

      } else if (tq.isFormulaMode) {
        const scale = unidad === "PULGADAS" || unidad === "PULG" ? 0.0254 : unidad === "M" || unidad === "METROS" || unidad === "MTS" ? 1 : unidad === "MM" ? 0.001 : 0.01;
        const h_m = m * scale;
        try {
          if (tq.detail.tipo_tanque === "RECTANGULAR" || tq.detail.tipo_tanque === "CUADRADO") {
            const largo_m = parseFloat(tq.detail.largo) * scale;
            const ancho_m = parseFloat(tq.detail.ancho) * scale;
            const alto_m = parseFloat(tq.detail.alto) * scale;
            return calcularVolumenTanque(h_m, largo_m, ancho_m, tq.detail.tipo_tanque, alto_m);
          } else {
            const largo_m = parseFloat(tq.detail.largo) * scale;
            const radio_m = parseFloat(tq.detail.radio) * scale;
            return calcularVolumenTanque(h_m, largo_m, radio_m, "CILINDRICO");
          }
        } catch (e) {
          return m;
        }
      }
      return m;
    };

    if (!tq.litersWereEdited.inicial) tq.liters.inicial = parseFloat(getVol(medIni).toFixed(2));
    if (!tq.litersWereEdited.final) tq.liters.final = parseFloat(getVol(medFin).toFixed(2));

    const ini = parseFloat(tq.liters.inicial) || 0;
    const fin = parseFloat(tq.liters.final) || 0;
    // La medida de aforo final determina la cantidad total independiente de la inicial
    tq.liters.recibido = fin >= 0 ? fin.toFixed(2) : "0.00";
  }

  function calculateAll() {
    let globalTotalRecibido = 0;

    // Calcular cada tanque individual
    for (let i = 0; i < tanquesForm.value.length; i++) {
      calculateTank(i);
      globalTotalRecibido += parseFloat(tanquesForm.value[i].liters.recibido || 0);
    }

    // Calcular métricas globales de la cabecera
    globalLiters.recibido = globalTotalRecibido.toFixed(2);

    const guia = parseFloat(formData.value.litros_segun_guia) || 0;
    const flujo = parseFloat(formData.value.litros_flujometro);

    globalLiters.faltante = (guia - globalTotalRecibido).toFixed(2);

    if (flujo !== null && flujo !== "" && !isNaN(flujo)) {
      globalLiters.dif_flujo = (globalTotalRecibido - flujo).toFixed(2);
    } else {
      globalLiters.dif_flujo = "0.00";
    }
  }

  function startEditTank(index, field) {
    const tq = tanquesForm.value[index];
    tq.originalValues[field] = tq.liters[field];
    tq.editing[field] = true;
  }

  function finishEditTank(index, field) {
    const tq = tanquesForm.value[index];
    tq.editing[field] = false;
    if (tq.liters[field] === null || tq.liters[field] === "" || isNaN(tq.liters[field])) {
      tq.liters[field] = 0;
    }
    tq.liters[field] = parseFloat(parseFloat(tq.liters[field]).toFixed(2));
    if (tq.liters[field] !== tq.originalValues[field]) {
      tq.litersWereEdited[field] = true;
    }
    calculateAll();
  }

  function cancelEditTank(index, field) {
    const tq = tanquesForm.value[index];
    tq.liters[field] = tq.originalValues[field];
    tq.editing[field] = false;
    calculateAll();
  }

  function calcularPesoNeto() {
    const entrada = parseFloat(formData.value.peso_entrada) || 0;
    const salida = parseFloat(formData.value.peso_salida) || 0;
    pesoNeto.value = entrada && salida ? entrada - salida : null;
  }

  // --- MÉTODOS AFORO DE CISTERNA ---
  function addAforoRow() {
    const comp = parseInt(newAforoCompartimiento.value);
    const alt = parseFloat(newAforoAltura.value);
    const vol = parseFloat(newAforoVol.value);

    if (isNaN(comp) || isNaN(alt) || isNaN(vol) || comp <= 0 || alt < 0 || vol <= 0) return;

    if (!formData.value.aforo_compartimiento) formData.value.aforo_compartimiento = [];
    formData.value.aforo_compartimiento.push({ compartimiento: comp, altura_cm: alt, volumen_litros: vol });
    formData.value.aforo_compartimiento.sort((a, b) => {
      if (a.compartimiento !== b.compartimiento) return a.compartimiento - b.compartimiento;
      return a.altura_cm - b.altura_cm;
    });
    newAforoAltura.value = null;
    newAforoVol.value = null;
  }

  function removeAforoRow(index) {
    if (formData.value.aforo_compartimiento) formData.value.aforo_compartimiento.splice(index, 1);
  }

  const totalAforoCisterna = computed(() => {
    if (!formData.value.aforo_compartimiento) return 0;
    return formData.value.aforo_compartimiento.reduce((acc, row) => acc + (parseFloat(row.volumen_litros) || 0), 0);
  });

  const tiempoTotalDescargaMinutos = computed(() => {
    const hrIni = formData.value.hora_inicio_descarga;
    const hrFin = formData.value.hora_fin_descarga;
    if (!hrIni || !hrFin) return 0;

    const [h1, m1] = hrIni.split(":").map(Number);
    const [h2, m2] = hrFin.split(":").map(Number);
    let totalIni = h1 * 60 + m1;
    let totalFin = h2 * 60 + m2;
    if (totalFin < totalIni) totalFin += 24 * 60;

    return totalFin - totalIni;
  });

  async function initializeForm() {
    step.value = 1;
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
      litros_segun_guia: init.litros_segun_guia || null,
      litros_flujometro: init.litros_flujometro || null,
      fuente_actualizacion: init.fuente_actualizacion || "VARILLAJE",
      peso_entrada: init.peso_entrada || null,
      peso_salida: init.peso_salida || null,
      hora_inicio_descarga: init.hora_inicio_descarga || "08:00",
      hora_fin_descarga: init.hora_fin_descarga || "09:00",
      observacion: init.observacion || "",
      aforo_compartimiento: init.aforo_compartimiento ? (typeof init.aforo_compartimiento === 'string' ? JSON.parse(init.aforo_compartimiento) : init.aforo_compartimiento) : [],
    };

    isInternalCistern.value = formData.value.numero_guia === "cisterna interna";

    // Cargar tanques
    tanquesForm.value = [];
    if (init.tanques_descarga && init.tanques_descarga.length > 0) {
      // Reconstruir modo edición desde la bd
      for (const t of init.tanques_descarga) {
        const tq = getEmptyTanqueForm();
        tq.id_tanque = t.id_tanque;
        tq.medida_inicial = t.medida_inicial;
        tq.medida_final = t.medida_final;
        tq.liters.inicial = parseFloat(t.litros_iniciales || 0);
        tq.liters.final = parseFloat(t.litros_finales || 0);
        tq.liters.recibido = parseFloat(t.litros_recibidos || 0).toFixed(2);
        tq.litersWereEdited = { inicial: true, final: true };
        tanquesForm.value.push(tq);
      }
    } else if (init.id_tanque) {
      // Reconstruir desde legacy database
      const tq = getEmptyTanqueForm();
      tq.id_tanque = init.id_tanque;
      tq.medida_inicial = init.medida_inicial;
      tq.medida_final = init.medida_final;
      tq.liters.inicial = parseFloat(init.litros_iniciales || 0);
      tq.liters.final = parseFloat(init.litros_finales || 0);
      tq.liters.recibido = parseFloat(init.litros_recibidos || 0).toFixed(2);
      tq.litersWereEdited = { inicial: true, final: true };
      tanquesForm.value.push(tq);
    } else {
      // Nuevo modal
      tanquesForm.value.push(getEmptyTanqueForm());
      // Precargar initial states para el primer tanque vacio asi se muestran desde base
      if (props.tanksList && props.tanksList.length > 0) {
        tanquesForm.value[0].tanksList = [...props.tanksList];
      } else {
        loadTanksListFor(0, null);
      }
    }

    // Inicializar sub-detalles silenciosa y asyncrómamente
    tanquesForm.value.forEach((tf, index) => {
      if (tf.id_tanque) handleTanqueChange(index, tf.id_tanque);
    });

    calculateAll();
    calcularPesoNeto();
  }

  // Si el usuario vacía el flujómetro, forzamos regresar a varillaje
  watch(() => formData.value.litros_flujometro, (newVal) => {
    if (!newVal || parseFloat(newVal) <= 0) {
      formData.value.fuente_actualizacion = "VARILLAJE";
    }
  });

  // --- ANÁLISIS DE CONSISTENCIA Y VARIACIONES ---
  function calcularEstadoDiferencia(litrosBase, litrosComparar) {
    if (!litrosBase || !litrosComparar || litrosBase <= 0) return { diffLiters: 0, diffPercent: 0, color: "positive", icon: "check_circle" };

    const diff = litrosComparar - litrosBase;
    const percent = (Math.abs(diff) / litrosBase) * 100;

    let color = "positive";
    let icon = "check_circle"; // Check circle for positive matching

    if (percent > 1.0) { color = "negative"; icon = "error"; }
    else if (percent > 0.5) { color = "warning"; icon = "warning"; }

    return { diffLiters: diff.toFixed(2), diffPercent: percent.toFixed(2), color, icon };
  }

  const analysis = computed(() => {
    const volGuia = parseFloat(formData.value.litros_segun_guia) || 0;
    const volAforo = totalAforoCisterna.value;
    const volReal = parseFloat(globalLiters.recibido) || 0;
    const volFlujo = parseFloat(formData.value.litros_flujometro) || 0;

    return {
      guiaVsAforo: calcularEstadoDiferencia(volGuia, volAforo),
      guiaVsReal: calcularEstadoDiferencia(volGuia, volReal),
      realVsFlujo: volFlujo > 0 ? calcularEstadoDiferencia(volReal, volFlujo) : null
    };
  });

  return {
    formData, isInternalCistern, tipoCombustible, pesoNeto, step,
    tanquesForm, globalLiters, addTanqueRow, removeTanqueRow,
    handleLlenaderoChange, handleTanqueChange, loadTanksListFor,
    calculateAll, calculateTank, startEditTank, finishEditTank, cancelEditTank,
    calcularPesoNeto, initializeForm,
    newAforoCompartimiento, newAforoAltura, newAforoVol, addAforoRow, removeAforoRow, totalAforoCisterna, tiempoTotalDescargaMinutos,
    analysis
  };
}

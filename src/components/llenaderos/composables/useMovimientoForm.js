import { ref, computed, watch } from "vue";
import { useQuasar, date } from "quasar";
import { useMovimientoLlenaderoStore } from "../../../stores/movimientoLlenaderoStore";

export function useMovimientoForm(emit) {
  const $q = useQuasar();
  const store = useMovimientoLlenaderoStore();

  const formData = ref({
    tipo_movimiento: "CARGA", // Default
    id_llenadero: null,
    cantidad: "",
    observacion: "",
    fecha_movimiento: date.formatDate(new Date(), "YYYY/MM/DD HH:mm"),
    // Campos condicionales (Carga)
    numero_factura: "",
    litros_factura: "",
    datos_gandola: "",
    nombre_conductor: "",
    cedula_conductor: ""
  });

  const selectedLlenaderoObj = computed(() => {
    return store.llenaderoOptions.find(l => l.id_llenadero === formData.value.id_llenadero) || null;
  });

  // Cálculos de Proyección
  const currentStock = computed(() => {
    return selectedLlenaderoObj.value ? parseFloat(selectedLlenaderoObj.value.disponibilidadActual || 0) : 0;
  });

  const capacity = computed(() => {
    return selectedLlenaderoObj.value ? parseFloat(selectedLlenaderoObj.value.capacidad || 0) : 0;
  });

  const inputAmount = computed(() => {
    const val = parseFloat(formData.value.cantidad);
    return isNaN(val) ? 0 : val;
  });

  const newStock = computed(() => {
    if (!selectedLlenaderoObj.value) return 0;

    if (formData.value.tipo_movimiento === "CARGA") {
      return currentStock.value + inputAmount.value;
    } else {
      return currentStock.value - inputAmount.value;
    }
  });

  const currentPercentage = computed(() => {
    if (capacity.value === 0) return 0;
    return (currentStock.value / capacity.value) * 100;
  });

  const percentage = computed(() => {
    if (capacity.value === 0) return 0;
    return (newStock.value / capacity.value) * 100;
  });

  // Validaciones
  const isValid = computed(() => {
    if (!formData.value.id_llenadero) return false;
    if (inputAmount.value <= 0) return false;
    if (!formData.value.observacion) return false;

    // Validaciones lógicas de stock
    if (formData.value.tipo_movimiento === "CARGA") {
      if (newStock.value > capacity.value) return false; // Excede capacidad
      // Campos requeridos para Carga
      if (!formData.value.numero_factura || !formData.value.datos_gandola ||
        !formData.value.nombre_conductor || !formData.value.cedula_conductor) return false;
    } else {
      // Evaporación
      if (newStock.value < 0) return false; // Stock negativo
    }

    return true;
  });

  function resetForm() {
    formData.value = {
      tipo_movimiento: "CARGA",
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

  async function submit() {
    if (!isValid.value) return;

    // Confirmación visual
    $q.dialog({
      title: "Confirmar Movimiento",
      message: `<div class="text-center">
                  ¿Está seguro de registrar este movimiento?<br/>
                  <b>Nuevo Stock: ${newStock.value} Lts</b><br/><br/>
                  <span class="text-negative text-weight-bold">ADVERTENCIA: Una vez almacenado, el registro no podrá ser modificado.</span>
                </div>`,
      html: true,
      cancel: true,
      persistent: true
    }).onOk(async () => {
      const success = await store.createMovimiento(formData.value);
      if (success) {
        emit("save");
        emit("update:modelValue", false);
      }
    });
  }

  return {
    formData,
    selectedLlenaderoObj,
    currentStock,
    currentPercentage,
    capacity,
    newStock,
    percentage,
    isValid,
    resetForm,
    submit
  };
}

import { ref, computed } from "vue";
import { useQuasar, date } from "quasar";

export function useDispatchForm(emit) {
  const $q = useQuasar();
  const formRef = ref(null);
  const currentStep = ref(1);

  const isMobile = computed(() => $q.screen.lt.md);

  const destinoOptions = [
    { label: "Vehículo", value: "VEHICULO", icon: "directions_car" },
    { label: "Bidón", value: "BIDON", icon: "inventory_2" },
  ];

  const rules = {
    required: (val) => !!val || "Campo requerido",
    positive: (val) => val > 0 || "Debe ser mayor a 0",
    ticketLength: (val) =>
      (val && val.length === 5) || "Completa los 5 números",
  };

  function getInitialFormData() {
    const now = new Date();
    return {
      numero_ticket: "",
      fecha: date.formatDate(now, "YYYY-MM-DD"),
      hora: date.formatDate(now, "HH:mm"),
      id_dispensador: null,
      cantidad_solicitada: null,
      cantidad_despachada: null,
      tipo_destino: "VEHICULO",
      id_vehiculo: null,
      id_chofer: null,
      id_gerencia: null,
      id_almacenista: null,
      observacion: "",
    };
  }

  const formData = ref(getInitialFormData());

  function resetDestinoFields() {
    formData.value.id_vehiculo = null;
    formData.value.id_chofer = null;
    formData.value.id_gerencia = null;
  }

  function selectDestino(value) {
    formData.value.tipo_destino = value;
    resetDestinoFields();
  }

  async function nextStep() {
    currentStep.value++;
  }

  async function onSave() {
    const valid = await formRef.value?.validate();
    if (valid) {
      emit("save", { ...formData.value });
    }
  }

  function resetForm() {
    currentStep.value = 1;
    formData.value = getInitialFormData();
  }

  return {
    formRef,
    formData,
    currentStep,
    isMobile,
    destinoOptions,
    rules,
    resetDestinoFields,
    selectDestino,
    nextStep,
    onSave,
    resetForm,
  };
}

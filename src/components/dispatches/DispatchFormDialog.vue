<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
    :maximized="isMobile"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="dispatch-dialog" :class="{ 'fullscreen-card': isMobile }">
      <!-- HEADER -->
      <DispatchHeader
        :is-mobile="isMobile"
        :current-step="currentStep"
        @close="emit('update:modelValue', false)"
      />

      <q-separator />

      <div class="q-px-md q-pt-sm" v-if="currentStep === 1">
        <q-btn
          color="primary"
          icon="camera_alt"
          label="Escanear Ticket"
          class="full-width"
          outline
          @click="showCamera = true"
        />
      </div>

      <!-- FORMULARIO ÚNICO ADAPTATIVO -->
      <q-form ref="formRef" @submit.prevent="onSave" class="form-container">
        <q-card-section class="scroll-area q-pa-md q-pa-lg-md">
          <!-- SECCIÓN 1: DATOS DE OPERACIÓN -->
          <DispatchOperationSection
            :form-data="formData"
            :is-mobile="isMobile"
            :current-step="currentStep"
            :rules="rules"
            :dispensers-list="dispensersList"
          />

          <!-- SECCIÓN 2: DESTINO Y BENEFICIARIO -->
          <DispatchDestinationSection
            :form-data="formData"
            :is-mobile="isMobile"
            :current-step="currentStep"
            :rules="rules"
            :destino-options="destinoOptions"
            :vehicle-options="vehicleOptions"
            :driver-options="driverOptions"
            :managements-list="managementsList"
            :get-vehicle-label="getVehicleLabel"
            :get-driver-label="getDriverLabel"
            @reset-destino-fields="resetDestinoFields"
            @select-destino="selectDestino"
            @filter-vehicles="filterVehicles"
            @filter-drivers="filterDrivers"
          />

          <!-- SECCIÓN 3: RESPONSABLE -->
          <DispatchResponsibleSection
            :form-data="formData"
            :is-mobile="isMobile"
            :current-step="currentStep"
            :rules="rules"
            :warehouseman-options="warehousemanOptions"
            :get-warehouseman-label="getWarehousemanLabel"
            @filter-warehousemen="filterWarehousemen"
          />

          <!-- Spacer para scroll -->
          <div :style="{ height: isMobile ? '100px' : '24px' }" />
        </q-card-section>

        <!-- FOOTER / NAVEGACIÓN -->
        <DispatchFooter
          :is-mobile="isMobile"
          :current-step="currentStep"
          @close="emit('update:modelValue', false)"
          @next="nextStep"
          @prev="currentStep--"
        />
      </q-form>

      <!-- Diálogo de Cámara -->
      <q-dialog
        v-model="showCamera"
        maximized
        transition-show="slide-up"
        transition-hide="slide-down"
      >
        <CameraCapture @capture="handleCapture" />
      </q-dialog>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { watch, ref } from "vue";
import { useQuasar } from "quasar";

// Componentes
import CameraCapture from "../CameraCapture.vue";
import { useDispatchOCR } from "./composables/useDispatchOCR.js";
import DispatchHeader from "./form-sections/DispatchHeader.vue";
import DispatchOperationSection from "./form-sections/DispatchOperationSection.vue";
import DispatchDestinationSection from "./form-sections/DispatchDestinationSection.vue";
import DispatchResponsibleSection from "./form-sections/DispatchResponsibleSection.vue";
import DispatchFooter from "./form-sections/DispatchFooter.vue";

// Composables
import { useDispatchForm } from "./composables/useDispatchForm.js";
import { useDispatchFilters } from "./composables/useDispatchFilters.js";

const $q = useQuasar();

const props = defineProps({
  modelValue: Boolean,
  isEditing: { type: Boolean, default: false },
  initialData: { type: Object, default: null },
  dispensersList: { type: Array, default: () => [] },
  vehiclesList: { type: Array, default: () => [] },
  driversList: { type: Array, default: () => [] },
  managementsList: { type: Array, default: () => [] },
  warehousemenList: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue", "save"]);

// 1. Filtros
const {
  vehicleOptions,
  driverOptions,
  warehousemanOptions,
  filterVehicles,
  filterDrivers,
  filterWarehousemen,
  getVehicleLabel,
  getDriverLabel,
  getWarehousemanLabel,
} = useDispatchFilters(props);

// 2. Form
const {
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
} = useDispatchForm(emit);

// OCR Integration
const showCamera = ref(false);

const { processTicketBlob } = useDispatchOCR(formData, props, {
  resetDestinoFields,
  setVehicleOptions: (list) => {
    vehicleOptions.value = list;
  },
  setDriverOptions: (list) => {
    driverOptions.value = list;
  },
  setWarehousemanOptions: (list) => {
    warehousemanOptions.value = list;
  },
  notify: $q.notify,
});

const handleCapture = async (imageBlob) => {
  showCamera.value = false;

  $q.loading.show({
    message: "Procesando imagen con OCR...",
    boxClass: "bg-grey-2 text-grey-9",
    spinnerColor: "primary",
  });

  try {
    await processTicketBlob(imageBlob);
  } finally {
    $q.loading.hide();
  }
};

// Watchers
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      if (props.isEditing && props.initialData) {
        // Mapeo de datos para edición
        const d = props.initialData;
        formData.value = {
          id_despacho: d.id_despacho,
          numero_ticket: d.numero_ticket,
          fecha: d.fecha_hora.split("T")[0],
          hora: d.fecha_hora.split("T")[1].substring(0, 5),
          id_dispensador: d.id_dispensador,
          cantidad_solicitada: d.cantidad_solicitada,
          cantidad_despachada: d.cantidad_despachada,
          tipo_destino: d.tipo_destino,
          id_vehiculo: d.id_vehiculo,
          id_chofer: d.id_chofer,
          id_gerencia: d.id_gerencia,
          id_almacenista: d.id_almacenista,
          observacion: d.observacion,
        };
        currentStep.value = 1;
      } else {
        resetForm();
      }
      vehicleOptions.value = [...props.vehiclesList];
      driverOptions.value = [...props.driversList];
      warehousemanOptions.value = [...props.warehousemenList];
    }
  }
);

watch(
  () => props.vehiclesList,
  (list) => {
    if (props.modelValue && list) vehicleOptions.value = [...list];
  },
  { deep: true }
);

watch(
  () => props.driversList,
  (list) => {
    if (props.modelValue && list) driverOptions.value = [...list];
  },
  { deep: true }
);

watch(
  () => props.warehousemenList,
  (list) => {
    if (props.modelValue && list) warehousemanOptions.value = [...list];
  },
  { deep: true }
);
</script>

<style lang="scss" scoped>
.dispatch-dialog {
  width: 950px;
  max-width: 95vw;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.fullscreen-card {
  width: 100% !important;
  max-width: 100% !important;
  max-height: 100% !important;
  height: 100%;
  border-radius: 0 !important;
}

.form-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.scroll-area {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f5f5f5;
  }

  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 4px;

    &:hover {
      background: #999;
    }
  }
}

.body--dark {
  .scroll-area::-webkit-scrollbar-track {
    background: var(--q-dark);
  }
}
</style>

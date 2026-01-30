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

      <!-- FORMULARIO ÚNICO ADAPTATIVO -->
      <q-form ref="formRef" @submit.prevent="onSave" class="form-container">
        <!-- Input oculto para OCR -->
        <input
          type="file"
          ref="fileInputRef"
          accept="image/*"
          capture="environment"
          class="hidden"
          @change="handleFileUpload"
        />

        <q-card-section class="scroll-area q-pa-md q-pa-lg-md">
          <!-- SECCIÓN 1: DATOS DE OPERACIÓN -->
          <DispatchOperationSection
            :form-data="formData"
            :is-mobile="isMobile"
            :current-step="currentStep"
            :rules="rules"
            :is-scanning="isScanning"
            :dispensers-list="dispensersList"
            @trigger-scan="triggerScan"
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
    </q-card>
  </q-dialog>
</template>

<script setup>
import { watch, onUnmounted } from "vue";
import { useQuasar } from "quasar";

// Componentes
import DispatchHeader from "./form-sections/DispatchHeader.vue";
import DispatchOperationSection from "./form-sections/DispatchOperationSection.vue";
import DispatchDestinationSection from "./form-sections/DispatchDestinationSection.vue";
import DispatchResponsibleSection from "./form-sections/DispatchResponsibleSection.vue";
import DispatchFooter from "./form-sections/DispatchFooter.vue";

// Composables
import { useDispatchForm } from "./composables/useDispatchForm.js";
import { useDispatchOCR } from "./composables/useDispatchOCR.js";
import { useDispatchFilters } from "./composables/useDispatchFilters.js";

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════════
const $q = useQuasar();

const props = defineProps({
  modelValue: Boolean,
  dispensersList: { type: Array, default: () => [] },
  vehiclesList: { type: Array, default: () => [] },
  driversList: { type: Array, default: () => [] },
  managementsList: { type: Array, default: () => [] },
  warehousemenList: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue", "save"]);

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSABLES
// ═══════════════════════════════════════════════════════════════════════════

// 1. Filtros y Labels
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

// 2. Estado del Formulario
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

// 3. OCR / Escaneo
const {
  isScanning,
  fileInputRef,
  triggerScan,
  handleFileUpload,
  terminate,
  initWorker,
} = useDispatchOCR(formData, props, {
  resetDestinoFields,
  updateVehicleOptions: (val) => {
    vehicleOptions.value = val;
  },
  updateDriverOptions: (val) => {
    driverOptions.value = val;
  },
  notify: $q.notify,
});

// ═══════════════════════════════════════════════════════════════════════════
// WATCHERS
// ═══════════════════════════════════════════════════════════════════════════

// Cuando se abre/cierra el diálogo
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      // Resetear formulario
      resetForm();

      // Inicializar listas de opciones
      vehicleOptions.value = [...props.vehiclesList];
      driverOptions.value = [...props.driversList];
      warehousemanOptions.value = [...props.warehousemenList];

      // Pre-cargar OCR worker en background (opcional pero mejora UX)
      initWorker?.().catch((err) => {
        console.warn("No se pudo pre-cargar OCR:", err.message);
      });
    }
  }
);

// Sincronizar cuando las props cambian
watch(
  () => props.vehiclesList,
  (list) => {
    if (props.modelValue && list) {
      vehicleOptions.value = [...list];
    }
  },
  { deep: true }
);

watch(
  () => props.driversList,
  (list) => {
    if (props.modelValue && list) {
      driverOptions.value = [...list];
    }
  },
  { deep: true }
);

watch(
  () => props.warehousemenList,
  (list) => {
    if (props.modelValue && list) {
      warehousemanOptions.value = [...list];
    }
  },
  { deep: true }
);

// ═══════════════════════════════════════════════════════════════════════════
// CLEANUP
// ═══════════════════════════════════════════════════════════════════════════
onUnmounted(() => {
  // Liberar recursos del worker OCR
  terminate?.();
});
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

// Dark mode
.body--dark {
  .scroll-area::-webkit-scrollbar-track {
    background: var(--q-dark);
  }
}
</style>

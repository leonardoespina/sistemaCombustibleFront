<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
<<<<<<< HEAD
    <q-card style="width: 600px; max-width: 80vw">
=======
    <q-card style="width: 500px; max-width: 80vw">
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
      <q-card-section>
        <div class="text-h6">
          {{ isEditing ? "Editar Subdependencia" : "Nueva Subdependencia" }}
        </div>
      </q-card-section>

      <q-form @submit.prevent="onSave" class="q-gutter-md">
        <q-card-section>
          <q-select
            dense
            v-model="formData.id_dependencia"
            :options="dependenciaOptions"
            option-value="id_dependencia"
            option-label="nombre_dependencia"
            label="Dependencia"
            emit-value
            map-options
            :rules="[(val) => !!val || 'Requerido']"
<<<<<<< HEAD
            @update:model-value="onDependenciaChange"
=======
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
          />
          <q-input
            dense
            v-model="formData.nombre"
            label="Nombre"
            :rules="[(val) => !!val || 'Requerido']"
          />
<<<<<<< HEAD
          
          <!-- Campos condicionales según tipo de venta -->
          <div v-if="dependenciaSeleccionada" class="q-mt-md">
            <div class="text-subtitle2 q-mb-sm">
              Tipo de venta: <strong>{{ dependenciaSeleccionada.tipo_venta }}</strong>
            </div>
            
            <!-- Campos obligatorios para tipo VENTA -->
            <div v-if="dependenciaSeleccionada.tipo_venta === 'VENTA'">
              <q-input
                dense
                v-model="formData.ubicacion"
                label="Ubicación *"
                :rules="[
                  (val) => !!val || 'La ubicación es obligatoria para tipo de venta VENTA',
                  (val) => val.trim().length > 0 || 'La ubicación no puede estar vacía'
                ]"
              />
              <q-input
                dense
                v-model="formData.responsable"
                label="Responsable *"
                :rules="[
                  (val) => !!val || 'El responsable es obligatorio para tipo de venta VENTA',
                  (val) => val.trim().length > 0 || 'El responsable no puede estar vacío'
                ]"
              />
              <q-input
                dense
                v-model="formData.cedula_rif"
                label="Cédula/RIF *"
                :rules="[
                  (val) => !!val || 'La cédula/RIF es obligatoria para tipo de venta VENTA',
                  (val) => val.trim().length > 0 || 'La cédula/RIF no puede estar vacía'
                ]"
              />
              <!-- Bandera de cobro para tipo VENTA (siempre activa) -->
              <q-toggle
                v-model="formData.cobra_venta"
                label="Cobrar venta (siempre activo para tipo VENTA)"
                disable
                class="q-mt-sm"
              />
            </div>
            
            <!-- Campos opcionales para tipo AMBOS con selección de cobro -->
            <div v-else-if="dependenciaSeleccionada.tipo_venta === 'AMBOS'">
              <!-- Selección de cobro para tipo AMBOS -->
              <div class="q-mt-sm">
                <div class="text-caption q-mb-xs">¿Desea agregar información fiscal y cobrar la venta?</div>
                <q-option-group
                  v-model="formData.cobra_venta"
                  :options="[
                    { label: 'Sí, agregar información fiscal y cobrar', value: true },
                    { label: 'No, no cobrar la venta', value: false }
                  ]"
                  color="primary"
                  inline
                />
              </div>

              <!-- Campos condicionales según la selección de cobro -->
              <div v-if="formData.cobra_venta" class="q-mt-md">
                <div class="text-subtitle2 q-mb-sm">Información fiscal requerida:</div>
                <q-input
                  dense
                  v-model="formData.ubicacion"
                  label="Ubicación *"
                  :rules="[
                    (val) => !!val || 'La ubicación es obligatoria cuando se cobra venta',
                    (val) => val.trim().length > 0 || 'La ubicación no puede estar vacía'
                  ]"
                />
                <q-input
                  dense
                  v-model="formData.responsable"
                  label="Responsable *"
                  :rules="[
                    (val) => !!val || 'El responsable es obligatorio cuando se cobra venta',
                    (val) => val.trim().length > 0 || 'El responsable no puede estar vacío'
                  ]"
                />
                <q-input
                  dense
                  v-model="formData.cedula_rif"
                  label="Cédula/RIF *"
                  :rules="[
                    (val) => !!val || 'La cédula/RIF es obligatoria cuando se cobra venta',
                    (val) => val.trim().length > 0 || 'La cédula/RIF no puede estar vacía'
                  ]"
                />
              </div>
            </div>
            
            <!-- No mostrar campos para tipo INSTITUCIONAL -->
            <div v-else-if="dependenciaSeleccionada.tipo_venta === 'INSTITUCIONAL'" class="text-caption text-grey">
              No se requieren campos adicionales para tipo de venta INSTITUCIONAL.
              <q-toggle
                v-model="formData.cobra_venta"
                label="Cobrar venta (siempre desactivado para tipo INSTITUCIONAL)"
                disable
                class="q-mt-sm"
              />
            </div>
          </div>

=======
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
          <q-select
            v-if="isEditing"
            dense
            v-model="formData.estatus"
            :options="['ACTIVO', 'INACTIVO']"
            label="Estatus"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn flat label="Guardar" type="submit" color="primary" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
<<<<<<< HEAD
import { ref, watch, onMounted, onUnmounted, computed } from "vue";
=======
import { ref, watch, onMounted, onUnmounted } from "vue";
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
import { useDependenciaStore } from "../../stores/dependenciaStore.js";
import { storeToRefs } from "pinia";

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
  isEditing: Boolean,
});

const emit = defineEmits(["update:modelValue", "save"]);

const dependenciaStore = useDependenciaStore();
const { rows: dependenciaOptions } = storeToRefs(dependenciaStore);

const formData = ref({});
<<<<<<< HEAD
const dependenciaSeleccionada = ref(null);
=======
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d

onMounted(() => {
    dependenciaStore.fetchDependencias();
    dependenciaStore.initSocket();
});

onUnmounted(() => {
    dependenciaStore.cleanupSocket();
});

<<<<<<< HEAD
// Obtener la dependencia seleccionada para mostrar el tipo de venta
const onDependenciaChange = (dependenciaId) => {
  if (dependenciaId) {
    dependenciaSeleccionada.value = dependenciaOptions.value.find(d => d.id_dependencia === dependenciaId);
  } else {
    dependenciaSeleccionada.value = null;
  }
};

// Watch para cargar datos iniciales y dependencia seleccionada
=======
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
watch(
  () => props.modelValue,
  (isNowOpen) => {
    if (isNowOpen) {
      formData.value = {
        id_dependencia: props.initialData?.id_dependencia || null,
        nombre: props.initialData?.nombre || "",
<<<<<<< HEAD
        ubicacion: props.initialData?.ubicacion || "",
        responsable: props.initialData?.responsable || "",
        cedula_rif: props.initialData?.cedula_rif || "",
        cobra_venta: props.initialData?.cobra_venta || false,
        estatus: props.initialData?.estatus || "ACTIVO",
      };
      
      // Establecer dependencia seleccionada para edición
      if (props.initialData?.id_dependencia) {
        dependenciaSeleccionada.value = dependenciaOptions.value.find(d => d.id_dependencia === props.initialData.id_dependencia);
      } else {
        dependenciaSeleccionada.value = null;
      }
=======
        estatus: props.initialData?.estatus || "ACTIVO",
      };
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
    }
  }
);

<<<<<<< HEAD
// Watch para actualizar dependencia seleccionada cuando cambien las opciones
watch(
  () => dependenciaOptions.value,
  () => {
    if (formData.value.id_dependencia) {
      dependenciaSeleccionada.value = dependenciaOptions.value.find(d => d.id_dependencia === formData.value.id_dependencia);
    }
  },
  { immediate: true }
);

=======
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
function onSave() {
  emit("save", formData.value);
}
</script>

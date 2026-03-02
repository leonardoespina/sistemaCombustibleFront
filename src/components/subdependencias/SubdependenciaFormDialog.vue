<!-- src/components/subdependencias/SubdependenciaFormDialog.vue -->
<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <q-card style="width: 600px; max-width: 80vw">
      <q-card-section>
        <div class="text-h6">
          {{ isEditing ? "Editar Subdependencia" : "Nueva Subdependencia" }}
        </div>
      </q-card-section>

      <q-form @submit.prevent="handleSave" class="q-gutter-md">
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
            :rules="validationRules.id_dependencia"
            @update:model-value="onDependenciaChange"
          />
          <q-input
            dense
            v-model="formData.nombre"
            label="Nombre"
            :rules="validationRules.nombre"
            counter
            maxlength="100"
          />

          <!-- Campos condicionales según tipo de venta -->
          <div v-if="dependenciaSeleccionada" class="q-mt-md">
            <div class="text-subtitle2 q-mb-sm">
              Tipo de venta:
              <strong>{{ dependenciaSeleccionada.tipo_venta }}</strong>
            </div>

            <!-- Campos obligatorios para tipo VENTA -->
            <div v-if="dependenciaSeleccionada.tipo_venta === 'VENTA'">
              <q-input
                dense
                v-model="formData.ubicacion"
                label="Ubicación *"
                :rules="validacionesUbicacion"
                counter
                maxlength="200"
              />
              <q-input
                dense
                v-model="formData.responsable"
                label="Responsable *"
                :rules="validacionesResponsable"
                counter
                maxlength="100"
              />
              <q-input
                dense
                v-model="formData.cedula_rif"
                label="Cédula/RIF *"
                :rules="validacionesCedulaRif"
                hint="Ej: V-12345678, J-123456789-0"
                @update:model-value="(val) => formData.cedula_rif = val?.toUpperCase()"
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
                <div class="text-caption q-mb-xs">
                  ¿Desea agregar información fiscal y cobrar la venta?
                </div>
                <q-option-group
                  v-model="formData.cobra_venta"
                  :options="[
                    {
                      label: 'Sí, agregar información fiscal y cobrar',
                      value: true,
                    },
                    { label: 'No, no cobrar la venta', value: false },
                  ]"
                  color="primary"
                  inline
                />
              </div>

              <!-- Campos condicionales según la selección de cobro -->
              <div v-if="formData.cobra_venta" class="q-mt-md">
                <div class="text-subtitle2 q-mb-sm">
                  Información fiscal requerida:
                </div>
                <q-input
                  dense
                  v-model="formData.ubicacion"
                  label="Ubicación *"
                  :rules="validacionesUbicacion"
                  counter
                  maxlength="200"
                />
                <q-input
                  dense
                  v-model="formData.responsable"
                  label="Responsable *"
                  :rules="validacionesResponsable"
                  counter
                  maxlength="100"
                />
                <q-input
                  dense
                  v-model="formData.cedula_rif"
                  label="Cédula/RIF *"
                  :rules="validacionesCedulaRif"
                  hint="Ej: V-12345678, J-123456789-0"
                  @update:model-value="(val) => formData.cedula_rif = val?.toUpperCase()"
                />
              </div>
            </div>

            <!-- No mostrar campos para tipo INSTITUCIONAL -->
            <div
              v-else-if="dependenciaSeleccionada.tipo_venta === 'INSTITUCIONAL'"
              class="text-caption text-grey"
            >
              No se requieren campos adicionales para tipo de venta
              INSTITUCIONAL.
              <q-toggle
                v-model="formData.cobra_venta"
                label="Cobrar venta (siempre desactivado para tipo INSTITUCIONAL)"
                disable
                class="q-mt-sm"
              />
            </div>
          </div>

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
import { onMounted, onUnmounted } from "vue";
import { useQuasar } from "quasar";
import { useDependenciaStore } from "../../stores/dependenciaStore.js";
import { storeToRefs } from "pinia";
import socket from "../../services/socket.js";
import { useSubdependenciaForm } from "./composables/useSubdependenciaForm.js";

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
  isEditing: Boolean,
});

const emit = defineEmits(["update:modelValue", "save"]);
const $q = useQuasar();

// Store de dependencias para el select
const dependenciaStore = useDependenciaStore();
const { rows: dependenciaOptions } = storeToRefs(dependenciaStore);

// Composable del formulario con lógica compleja
const {
  formData,
  dependenciaSeleccionada,
  validationRules,
  validacionesUbicacion,
  validacionesResponsable,
  validacionesCedulaRif,
  onDependenciaChange,
  handleSave,
} = useSubdependenciaForm(props, emit, dependenciaOptions);

// Cargar dependencias al montar
onMounted(() => {
  dependenciaStore.fetchDependencias();

  // Listeners de Socket.io para sincronización en tiempo real
  socket.on("subdependencia:creado", (data) => {
    // Notificar creación
  });

  socket.on("subdependencia:actualizado", (data) => {
    // Notificación de edición concurrente
    if (
      props.isEditing &&
      props.initialData?.id_subdependencia === data.id_subdependencia
    ) {
      $q.notify({
        type: "warning",
        message: "⚠️ Esta subdependencia fue actualizada por otro usuario",
        icon: "warning",
        position: "top",
        timeout: 4000,
        actions: [
          {
            label: "Recargar",
            color: "white",
            handler: () => {
              // Recargar datos
              emit("update:modelValue", false);
            },
          },
        ],
      });
    }
  });
});

onUnmounted(() => {
  socket.off("subdependencia:creado");
  socket.off("subdependencia:actualizado");
});
</script>

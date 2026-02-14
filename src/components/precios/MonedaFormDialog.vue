<!-- src/components/precios/MonedaFormDialog.vue -->
<template>
  <q-dialog v-model="visible" persistent>
    <q-card style="width: 500px; max-width: 80vw">
      <!-- HEADER -->
      <q-card-section class="row items-center">
        <div class="text-h6">
          {{ isEdit ? "Editar Moneda" : "Nueva Moneda" }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <!-- FORMULARIO -->
      <q-form @submit.prevent="handleSave" class="q-gutter-md">
        <q-card-section>
          <!-- Nombre de la Moneda -->
          <q-input
            v-model="formData.nombre"
            label="Nombre *"
            outlined
            dense
            hint="Ej: Dólar Americano, Bolívar Digital, Oro"
            :rules="validationRules.nombre"
            counter
            maxlength="50"
          />

          <!-- Símbolo de la Moneda -->
          <q-input
            v-model="formData.simbolo"
            label="Símbolo *"
            outlined
            dense
            hint="Ej: USD, $, Bs, Au (se convertirá a mayúsculas)"
            :rules="validationRules.simbolo"
            counter
            maxlength="5"
            class="q-mt-md"
          />
        </q-card-section>

        <!-- ACCIONES -->
        <q-card-section class="row justify-end q-pt-none">
          <q-btn
            label="Cancelar"
            color="negative"
            flat
            v-close-popup
            class="q-mr-sm"
          />
          <q-btn
            :label="isEdit ? 'Actualizar' : 'Guardar'"
            type="submit"
            color="primary"
            :loading="loading"
          />
        </q-card-section>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
// ============================================
// IMPORTS
// ============================================
import { computed, onMounted, onUnmounted } from "vue";
import { useQuasar } from "quasar";
import { usePrecioStore } from "../../stores/precioStore";
import socket from "../../services/socket.js";
import { useMonedaForm } from "./composables/useMonedaForm.js";

// ============================================
// PROPS & EMITS
// ============================================
const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
});

const emit = defineEmits(["update:modelValue", "dataUpdated"]);

// ============================================
// COMPOSABLES & STORES
// ============================================
const $q = useQuasar();
const store = usePrecioStore();

// Composable del formulario (maneja estado, validaciones, y guardado)
const { formData, validationRules, handleSave } = useMonedaForm(
  props,
  emit,
  store
);

// ============================================
// COMPUTED
// ============================================

// Control del diálogo (v-model bidireccional)
const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

// Detecta si estamos en modo edición
const isEdit = computed(() => !!props.initialData);

// Loading state del store
const loading = computed(() => store.loading);

// ============================================
// LIFECYCLE HOOKS
// ============================================

/**
 * Al montar el componente:
 * Configurar listeners de Socket.IO para sincronización en tiempo real
 */
onMounted(() => {
  // Listener para monedas creadas
  socket.on("moneda:creado", (data) => {
    emit("dataUpdated", data);
  });

  // Listener para monedas actualizadas
  // Incluye notificación de edición concurrente
  socket.on("moneda:actualizado", (data) => {
    // Si estamos editando y otro usuario modifica la misma moneda, notificar
    if (
      props.initialData?.id_moneda === data.id_moneda
    ) {
      $q.notify({
        type: "warning",
        message: `⚠️ La moneda "${data.nombre}" fue actualizada por otro usuario`,
        icon: "warning",
        position: "top",
        timeout: 4000,
        actions: [
          {
            label: "Recargar",
            color: "white",
            handler: () => {
              emit("dataUpdated", data);
            },
          },
        ],
      });
    }
    emit("dataUpdated", data);
  });
});

/**
 * Al desmontar el componente:
 * Limpiar listeners de Socket.IO para evitar memory leaks
 */
onUnmounted(() => {
  socket.off("moneda:creado");
  socket.off("moneda:actualizado");
});
</script>


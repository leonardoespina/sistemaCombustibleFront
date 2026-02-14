<!-- src/components/precios/PrecioFormDialog.vue -->
<template>
  <q-dialog v-model="visible" persistent>
    <q-card style="width: 600px; max-width: 80vw">
      <!-- HEADER -->
      <q-card-section class="row items-center">
        <div class="text-h6">
          Actualizar Precios - {{ combustibleNombre }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <!--
        FORMULARIO DINÁMICO
        Genera un campo de input por cada moneda activa en el sistema
      -->
      <q-form @submit.prevent="handleSave" class="q-gutter-md">
        <q-card-section>
          <!--
            Loop dinámico: Un input por cada moneda activa
            Ejemplo: Si hay 3 monedas (Bs, USD, Au), mostrará 3 inputs
          -->
          <div
            v-for="moneda in monedasActivas"
            :key="moneda.id_moneda"
            class="q-mb-md"
          >
            <q-input
              v-model.number="formData.precios[moneda.simbolo]"
              :label="`${moneda.nombre} (${moneda.simbolo})`"
              outlined
              dense
              type="number"
              step="0.00000001"
              min="0"
              :suffix="`${moneda.simbolo}/Litro`"
              :hint="`Precio por litro en ${moneda.nombre}`"
              :rules="validationRules.precio"
            />
          </div>

          <!--
            WARNING: Si no hay monedas activas
            El usuario debe crear al menos una moneda antes de configurar precios
          -->
          <q-banner
            v-if="monedasActivas.length === 0"
            class="bg-warning text-white"
          >
            <template v-slot:avatar>
              <q-icon name="warning" />
            </template>
            No hay monedas activas en el sistema. Crea al menos una moneda
            antes de configurar precios.
          </q-banner>
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
            label="Actualizar Precios"
            type="submit"
            color="primary"
            icon="price_change"
            :loading="loading"
            :disable="monedasActivas.length === 0"
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
import { computed } from "vue";
import { usePrecioStore } from "../../stores/precioStore";
import { usePrecioForm } from "./composables/usePrecioForm.js";

// ============================================
// PROPS & EMITS
// ============================================
const props = defineProps({
  modelValue: Boolean,
  combustibleData: Object, // { id_tipo_combustible, nombre, precios: {Bs: 50, USD: 1.2} }
});

const emit = defineEmits(["update:modelValue"]);

// ============================================
// COMPOSABLES & STORES
// ============================================
const store = usePrecioStore();

// Composable del formulario (maneja estado, monedas activas, validaciones, y guardado)
const {
  formData,
  monedasActivas,
  combustibleNombre,
  validationRules,
  handleSave,
} = usePrecioForm(props, emit, store);

// ============================================
// COMPUTED
// ============================================

// Control del diálogo (v-model bidireccional)
const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

// Loading state del store
const loading = computed(() => store.loading);
</script>


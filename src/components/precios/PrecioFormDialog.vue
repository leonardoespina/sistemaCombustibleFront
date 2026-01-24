<template>
  <q-dialog v-model="visible" persistent>
    <q-card style="min-width: 500px">
      <q-card-section class="row items-center">
        <div class="text-h6">
          Actualizar Precios - {{ combustibleNombre }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <div v-for="moneda in monedasActivas" :key="moneda.id_moneda">
            <q-input
              v-model.number="form.precios[moneda.simbolo]"
              :label="`${moneda.nombre} (${moneda.simbolo})`"
              outlined
              dense
              type="number"
              step="0.00000001"
              min="0"
              :suffix="`${moneda.simbolo}/Litro`"
              :hint="`Precio por litro en ${moneda.nombre}`"
              :rules="[
                (val) => val === null || val === undefined || val >= 0 || 'El precio no puede ser negativo'
              ]"
            />
          </div>

          <q-banner v-if="monedasActivas.length === 0" class="bg-warning text-white">
            <template v-slot:avatar>
              <q-icon name="warning" />
            </template>
            No hay monedas activas en el sistema. Crea al menos una moneda antes de configurar precios.
          </q-banner>

          <div class="row justify-end q-mt-md">
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
              :loading="loading"
              :disable="monedasActivas.length === 0"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { usePrecioStore } from "../../stores/precioStore";

const props = defineProps({
  modelValue: Boolean,
  combustibleData: Object, // { id_tipo_combustible, nombre, precios: {Bs: 50, USD: 1.2} }
});

const emit = defineEmits(["update:modelValue"]);

const store = usePrecioStore();
const loading = computed(() => store.loading);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const combustibleNombre = computed(() => props.combustibleData?.nombre || "");

// Obtener monedas activas (sin paginación, todas)
const monedasActivas = ref([]);

const form = ref({
  precios: {}, // { "Bs": 50, "USD": 1.2, "Au": 0.025 }
});

// Cargar monedas activas al montar
onMounted(async () => {
  await cargarMonedas();
});

async function cargarMonedas() {
  try {
    // Usar la instancia de axios importada o el helper de la store si existe
    // En este proyecto parece que se usa 'api' importado en las stores.
    // Intentaremos usar la store directamente si tiene el fetch o una referencia a api
    const response = await store.fetchMonedas(); // Esto actualiza store.monedas
    monedasActivas.value = store.monedas;
  } catch (error) {
    console.error("Error cargando monedas", error);
  }
}

watch(
  () => props.combustibleData,
  (val) => {
    if (val) {
      // Inicializar form con los precios actuales
      form.value.precios = { ...val.precios } || {};
    } else {
      form.value.precios = {};
    }
  },
  { immediate: true, deep: true }
);

watch(
  () => props.modelValue,
  async (val) => {
    if (val) {
      await cargarMonedas();
    }
  }
);

const onSubmit = async () => {
  const success = await store.actualizarPrecios({
    id_tipo_combustible: props.combustibleData.id_tipo_combustible,
    precios: form.value.precios,
  });

  if (success) {
    visible.value = false;
  }
};
</script>

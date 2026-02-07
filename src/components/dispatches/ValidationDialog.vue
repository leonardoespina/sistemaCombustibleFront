<template>
  <q-dialog v-model="isOpen" persistent backdrop-filter="blur(4px)">
    <q-card style="width: 450px; max-width: 95vw; border-radius: 12px">
      <q-card-section class="bg-primary text-white row items-center q-pb-none">
        <div class="text-h6">
          {{ mode === 'CONFIRMATION' ? 'Confirmar Carga Completa' : 'Reportar Diferencia' }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-sm">
        <div class="text-caption text-grey-7">
          Ticket: <span class="text-weight-bold text-primary">{{ ticket?.codigo_ticket }}</span>
        </div>
      </q-card-section>

      <q-card-section>
        <!-- MODO CONFIRMACIÓN -->
        <div v-if="mode === 'CONFIRMATION'">
          <div class="q-mb-md text-body2">
            Por favor, ingrese su contraseña para confirmar que la carga fue realizada exitosamente por la cantidad total aprobada ({{ ticket?.cantidad_litros }} Lts).
          </div>
          <q-input
            v-model="password"
            label="Contraseña de Confirmación"
            type="password"
            outlined
            dense
            autofocus
            :rules="[val => !!val || 'Contraseña requerida']"
          />
        </div>

        <!-- MODO DIFERENCIA -->
        <div v-else>
          <div class="q-mb-md text-body2 text-warning flex items-center q-gutter-x-xs">
            <q-icon name="warning" size="sm" />
            <span>Se registrará un excedente que será reintegrado al inventario.</span>
          </div>
          
          <div class="row q-col-gutter-md">
             <div class="col-12 col-sm-6">
                <q-input
                  v-model="ticket.cantidad_litros"
                  label="Cantidad Aprobada"
                  outlined
                  dense
                  readonly
                  bg-color="grey-2"
                  suffix="Lts"
                />
             </div>
             <div class="col-12 col-sm-6">
                <q-input
                  v-model.number="cantidadReal"
                  label="Cantidad Real Cargada"
                  type="number"
                  outlined
                  dense
                  autofocus
                  suffix="Lts"
                  :rules="[
                    val => val !== null && val !== '' || 'Requerido',
                    val => val < ticket.cantidad_litros || 'Debe ser menor a la aprobada'
                  ]"
                />
             </div>
          </div>

          <q-input
            v-model="observaciones"
            label="Observaciones"
            type="textarea"
            outlined
            dense
            class="q-mt-md"
            rows="3"
            :rules="[val => !!val || 'Observaciones requeridas para diferencias']"
          />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="q-pa-md q-gutter-x-sm">
        <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
        <q-btn 
          unelevated 
          color="primary" 
          :label="mode === 'CONFIRMATION' ? 'Confirmar y Finalizar' : 'Registrar Diferencia'"
          @click="onConfirm"
          :disable="!isValid"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: Boolean,
  mode: {
    type: String, // 'CONFIRMATION' | 'DIFFERENCE'
    required: true
  },
  ticket: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'confirm']);

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const password = ref('');
const cantidadReal = ref(null);
const observaciones = ref('');

// Reset fields when dialog opens
watch(() => props.modelValue, (val) => {
  if (val) {
    password.value = '';
    // Si es confirmación de carga completa, la cantidad real toma el valor de la aprobada
    if (props.mode === 'CONFIRMATION') {
      cantidadReal.value = props.ticket.cantidad_litros;
    } else {
      cantidadReal.value = null;
    }
    observaciones.value = '';
  }
});

const isValid = computed(() => {
  if (props.mode === 'CONFIRMATION') {
    return !!password.value;
  } else {
    return (
      cantidadReal.value !== null &&
      cantidadReal.value < props.ticket.cantidad_litros &&
      !!observaciones.value
    );
  }
});

const onConfirm = () => {
  const payload = {
    mode: props.mode,
    password: password.value,
    cantidad_real: cantidadReal.value,
    observaciones: observaciones.value
  };
  emit('confirm', payload);
};
</script>

<template>
  <q-input 
    outlined 
    dense 
    :model-value="labelCalculado" 
    readonly 
    :label="label"
  >
    <template v-slot:append>
      <q-icon name="event" class="cursor-pointer">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-date 
            v-model="fechaInterna" 
            :range="rango" 
            :default-view="defaultView"
            :options="bloquearFuturo ? deshabilitarDiasFuturos : undefined"
          >
            <div class="row items-center justify-end">
              <q-btn v-close-popup label="Cerrar" flat color="primary" />
            </div>
          </q-date>
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>

<script setup>
import { computed } from 'vue'
import { date } from 'quasar'

const props = defineProps({
  modelValue: {
    type: [String, Object, null],
    default: null
  },
  label: {
    type: String,
    default: 'Seleccione Fecha'
  },
  rango: {
    type: Boolean,
    default: true
  },
  defaultView: {
    type: String,
    default: 'Calendar'
  },
  bloquearFuturo: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue'])

const fechaInterna = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const labelCalculado = computed(() => {
  if (!props.modelValue) return ''
  if (typeof props.modelValue === 'string') return props.modelValue
  if (props.modelValue.from && props.modelValue.to) return `${props.modelValue.from} - ${props.modelValue.to}`
  return ''
})

const deshabilitarDiasFuturos = (fechaEvaluar) => {
  const hoy = date.formatDate(Date.now(), 'YYYY/MM/DD')
  return fechaEvaluar <= hoy
}
</script>
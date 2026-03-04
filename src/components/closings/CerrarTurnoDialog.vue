<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <q-card style="width: 700px; max-width: 96vw">
      <q-card-section class="row items-center">
        <div>
          <div class="text-h6">Cierre de Turno — Medición Finals</div>
          <div class="text-caption text-grey-7">
            Registra la vara final. El inventario se recalibrará con este valor.
          </div>
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-form @submit.prevent="onSave">
        <q-card-section class="q-pt-none scroll" style="max-height: 70vh">
          <q-banner class="bg-orange-1 q-mb-md rounded-borders">
            <template #avatar>
              <q-icon name="info" color="orange" />
            </template>
            <div class="text-caption">
              Al cerrar este lote se conciliarán todos los despachos pendientes
              del llenadero y se recalibrará el nivel de cada tanque activo.
            </div>
          </q-banner>

          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-6">
              <q-input
                dense filled
                v-model="formData.hora_cierre_lote"
                type="time"
                label="Hora de Cierre *"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>
            <div class="col-6">
              <q-select
                dense filled
                use-input
                v-model="formData.id_usuario_pcp"
                :options="filteredPcp"
                @filter="filterPcp"
                option-value="id_usuario"
                :option-label="(o) => `${o.nombre} ${o.apellido}`"
                label="Validador PCP *"
                emit-value map-options
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>
          </div>

          <q-separator class="q-mb-md" />

          <div class="text-subtitle2 text-primary q-mb-sm">Medición Final por Tanque</div>

          <div
            v-for="(med, idx) in formData.mediciones_cierre"
            :key="med.id_tanque"
            class="q-pa-sm rounded-borders bg-grey-1 q-mb-sm"
          >
            <div class="text-caption text-primary text-weight-bold q-mb-sm">
              {{ med.codigo }} — {{ med.nombre }}
              <span class="text-grey-7 q-ml-sm text-caption">
                (Nivel actual sistema: {{ med.nivel_actual_sistema }} Lts)
              </span>
            </div>
            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-input
                  dense filled
                  v-model.number="formData.mediciones_cierre[idx].medida_vara"
                  type="number"
                  :label="`Altura Vara (${med.unidad_medida})`"
                />
              </div>
              <div class="col-6">
                <q-input
                  dense filled
                  v-model.number="formData.mediciones_cierre[idx].volumen_real"
                  type="number"
                  suffix="Lts"
                  label="Volumen Final (Lts) *"
                  :rules="[(val) => (val !== null && val !== '') || 'Requerido']"
                />
              </div>
            </div>
          </div>

          <q-input
            dense filled
            v-model="formData.observaciones"
            type="textarea"
            label="Observaciones del Cierre (Opcional)"
            rows="2"
            class="q-mt-sm"
          />
        </q-card-section>

        <q-separator />
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            label="Ejecutar Cierre"
            type="submit"
            color="negative"
            icon="lock"
            :loading="loading"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useCierreCerrarForm } from "./composables/useCierreCerrarForm.js";

const props = defineProps({
  modelValue: Boolean,
  loading: Boolean,
  cierre: { type: Object, default: null },
  pcpList: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue", "save"]);

const { formData, filteredPcp, filterPcp, onSave } = useCierreCerrarForm(props, emit);
</script>

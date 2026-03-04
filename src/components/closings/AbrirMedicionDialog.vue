<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <q-card style="width: 780px; max-width: 98vw">

      <!-- ─── HEADER ──────────────────────────────────────────── -->
      <q-card-section class="bg-positive text-white q-pa-md row items-center">
        <div>
          <div class="row items-center q-gutter-sm">
            <q-icon name="play_circle" size="28px" />
            <span class="text-h6 text-weight-bold">Apertura de Lotes</span>
          </div>
          <div class="text-caption opacity-80 q-mt-xs">
            Registra la medición inicial por cada tanque activo del llenadero
          </div>
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-form @submit.prevent="onSave">
        <q-card-section class="q-pa-lg scroll" style="max-height: 72vh">

          <!-- ── Datos del lote ────────────────────────────────── -->
          <div class="text-subtitle2 text-positive q-mb-sm row items-center q-gutter-xs">
            <q-icon name="info_outline" size="xs" />
            <span>Datos del Lote</span>
          </div>

          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-sm-6">
              <q-select
                dense filled
                v-model="formData.id_llenadero"
                :options="llenaderosList"
                option-value="id_llenadero"
                option-label="nombre_llenadero"
                label="Llenadero *"
                emit-value map-options
                :rules="[(v) => !!v || 'Requerido']"
                @update:model-value="onLlenaderoChange"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-select
                dense filled
                v-model="formData.turno"
                :options="['DIURNO', 'NOCTURNO']"
                label="Turno *"
                :rules="[(v) => !!v || 'Requerido']"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input dense filled v-model="formData.fecha_lote" type="date" label="Fecha del Lote *"
                :rules="[(v) => !!v || 'Requerido']" />
            </div>
            <div class="col-12 col-sm-6">
              <q-input dense filled v-model="formData.hora_inicio_lote" type="time" label="Hora de Inicio *"
                :rules="[(v) => !!v || 'Requerido']" />
            </div>
          </div>

          <q-separator class="q-mb-md" />

          <!-- ── Mediciones por tanque ──────────────────────────── -->
          <div class="text-subtitle2 text-positive q-mb-sm row items-center q-gutter-xs">
            <q-icon name="oil_barrel" size="xs" />
            <span>Mediciones Iniciales por Tanque</span>
          </div>

          <!-- Estado vacío: sin llenadero -->
          <div v-if="!formData.id_llenadero"
            class="column items-center text-grey-5 q-pa-xl">
            <q-icon name="oil_barrel" size="48px" color="grey-3" />
            <div class="q-mt-sm text-body2">Selecciona un llenadero para ver los tanques activos</div>
          </div>

          <!-- Estado vacío: sin tanques -->
          <div v-else-if="tanquesActivos.length === 0"
            class="row items-center q-pa-md bg-warning-1 rounded-borders q-gutter-sm">
            <q-icon name="warning" color="warning" />
            <span class="text-caption">No hay tanques activos para despacho en este llenadero</span>
          </div>

          <!-- Tarjeta por tanque -->
          <div
            v-for="tanque in tanquesActivos"
            :key="tanque.id_tanque"
            class="q-mb-md"
          >
            <q-card flat :class="['border-left-positive']" style="border-left: 4px solid var(--q-positive)">
              <q-card-section class="q-pa-md">
                <div class="row items-center q-mb-sm">
                  <div>
                    <span class="text-weight-bold text-grey-9">
                      {{ tanque.codigo }} — {{ tanque.nombre }}
                    </span>
                    <q-chip dense size="sm"
                      :color="tanque.TipoCombustible?.nombre?.includes('GASOLINA') ? 'orange-2' : 'blue-2'"
                      :text-color="tanque.TipoCombustible?.nombre?.includes('GASOLINA') ? 'orange-9' : 'blue-9'"
                      class="q-ml-sm">
                      {{ tanque.TipoCombustible?.nombre ?? '—' }}
                    </q-chip>
                  </div>
                  <q-space />
                  <q-chip dense icon="gauge" color="blue-grey-1" text-color="blue-grey-9" size="sm">
                    Sistema: <strong class="q-ml-xs">{{ Number(tanque.nivel_actual).toLocaleString() }} L</strong>
                  </q-chip>
                </div>

                <div class="row q-col-gutter-md">
                  <div class="col-12 col-sm-6">
                    <q-input
                      dense filled
                      v-model.number="medicionesIniciales[tanque.id_tanque].medida_vara"
                      type="number"
                      :label="`Medida de Vara (${tanque.unidad_medida ?? 'cm'})`"
                    >
                      <template #prepend>
                        <q-icon name="straighten" color="grey-6" />
                      </template>
                    </q-input>
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-input
                      dense filled
                      v-model.number="medicionesIniciales[tanque.id_tanque].volumen_real"
                      type="number"
                      suffix="Lts"
                      label="Volumen Inicial (Lts) *"
                      :rules="[(v) => (v !== null && v !== '') || 'Requerido']"
                    >
                      <template #prepend>
                        <q-icon name="water" color="positive" />
                      </template>
                    </q-input>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Observaciones -->
          <q-input
            dense filled
            v-model="formData.observaciones"
            type="textarea"
            label="Observaciones (Opcional)"
            rows="2"
          >
            <template #prepend><q-icon name="notes" color="grey-6" /></template>
          </q-input>

        </q-card-section>

        <q-separator />
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            unelevated
            label="Registrar Apertura"
            type="submit"
            color="positive"
            icon="play_circle"
            :loading="loading"
            :disable="tanquesActivos.length === 0"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useCierreAbrirForm } from "./composables/useCierreAbrirForm.js";

const props = defineProps({
  modelValue: Boolean,
  loading: Boolean,
  llenaderosList: { type: Array, default: () => [] },
  tanquesPorLlenadero: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue", "llenadero-changed", "save"]);

const { formData, medicionesIniciales, tanquesActivos, onLlenaderoChange, onSave } =
  useCierreAbrirForm(props, emit);
</script>

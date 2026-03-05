<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(v) => emit('update:modelValue', v)"
    persistent
  >
    <q-card style="width: 900px; max-width: 98vw">

      <!-- TÍTULO (estilo MeasurementFormDialog: simple, sin color) -->
      <q-card-section>
        <div class="text-h6">Generar Cierre de Turno</div>
        <div class="text-caption text-grey-7">Medición física + conciliación de lote</div>
      </q-card-section>

      <q-form @submit.prevent="onSave">
        <q-card-section class="q-pt-none scroll" style="max-height: 78vh">
          <div class="row q-col-gutter-lg">

            <!-- ── PANEL IZQUIERDO: Datos del lote ─────────────── -->
            <div class="col-12 col-md-4">
              <div class="text-subtitle2 text-primary q-mb-sm">
                Datos del Lote
              </div>

              <q-select
                dense filled
                v-model="lote.id_llenadero"
                :options="llenaderosList"
                option-value="id_llenadero"
                option-label="nombre_llenadero"
                label="Llenadero *"
                emit-value map-options
                class="q-mb-sm"
                :rules="[(v) => !!v || 'Requerido']"
                @update:model-value="$emit('llenadero-changed', $event)"
              />

              <q-select
                dense filled
                v-model="lote.turno"
                :options="['DIURNO', 'NOCTURNO']"
                label="Turno *"
                class="q-mb-sm"
              />

              <q-input
                dense filled
                v-model="lote.fecha_lote"
                type="date"
                label="Fecha del Lote *"
                class="q-mb-sm"
                :rules="[(v) => !!v || 'Requerido']"
              />

              <div class="row q-col-gutter-sm q-mb-sm">
                <div class="col-6">
                  <q-input
                    dense filled
                    v-model="lote.hora_inicio_lote"
                    type="time"
                    label="Hora Inicio *"
                  />
                </div>
                <div class="col-6">
                  <q-input
                    dense filled
                    v-model="lote.hora_cierre_lote"
                    type="time"
                    label="Hora Cierre *"
                  />
                </div>
              </div>


              <q-input
                dense
                v-model="lote.observaciones"
                type="textarea"
                label="Observaciones"
                rows="3"
              />
            </div>

            <!-- ── PANEL DERECHO: Mediciones por tanque ─────────── -->
            <div class="col-12 col-md-8">

              <!-- Estado: sin llenadero -->
              <div v-if="!lote.id_llenadero" class="column items-center text-grey-5 q-pa-xl">
                <q-icon name="oil_barrel" size="64px" color="grey-3" />
                <div class="q-mt-sm text-body2">Selecciona un llenadero para ver los tanques</div>
              </div>

              <!-- Estado: sin tanques -->
              <div
                v-else-if="tanquesForm.length === 0 && !cargandoTanques"
                class="row items-center q-pa-md rounded-borders q-gutter-sm bg-orange-1"
              >
                <q-icon name="warning" color="warning" />
                <span class="text-caption">No hay tanques activos para despacho en este llenadero</span>
              </div>

              <!-- Cargando -->
              <q-inner-loading :showing="cargandoTanques">
                <q-spinner-gears size="40px" color="primary" />
              </q-inner-loading>

              <!-- Tarjeta por tanque -->
              <div
                v-for="(t, idx) in tanquesForm"
                :key="t.id_tanque"
                class="q-mb-md"
              >
                <!-- Nombre del tanque + chips informativos -->
                <div class="row items-center q-mb-xs q-gutter-xs">
                  <span class="text-subtitle2 text-weight-bold text-primary">
                    {{ t.codigo }} — {{ t.nombre }}
                  </span>
                  <q-chip
                    dense size="sm"
                    :color="t.combustible?.includes('GASOLINA') ? 'orange-2' : 'blue-2'"
                    :text-color="t.combustible?.includes('GASOLINA') ? 'orange-9' : 'blue-9'"
                  >
                    {{ t.combustible }}
                  </q-chip>
                  <q-chip dense size="sm" color="grey-2" text-color="grey-8">
                    {{ getModo(t) }}
                  </q-chip>
                </div>

                <!-- Chips de referencia (último cierre / nivel sistema) -->
                <div class="row q-gutter-xs q-mb-sm">
                  <q-chip dense icon="history" color="teal-1" text-color="teal-9" size="sm">
                    Último cierre:
                    <strong class="q-ml-xs">
                      {{ t.ultimo_cierre
                        ? `${t.ultimo_cierre.volumen_real.toLocaleString()} Lts (${t.ultimo_cierre.fecha})`
                        : 'Sin cierre previo' }}
                    </strong>
                  </q-chip>
                  <q-chip dense icon="gauge" color="blue-1" text-color="blue-9" size="sm">
                    Sistema actual:
                    <strong class="q-ml-xs">{{ t.nivel_actual?.toLocaleString() }} Lts</strong>
                  </q-chip>
                </div>

                <!-- Inputs + card de resumen estilo MeasurementFormDialog -->
                <div class="row q-col-gutter-md q-mb-sm">
                  <div class="col-12 col-sm-6" v-if="getModo(t) !== 'MANUAL'">
                    <q-input
                      dense filled
                      v-model.number="t.medida_vara"
                      type="number"
                      :label="`Medida de Vara (${t.unidad_medida || 'cm'})`"
                      @update:model-value="calcular(idx)"
                    />
                  </div>

                  <div :class="getModo(t) === 'MANUAL' ? 'col-12' : 'col-12 col-sm-6'">
                    <q-input
                      dense filled
                      v-model.number="t.volumen_calculado"
                      type="number"
                      suffix="Lts"
                      :label="getModo(t) === 'MANUAL' ? 'Volumen Medido (Lts) *' : 'Volumen Calculado (Lts)'"
                      :readonly="getModo(t) !== 'MANUAL'"
                      :bg-color="getModo(t) !== 'MANUAL' ? 'grey-2' : undefined"
                      :rules="[(v) => (v !== null && v !== '') || 'Requerido']"
                      @update:model-value="getModo(t) === 'MANUAL' && onVolumenManual(idx)"
                    />
                  </div>
                </div>

                <!-- Resumen Sistema / Medido / Diferencia — igual que MeasurementFormDialog -->
                <q-card flat bordered class="bg-grey-1">
                  <q-card-section class="row q-col-gutter-md text-center q-py-sm">
                    <!-- Sistema -->
                    <div class="col-4">
                      <div class="text-caption text-grey-8">Sistema (Teórico)</div>
                      <div class="text-h6">{{ (t.nivel_actual ?? 0).toLocaleString() }} L</div>
                    </div>

                    <!-- Real (Medido) -->
                    <div class="col-4">
                      <div class="text-caption text-grey-8">Real (Vara)</div>
                      <div class="text-h6 text-primary text-weight-bold">
                        {{ t.volumen_calculado != null ? Number(t.volumen_calculado).toLocaleString() : '—' }} L
                      </div>
                    </div>

                    <!-- Diferencia -->
                    <div class="col-4">
                      <div class="text-caption text-grey-8">Diferencia Neta</div>
                      <div
                        class="text-h6"
                        :class="t.diferencia > 0 ? 'text-negative' : t.diferencia < 0 ? 'text-warning' : 'text-positive'"
                      >
                        {{ t.diferencia != null ? Number(t.diferencia).toLocaleString() : '—' }} L
                      </div>
                      <div class="text-xs text-grey-6">
                        {{ t.diferencia > 0 ? 'Faltante' : t.diferencia < 0 ? 'Sobrante' : '' }}
                      </div>
                    </div>
                  </q-card-section>
                </q-card>

                <q-separator v-if="idx < tanquesForm.length - 1" class="q-mt-md" />
              </div>
            </div>
          </div>
        </q-card-section>

        <q-separator />
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            type="submit"
            color="primary"
            icon="lock_clock"
            label="Generar Cierre"
            unelevated
            :loading="loading"
            :disable="tanquesForm.length === 0"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useGenerarCierreForm } from "./composables/useGenerarCierreForm.js";

const props = defineProps({
  modelValue: Boolean,
  loading: Boolean,
  cargandoTanques: Boolean,
  llenaderosList: { type: Array, default: () => [] },
  pcpList:        { type: Array, default: () => [] },
  tanques:        { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue", "llenadero-changed", "save"]);

const { lote, tanquesForm, calcular, onVolumenManual, getModo, onSave } =
  useGenerarCierreForm(props, emit);
</script>

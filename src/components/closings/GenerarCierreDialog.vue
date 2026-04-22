<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(v) => emit('update:modelValue', v)"
    persistent
  >
    <q-card style="width: 900px; max-width: 98vw">
      <!-- TÍTULO -->
      <q-card-section>
        <div class="row items-center justify-between">
            <div>
              <div class="text-h6">Generar Cierre de Turno</div>
              <div class="text-caption text-grey-7">Medición física + conciliación de lote</div>
            </div>
            <q-btn icon="close" flat round dense v-close-popup />
        </div>
      </q-card-section>

      <q-form @submit.prevent="onSave">
        <q-stepper
          v-model="step"
          ref="stepper"
          color="primary"
          animated
          flat
        >
          <!-- ── PASO 1: DATOS DEL LOTE ─────────────────────── -->
          <q-step
            :name="1"
            title="Datos del Lote"
            icon="settings"
            :done="step > 1"
          >
            <div class="q-col-gutter-lg row q-mt-md">
              <div class="col-12 col-md-6">
                  <q-select
                    dense filled
                    v-model="lote.id_llenadero"
                    :options="llenaderosList"
                    option-value="id_llenadero"
                    option-label="nombre_llenadero"
                    label="Llenadero *"
                    emit-value map-options
                    class="q-mb-md"
                    :rules="[(v) => !!v || 'Requerido']"
                    @update:model-value="$emit('llenadero-changed', $event)"
                  />
                  <q-select
                    dense filled
                    v-model="lote.turno"
                    :options="['DIURNO', 'NOCTURNO']"
                    label="Turno *"
                    class="q-mb-md"
                  />
                  <q-input
                    dense filled
                    v-model="lote.fecha_lote"
                    type="date"
                    label="Fecha del Lote *"
                    class="q-mb-md"
                    :rules="[(v) => !!v || 'Requerido']"
                  />
              </div>
              <div class="col-12 col-md-6">
                  <div class="row q-col-gutter-sm q-mb-md">
                    <div class="col-6">
                        <q-input dense filled v-model="lote.hora_inicio_lote" type="time" label="Hora Inicio *" />
                    </div>
                    <div class="col-6">
                        <q-input dense filled v-model="lote.hora_cierre_lote" type="time" label="Hora Cierre *" />
                    </div>
                  </div>
                  <q-input
                    dense filled
                    v-model="lote.observaciones"
                    type="textarea"
                    label="Observaciones"
                    rows="4"
                  />
              </div>
            </div>
          </q-step>

          <!-- ── PASO 2: SELECCIÓN DE TANQUES ─────────────────── -->
          <q-step
            :name="2"
            title="Seleccionar Tanques"
            icon="list"
            :done="step > 2"
          >
              <div v-if="!lote.id_llenadero" class="column items-center text-grey-5 q-pa-xl">
                  <q-icon name="oil_barrel" size="64px" color="grey-3" />
                  <div class="q-mt-sm text-body2">Regresa al paso anterior y selecciona un llenadero</div>
              </div>
              <div v-else-if="cargandoTanques" class="q-pa-xl text-center">
                  <q-spinner-gears size="40px" color="primary" />
              </div>
              <div v-else-if="tanquesForm.length === 0" class="row items-center q-pa-md rounded-borders q-gutter-sm bg-orange-1">
                  <q-icon name="warning" color="warning" />
                  <span class="text-caption">No hay tanques registrados o activos en este llenadero</span>
              </div>
              <div v-else>
                  <!-- Agrupado por combustible -->
                  <div class="q-mb-md" v-for="(listaTanques, combustible) in tanquesPorCombustible" :key="combustible">
                    <div class="text-subtitle1 text-weight-bold q-my-sm text-secondary">{{ combustible }}</div>
                    <q-list bordered separator class="rounded-borders relative-position">
                        <q-item
                          v-for="t in listaTanques"
                          :key="t.id_tanque"
                          tag="label"
                          v-ripple
                        >
                            <q-item-section avatar>
                                <q-checkbox v-model="tanquesSeleccionados" :val="t.id_tanque" color="primary" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label class="text-subtitle2 text-weight-bold text-primary">{{ t.codigo }} — {{ t.nombre }}</q-item-label>
                                <q-item-label caption>
                                  Nivel Sistema: {{ t.nivel_actual?.toLocaleString() }} L
                                </q-item-label>
                            </q-item-section>
                            <q-item-section side>
                                <q-chip
                                  dense size="sm"
                                  :color="combustible.includes('GASOLINA') ? 'orange-2' : 'blue-2'"
                                  :text-color="combustible.includes('GASOLINA') ? 'orange-9' : 'blue-9'"
                                >
                                  {{ t.combustible }}
                                </q-chip>
                            </q-item-section>
                        </q-item>
                    </q-list>
                  </div>
              </div>
          </q-step>

          <!-- ── PASO 3: MEDICIONES CON EVAPORACIÓN ───────────── -->
          <q-step
            :name="3"
            title="Ingresar Mediciones"
            icon="edit"
          >
              <div v-if="tanquesSeleccionados.length === 0" class="column items-center text-grey-5 q-pa-xl">
                  <q-icon name="check_box_outline_blank" size="64px" color="grey-3" />
                  <div class="q-mt-sm text-body2">No has seleccionado tanques para medir</div>
              </div>
              <div v-else>
                  <!-- Agrupar por combustible para renderizar solo los seleccionados -->
                  <div class="q-mb-lg" v-for="(listaTanques, combustible) in tanquesPorCombustible" :key="combustible">
                    <!-- Solo mostrar el grupo si hay al menos un tanque seleccionado de este combustible -->
                    <div v-if="listaTanques.some(t => tanquesSeleccionados.includes(t.id_tanque))">
                      <div class="text-subtitle1 text-weight-bold q-my-sm text-secondary">{{ combustible }}</div>
                      
                      <div
                        v-for="(t) in listaTanques"
                        :key="t.id_tanque"
                      >
                        <div v-if="tanquesSeleccionados.includes(t.id_tanque)" class="q-mb-md">
                          <div class="row items-center q-mb-xs q-gutter-xs">
                              <span class="text-subtitle2 text-weight-bold text-primary">
                              {{ t.codigo }} — {{ t.nombre }}
                              </span>
                              <q-chip dense size="sm" color="grey-2" text-color="grey-8">
                              {{ getModo(t) }}
                              </q-chip>
                          </div>

                          <div class="row q-col-gutter-md q-mb-sm">
                              <div class="col-12 col-sm-4" v-if="getModo(t) !== 'MANUAL'">
                              <q-input
                                  dense filled
                                  v-model.number="t.medida_vara"
                                  type="number"
                                  :label="`Vara (${t.unidad_medida || 'cm'})`"
                                  @update:model-value="calcular(t)"
                              />
                              </div>
                              <div :class="getModo(t) === 'MANUAL' ? 'col-12 col-sm-6' : 'col-12 col-sm-4'">
                              <q-input
                                  dense filled
                                  v-model.number="t.volumen_calculado"
                                  type="number"
                                  suffix="Lts"
                                  :label="getModo(t) === 'MANUAL' ? 'Volumen Medido (L) *' : 'Volumen Calc. (L)'"
                                  :readonly="getModo(t) !== 'MANUAL'"
                                  :bg-color="getModo(t) !== 'MANUAL' ? 'grey-2' : undefined"
                                  :rules="[(v) => (v !== null && v !== '') || 'Requerido']"
                                  @update:model-value="getModo(t) === 'MANUAL' && onVolumenManual(t)"
                              />
                              </div>
                              <div :class="getModo(t) === 'MANUAL' ? 'col-12 col-sm-6' : 'col-12 col-sm-4'">
                              <q-input
                                  dense filled
                                  v-model.number="t.merma_evaporacion"
                                  type="number"
                                  suffix="Lts"
                                  label="Evaporación"
                                  placeholder="Ej: 50"
                              />
                              </div>
                          </div>

                          <q-card flat bordered class="bg-grey-1">
                              <q-card-section class="row q-col-gutter-md text-center q-py-sm">
                              <div class="col-4">
                                  <div class="text-caption text-grey-8">Sistema</div>
                                  <div class="text-h6">{{ (t.nivel_actual ?? 0).toLocaleString() }} L</div>
                              </div>
                              <div class="col-4">
                                  <div class="text-caption text-grey-8">Real</div>
                                  <div class="text-h6 text-primary text-weight-bold">
                                  {{ t.volumen_calculado != null ? Number(t.volumen_calculado).toLocaleString() : '—' }} L
                                  </div>
                              </div>
                              <div class="col-4">
                                  <div class="text-caption text-grey-8">Diferencia</div>
                                  <div
                                  class="text-h6"
                                  :class="t.diferencia > 0 ? 'text-negative' : t.diferencia < 0 ? 'text-warning' : 'text-positive'"
                                  >
                                  {{ t.diferencia != null ? Number(t.diferencia).toLocaleString() : '—' }} L
                                  </div>
                              </div>
                              </q-card-section>
                          </q-card>
                        </div>
                      </div>
                    </div>
                  </div>
              </div>
          </q-step>

          <!-- ── NAVEGACIÓN DEL STEPPER ───────────────────────────── -->
          <template v-slot:navigation>
            <q-separator class="q-my-md"/>
            <q-stepper-navigation class="row justify-end q-gutter-sm">
              <q-btn flat label="Cancelar" v-close-popup v-if="step === 1" />
              <q-btn v-if="step > 1" flat color="primary" @click="step--" label="Atrás" />
              <q-btn v-if="step < 3" :disable="step === 2 && tanquesSeleccionados.length === 0" color="primary" @click="step++" label="Continuar" unelevated />
              <q-btn
                v-if="step === 3"
                @click="confirmarGuardado"
                color="primary"
                icon="lock_clock"
                label="Generar Cierre"
                unelevated
                :loading="loading"
                :disable="tanquesSeleccionados.length === 0"
              />
            </q-stepper-navigation>
          </template>
        </q-stepper>
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

const { step, lote, tanquesForm, tanquesPorCombustible, tanquesSeleccionados, calcular, onVolumenManual, getModo, onSave, confirmarGuardado } =
  useGenerarCierreForm(props, emit);
</script>

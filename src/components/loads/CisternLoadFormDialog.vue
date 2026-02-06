<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <q-card style="width: 1000px; max-width: 95vw">
      <q-card-section class="bg-primary text-white row items-center">
        <div class="text-h6">
          {{
            isReadOnly
              ? "Detalle de Carga"
              : isEditing
              ? "Editar Carga de Cisterna"
              : "Registrar Carga de Cisterna"
          }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-form @submit.prevent="handleSave">
        <q-card-section class="q-pt-md scroll" style="max-height: 75vh">
          <div class="row q-col-gutter-md">
            <!-- === 1. DATOS GUÍA Y TRANSPORTE === -->
            <div class="col-12 text-subtitle2 text-primary text-weight-bold uppercase">
              Documentación y Transporte
            </div>

            <div class="col-12 col-md-3">
              <div class="row items-center no-wrap">
                <q-input
                  class="col-grow"
                  dense
                  outlined
                  v-model="formData.numero_guia"
                  label="N° Guía"
                  :readonly="isReadOnly"
                  :rules="[(val) => !!val || 'Requerido']"
                  :disable="isInternalCistern"
                />
                <q-checkbox
                  v-if="!isReadOnly"
                  v-model="isInternalCistern"
                  dense
                  size="sm"
                  class="q-ml-sm q-mb-md"
                  color="primary"
                >
                  <q-tooltip>Cisterna Interna</q-tooltip>
                </q-checkbox>
              </div>
            </div>
            <div class="col-12 col-md-3">
              <q-input
                dense
                outlined
                v-model="formData.fecha_emision"
                type="date"
                label="Fecha Emisión"
                :readonly="isReadOnly"
              />
            </div>
            <div class="col-12 col-md-3">
              <q-input
                dense
                outlined
                v-model="formData.fecha_recepcion"
                type="date"
                label="Fecha Recepción"
                :readonly="isReadOnly"
              />
            </div>
            <div class="col-12 col-md-3">
              <q-input
                dense
                outlined
                v-model.number="formData.litros_segun_guia"
                type="number"
                label="Litros según Guía"
                suffix="Lts"
                :readonly="isReadOnly"
                :rules="[(val) => val > 0 || 'Requerido']"
                @update:model-value="calculate"
              />
            </div>

            <div class="col-12 col-md-4">
              <q-input
                dense
                outlined
                v-model="formData.fecha"
                type="date"
                label="Fecha Llegada"
                :readonly="isReadOnly"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                dense
                outlined
                v-model="formData.hora"
                type="time"
                label="Hora Llegada"
                :readonly="isReadOnly"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                dense
                outlined
                v-model="tipoCombustible"
                label="Tipo Combustible"
                readonly
                bg-color="grey-2"
              />
            </div>

            <div class="col-12 col-md-4">
              <q-input
                dense
                outlined
                v-model="formData.placa_cisterna"
                label="Placa Cisterna"
                :readonly="isReadOnly"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                dense
                outlined
                v-model="formData.nombre_chofer"
                label="Nombre Chofer"
                :readonly="isReadOnly"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                dense
                outlined
                v-model="almacenistaNombre"
                label="Almacenista Receptor"
                readonly
                filled
              />
            </div>

            <q-separator class="col-12 q-my-sm" />

            <!-- === 2. MEDICIÓN FÍSICA (VARA) === -->
            <div class="col-12 text-subtitle2 text-primary text-weight-bold uppercase">
              Medición de Tanque (Varillaje)
            </div>

            <div class="col-12 col-md-6">
              <q-select
                dense
                outlined
                v-model="formData.id_llenadero"
                :options="llenaderosList"
                option-value="id_llenadero"
                option-label="nombre_llenadero"
                label="Seleccionar Llenadero"
                emit-value
                map-options
                :readonly="isReadOnly || isEditing"
                @update:model-value="onLlenaderoSelect"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-select
                dense
                outlined
                v-model="formData.id_tanque"
                :options="tanksList"
                option-value="id_tanque"
                :option-label="(opt) => `${opt.codigo} - ${opt.nombre}`"
                label="Seleccionar Tanque"
                emit-value
                map-options
                :disable="!formData.id_llenadero"
                :readonly="isReadOnly || isEditing"
                :rules="[(val) => !!val || 'Requerido']"
                @update:model-value="onTankSelect"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-input
                dense
                outlined
                v-model.number="formData.medida_inicial"
                label="Medida Inicial (Vara)"
                type="number"
                :suffix="currentTankDetail?.unidad_medida || 'cm'"
                :readonly="isReadOnly"
                :disable="!formData.id_tanque"
                @update:model-value="calculate"
              >
                <template v-slot:append v-if="!isReadOnly && (tieneAforo || isFormulaMode)">
                  <q-btn flat round dense icon="edit" size="xs" color="primary" @click="startEdit('inicial')">
                    <q-tooltip>Editar volumen manualmente</q-tooltip>
                  </q-btn>
                </template>
              </q-input>
              <!-- Info del Volumen Inicial -->
              <div v-if="tieneAforo || isFormulaMode" class="text-caption text-grey-7 q-pl-sm q-mt-xs">
                {{ isFormulaMode ? "Volumen Calculado:" : "Volumen según Tabla:" }}
                <strong :class="{'text-orange': litersWereEdited.inicial}">{{ liters.inicial }} Lts</strong>
              </div>
              <q-input v-if="editing.inicial" v-model.number="liters.inicial" type="number" dense outlined label="Volumen Manual" class="q-mt-xs bg-orange-1" @blur="finishEdit('inicial')" autofocus />
            </div>

            <div class="col-12 col-md-6">
              <q-input
                dense
                outlined
                v-model.number="formData.medida_final"
                label="Medida Final (Vara)"
                type="number"
                :suffix="currentTankDetail?.unidad_medida || 'cm'"
                :readonly="isReadOnly"
                :disable="!formData.id_tanque"
                @update:model-value="calculate"
              >
                <template v-slot:append v-if="!isReadOnly && (tieneAforo || isFormulaMode)">
                  <q-btn flat round dense icon="edit" size="xs" color="primary" @click="startEdit('final')">
                    <q-tooltip>Editar volumen manualmente</q-tooltip>
                  </q-btn>
                </template>
              </q-input>
              <!-- Info del Volumen Final -->
              <div v-if="tieneAforo || isFormulaMode" class="text-caption text-grey-7 q-pl-sm q-mt-xs">
                {{ isFormulaMode ? "Volumen Calculado:" : "Volumen según Tabla:" }}
                <strong :class="{'text-orange': litersWereEdited.final}">{{ liters.final }} Lts</strong>
              </div>
              <q-input v-if="editing.final" v-model.number="liters.final" type="number" dense outlined label="Volumen Manual" class="q-mt-xs bg-orange-1" @blur="finishEdit('final')" autofocus />
            </div>

            <q-separator class="col-12 q-my-sm" />

            <!-- === 3. DATOS DE PESAJE Y TIEMPOS === -->
            <div class="col-12 text-subtitle2 text-primary text-weight-bold uppercase">
              Datos de Pesaje y Descarga
            </div>

            <div class="col-6 col-md-3">
              <q-input dense outlined v-model.number="formData.peso_entrada" type="number" label="Peso Entrada" suffix="Kg" :readonly="isReadOnly" @update:model-value="calcularPesoNeto" />
            </div>
            <div class="col-6 col-md-3">
              <q-input dense outlined v-model.number="formData.peso_salida" type="number" label="Peso Salida" suffix="Kg" :readonly="isReadOnly" @update:model-value="calcularPesoNeto" />
            </div>
            <div class="col-6 col-md-3">
              <q-input dense outlined v-model="formData.hora_inicio_descarga" type="time" label="Inicio Descarga" :readonly="isReadOnly" />
            </div>
            <div class="col-6 col-md-3">
              <q-input dense outlined v-model="formData.hora_fin_descarga" type="time" label="Fin Descarga" :readonly="isReadOnly" />
            </div>

            <div v-if="pesoNeto !== null" class="col-12">
              <q-banner dense class="bg-grey-2 rounded-borders">
                Peso Neto: <strong>{{ pesoNeto.toFixed(2) }} Kg</strong>
              </q-banner>
            </div>

            <q-separator class="col-12 q-my-sm" />

            <!-- === 4. RESULTADOS === -->
            <div class="col-12 text-subtitle2 text-primary text-weight-bold uppercase">
              Análisis de Volúmenes
              <q-badge v-if="litersWereEdited.inicial || litersWereEdited.final" color="orange" class="q-ml-sm">Editado manual</q-badge>
            </div>

            <div class="col-12">
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <q-card flat bordered class="bg-blue-1 text-center">
                    <q-card-section class="q-py-sm">
                      <div class="text-caption text-blue-9 text-weight-bold">RECIBIDO REAL</div>
                      <div class="text-h4 text-primary text-weight-bold">{{ liters.recibido }} L</div>
                      <div class="row justify-between q-mt-sm">
                        <span class="text-caption text-grey-8">DIF. GUÍA:</span>
                        <q-badge :color="parseFloat(liters.faltante) > 0 ? 'negative' : 'positive'">{{ liters.faltante }} L</q-badge>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
                <div class="col-12 col-md-6">
                  <q-card flat bordered class="text-center">
                    <q-card-section class="q-py-sm">
                      <div class="text-caption text-grey-7 uppercase">Flujómetro (Opcional)</div>
                      <q-input dense outlined v-model.number="formData.litros_flujometro" type="number" suffix="L" class="q-my-xs" :readonly="isReadOnly" @update:model-value="calculate" />
                      <div v-if="formData.litros_flujometro" class="row justify-between text-caption text-grey-8">
                         <span>DESVIACIÓN:</span>
                         <span class="text-weight-bold">{{ liters.dif_flujo }} L</span>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </div>

            <div class="col-12">
              <q-input dense outlined v-model="formData.observacion" type="textarea" label="Observaciones" rows="2" :readonly="isReadOnly" />
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cerrar" color="grey-7" v-close-popup />
          <q-btn v-if="!isReadOnly" :label="isEditing ? 'Guardar Cambios' : 'Registrar Carga'" type="submit" color="primary" unelevated />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, nextTick } from "vue";
import { useCisternLoadForm } from "./composables/useCisternLoadForm";

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
  isEditing: Boolean,
  isReadOnly: Boolean,
  llenaderosList: { type: Array, default: () => [] },
  tanksList: { type: Array, default: () => [] },
  currentTankAforo: { type: [Object, Array], default: () => [] },
  currentTankDetail: { type: Object, default: null },
});

const emit = defineEmits(["update:modelValue", "save", "llenadero-changed", "tank-changed"]);

const {
  formData, isInternalCistern, tipoCombustible, pesoNeto, editing, litersWereEdited, liters,
  tieneAforo, isFormulaMode, calculate, startEdit, finishEdit, cancelEdit,
  calcularPesoNeto, initializeForm, resetAllStates
} = useCisternLoadForm(props, emit);

const almacenistaNombre = ref("");

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    initializeForm();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    almacenistaNombre.value = `${user.nombre} ${user.apellido}`;
  }
});

watch(() => props.currentTankDetail, (newVal) => {
  if (newVal) {
    tipoCombustible.value = newVal.TipoCombustible?.nombre || "";
    if (!litersWereEdited.inicial && !litersWereEdited.final) {
      nextTick(() => calculate());
    }
  }
});

watch(() => props.currentTankAforo, () => {
  if (!litersWereEdited.inicial && !litersWereEdited.final) {
    nextTick(() => calculate());
  }
});

function onLlenaderoSelect(id) {
  formData.value.id_tanque = null;
  emit("llenadero-changed", id);
  resetAllStates();
}

function onTankSelect(id) {
  emit("tank-changed", id);
  resetAllStates();
}

function handleSave() {
  const payload = { ...formData.value };
  payload.litros_iniciales = parseFloat(liters.inicial);
  payload.litros_finales = parseFloat(liters.final);
  payload.litros_recibidos = parseFloat(liters.recibido);
  payload.diferencia_guia = parseFloat(liters.faltante);
  payload.fecha_llegada = `${formData.value.fecha}T${formData.value.hora}`;
  emit("save", payload);
}
</script>

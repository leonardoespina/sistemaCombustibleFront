<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <q-card style="width: 900px; max-width: 95vw">
      <q-card-section class="bg-primary text-white row items-center">
        <div class="text-h6">
          {{
            isReadOnly
              ? "Detalle de Transferencia"
              : isEditing
              ? "Editar Transferencia"
              : "Registrar Transferencia Interna"
          }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-form @submit.prevent="handleSaveInternal">
        <q-card-section class="q-pt-md scroll" style="max-height: 75vh">
          <div class="row q-col-gutter-md">
            <!-- 1. DATOS GENERALES -->
            <div class="col-12 col-md-4">
              <q-input
                dense
                outlined
                v-model="formData.fecha"
                type="date"
                label="Fecha"
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
                label="Hora"
                :readonly="isReadOnly"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                dense
                outlined
                v-model="almacenistaNombre"
                label="Registrado Por"
                readonly
                filled
              />
            </div>

            <q-separator class="col-12 q-my-sm" />

            <!-- LLENADERO -->
            <div class="col-12">
              <q-select
                dense
                outlined
                v-model="formData.id_llenadero"
                :options="llenaderosList"
                option-value="id_llenadero"
                option-label="nombre_llenadero"
                label="Seleccionar Llenadero *"
                emit-value
                map-options
                :readonly="isReadOnly || isEditing"
                :rules="[(val) => !!val || 'Requerido']"
                @update:model-value="onLlenaderoSelect"
              >
                <template v-slot:selected-item="scope">
                    <span v-if="scope.opt">{{ scope.opt.nombre_llenadero || (initialData?.TanqueOrigen?.Llenadero?.nombre_llenadero) }}</span>
                </template>
              </q-select>
            </div>

            <!-- 2. TANQUES -->
            <div class="col-12 col-md-6">
              <q-select
                dense
                outlined
                v-model="formData.id_tanque_origen"
                :options="tanksList"
                option-value="id_tanque"
                :option-label="(opt) => opt ? `${opt.codigo} - ${opt.nombre} (${opt.TipoCombustible?.nombre || ''})` : ''"
                label="Tanque Origen"
                emit-value
                map-options
                :disable="!formData.id_llenadero"
                :readonly="isReadOnly || isEditing"
                :rules="[(val) => !!val || 'Requerido']"
                @update:model-value="onSourceTankSelect"
              >
                <template v-slot:selected-item="scope">
                    <span v-if="scope.opt">{{ scope.opt.codigo }} - {{ scope.opt.nombre }}</span>
                    <span v-else-if="initialData?.TanqueOrigen">{{ initialData.TanqueOrigen.codigo }} - {{ initialData.TanqueOrigen.nombre }}</span>
                </template>
              </q-select>
              <div v-if="sourceTankDetail" class="text-caption text-grey-8 q-ml-sm">
                Nivel Actual: <strong>{{ sourceTankDetail.nivel_actual }} L</strong>
              </div>
            </div>

            <div class="col-12 col-md-6">
              <q-select
                dense
                outlined
                v-model="formData.id_tanque_destino"
                :options="filteredDestinationTanks"
                option-value="id_tanque"
                :option-label="(opt) => opt ? `${opt.codigo} - ${opt.nombre} (${opt.TipoCombustible?.nombre || ''})` : ''"
                label="Tanque Destino"
                emit-value
                map-options
                :disable="!formData.id_tanque_origen"
                :readonly="isReadOnly || isEditing"
                :rules="[
                  (val) => !!val || 'Requerido',
                  (val) => val !== formData.id_tanque_origen || 'Debe ser diferente al origen',
                ]"
                @update:model-value="onDestinationTankSelect"
              >
                <template v-slot:selected-item="scope">
                    <span v-if="scope.opt">{{ scope.opt.codigo }} - {{ scope.opt.nombre }}</span>
                    <span v-else-if="initialData?.TanqueDestino">{{ initialData.TanqueDestino.codigo }} - {{ initialData.TanqueDestino.nombre }}</span>
                </template>
              </q-select>
              <div v-if="destinationTankDetail" class="text-caption text-grey-8 q-ml-sm">
                Nivel Actual: <strong>{{ destinationTankDetail.nivel_actual }} L</strong>
              </div>
              <div v-if="formData.id_tanque_origen && filteredDestinationTanks.length === 0" class="text-caption text-negative q-ml-sm">
                * No hay otros tanques con el mismo combustible en este llenadero.
              </div>
            </div>

            <!-- 3. DETALLES DE TRANSFERENCIA -->
            <div class="col-12 text-subtitle2 text-primary uppercase text-weight-bold q-mt-md">
              Detalles de la Operación
            </div>

            <div class="col-12 q-mb-sm" v-if="!isReadOnly && !isEditing">
              <q-btn-toggle
                v-model="calculationMode"
                spread
                no-caps
                rounded
                unelevated
                toggle-color="primary"
                color="grey-3"
                text-color="primary"
                :options="[
                  { label: 'Por Medición Final (Vara)', value: 'final' },
                  { label: 'Por Cantidad a Transferir', value: 'amount' },
                ]"
              />
            </div>

            <!-- MODO FINAL (VARA) -->
            <template v-if="calculationMode === 'final'">
              <div class="col-12 col-md-6">
                <q-input
                  dense
                  outlined
                  v-model.number="formData.medida_vara_destino"
                  :label="tieneAforo || isFormulaMode ? 'Medida Vara Final Destino' : 'Medida Vara (Ref)'"
                  type="number"
                  :suffix="destinationTankDetail?.unidad_medida || 'cm'"
                  :readonly="isReadOnly"
                  :disable="!formData.id_tanque_destino"
                  @update:model-value="calculate"
                >
                  <template v-slot:append v-if="!isReadOnly && (tieneAforo || isFormulaMode)">
                    <q-btn flat round dense icon="edit" size="xs" color="primary" @click="startEdit">
                      <q-tooltip>Editar volumen manualmente</q-tooltip>
                    </q-btn>
                  </template>
                </q-input>
                <div v-if="tieneAforo || isFormulaMode" class="text-caption text-grey-7 q-pl-sm q-mt-xs">
                  {{ isFormulaMode ? "Volumen Calculado:" : "Volumen según Tabla:" }}
                  <strong :class="{'text-orange': manualEdit.final}">{{ liters.final }} Lts</strong>
                </div>
                <q-input v-if="editing.final" v-model.number="liters.final" type="number" dense outlined label="Volumen Final Manual" class="q-mt-xs bg-orange-1" @blur="finishEdit" autofocus />
              </div>
            </template>

            <!-- MODO CANTIDAD -->
            <template v-if="calculationMode === 'amount'">
              <div class="col-12 col-md-6">
                <q-input
                  dense
                  outlined
                  v-model.number="litersToTransfer"
                  label="Cantidad a Transferir"
                  type="number"
                  suffix="Lts"
                  :readonly="isReadOnly"
                  :rules="[(val) => val > 0 || 'Debe ser mayor a 0']"
                  :disable="!formData.id_tanque_destino"
                  @update:model-value="calculateFinalFromAmount"
                />
              </div>
            </template>

            <!-- 4. RESULTADOS (RESUMEN) -->
            <div class="col-12 q-mt-md">
              <q-banner rounded class="bg-blue-1 text-primary">
                <div class="text-subtitle2 text-weight-bold uppercase q-mb-xs">Resumen de Movimiento</div>
                <div class="row q-col-gutter-sm">
                  <div class="col-6">
                    A TRANSFERIR:
                    <div class="text-h6 text-weight-bold">{{ computedLitersTransferidos }} L</div>
                  </div>
                  <div class="col-6 text-right">
                    NUEVO NIVEL ORIGEN:
                    <div class="text-h6 text-weight-bold" :class="{'text-negative': parseFloat(litersOrigenDespues) < 0}">{{ litersOrigenDespues }} L</div>
                  </div>
                </div>
                <div v-if="parseFloat(computedLitersTransferidos) <= 0" class="text-caption text-negative q-mt-xs">
                  * El nivel final debe ser mayor al actual.
                </div>
                <div v-if="parseFloat(litersOrigenDespues) < 0" class="text-caption text-negative q-mt-xs">
                  * Insuficiente producto en origen.
                </div>
              </q-banner>
            </div>

            <div class="col-12">
              <q-input
                dense
                outlined
                v-model="formData.observacion"
                type="textarea"
                label="Observaciones"
                rows="2"
                :readonly="isReadOnly"
              />
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cerrar" color="grey-7" v-close-popup />
          <q-btn
            v-if="!isReadOnly"
            :label="isEditing ? 'Guardar Cambios' : 'Registrar Movimiento'"
            type="submit"
            color="primary"
            unelevated
            :disable="parseFloat(computedLitersTransferidos) <= 0 || parseFloat(litersOrigenDespues) < 0"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { useInternalTransferForm } from "./composables/useInternalTransferForm";

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
  isEditing: Boolean,
  isReadOnly: Boolean,
  llenaderosList: { type: Array, default: () => [] },
  tanksList: { type: Array, default: () => [] },
  sourceTankDetail: { type: Object, default: null },
  destinationTankDetail: { type: Object, default: null },
  destinationTankAforo: { type: [Object, Array], default: () => [] },
});

const emit = defineEmits([
  "update:modelValue",
  "save",
  "llenadero-changed",
  "source-tank-changed",
  "destination-tank-changed",
]);

const {
  formData, calculationMode, litersToTransfer, editing, manualEdit, liters,
  tieneAforo, isFormulaMode, computedLitersTransferidos, litersOrigenDespues,
  calculate, calculateFinalFromAmount, startEdit, finishEdit, initializeForm, resetAllStates
} = useInternalTransferForm(props, emit);

const almacenistaNombre = ref("");

// Filtrado de tanques destino (mismo combustible que origen)
const filteredDestinationTanks = computed(() => {
  if (!formData.value.id_tanque_origen || !props.sourceTankDetail) return [];
  
  // Usamos el id_tipo_combustible del detalle cargado
  const combustibleOrigen = props.sourceTankDetail.id_tipo_combustible;
  
  console.log("Combustible Origen:", combustibleOrigen);
  console.log("Lista de tanques disponibles:", props.tanksList);

  return props.tanksList.filter(t => {
    // Aseguramos comparación numérica y verificamos existencia de tipos
    const match = t.id_tanque !== formData.value.id_tanque_origen && 
                  Number(t.id_tipo_combustible) === Number(combustibleOrigen);
    return match;
  });
});

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    initializeForm();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    almacenistaNombre.value = `${user.nombre} ${user.apellido}`;
  }
});

watch(() => props.destinationTankDetail, () => {
    if (!manualEdit.final) calculate();
});

watch(() => props.destinationTankAforo, () => {
    if (!manualEdit.final) calculate();
});

function onLlenaderoSelect(id) {
  formData.value.id_tanque_origen = null;
  formData.value.id_tanque_destino = null;
  emit("llenadero-changed", id);
  resetAllStates();
}

function onSourceTankSelect(id) {
  formData.value.id_tanque_destino = null;
  emit("source-tank-changed", id);
  resetAllStates();
}

function onDestinationTankSelect(id) {
  emit("destination-tank-changed", id);
  formData.value.medida_vara_destino = null;
  resetAllStates();
}

function handleSaveInternal() {
  const payload = { ...formData.value };
  payload.cantidad_transferida = parseFloat(computedLitersTransferidos.value);
  payload.nivel_destino_despues = parseFloat(liters.final);
  payload.fecha_transferencia = `${formData.value.fecha}T${formData.value.hora}`;
  emit("save", payload);
}
</script>

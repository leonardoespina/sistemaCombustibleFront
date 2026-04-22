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

      <q-form @submit.prevent="confirmarTransferencia">
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

            <!-- LLENADEROS -->
            <div class="col-12 col-md-6">
              <q-select
                dense
                outlined
                v-model="formData.id_llenadero"
                :options="llenaderosList"
                option-value="id_llenadero"
                option-label="nombre_llenadero"
                label="Surtidor Origen *"
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
                :options="filteredSourceTanks"
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
                :option-label="(opt) => opt ? `${opt.Llenadero?.nombre_llenadero || 'Surtidor'} > ${opt.codigo} - ${opt.nombre}` : ''"
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
                    <span v-if="scope.opt">{{ scope.opt.Llenadero?.nombre_llenadero }} > {{ scope.opt.codigo }} - {{ scope.opt.nombre }}</span>
                    <span v-else-if="initialData?.TanqueDestino">{{ initialData.TanqueDestino.Llenadero?.nombre_llenadero }} > {{ initialData.TanqueDestino.codigo }} - {{ initialData.TanqueDestino.nombre }}</span>
                </template>
              </q-select>
              <div v-if="destinationTankDetail" class="text-caption text-grey-8 q-ml-sm">
                Nivel Actual: <strong>{{ destinationTankDetail.nivel_actual }} L</strong>
              </div>
              <div v-if="formData.id_tanque_origen && filteredDestinationTanks.length === 0" class="text-caption text-negative q-ml-sm">
                * No hay tanques compatibles disponibles.
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
              <q-card flat bordered :class="isTransferValid ? 'bg-blue-1 border-blue' : 'bg-red-1 border-red'">
                <q-card-section class="q-py-md">
                  <div class="row items-center justify-between q-col-gutter-sm">
                    <!-- Origen Balance -->
                    <div class="col-12 col-md-5 text-center">
                      <div class="text-caption text-grey-7 uppercase">Origen (Neto)</div>
                      <div class="text-h6 text-weight-bold" :class="parseFloat(litersOrigenDespues) < 0 ? 'text-negative' : 'text-primary'">
                        {{ litersOrigenDespues }} L
                      </div>
                      <div class="text-xxs text-grey-6">{{ sourceTankDetail?.nombre }}</div>
                    </div>

                    <!-- Dirección -->
                    <div class="col-12 col-md-2 text-center">
                      <q-icon
                        :name="isTransferValid ? 'trending_flat' : 'error_outline'"
                        :color="isTransferValid ? 'primary' : 'negative'"
                        size="md"
                      />
                      <div class="text-xxs uppercase text-weight-bold" :class="isTransferValid ? 'text-primary' : 'text-negative'">
                        {{ isTransferValid ? 'Transferir' : 'Inválido' }}
                      </div>
                    </div>

                    <!-- Destino Balance -->
                    <div class="col-12 col-md-5 text-center">
                      <div class="text-caption text-grey-7 uppercase">A Transferir</div>
                      <div class="text-h6 text-weight-bold" :class="isTransferValid ? 'text-primary' : 'text-negative'">
                        <span v-if="parseFloat(computedLitersTransferidos) > 0">+</span>{{ computedLitersTransferidos }} L
                      </div>
                      <div class="text-xxs text-grey-6">{{ destinationTankDetail?.nombre }}</div>
                    </div>
                  </div>

                  <!-- Mensajes de Error -->
                  <div v-if="!isTransferValid" class="q-mt-sm text-center">
                    <q-badge color="negative" class="q-pa-xs">
                      <q-icon name="warning" size="xs" class="q-mr-xs" />
                      <span v-if="parseFloat(computedLitersTransferidos) <= 0">La medición final debe ser mayor al nivel actual ({{ destinationTankDetail?.nivel_actual }} L).</span>
                      <span v-else-if="parseFloat(litersOrigenDespues) < 0">No hay suficiente combustible en el tanque origen.</span>
                      <span v-else>Medición o cantidad inválida.</span>
                    </q-badge>
                  </div>
                </q-card-section>
              </q-card>
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
            :disable="!isTransferValid"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.border-blue {
  border: 1px solid #2196f3;
}
.border-red {
  border: 1px solid #f44336;
}
</style>

<script setup>
import { ref, watch, computed } from "vue";
import { useQuasar } from "quasar";
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

const $q = useQuasar();

const {
  formData, calculationMode, litersToTransfer, editing, manualEdit, liters,
  tieneAforo, isFormulaMode, computedLitersTransferidos, litersOrigenDespues, isTransferValid,
  calculate, calculateFinalFromAmount, startEdit, finishEdit, cancelEdit, initializeForm, resetAllStates
} = useInternalTransferForm(props, emit);

const almacenistaNombre = ref("");

// Filtrado de tanques origen (pertenecientes al llenadero seleccionado)
const filteredSourceTanks = computed(() => {
  if (!formData.value.id_llenadero) return [];
  return props.tanksList.filter(t => Number(t.id_llenadero) === Number(formData.value.id_llenadero));
});

// Filtrado de tanques destino (mismo combustible que origen de forma global)
const filteredDestinationTanks = computed(() => {
  if (!formData.value.id_tanque_origen || !props.sourceTankDetail) return [];
  
  const combustibleOrigen = props.sourceTankDetail.id_tipo_combustible;
  
  return props.tanksList.filter(t => {
    return t.id_tanque !== formData.value.id_tanque_origen && 
           Number(t.id_tipo_combustible) === Number(combustibleOrigen);
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
  emit("source-tank-changed", null);
  emit("destination-tank-changed", null);
  resetAllStates();
}



function onSourceTankSelect(id) {
  formData.value.id_tanque_destino = null;
  emit("source-tank-changed", id);
  emit("destination-tank-changed", null);
  resetAllStates();
}

function onDestinationTankSelect(id) {
  emit("destination-tank-changed", id);
  formData.value.medida_vara_destino = null;
  resetAllStates();
}

function confirmarTransferencia() {
  // Obtener nombres de tanques y llenaderos
  const tanqueOrigen = props.tanksList.find(t => t.id_tanque === formData.value.id_tanque_origen);
  const tanqueDestino = props.tanksList.find(t => t.id_tanque === formData.value.id_tanque_destino);
  const llenadero = props.llenaderosList.find(l => l.id_llenadero === formData.value.id_llenadero);
  
  // Formatear fecha
  const fechaFormateada = new Date(formData.value.fecha).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  $q.dialog({
    title: "🔄 Confirmar Transferencia Interna",
    message: `
      <div style="text-align: left; line-height: 1.6;">
        <div style="margin-bottom: 16px; padding: 12px; background: #f5f5f5; border-radius: 8px; border-left: 4px solid #1976d2;">
          <div style="font-weight: bold; color: #1976d2; margin-bottom: 8px;">📍 Detalles de la Transferencia</div>
          <div style="margin-bottom: 4px;"><strong>🏢 Llenadero:</strong> ${llenadero?.nombre_llenadero || 'N/A'}</div>
          <div style="margin-bottom: 4px;"><strong>📅 Fecha:</strong> ${fechaFormateada}</div>
          <div style="margin-bottom: 4px;"><strong>⏰ Hora:</strong> ${formData.value.hora}</div>
          <div><strong>👤 Registrado por:</strong> ${almacenistaNombre.value}</div>
        </div>

        <div style="margin-bottom: 16px; padding: 12px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #28a745;">
          <div style="font-weight: bold; color: #28a745; margin-bottom: 8px;">🔄 Movimiento de Combustible</div>
          
          <div style="margin-bottom: 12px; padding: 8px; background: white; border-radius: 4px; border: 1px solid #e0e0e0;">
            <div style="font-weight: bold; color: #dc3545; margin-bottom: 4px;">📤 ORIGEN: ${tanqueOrigen?.codigo} - ${tanqueOrigen?.nombre}</div>
            <div style="font-size: 13px; color: #666;">
              <span style="margin-right: 12px;">📊 Nivel Actual: <strong>${props.sourceTankDetail?.nivel_actual?.toLocaleString() || 'N/A'} L</strong></span>
              <span>📉 Quedará: <strong>${Number(litersOrigenDespues).toLocaleString()} L</strong></span>
            </div>
          </div>

          <div style="text-align: center; margin: 8px 0;">
            <div style="font-size: 18px; color: #1976d2;">⬇️</div>
            <div style="font-weight: bold; color: #1976d2; font-size: 16px;">${Number(computedLitersTransferidos).toLocaleString()} L</div>
          </div>

          <div style="margin-bottom: 8px; padding: 8px; background: white; border-radius: 4px; border: 1px solid #e0e0e0;">
            <div style="font-weight: bold; color: #28a745; margin-bottom: 4px;">📥 DESTINO: ${tanqueDestino?.codigo} - ${tanqueDestino?.nombre}</div>
            <div style="font-size: 13px; color: #666;">
              <span style="margin-right: 12px;">📊 Nivel Actual: <strong>${props.destinationTankDetail?.nivel_actual?.toLocaleString() || 'N/A'} L</strong></span>
              <span>📈 Quedará: <strong>${Number(liters.final).toLocaleString()} L</strong></span>
            </div>
          </div>
        </div>
        
        <div style="padding: 12px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107; margin-bottom: 16px;">
          <div style="font-weight: bold; color: #856404; margin-bottom: 4px;">⚠️ Importante</div>
          <div style="color: #856404; font-size: 14px;">
            Esta acción registrará la <strong>transferencia interna</strong> de combustible entre tanques.
            Una vez confirmada, se actualizarán los niveles de inventario.
          </div>
        </div>
        
        <div style="text-align: center; color: #666; font-size: 14px;">
          ¿Desea continuar con el registro de la transferencia?
        </div>
      </div>
    `,
    cancel: {
      label: "❌ Cancelar",
      color: "grey-7",
      flat: true,
      'no-caps': true
    },
    ok: {
      label: "✅ Confirmar Transferencia",
      color: "primary",
      unelevated: true,
      'no-caps': true,
      icon: "swap_horiz"
    },
    persistent: true,
    html: true,
    style: "min-width: 500px;"
  }).onOk(() => {
    handleSaveInternal();
  });
}

function handleSaveInternal() {
  const payload = { ...formData.value };
  payload.cantidad_transferida = parseFloat(computedLitersTransferidos.value);
  payload.nivel_destino_despues = parseFloat(liters.final);
  payload.fecha_transferencia = `${formData.value.fecha}T${formData.value.hora}`;
  emit("save", payload);
}
</script>

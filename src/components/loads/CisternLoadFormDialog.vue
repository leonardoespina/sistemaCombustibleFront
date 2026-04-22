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

      <q-form @submit.prevent="confirmarCarga">
        <!-- Reemplazo a Stepper -->
        <q-stepper
          v-model="step"
          ref="stepper"
          color="primary"
          animated
          flat
        >
          <!-- PASO 1: Documentación y Transporte -->
          <q-step
            :name="1"
            title="Documentación y Transporte"
            icon="description"
            :done="step > 1"
          >
            <div class="row q-col-gutter-md q-pt-sm">
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
                <q-input dense outlined v-model="formData.fecha_emision" type="date" label="Fecha Emisión" :readonly="isReadOnly" />
              </div>
              <div class="col-12 col-md-3">
                <q-input dense outlined v-model="formData.fecha_recepcion" type="date" label="Fecha Recepción" :readonly="isReadOnly" />
              </div>
              <div class="col-12 col-md-3">
                <q-input dense outlined v-model.number="formData.litros_segun_guia" type="number" label="Litros según Guía" suffix="Lts" :readonly="isReadOnly" :rules="[(val) => !!val || 'Requerido']" @update:model-value="calculateAll" />
              </div>

              <div class="col-12 col-md-4">
                <q-input dense outlined v-model="formData.fecha" type="date" label="Fecha Llegada" :readonly="isReadOnly" :rules="[(val) => !!val || 'Requerido']" />
              </div>
              <div class="col-12 col-md-4">
                <q-input dense outlined v-model="formData.hora" type="time" label="Hora Llegada" :readonly="isReadOnly" :rules="[(val) => !!val || 'Requerido']" />
              </div>
              <div class="col-12 col-md-4">
                <q-input dense outlined v-model="tipoCombustible" label="Tipo Combustible" readonly bg-color="grey-2" />
              </div>

              <div class="col-12 col-md-4">
                <q-input dense outlined v-model="formData.placa_cisterna" label="Placa Cisterna" :readonly="isReadOnly" :rules="[(val) => !!val || 'Requerido']" />
              </div>
              <div class="col-12 col-md-4">
                <q-input dense outlined v-model="formData.nombre_chofer" label="Nombre Chofer" :readonly="isReadOnly" />
              </div>
              <div class="col-12 col-md-4">
                <q-input dense outlined v-model="almacenistaNombre" label="Almacenista Receptor" readonly filled />
              </div>
            </div>
          </q-step>

          <!-- PASO 2: Medición de Tanque -->
          <q-step
            :name="2"
            title="Medición de Tanques de Descarga"
            icon="straighten"
            :done="step > 2"
          >
            <div v-for="(tq, index) in tanquesForm" :key="index" class="q-mb-md q-pa-sm bg-grey-1 rounded-borders relative-position">
              <q-btn v-if="tanquesForm.length > 1 && (!isReadOnly && !isEditing)" flat round dense color="negative" icon="close" size="sm" class="absolute-top-right q-mt-xs q-mr-xs" @click="removeTanqueRow(index)">
                <q-tooltip>Eliminar Tanque</q-tooltip>
              </q-btn>
              
              <div class="text-subtitle2 text-primary q-mb-sm">Descarga #{{ index + 1 }} {{ tq.detail ? `- ${tq.detail.nombre}` : '' }}</div>

              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <q-select dense outlined v-model="tq.id_llenadero" :options="llenaderosList" option-value="id_llenadero" option-label="nombre_llenadero" label="Seleccionar Llenadero" emit-value map-options :readonly="isReadOnly || isEditing" @update:model-value="val => handleLlenaderoChange(index, val)" :rules="[(val) => !!val || 'Requerido']" />
                </div>
                <div class="col-12 col-md-6">
                  <q-select dense outlined v-model="tq.id_tanque" :options="tq.tanksList" option-value="id_tanque" :option-label="(opt) => `${opt.codigo} - ${opt.nombre}`" label="Seleccionar Tanque" emit-value map-options :disable="!tq.id_llenadero" :readonly="isReadOnly || isEditing" :rules="[(val) => !!val || 'Requerido']" @update:model-value="val => handleTanqueChange(index, val)" />
                </div>

                <!-- DISPONIBILIDAD DEL TANQUE -->
                <div class="col-12" v-if="tq.detail">
                  <q-card flat bordered class="q-pa-sm bg-blue-grey-1">
                    <div class="row items-center q-col-gutter-xs">
                      <div class="col-12 col-sm-6">
                        <div class="text-caption text-grey-7">Nivel Actual (Existencia)</div>
                        <div class="text-subtitle1 text-weight-bolder text-primary">
                          {{ parseFloat(tq.detail.nivel_actual).toLocaleString('es-VE', {minimumFractionDigits:2,maximumFractionDigits:2}) }} L
                        </div>
                      </div>
                      <div class="col-12 col-sm-6 text-right">
                        <div class="text-caption text-grey-7">Espacio para Descarga</div>
                        <div class="text-subtitle2 text-weight-bold"
                          :class="(parseFloat(tq.detail.capacidad_maxima) - parseFloat(tq.detail.nivel_actual)) <= 0 ? 'text-negative' : (parseFloat(tq.detail.capacidad_maxima) - parseFloat(tq.detail.nivel_actual)) < 2000 ? 'text-warning' : 'text-positive'">
                          {{ (parseFloat(tq.detail.capacidad_maxima) - parseFloat(tq.detail.nivel_actual)).toLocaleString('es-VE', {minimumFractionDigits:2,maximumFractionDigits:2}) }} L
                        </div>
                        <div class="text-caption text-grey-6">Cap. Máx: {{ parseFloat(tq.detail.capacidad_maxima).toLocaleString('es-VE', {minimumFractionDigits:2,maximumFractionDigits:2}) }} L</div>
                      </div>
                      <div class="col-12">
                        <q-linear-progress
                          :value="parseFloat(tq.detail.nivel_actual) / parseFloat(tq.detail.capacidad_maxima)"
                          rounded size="6px" color="primary" track-color="grey-3"
                        />
                      </div>
                    </div>
                  </q-card>
                </div>


                <div class="col-12 col-md-6">
                  <q-input dense outlined v-model.number="tq.medida_inicial" label="Medida Inicial (Vara)" type="number" :suffix="tq.detail?.unidad_medida || 'cm'" :readonly="isReadOnly" :disable="!tq.id_tanque" @update:model-value="calculateAll">
                    <template v-slot:append v-if="!isReadOnly && (tq.tieneAforo || tq.isFormulaMode)">
                      <q-btn flat round dense icon="edit" size="xs" color="primary" @click="startEditTank(index, 'inicial')"><q-tooltip>Editar volumen</q-tooltip></q-btn>
                    </template>
                  </q-input>
                  <div v-if="(tq.tieneAforo || tq.isFormulaMode) && tq.medida_inicial != null" class="text-caption text-grey-7 q-pl-sm q-mt-xs">
                    {{ tq.isFormulaMode ? "Volumen Calculado:" : "Volumen según Tabla:" }} <strong :class="{'text-orange': tq.litersWereEdited.inicial}">{{ tq.liters.inicial }} Lts</strong>
                  </div>
                  <q-input v-if="tq.editing.inicial" v-model.number="tq.liters.inicial" type="number" dense outlined label="Volumen Manual" class="q-mt-xs bg-orange-1" @blur="finishEditTank(index, 'inicial')" autofocus />
                </div>

                <div class="col-12 col-md-6">
                  <q-input dense outlined v-model.number="tq.medida_final" label="Medida Final (Vara)" type="number" :suffix="tq.detail?.unidad_medida || 'cm'" :readonly="isReadOnly" :disable="!tq.id_tanque" @update:model-value="calculateAll">
                    <template v-slot:append v-if="!isReadOnly && (tq.tieneAforo || tq.isFormulaMode)">
                      <q-btn flat round dense icon="edit" size="xs" color="primary" @click="startEditTank(index, 'final')"><q-tooltip>Editar volumen</q-tooltip></q-btn>
                    </template>
                  </q-input>
                  <div v-if="(tq.tieneAforo || tq.isFormulaMode) && tq.medida_final != null" class="text-caption text-grey-7 q-pl-sm q-mt-xs">
                    {{ tq.isFormulaMode ? "Volumen Calculado:" : "Volumen según Tabla:" }} <strong :class="{'text-orange': tq.litersWereEdited.final}">{{ tq.liters.final }} Lts</strong>
                  </div>
                  <q-input v-if="tq.editing.final" v-model.number="tq.liters.final" type="number" dense outlined label="Volumen Manual" class="q-mt-xs bg-orange-1" @blur="finishEditTank(index, 'final')" autofocus />
                </div>
              </div>
            </div>

            <div class="row justify-center q-mt-md" v-if="!isReadOnly && !isEditing">
              <q-btn flat color="secondary" icon="add" label="Añadir Tanque de Descarga" @click="addTanqueRow" />
            </div>

          </q-step>

          <!-- PASO 3: Aforo por Compartimiento -->
          <q-step
            :name="3"
            title="Aforo por Compartimiento"
            icon="view_week"
            :done="step > 3"
          >
             <div class="col-12 q-mb-md q-pt-sm">
              <q-card flat bordered class="bg-grey-1 q-pa-sm">
                <div class="row q-col-gutter-sm items-end" v-if="!isReadOnly">
                  <div class="col-12 col-md-3">
                    <q-input dense outlined bg-color="white" v-model.number="newAforoCompartimiento" type="number" label="Compartimiento N°" />
                  </div>
                  <div class="col-12 col-md-3">
                    <q-input dense outlined bg-color="white" v-model.number="newAforoAltura" type="number" label="Altura" suffix="cm" />
                  </div>
                  <div class="col-12 col-md-3">
                    <q-input dense outlined bg-color="white" v-model.number="newAforoVol" type="number" label="Volumen" suffix="L" />
                  </div>
                  <div class="col-12 col-md-3">
                    <q-btn icon="add" color="secondary" label="Agregar" unelevated @click="addAforoRow" class="full-width" />
                  </div>
                </div>

                <q-markup-table dense flat bordered class="q-mt-md bg-white" v-if="formData.aforo_compartimiento?.length">
                  <thead>
                    <tr class="bg-primary text-white">
                      <th class="text-center">Comp. N°</th>
                      <th class="text-center">Altura (cm)</th>
                      <th class="text-center">Volumen (L)</th>
                      <th class="text-center" v-if="!isReadOnly">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(fila, idx) in formData.aforo_compartimiento" :key="idx">
                      <td class="text-center text-weight-bold"># {{ fila.compartimiento }}</td>
                      <td class="text-center">{{ fila.altura_cm }} cm</td>
                      <td class="text-center text-weight-bold">{{ Number(fila.volumen_litros).toLocaleString() }} L</td>
                      <td class="text-center" v-if="!isReadOnly">
                        <q-btn flat dense round color="negative" icon="delete" size="sm" @click="removeAforoRow(idx)">
                          <q-tooltip>Eliminar fila</q-tooltip>
                        </q-btn>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="bg-grey-2">
                      <td colspan="2" class="text-right text-subtitle2 text-weight-bold uppercase">Total Aforo Cisterna:</td>
                      <td class="text-center text-subtitle1 text-weight-bold text-primary">{{ Number(totalAforoCisterna).toLocaleString() }} L</td>
                      <td v-if="!isReadOnly"></td>
                    </tr>
                  </tfoot>
                </q-markup-table>
                <div v-else class="text-center text-grey-6 q-pa-sm text-caption q-mt-sm">No hay aforo registrado para esta cisterna.</div>
              </q-card>
            </div>
          </q-step>

          <!-- PASO 4: Pesaje, Tiempos y Análisis Final -->
          <q-step
            :name="4"
            title="Resultados y Pesaje"
            icon="analytics"
          >
            <div class="row q-col-gutter-md q-pt-sm">
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

              <div class="col-12 q-mb-sm">
                <div class="row q-gutter-md">
                  <q-banner v-if="pesoNeto !== null" dense class="bg-grey-2 rounded-borders flex-grow-1">
                    Peso Neto: <strong>{{ pesoNeto.toFixed(2) }} Kg</strong>
                  </q-banner>
                  <q-banner dense class="bg-blue-1 text-blue-9 rounded-borders flex-grow-1">
                    <q-icon name="timer" size="sm" class="q-mr-xs" />
                    Tiempo Total: <strong>{{ tiempoTotalDescargaMinutos }} min</strong>
                  </q-banner>
                </div>
              </div>

              <!-- Resultados Analíticos -->
              <div class="col-12">
                <div class="text-subtitle2 text-primary text-weight-bold uppercase q-mb-sm">
                  Análisis Comparativo de Volúmenes Totales
                  <q-badge v-if="tanquesForm.some(t => t.litersWereEdited.inicial || t.litersWereEdited.final)" color="orange" class="q-ml-sm">Algún volumen editado manual</q-badge>
                </div>
                
                <div class="row q-col-gutter-sm">
                  <!-- 1. Volumen Guía -->
                  <div class="col-12 col-md-3">
                    <q-card flat bordered class="text-center h-100 bg-grey-2">
                      <q-card-section class="q-py-sm">
                        <div class="text-caption text-grey-8 uppercase">FACTURA/GUÍA</div>
                        <div class="text-h5 text-weight-bold text-grey-9 q-my-xs">{{ Number(formData.litros_segun_guia || 0).toLocaleString() }} L</div>
                        <div class="text-caption text-grey-7">Declarado origen</div>
                      </q-card-section>
                    </q-card>
                  </div>
                  
                  <!-- 2. Aforo Cisterna -->
                  <div class="col-12 col-md-3">
                    <q-card flat bordered class="text-center h-100" :class="`bg-${analysis.guiaVsAforo.color}-1`">
                      <q-card-section class="q-py-sm">
                        <div class="text-caption text-grey-8 uppercase">TOTAL AFOROS</div>
                        <div class="text-h5 text-weight-bold q-my-xs" :class="`text-${analysis.guiaVsAforo.color}`">{{ Number(totalAforoCisterna).toLocaleString() }} L</div>
                        
                        <div class="row justify-between text-caption text-grey-8 q-mt-sm">
                           <span>vs Guía:</span>
                           <span class="text-weight-bold line-height-1">
                             <q-icon v-if="parseFloat(analysis.guiaVsAforo.diffLiters) !== 0" :name="analysis.guiaVsAforo.icon" :color="analysis.guiaVsAforo.color" size="xs"/> 
                             {{ analysis.guiaVsAforo.diffLiters }} L ({{ analysis.guiaVsAforo.diffPercent }}%)
                           </span>
                        </div>
                      </q-card-section>
                    </q-card>
                  </div>

                  <!-- 3. Volumen Real Tanque -->
                  <div class="col-12 col-md-3">
                    <q-card flat bordered class="text-center h-100" :class="`bg-${analysis.guiaVsReal.color}-1`">
                      <q-card-section class="q-py-sm">
                        <div class="text-caption text-blue-9 text-weight-bold uppercase">TOTAL REAL (VARILLAJES)</div>
                        <div class="text-h4 text-primary text-weight-bold q-my-xs">{{ Number(globalLiters.recibido || 0).toLocaleString() }} L</div>
                        
                        <div class="row justify-between text-caption text-grey-8">
                           <span>Dif. vs Guía:</span>
                           <span class="text-weight-bold line-height-1">
                             <q-icon v-if="parseFloat(analysis.guiaVsReal.diffLiters) !== 0" :name="analysis.guiaVsReal.icon" :color="analysis.guiaVsReal.color" size="xs"/> 
                             {{ analysis.guiaVsReal.diffLiters }} L ({{ analysis.guiaVsReal.diffPercent }}%)
                           </span>
                        </div>
                      </q-card-section>
                    </q-card>
                  </div>

                  <!-- 4. Flujómetro -->
                  <div class="col-12 col-md-3">
                    <q-card flat bordered class="text-center h-100">
                      <q-card-section class="q-py-sm q-px-sm">
                        <div class="text-caption text-grey-8 uppercase">Flujómetro (Opcional)</div>
                        <q-input dense outlined v-model.number="formData.litros_flujometro" type="number" suffix="L" class="q-mt-xs q-mb-sm bg-white" :readonly="isReadOnly" @update:model-value="calculateAll" />
                        
                        <div v-if="formData.litros_flujometro && analysis.realVsFlujo" class="row justify-between text-caption text-grey-8">
                           <span>vs Real:</span>
                           <span class="text-weight-bold line-height-1" :class="`text-${analysis.realVsFlujo.color}`">
                             {{ analysis.realVsFlujo.diffLiters }} L ({{ analysis.realVsFlujo.diffPercent }}%)
                           </span>
                        </div>
                      </q-card-section>
                    </q-card>
                  </div>

                </div>
              </div>
              
              <!-- NUEVO: SELECTOR DE ORIGEN PARA ACTUALIZAR -->
              <div class="col-12 q-mt-md" v-if="!isReadOnly">
                <q-card flat bordered class="bg-grey-1">
                  <q-card-section>
                    <div class="text-subtitle2 text-primary text-weight-bold q-mb-sm">
                      Origen de Actualización del Nivel del Tanque
                    </div>
                    <div class="text-caption text-grey-8 q-mb-sm">
                      Seleccione cuál fuente de medición impactará físicamente al inventario final.
                    </div>
                    <q-option-group
                      v-model="formData.fuente_actualizacion"
                      :options="[
                        { label: 'Priorizar Flujómetro (Si está ingresado y reporta > 0)', value: 'FLUJOMETRO', disable: !(parseFloat(formData.litros_flujometro) > 0) },
                        { label: 'Priorizar Varillaje (Lectura técnica mediante regla final)', value: 'VARILLAJE' }
                      ]"
                      color="primary"
                      inline
                    />
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 q-mt-md">
                <q-input dense outlined v-model="formData.observacion" type="textarea" label="Observaciones" rows="2" :readonly="isReadOnly" />
              </div>
            </div>
          </q-step>

          <!-- Navegación del Stepper -->
          <template v-slot:navigation>
            <q-stepper-navigation>
              <q-separator class="q-mb-md" />
              <div class="row justify-end q-gutter-sm">
                <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
                
                <q-btn 
                  v-if="step > 1" 
                  flat 
                  color="primary" 
                  @click="step--" 
                  label="Anterior" 
                />
                <q-btn 
                  v-if="step < 4" 
                  unelevated 
                  color="primary" 
                  @click="step++" 
                  label="Siguiente" 
                />
                <q-btn 
                  v-if="step === 4 && !isReadOnly" 
                  :label="isEditing ? 'Guardar Cambios' : 'Registrar Recepción'" 
                  type="submit" 
                  color="positive" 
                  unelevated 
                  icon="check"
                />
              </div>
            </q-stepper-navigation>
          </template>
        </q-stepper>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, nextTick } from "vue";
import { useQuasar } from "quasar";
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

const $q = useQuasar();

const {
    formData, isInternalCistern, tipoCombustible, pesoNeto, step,
    tanquesForm, globalLiters, addTanqueRow, removeTanqueRow, 
    handleLlenaderoChange, handleTanqueChange, loadTanksListFor, 
    calculateAll, calculateTank, startEditTank, finishEditTank, cancelEditTank,
    calcularPesoNeto, initializeForm,
    newAforoCompartimiento, newAforoAltura, newAforoVol, addAforoRow, removeAforoRow, totalAforoCisterna, tiempoTotalDescargaMinutos,
    analysis
} = useCisternLoadForm(props, emit);

const almacenistaNombre = ref("");

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    initializeForm();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    almacenistaNombre.value = `${user.nombre} ${user.apellido}`;
  }
});

function confirmarCarga() {
  // Formatear fecha
  const fechaFormateada = new Date(formData.value.fecha).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Generar resumen de tanques
  const resumenTanques = tanquesForm.value.map(tq => {
    const tanqueNombre = tq.detail ? `${tq.detail.codigo} - ${tq.detail.nombre}` : 'Tanque no identificado';
    const litrosRecibidos = Number(tq.liters.recibido || 0).toLocaleString();
    const nivelFinal = Number(tq.liters.final || 0).toLocaleString();
    
    return `
      <div style="margin-bottom: 8px; padding: 8px; background: white; border-radius: 4px; border: 1px solid #e0e0e0;">
        <div style="font-weight: bold; color: #1976d2; margin-bottom: 4px;">${tanqueNombre}</div>
        <div style="font-size: 13px; color: #666;">
          <span style="margin-right: 12px;">📥 Recibido: <strong>${litrosRecibidos} L</strong></span>
          <span>📊 Nivel Final: <strong>${nivelFinal} L</strong></span>
        </div>
      </div>
    `;
  }).join('');

  $q.dialog({
    title: "🚛 Confirmar Carga de Cisterna",
    message: `
      <div style="text-align: left; line-height: 1.6;">
        <div style="margin-bottom: 16px; padding: 12px; background: #f5f5f5; border-radius: 8px; border-left: 4px solid #1976d2;">
          <div style="font-weight: bold; color: #1976d2; margin-bottom: 8px;">📍 Detalles de la Carga</div>
          <div style="margin-bottom: 4px;"><strong>📋 N° Guía:</strong> ${formData.value.numero_guia || 'N/A'}</div>
          <div style="margin-bottom: 4px;"><strong>🚛 Placa:</strong> ${formData.value.placa_cisterna || 'N/A'}</div>
          <div style="margin-bottom: 4px;"><strong>📅 Fecha:</strong> ${fechaFormateada}</div>
          <div style="margin-bottom: 4px;"><strong>⏰ Hora:</strong> ${formData.value.hora}</div>
          <div><strong>👤 Almacenista:</strong> ${almacenistaNombre.value}</div>
        </div>

        <div style="margin-bottom: 16px; padding: 12px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #28a745;">
          <div style="font-weight: bold; color: #28a745; margin-bottom: 8px;">📊 Resumen de Volúmenes</div>
          
            <div style="margin-bottom: 12px; padding: 8px; background: white; border-radius: 4px; border: 1px solid #e0e0e0;">
              <div style="font-weight: bold; color: #6c757d; margin-bottom: 4px;">📋 SEGÚN GUÍA: ${Number(formData.value.litros_segun_guia || 0).toLocaleString()} L</div>
              <div style="font-weight: bold; color: #28a745; margin-bottom: 4px;">📏 VOLUMEN RECIBIDO TOTAL: ${Number(globalLiters.recibido || 0).toLocaleString()} L</div>
              <div style="font-weight: bold; color: ${Number(globalLiters.faltante || 0) >= 0 ? '#28a745' : '#dc3545'};">📈 DIFERENCIA: ${Number(globalLiters.faltante || 0).toLocaleString()} L</div>
              <div style="font-size: 12px; color: #666; margin-top: 4px; font-style: italic;">
                * El Volumen Recibido Total es la suma de lo depositado en todos los tanques receptores.
              </div>
            </div>
        </div>

        <div style="margin-bottom: 16px; padding: 12px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #17a2b8;">
          <div style="font-weight: bold; color: #17a2b8; margin-bottom: 8px;">🛢️ Tanques de Descarga</div>
          ${resumenTanques}
        </div>
        
        <div style="padding: 12px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107; margin-bottom: 16px;">
          <div style="font-weight: bold; color: #856404; margin-bottom: 4px;">⚠️ Importante</div>
          <div style="color: #856404; font-size: 14px;">
            Esta acción registrará la <strong>carga de cisterna</strong> y actualizará los niveles de inventario.
            Una vez confirmada, se procesarán todas las mediciones y diferencias.
          </div>
        </div>
        
        <div style="text-align: center; color: #666; font-size: 14px;">
          ¿Desea continuar con el registro de la carga?
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
      label: "✅ Confirmar Carga",
      color: "positive",
      unelevated: true,
      'no-caps': true,
      icon: "local_shipping"
    },
    persistent: true,
    html: true,
    style: "min-width: 600px;"
  }).onOk(() => {
    handleSave();
  });
}

function handleSave() {
  const payload = { ...formData.value };
  
  // Incluimos el array procesado omitiendo campos grandes como 'detail'
  payload.tanques_descarga = tanquesForm.value.map(tq => ({
    id_tanque: tq.id_tanque,
    medida_inicial: parseFloat(tq.medida_inicial),
    medida_final: parseFloat(tq.medida_final),
    litros_iniciales: parseFloat(tq.liters.inicial),
    litros_finales: parseFloat(tq.liters.final),
    litros_recibidos: parseFloat(tq.liters.recibido)
  }));
  
  // Por si quieren los valores globales como cabecera (y retrocompatibilidad del backend)
  payload.litros_recibidos = parseFloat(globalLiters.recibido);
  payload.diferencia_guia = parseFloat(globalLiters.faltante);
  payload.fecha_llegada = `${formData.value.fecha}T${formData.value.hora}`;
  payload.tiempo_descarga = tiempoTotalDescargaMinutos.value;
  emit("save", payload);
}
</script>

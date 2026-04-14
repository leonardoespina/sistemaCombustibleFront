<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <q-card style="width: 800px; max-width: 90vw">
      <q-card-section class="row items-center">
        <div class="text-h6">
          {{ isEditing ? "Editar Tanque" : "Nuevo Tanque" }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-form @submit.prevent="onSave">
        <q-card-section class="q-pt-none">
          <div class="row q-col-gutter-md">
            <!-- Sección: Identificación -->
            <div class="col-12 text-subtitle2 text-primary">Identificación</div>
            
            <div class="col-12 col-md-4">
              <q-input
                dense
                outlined
                v-model="formData.codigo"
                label="Código *"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>
            <div class="col-12 col-md-8">
              <q-input
                dense
                outlined
                v-model="formData.nombre"
                label="Nombre del Tanque *"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>

            <!-- Sección: Ubicación y Tipo -->
            <div class="col-12 col-md-6">
              <q-select
                dense
                outlined
                v-model="formData.id_llenadero"
                :options="llenaderoOptions"
                label="Llenadero *"
                option-label="nombre_llenadero"
                option-value="id_llenadero"
                emit-value
                map-options
                use-input
                @filter="filterLlenaderos"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-select
                dense
                outlined
                v-model="formData.id_tipo_combustible"
                :options="combustibleOptions"
                label="Tipo de Combustible *"
                option-label="nombre"
                option-value="id_tipo_combustible"
                emit-value
                map-options
                use-input
                @filter="filterCombustibles"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>

            <!-- Sección: Especificaciones Técnicas -->
            <div class="col-12 text-subtitle2 text-primary q-pt-sm">Especificaciones Técnicas</div>
            
            <div class="col-12 col-md-4">
              <q-select
                dense
                outlined
                v-model="formData.tipo_tanque"
                :options="['RECTANGULAR', 'CILINDRICO']"
                label="Tipo de Tanque *"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-select
                dense
                outlined
                v-model="formData.unidad_medida"
                :options="[
                  { label: 'CM', value: 'CM' },
                  { label: 'M (Metros)', value: 'M' },
                  { label: 'PULG', value: 'PULGADAS' },
                  { label: 'MM', value: 'MM' }
                ]"
                label="Unidad de Medida *"
                emit-value
                map-options
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                dense
                outlined
                v-model.number="formData.capacidad_maxima"
                type="number"
                label="Capacidad Máxima (L) *"
                suffix="L"
                :rules="[(val) => val > 0 || 'Debe ser mayor a 0']"
              />
            </div>

            <!-- Nivel Actual -->
            <div class="col-12 col-md-4">
              <q-input
                dense
                outlined
                v-model.number="formData.nivel_actual"
                type="number"
                label="Nivel Actual (L) *"
                suffix="L"
                hint="Inventario inicial o actual"
                :rules="[(val) => val >= 0 || 'Debe ser mayor o igual a 0']"
              />
            </div>

            <!-- Dimensiones Dinámicas -->
            <div class="col-12 col-md-3">
              <q-input
                dense
                outlined
                v-model.number="formData.alto"
                type="number"
                label="Alto"
                :suffix="formData.unidad_medida"
                :rules="formData.tipo_tanque === 'RECTANGULAR'
                  ? [(val) => (val !== null && val > 0) || 'Requerido para tanque rectangular']
                  : []"
              />
            </div>
            <div class="col-12 col-md-3">
              <q-input
                dense
                outlined
                v-model.number="formData.largo"
                type="number"
                label="Largo"
                :suffix="formData.unidad_medida"
              />
            </div>
            
            <div class="col-12 col-md-3" v-if="formData.tipo_tanque === 'RECTANGULAR'">
              <q-input
                dense
                outlined
                v-model.number="formData.ancho"
                type="number"
                label="Ancho"
                :suffix="formData.unidad_medida"
              />
            </div>
            <div class="col-12 col-md-3" v-if="formData.tipo_tanque === 'CILINDRICO'">
              <q-input
                dense
                outlined
                v-model.number="formData.radio"
                type="number"
                label="Radio"
                :suffix="formData.unidad_medida"
              />
            </div>

            <!-- Sección: Alarmas y Estado -->
            <div class="col-12 text-subtitle2 text-primary q-pt-sm">Alarmas y Estado</div>
            
            <div class="col-12 col-md-4">
              <q-input
                dense
                outlined
                v-model.number="formData.nivel_alarma_bajo"
                type="number"
                label="Nivel Alarma Bajo"
                color="orange"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                dense
                outlined
                v-model.number="formData.nivel_alarma_alto"
                type="number"
                label="Nivel Alarma Alto"
                color="negative"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-select
                dense
                outlined
                v-model="formData.estado"
                :options="['ACTIVO', 'INACTIVO', 'MANTENIMIENTO', 'CONTAMINADO']"
                label="Estado"
              />
            </div>
            
            <div class="col-12 col-md-4">
               <q-toggle 
                 v-model="formData.activo_para_despacho" 
                 label="Activo para Despacho" 
                 color="positive"
               />
               <q-tooltip>Indica si el sistema debe descontar litros de este tanque al despachar este tipo de combustible</q-tooltip>
            </div>

            <!-- Opción de Aforo -->
            <div class="col-12 q-pt-md">
               <q-toggle 
                 v-model="formData.con_aforo" 
                 label="El tanque posee tabla de aforo (Calibración manual)" 
                 color="primary"
                 icon="table_chart"
               />
               <div v-if="formData.con_aforo" class="text-caption text-grey-7 q-ml-lg">
                 * Se utilizará la tabla de aforo cargada para los cálculos de volumen.
               </div>
               <div v-else class="text-caption text-grey-7 q-ml-lg">
                 * El volumen se calculará automáticamente mediante fórmulas geométricas.
               </div>
            </div>

            <!-- SECCIÓN: TABLA DE AFORO -->
            <div v-if="formData.con_aforo" class="col-12">
              <q-separator q-my-md />
              <div class="row items-center justify-between q-mb-sm">
                <div class="text-subtitle2 text-primary">Tabla de Calibración (Aforo)</div>
                <div class="q-gutter-sm">
                  <q-btn flat dense icon="code" color="secondary" label="Carga JSON" @click="openJsonEditor">
                    <q-tooltip>Pegar datos en formato JSON</q-tooltip>
                  </q-btn>
                  <q-btn dense icon="add" color="primary" label="Nueva Fila" @click="addAforoRow" />
                </div>
              </div>

              <div class="aforo-container border-grey q-pa-sm rounded-borders scroll" style="max-height: 300px;">
                <div v-if="!formData.aforo || formData.aforo.length === 0" class="text-center q-pa-md text-grey-6">
                  No hay datos cargados. Use el botón "Nueva Fila" o "Carga JSON".
                </div>
                <div v-else>
                  <div class="row q-col-gutter-sm q-mb-xs text-weight-bold text-grey-8">
                    <div class="col-5">Altura ({{ formData.unidad_medida }})</div>
                    <div class="col-5">Volumen (Litros)</div>
                    <div class="col-2 text-center">Acción</div>
                  </div>

                  <div v-for="(row, index) in formData.aforo" :key="index" class="row q-col-gutter-sm q-mb-sm items-center">
                    <div class="col-5">
                      <q-input 
                        v-model.number="row.altura" 
                        type="number" 
                        dense 
                        outlined 
                        step="0.01" 
                        :suffix="formData.unidad_medida"
                      />
                    </div>
                    <div class="col-5">
                      <q-input v-model.number="row.volumen" type="number" dense outlined step="0.01" />
                    </div>
                    <div class="col-2 text-center">
                      <q-btn flat round dense icon="delete" color="negative" @click="removeAforoRow(index)" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn label="Guardar" type="submit" color="primary" :loading="loading" />
        </q-card-actions>
      </q-form>
    </q-card>

    <!-- DIÁLOGO INTERNO: EDITOR JSON -->
    <q-dialog v-model="jsonEditorVisible">
      <q-card style="width: 500px">
        <q-card-section>
          <div class="text-h6">Carga Masiva de Aforo</div>
          <div class="text-caption">Pegue un arreglo de objetos: [ { "altura": 10, "volumen": 150 }, ... ]</div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="rawJson"
            type="textarea"
            outlined
            rows="10"
            placeholder='[ {"altura": 1, "volumen": 50}, {"altura": 2, "volumen": 100} ]'
            :error="!!jsonError"
            :error-message="jsonError"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Importar" @click="applyJson" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script setup>
import { watch, onMounted } from "vue";
import { useTankForm } from "./composables/useTankForm.js";

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
  isEditing: Boolean,
  loading: Boolean
});

const emit = defineEmits(["update:modelValue", "save"]);

const {
  formData,
  llenaderoOptions,
  combustibleOptions,
  jsonEditorVisible,
  rawJson,
  jsonError,
  initializeForm,
  filterLlenaderos,
  filterCombustibles,
  addAforoRow,
  removeAforoRow,
  openJsonEditor,
  applyJson,
  onSave
} = useTankForm(props, emit);

onMounted(async () => {
    if (props.modelValue) await initializeForm();
});

watch(() => props.modelValue, async (val) => {
    if (val) await initializeForm();
});
</script>

<style scoped>
.aforo-container {
  border: 1px solid #ddd;
  background: #f9f9f9;
}
</style>

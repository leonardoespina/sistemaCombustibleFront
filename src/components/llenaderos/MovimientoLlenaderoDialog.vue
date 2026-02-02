<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
    transition-show="slide-up"
    transition-hide="slide-down"
    full-width
    full-height
  >
    <q-card class="bg-grey-2 column no-wrap">
      <!-- Cabecera -->
      <q-bar class="bg-primary text-white q-py-md">
        <q-icon name="compare_arrows" />
        <div class="text-weight-bold text-subtitle1">
          Gestión de Movimientos de Inventario
        </div>
        <q-space />
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Cerrar Ventana</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section class="col q-pa-md scroll">
        <q-form @submit.prevent="submit">
          <div class="row q-col-gutter-lg items-start">
            
            <!-- SECCIÓN IZQUIERDA: Formulario -->
            <div class="col-12 col-md-7 column q-gutter-y-md">
              <q-card class="q-pa-md shadow-2">
                <div class="text-h6 q-mb-md text-primary">Detalles de Operación</div>
                
                <!-- Selector de Tipo -->
                <div class="q-mb-md">
                  <div class="text-caption text-grey-8 q-mb-sm">Tipo de Movimiento</div>
                  <q-btn-toggle
                    v-model="formData.tipo_movimiento"
                    spread
                    no-caps
                    rounded
                    unelevated
                    toggle-color="primary"
                    color="white"
                    text-color="primary"
                    :options="[
                      { label: 'Recepción de Cisterna (Carga)', value: 'CARGA', icon: 'local_shipping' },
                      { label: 'Registro de Evaporación', value: 'EVAPORACION', icon: 'opacity' }
                    ]"
                    @update:model-value="formData.id_llenadero = null" 
                  />
                  <!-- Nota: Reseteamos llenadero al cambiar tipo para forzar validación fresca -->
                </div>

                <!-- Selector de Llenadero -->
                <q-select
                  v-model="formData.id_llenadero"
                  :options="store.llenaderoOptions"
                  option-value="id_llenadero"
                  option-label="nombre_llenadero"
                  emit-value
                  map-options
                  label="Seleccione Llenadero"
                  outlined
                  dense
                  :rules="[val => !!val || 'Requerido']"
                >
                  <template v-slot:option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section>
                        <q-item-label>{{ scope.opt.nombre_llenadero }}</q-item-label>
                        <q-item-label caption>
                          {{ scope.opt.TipoCombustible?.nombre || 'Combustible Desconocido' }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>

                <!-- Cantidad Principal -->
                <q-input
                  v-model="formData.cantidad"
                  type="number"
                  label="Cantidad (Litros)"
                  outlined
                  dense
                  :rules="[
                    val => !!val || 'Requerido',
                    val => parseFloat(val) > 0 || 'Debe ser mayor a 0'
                  ]"
                  class="q-mb-sm"
                >
                  <template v-slot:prepend>
                    <q-icon name="water_drop" />
                  </template>
                </q-input>

                <!-- Campos Específicos para CARGA -->
                <div v-if="formData.tipo_movimiento === 'CARGA'" class="q-gutter-y-sm animate-fade">
                  <q-separator class="q-my-sm" />
                  <div class="text-subtitle2 text-grey-8">Datos Administrativos de Carga</div>
                  
                  <div class="row q-col-gutter-sm">
                    <div class="col-12 col-sm-6">
                      <q-input
                        v-model="formData.numero_factura"
                        label="Número de Factura"
                        outlined
                        dense
                        :rules="[val => !!val || 'Requerido para Carga']"
                      />
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-input
                        v-model="formData.datos_gandola"
                        label="Placa Gandola / Transporte"
                        outlined
                        dense
                        :rules="[val => !!val || 'Requerido para Carga']"
                      />
                    </div>
                  </div>

                  <div class="row q-col-gutter-sm">
                    <div class="col-12 col-sm-6">
                      <q-input
                        v-model="formData.nombre_conductor"
                        label="Nombre Conductor"
                        outlined
                        dense
                        :rules="[val => !!val || 'Requerido para Carga']"
                      />
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-input
                        v-model="formData.cedula_conductor"
                        label="Cédula Conductor"
                        outlined
                        dense
                        :rules="[val => !!val || 'Requerido para Carga']"
                      />
                    </div>
                  </div>
                </div>

                <!-- Observación (Común) -->
                <q-input
                  v-model="formData.observacion"
                  type="textarea"
                  label="Observación / Justificación"
                  outlined
                  dense
                  class="q-mt-md"
                  rows="3"
                  :rules="[val => !!val || 'Requerido']"
                />

              </q-card>
            </div>

            <!-- SECCIÓN DERECHA: Estadísticas y Proyección -->
            <div class="col-12 col-md-5 column q-gutter-y-md">
              
              <!-- Tarjeta de Estado ACTUAL -->
              <q-card class="bg-white text-dark q-pa-md shadow-2">
                <div class="text-subtitle2 text-grey-7">ESTADO ACTUAL</div>
                <div class="text-h4 text-weight-bold text-primary">
                  {{ selectedLlenaderoObj ? selectedLlenaderoObj.disponibilidadActual : 0 }} <span class="text-h6">Lts</span>
                </div>
                <div class="text-caption">
                  Capacidad Total: {{ capacity }} Lts
                </div>
                <q-linear-progress 
                  :value="selectedLlenaderoObj ? (selectedLlenaderoObj.disponibilidadActual / capacity) : 0" 
                  color="primary" 
                  class="q-mt-sm" 
                  size="10px"
                  rounded
                />
              </q-card>

              <!-- Tarjeta de Proyección (PREVIEW) -->
              <q-card 
                class="q-pa-md shadow-2 text-white"
                :class="{
                  'bg-positive': isValid && formData.tipo_movimiento === 'CARGA',
                  'bg-warning text-dark': isValid && formData.tipo_movimiento === 'EVAPORACION',
                  'bg-grey-6': !isValid || !formData.id_llenadero,
                  'bg-negative': !isValid && formData.id_llenadero && (newStock < 0 || newStock > capacity)
                }"
              >
                <div class="text-subtitle2">ESTADO FINAL (PROYECCIÓN)</div>
                <div class="text-h3 text-weight-bolder q-my-sm">
                  {{ newStock }} <span class="text-h6">Lts</span>
                </div>
                
                <div v-if="formData.id_llenadero">
                  <div v-if="newStock > capacity" class="row items-center q-gutter-x-sm">
                    <q-icon name="warning" size="sm" />
                    <span>Excede la capacidad del tanque!</span>
                  </div>
                  <div v-else-if="newStock < 0" class="row items-center q-gutter-x-sm">
                    <q-icon name="error" size="sm" />
                    <span>Inventario negativo no permitido!</span>
                  </div>
                  <div v-else class="row items-center q-gutter-x-sm">
                    <q-icon name="check_circle" size="sm" />
                    <span>Operación válida</span>
                  </div>
                </div>
                <div v-else>
                  Seleccione un llenadero
                </div>
              </q-card>

              <!-- Resumen de Reglas -->
              <q-card class="bg-blue-1 text-blue-9 q-pa-md" flat bordered>
                <div class="row items-center q-mb-sm">
                  <q-icon name="info" size="sm" class="q-mr-sm" />
                  <div class="text-weight-bold">Reglas de Negocio</div>
                </div>
                <ul class="q-pl-md q-my-none text-body2">
                  <li v-if="formData.tipo_movimiento === 'CARGA'">
                    La recepción aumenta el inventario disponible.
                  </li>
                  <li v-if="formData.tipo_movimiento === 'CARGA'">
                    Se requiere factura y datos de conductor obligatorios.
                  </li>
                  <li v-if="formData.tipo_movimiento === 'EVAPORACION'">
                    La evaporación reduce el inventario (Pérdida).
                  </li>
                  <li v-if="formData.tipo_movimiento === 'EVAPORACION'">
                    <strong>Solo permitido para Gasolina.</strong>
                  </li>
                </ul>
              </q-card>

            </div>
          </div>

          <!-- Acciones Footer -->
          <div class="row justify-end q-mt-lg q-gutter-x-md">
            <q-btn 
              label="Cancelar" 
              flat 
              color="grey-8" 
              v-close-popup 
            />
            <q-btn 
              :label="formData.tipo_movimiento === 'CARGA' ? 'Registrar Recepción' : 'Registrar Evaporación'"
              type="submit"
              color="primary"
              icon="save"
              size="lg"
              :disable="!isValid || store.loading"
              :loading="store.loading"
            />
          </div>

        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { onMounted, watch } from "vue";
import { useMovimientoLlenaderoStore } from "../../stores/movimientoLlenaderoStore";
import { useMovimientoForm } from "./composables/useMovimientoForm";

// Props y Emits
const props = defineProps({
  modelValue: Boolean
});

const emit = defineEmits(["update:modelValue", "save"]);

// Store
const store = useMovimientoLlenaderoStore();

// Composable
const {
  formData,
  selectedLlenaderoObj,
  currentStock,
  capacity,
  newStock,
  percentage,
  isValid,
  resetForm,
  submit
} = useMovimientoForm(emit);

// Cargar lista al montar o abrir
watch(() => props.modelValue, (val) => {
  if (val) {
    store.fetchLlenaderosList();
    resetForm();
  }
});

onMounted(() => {
  if (props.modelValue) {
    store.fetchLlenaderosList();
  }
});
</script>

<style>
/* Animación simple para campos condicionales */
.animate-fade {
  animation: fadeIn 0.3s ease-in-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>

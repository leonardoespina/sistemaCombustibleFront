<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
    transition-show="scale"
    transition-hide="scale"
  >
    <q-card style="width: 600px; max-width: 95vw">
      <q-bar class="bg-primary text-white">
        <q-icon name="local_shipping" />
        <div class="text-weight-bold text-subtitle1">
          Gestión Combustible - Recepción
        </div>
        <q-space />
        <div class="text-weight-bold q-mr-md" v-if="selectedLlenaderoObj">
          Capacidad: {{ capacity }} Lts
        </div>
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Cerrar Ventana</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <q-form @submit.prevent="submit">
          <!-- Fecha y Hora (Colocada por el usuario) -->
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12">
              <q-input 
                outlined 
                dense 
                v-model="formData.fecha_movimiento" 
                label="Fecha y Hora del Movimiento"
                hint="Formato: AAAA/MM/DD HH:mm"
              >
                <template v-slot:prepend>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="formData.fecha_movimiento" mask="YYYY/MM/DD HH:mm">
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Cerrar" color="primary" flat />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>

                <template v-slot:append>
                  <q-icon name="access_time" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-time v-model="formData.fecha_movimiento" mask="YYYY/MM/DD HH:mm" format24h>
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Cerrar" color="primary" flat />
                        </div>
                      </q-time>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
          </div>
          
          <!-- Llenadero + Cantidad -->
          <div class="row q-col-gutter-md q-mb-sm">
            <div class="col-12 col-sm-7 column q-gutter-y-sm">
              <q-select
                v-model="formData.id_llenadero"
                :options="store.llenaderoOptions"
                option-value="id_llenadero"
                option-label="nombre_llenadero"
                emit-value
                map-options
                label="Llenadero"
                outlined
                dense
                :rules="[val => !!val || 'Requerido']"
              />

              <q-input
                v-model="formData.cantidad"
                type="number"
                label="Volumen Real Litros (Lts)"
                outlined
                dense
                bg-color="red-1"
                class="text-weight-bold"
                :rules="[
                  val => !!val || 'Requerido',
                  val => parseFloat(val) > 0 || 'Debe ser mayor a 0'
                ]"
              >
                <template v-slot:prepend><q-icon name="water_drop" color="negative" /></template>
              </q-input>
            </div>

            <!-- Detalles ACTUAL y FINAL -->
            <div class="col-12 col-sm-5 column q-gutter-y-sm">
               <q-card flat bordered class="bg-grey-1">
                 <div class="text-caption q-px-sm bg-grey-3">Detalles ACTUAL</div>
                 <q-card-section class="q-pa-xs">
                   <q-input :model-value="currentStock" label="Disponibilidad: Litros (LTS)" outlined dense readonly bg-color="white" />
                   <q-input :model-value="currentPercentage.toFixed(2) + ' %'" label="% Disponibilidad" outlined dense readonly bg-color="white" class="q-mt-xs" />
                 </q-card-section>
               </q-card>

               <q-card flat bordered class="bg-grey-1">
                 <div class="text-caption q-px-sm bg-grey-3">Detalles FINAL</div>
                 <q-card-section class="q-pa-xs">
                   <q-input :model-value="newStock" label="Disponibilidad: Litros (LTS)" outlined dense readonly bg-color="white" />
                   <q-input :model-value="percentage.toFixed(2) + ' %'" label="% Disponibilidad" outlined dense readonly bg-color="white" class="q-mt-xs" />
                 </q-card-section>
               </q-card>
            </div>
          </div>

          <q-separator class="q-mb-md" />
          <div class="text-subtitle2 text-grey-8 q-mb-sm">Datos Administrativos</div>

          <!-- Datos Carga -->
          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <q-input v-model="formData.numero_factura" label="N° Factura" outlined dense :rules="[val => !!val || 'Requerido']" />
            </div>
            <div class="col-6">
              <q-input v-model="formData.datos_gandola" label="Placa Transporte" outlined dense :rules="[val => !!val || 'Requerido']" />
            </div>
            <div class="col-6">
              <q-input v-model="formData.nombre_conductor" label="Conductor" outlined dense :rules="[val => !!val || 'Requerido']" />
            </div>
            <div class="col-6">
              <q-input v-model="formData.cedula_conductor" label="Cédula" outlined dense :rules="[val => !!val || 'Requerido']" />
            </div>
          </div>

          <!-- Observación y Volumen Final -->
          <div class="row q-col-gutter-md q-mt-xs">
            <div class="col-12 col-sm-7">
              <q-input
                v-model="formData.observacion"
                label="Observación"
                outlined
                dense
                type="textarea"
                rows="2"
                :rules="[val => !!val || 'Requerido']"
              />
            </div>
            <div class="col-12 col-sm-5 flex flex-center column">
               <div class="text-subtitle2 text-blue-9 text-weight-bolder">VOLUMEN FINAL</div>
               <q-input :model-value="newStock" outlined dense readonly bg-color="white" input-class="text-h6 text-center text-weight-bolder text-blue-9" />
            </div>
          </div>

          <!-- Footer -->
          <div class="row justify-end q-mt-md q-gutter-x-sm">
            <q-btn label="Cancelar" flat v-close-popup color="grey-8" />
            <q-btn 
              label="Registrar Recepción" 
              type="submit" 
              color="primary" 
              icon="save"
              :loading="store.loading"
              :disable="!isValid"
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
  currentPercentage,
  capacity,
  newStock,
  percentage,
  isValid,
  resetForm,
  submit
} = useMovimientoForm(emit);

// Asegurar que el tipo sea siempre CARGA
watch(() => formData.value.tipo_movimiento, (val) => {
  if (val !== 'CARGA') formData.value.tipo_movimiento = 'CARGA';
}, { immediate: true });

// Cargar lista al montar o abrir
watch(() => props.modelValue, (val) => {
  if (val) {
    store.fetchLlenaderosList();
    resetForm();
    formData.value.tipo_movimiento = 'CARGA'; // Force
  }
});

onMounted(() => {
  if (props.modelValue) {
    store.fetchLlenaderosList();
  }
});
</script>

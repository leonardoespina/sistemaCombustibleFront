<!-- src/components/dispatches/RequestFormDialog.vue -->
<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <q-card style="width: 600px; max-width: 90vw">
      <q-card-section class="row items-center">
        <div class="text-h6">Generar Solicitud de Combustible</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-form @submit.prevent="onSave">
        <q-card-section class="q-gutter-y-md q-pt-none">
          
          <!-- Seleccionar Vehículo -->
          <q-select
            v-model="formData.id_vehiculo"
            label="Vehículo / Equipo *"
            outlined
            dense
            use-input
            @filter="filterVehicles"
            :options="vehicleOptions"
            option-value="id_vehiculo"
            option-label="placa"
            emit-value
            map-options
            @update:model-value="onVehicleSelect"
            :rules="[val => !!val || 'Requerido']"
          >
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>{{ scope.opt.placa }}</q-item-label>
                  <q-item-label caption>{{ scope.opt.Marca?.nombre }} - {{ scope.opt.Modelo?.nombre }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <!-- Info de Cupo (Solo lectura informativa) -->
          <div v-if="quotaInfo && quotaInfo.disponible !== null" class="bg-grey-2 q-pa-sm rounded-borders">
            <div class="row items-center justify-between">
              <span class="text-caption">Cupo Disponible ({{ quotaInfo.combustible }}):</span>
              <span class="text-weight-bold" :class="quotaInfo.disponible > 0 ? 'text-positive' : 'text-negative'">
                {{ quotaInfo.disponible }} L
              </span>
            </div>
            <q-linear-progress :value="quotaInfo.disponible / quotaInfo.asignado" class="q-mt-xs" />
          </div>

          <div class="row q-col-gutter-sm">
            <!-- Tipo Suministro -->
            <div class="col-12 col-md-6">
              <q-select
                v-model="formData.tipo_suministro"
                label="Tipo Suministro"
                outlined
                dense
                :options="['REGULAR', 'BIDON']"
              />
            </div>
            <!-- Tipo Solicitud -->
            <div class="col-12 col-md-6">
              <q-select
                v-model="formData.tipo_solicitud"
                label="Tipo Solicitud"
                outlined
                dense
                :options="['INSTITUCIONAL', 'VENTA']"
                @update:model-value="onTipoSolicitudChange"
              />
            </div>
          </div>

          <!-- Tipo de Pago (solo para VENTA) -->
          <q-select
            v-if="formData.tipo_solicitud === 'VENTA'"
            v-model="formData.moneda_pago"
            label="Tipo de Pago"
            outlined
            dense
            :options="['USD', 'VES']"
            :rules="[val => !!val || 'Requerido para ventas']"
          />

          <!-- Litros a Solicitar -->
          <q-input
            v-model.number="formData.litros_solicitado"
            type="number"
            label="Litros a Solicitar *"
            outlined
            dense
            suffix="L"
            :rules="[
              val => !!val || 'Requerido',
              val => val > 0 || 'Debe ser mayor a 0',
              val => !quotaInfo || val <= quotaInfo.disponible || 'Excede el cupo disponible'
            ]"
          />


        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn 
            label="Generar Solicitud" 
            type="submit" 
            color="primary" 
            :loading="loading"
            :disable="quotaInfo && quotaInfo.disponible <= 0"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import api from "../../api";

const props = defineProps({
  modelValue: Boolean,
});

const emit = defineEmits(["update:modelValue", "save"]);

const formData = ref({
  id_vehiculo: null,
  litros_solicitado: null,
  tipo_suministro: "REGULAR",
  tipo_solicitud: "INSTITUCIONAL"
});

const loading = ref(false);
const vehicleOptions = ref([]);
const quotaInfo = ref(null);

let allVehicles = [];

onMounted(() => {
  loadInitialData();
});

watch(() => props.modelValue, (val) => {
  if (val) resetForm();
});

async function loadInitialData() {
  try {
    const resVeh = await api.get("/vehiculos/lista");
    // Filtrar vehículos por dependencia del usuario (si no es ADMIN)
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    let vehiclesList = resVeh.data;

    if (user && user.tipo_usuario !== 'ADMIN' && user.id_dependencia) {
      vehiclesList = vehiclesList.filter(v => Number(v.id_dependencia) === Number(user.id_dependencia));
    }

    allVehicles = vehiclesList;
    vehicleOptions.value = allVehicles;
  } catch (error) {
    console.error("Error cargando datos:", error);
  }
}

function resetForm() {
  formData.value = {
    id_vehiculo: null,
    litros_solicitado: null,
    tipo_suministro: "REGULAR",
    tipo_solicitud: "INSTITUCIONAL"
  };
  quotaInfo.value = null;
}

function filterVehicles(val, update) {
  update(() => {
    const needle = val.toLowerCase();
    vehicleOptions.value = allVehicles.filter(v => v.placa.toLowerCase().indexOf(needle) > -1);
  });
}

async function onVehicleSelect(vehicleId) {
  if (!vehicleId) {
    quotaInfo.value = null;
    return;
  }
  
  const vehicle = allVehicles.find(v => v.id_vehiculo === vehicleId);
  if (vehicle) {
    // Buscamos el cupo disponible para la dependencia del vehículo y el tipo de combustible
    try {
      // Nota: Este endpoint debe existir o ser filtrado desde CuposActuales
      const { data } = await api.get("/cupos/actual", {
        params: {
          id_dependencia: vehicle.id_dependencia,
          id_tipo_combustible: vehicle.id_tipo_combustible
        }
      });
      
      if (data) {
        quotaInfo.value = {
          disponible: parseFloat(data.cantidad_disponible),
          asignado: parseFloat(data.cantidad_asignada),
          combustible: vehicle.TipoCombustible?.nombre || 'Combustible'
        };
        // Auto-asignar jerarquía al formData para el backend
        formData.value.id_categoria = vehicle.id_categoria;
        formData.value.id_dependencia = vehicle.id_dependencia;
        formData.value.id_subdependencia = vehicle.id_subdependencia;
        formData.value.id_tipo_combustible = vehicle.id_tipo_combustible;
      }
    } catch (e) {
      quotaInfo.value = null;
    }
  }
}

function onTipoSolicitudChange(tipoSolicitud) {
  // Limpiar el tipo de pago cuando se cambia de VENTA a INSTITUCIONAL
  if (tipoSolicitud !== 'VENTA') {
    formData.value.moneda_pago = null;
  }
}

function onSave() {
  emit("save", formData.value);
}
</script>

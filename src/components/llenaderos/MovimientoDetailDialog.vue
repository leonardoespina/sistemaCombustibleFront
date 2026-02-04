<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card style="min-width: 400px; max-width: 600px">
      <q-toolbar class="bg-primary text-white">
        <q-icon name="info" size="sm" />
        <q-toolbar-title>Detalle de Movimiento</q-toolbar-title>
        <q-btn flat round dense icon="close" v-close-popup />
      </q-toolbar>

      <q-card-section v-if="data" class="q-pa-md">
        <q-banner dense class="bg-grey-3 text-grey-8 q-mb-md rounded-borders">
          <template v-slot:avatar>
            <q-icon name="lock" color="grey-7" />
          </template>
          Registro finalizado. No admite modificaciones.
        </q-banner>

        <div class="row q-col-gutter-sm">
          
          <!-- Encabezado con Icono Grande -->
          <div class="col-12 text-center q-mb-sm">
            <q-avatar 
              size="lg" 
              :color="data.tipo_movimiento === 'CARGA' ? 'positive' : 'negative'" 
              text-color="white"
              :icon="data.tipo_movimiento === 'CARGA' ? 'local_shipping' : 'opacity'"
            />
            <div class="text-subtitle1 q-mt-xs font-weight-bold">{{ data.tipo_movimiento === 'CARGA' ? 'Recepción de Cisterna' : 'Evaporación Registrada' }}</div>
          </div>

          <!-- Info Principal -->
          <div class="col-12">
            <q-list dense bordered separator class="rounded-borders">
              <q-item>
                <q-item-section avatar>
                  <q-icon name="event" color="primary" size="xs"/>
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>Fecha y Hora</q-item-label>
                  <q-item-label class="text-weight-medium">{{ formatDate(data.fecha_movimiento) }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon name="ev_station" color="primary" size="xs"/>
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>Llenadero</q-item-label>
                  <q-item-label class="text-weight-medium">{{ data.Llenadero?.nombre_llenadero || 'N/A' }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon name="person" color="primary" size="xs"/>
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>Registrado Por</q-item-label>
                  <q-item-label>
                    {{ data.Usuario ? `${data.Usuario.nombre} ${data.Usuario.apellido}` : 'Sistema' }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <!-- Tarjeta de Cantidades -->
          <div class="col-12">
             <q-card flat bordered class="bg-grey-1">
               <q-card-section class="row items-center justify-between q-pa-sm">
                 <div class="text-center">
                   <div class="text-caption text-grey-8">Saldo Anterior</div>
                   <div class="text-subtitle2 text-grey-8">{{ data.saldo_anterior }} Lts</div>
                   <div class="text-caption text-grey-6">{{ data.porcentaje_anterior }} %</div>
                 </div>
                 <div class="text-center">
                   <div class="text-caption text-grey-8">Cantidad</div>
                   <div class="text-h6 text-weight-bolder" :class="data.tipo_movimiento === 'CARGA' ? 'text-positive' : 'text-negative'">
                     {{ data.tipo_movimiento === 'CARGA' ? '+' : '-' }} {{ data.cantidad }} Lts
                   </div>
                 </div>
                 <div class="text-center">
                   <div class="text-caption text-grey-8">Saldo Resultante</div>
                   <div class="text-subtitle2 text-primary text-weight-bold">{{ data.saldo_nuevo }} Lts</div>
                   <div class="text-caption text-primary">{{ data.porcentaje_nuevo }} %</div>
                 </div>
               </q-card-section>
             </q-card>
          </div>

          <!-- Datos Específicos de Carga -->
          <div class="col-12" v-if="data.tipo_movimiento === 'CARGA'">
            <div class="text-caption text-primary q-mb-xs text-weight-bold">Datos Administrativos</div>
            <q-list bordered separator dense class="rounded-borders bg-white">
              <q-item>
                <q-item-section>
                  <q-item-label caption>N° Factura</q-item-label>
                  <q-item-label>{{ data.numero_factura || 'N/A' }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>Transporte (Placa)</q-item-label>
                  <q-item-label>{{ data.datos_gandola || 'N/A' }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>Conductor</q-item-label>
                  <q-item-label>{{ data.nombre_conductor }} ({{ data.cedula_conductor }})</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <!-- Observación -->
          <div class="col-12">
            <div class="text-caption text-primary q-mb-xs text-weight-bold">Observación</div>
            <q-card flat bordered class="q-pa-sm bg-yellow-1 text-grey-9 text-italic text-caption">
              {{ data.observacion || 'Sin observaciones' }}
            </q-card>
          </div>

        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { date } from "quasar";
const props = defineProps({
  modelValue: Boolean,
  data: Object
});
const emit = defineEmits(['update:modelValue']);

function formatDate(val) {
  return date.formatDate(val, "DD/MM/YYYY HH:mm A");
}
</script>

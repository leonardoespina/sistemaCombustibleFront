<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-y-md">
      <!-- HEADER -->
      <div class="row items-center q-mb-md">
        <div class="col">
          <h4 class="text-h4 q-my-none text-weight-bold text-primary">
            <q-icon name="assignment" class="q-mr-sm" />
            Reporte Diario de Combustible
          </h4>
          <p class="text-grey-7 q-mb-none">
            Resumen detallado de solicitudes despachadas por día
          </p>
        </div>
      </div>

      <!-- FILTROS -->
      <q-card flat bordered class="shadow-2">
        <q-card-section class="bg-primary text-white q-py-sm">
          <div class="text-subtitle1">
            <q-icon name="filter_alt" class="q-mr-xs" />
            Filtros de Búsqueda
          </div>
        </q-card-section>

        <q-card-section>
          <div class="row q-col-gutter-md items-end">
            <!-- Selector de Llenadero -->
            <div class="col-12 col-md-4">
              <q-select
                outlined
                v-model="filters.id_llenadero"
                :options="llenaderosList"
                option-value="id_llenadero"
                option-label="nombre_llenadero"
                label="Llenadero *"
                emit-value
                map-options
                dense
                :rules="[val => !!val || 'Seleccione un llenadero']"
              >
                <template v-slot:prepend>
                  <q-icon name="ev_station" color="primary" />
                </template>
              </q-select>
            </div>

            <!-- Selector de Fecha -->
            <div class="col-12 col-md-3">
              <q-input
                outlined
                v-model="filters.fecha"
                type="date"
                label="Fecha *"
                dense
                :rules="[val => !!val || 'Seleccione una fecha']"
              >
                <template v-slot:prepend>
                  <q-icon name="event" color="primary" />
                </template>
              </q-input>
            </div>

            <!-- Botón Buscar -->
            <div class="col-12 col-md-2">
              <q-btn
                color="primary"
                icon="search"
                label="Buscar"
                class="full-width"
                @click="consultarReporte"
                :loading="loading"
                :disable="!filters.id_llenadero || !filters.fecha"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- RESULTADOS -->
      <div v-if="reporteData" class="q-gutter-y-lg">
        
        <!-- HEADER DEL REPORTE -->
        <div class="text-center q-pa-md bg-grey-2 rounded-borders">
          <div class="text-h6 text-weight-bold">REPORTE DIARIO DE COMBUSTIBLE</div>
          <div class="text-subtitle1">
            Fecha: <span class="text-weight-bold">{{ formatDate(filters.fecha) }}</span> 
            | Llenadero: <span class="text-weight-bold">{{ getLlenaderoNombre(filters.id_llenadero) }}</span>
          </div>
        </div>

        <!-- SECCIÓN INSTITUCIONAL -->
        <q-card flat bordered>
          <q-card-section class="bg-teal text-white q-py-xs">
            <div class="text-subtitle2 text-uppercase text-weight-bold">Tipo: Institucional</div>
          </q-card-section>
          
          <q-table
            :rows="reporteData.institucional"
            :columns="columnsInstitucional"
            row-key="id_solicitud"
            dense
            flat
            :pagination="{ rowsPerPage: 0 }"
            hide-pagination
          >
            <template v-slot:bottom-row>
              <q-tr class="bg-grey-2 text-weight-bold">
                <q-td colspan="6" class="text-right">Total Litros Institucional:</q-td>
                <q-td class="text-right">{{ reporteData.totales.litros_institucional }}</q-td>
              </q-tr>
            </template>
          </q-table>
        </q-card>

        <!-- SECCIÓN VENTA -->
        <q-card flat bordered>
          <q-card-section class="bg-orange-8 text-white q-py-xs">
            <div class="text-subtitle2 text-uppercase text-weight-bold">Tipo: Venta</div>
          </q-card-section>

          <q-table
            :rows="reporteData.venta"
            :columns="columnsVenta"
            row-key="id_solicitud"
            dense
            flat
            :pagination="{ rowsPerPage: 0 }"
            hide-pagination
          >
            <template v-slot:bottom-row>
              <q-tr class="bg-grey-2 text-weight-bold">
                <q-td colspan="6" class="text-right">Total Litros Venta:</q-td>
                <q-td class="text-right">{{ reporteData.totales.litros_venta }}</q-td>
                <q-td colspan="2" class="text-right">Total Recaudado:</q-td>
                <q-td class="text-right">{{ reporteData.totales.monto_venta }}</q-td>
              </q-tr>
            </template>
          </q-table>
        </q-card>

        <!-- RESUMEN FINAL -->
        <q-card flat bordered class="bg-blue-grey-1">
          <q-card-section>
            <div class="row q-col-gutter-md justify-center text-center">
              <div class="col-12 col-md-3">
                <div class="text-caption text-uppercase text-grey-8">Total Litros Institucional</div>
                <div class="text-h6 text-teal">{{ reporteData.totales.litros_institucional }} L</div>
              </div>
              <div class="col-12 col-md-3">
                <div class="text-caption text-uppercase text-grey-8">Total Litros Venta</div>
                <div class="text-h6 text-orange-9">{{ reporteData.totales.litros_venta }} L</div>
              </div>
              <div class="col-12 col-md-3">
                <div class="text-caption text-uppercase text-grey-8">Total General Litros</div>
                <div class="text-h5 text-primary text-weight-bold">{{ reporteData.totales.total_litros }} L</div>
              </div>
            </div>
          </q-card-section>
        </q-card>

      </div>

      <div v-else-if="searched && !loading" class="text-center q-pa-xl text-grey">
        <q-icon name="sentiment_dissatisfied" size="lg" />
        <div class="text-h6">No se encontraron registros para la fecha seleccionada.</div>
      </div>

    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar, date } from 'quasar';
import api from '../../api/index';

const $q = useQuasar();
const loading = ref(false);
const searched = ref(false);
const llenaderosList = ref([]);
const reporteData = ref(null);

const filters = ref({
  id_llenadero: null,
  fecha: date.formatDate(new Date(), 'YYYY-MM-DD')
});

// Columnas Institucional
const columnsInstitucional = [
  { name: 'solicitante', label: 'Solicitante', field: 'solicitante', align: 'left' },
  { name: 'vehiculo', label: 'Vehículo', field: 'vehiculo', align: 'left' },
  { name: 'placa', label: 'Placa', field: 'placa', align: 'left' },
  { name: 'dependencia', label: 'Dependencia', field: 'dependencia', align: 'left' },
  { name: 'subdependencia', label: 'Subdependencia', field: 'subdependencia', align: 'left' },
  { name: 'cant_solic', label: 'Cant. Solic', field: 'cant_solic', align: 'right' },
  { name: 'cant_desp', label: 'Cant. Desp', field: 'cant_desp', align: 'right' }
];

// Columnas Venta
const columnsVenta = [
  ...columnsInstitucional,
  { name: 'precio', label: 'Precio', field: 'precio', align: 'right' },
  { name: 'total_pagar', label: 'Total a Pagar', field: 'total_pagar', align: 'right' },
  { name: 'moneda', label: 'Moneda', field: 'moneda', align: 'center' }
];

// Cargar lista de llenaderos
async function loadLlenaderos() {
  try {
    const response = await api.get('/llenaderos');
    llenaderosList.value = response.data.data || response.data;
  } catch (error) {
    console.error('Error cargando llenaderos:', error);
    $q.notify({ type: 'negative', message: 'Error al cargar lista de llenaderos' });
  }
}

// Consultar reporte
async function consultarReporte() {
  loading.value = true;
  searched.value = true;
  reporteData.value = null;

  console.log('[DEBUG-FRONT] Solicitando reporte:', filters.value);

  try {
    const response = await api.get('/reportes/diario', {
      params: {
        id_llenadero: filters.value.id_llenadero,
        fecha: filters.value.fecha
      }
    });
    console.log('[DEBUG-FRONT] Respuesta recibida:', response.data);
    reporteData.value = response.data;
  } catch (error) {
    console.error('Error consultando reporte:', error);
    $q.notify({ type: 'negative', message: 'Error al generar el reporte' });
  } finally {
    loading.value = false;
  }
}

// Helpers
function getLlenaderoNombre(id) {
  const llenadero = llenaderosList.value.find(l => l.id_llenadero === id);
  return llenadero ? llenadero.nombre_llenadero : 'Desconocido';
}

function formatDate(fechaStr) {
  return date.formatDate(fechaStr, 'DD/MM/YYYY');
}

onMounted(() => {
  loadLlenaderos();
});
</script>

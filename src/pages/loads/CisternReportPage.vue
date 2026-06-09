<template>
  <q-page class="p-8 bg-gray-50 min-h-screen">
    <div class="max-w-7xl mx-auto">
      
      <!-- HEADER Y BOTONES -->
      <header class="mb-10 text-center relative">
        <!-- Botón Volver (Izquierda) -->
        <q-btn
          flat
          color="primary"
          icon="arrow_back"
          label="Volver a Operaciones"
          class="absolute-top-left q-mt-md"
          @click="$router.push('/recepcion-cisternas')"
          no-caps
        />

        <h1 class="text-4xl font-bold text-gray-800 tracking-tight pt-8">Reporte de Recepción de Cisternas</h1>
        <p class="text-lg text-gray-500 mt-2">Vista Ejecutiva Consolidada</p>
      </header>

      <!-- BARRA DE CONTROLES (FILTROS Y EXPORTAR) -->
      <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8 flex flex-wrap items-center justify-between gap-4">
        <div class="flex gap-4 items-center flex-grow">
          <q-input dense outlined v-model="filters.fecha_inicio" type="date" label="Desde" class="w-48" />
          <q-input dense outlined v-model="filters.fecha_fin" type="date" label="Hasta" class="w-48" />
          <q-btn color="primary" label="Generar" icon="search" unelevated @click="loadReportData" :loading="loading" />
        </div>
        
        <div>
          <!-- Aquí luego colocaremos el botón exportar Excel -->
          <q-btn 
            color="positive" 
            icon="table_view" 
            label="Exportar a Excel" 
            unelevated 
            @click="exportToExcel"
            :disable="!hasData"
          />
        </div>
      </div>

      <!-- CARGADOR -->
      <div v-if="loading" class="flex justify-center py-20">
        <q-spinner-pie color="primary" size="4em" />
      </div>

      <!-- ESTADO VACÍO -->
      <div v-else-if="!hasData" class="text-center py-20 text-gray-400">
        <q-icon name="inbox" size="4rem" />
        <p class="mt-4 text-lg">No hay recepciones registradas en este período.</p>
      </div>

      <!-- DASHBOARD CARDS (MOCKUP 1 DINÁMICO) -->
      <div v-else class="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        <!-- Tarjeta por cada Llenadero -->
        <div 
          v-for="(grupo, llenaderoName) in dataAgrupada" 
          :key="llenaderoName"
          class="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 flex flex-col"
        >
          <!-- HEADER DE TARJETA -->
          <div :class="getCardColorClass(llenaderoName) + ' p-6 text-white flex justify-between items-center'">
            <div>
              <h2 class="text-2xl font-bold tracking-wide">{{ llenaderoName }}</h2>
              <span class="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider mt-1 inline-block">
                Múltiples
              </span>
            </div>
            <div class="text-right">
              <div class="text-sm opacity-80">Total Recibido</div>
              <div class="text-3xl font-bold">{{ grupo.totalLlenadero.toLocaleString() }} <span class="text-lg font-normal">L</span></div>
            </div>
          </div>

          <!-- LISTA DE CISTERNAS -->
          <div class="flex-grow overflow-y-auto max-h-[500px]">
            <ul class="divide-y divide-gray-100">
              <li 
                v-for="carga in grupo.cargas" 
                :key="carga.id_carga"
                class="p-4 hover:bg-gray-50 transition"
              >
                <div class="flex justify-between items-center mb-1">
                  <span class="font-bold text-gray-800 text-lg">🚚 {{ carga.Vehiculo?.placa || 'S/I' }}</span>
                  <span :class="getTextColorClass(llenaderoName) + ' font-bold'">{{ Number(carga.litros_recibidos || 0).toLocaleString() }} L</span>
                </div>
                <div class="flex justify-between text-sm text-gray-500">
                  <span>Fac: #{{ carga.numero_guia }} ({{ formatDate(carga.fecha_llegada) }})</span>
                  <span class="bg-gray-100 px-2 py-0.5 rounded text-gray-600 truncate max-w-[150px]" :title="getDestinosText(carga)">
                    {{ getDestinosText(carga) }}
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>

      </div>

    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { date, useQuasar } from 'quasar';
import api from '../../api';

const $q = useQuasar();

// ESTADOS
const loading = ref(false);
const rawData = ref([]);
const filters = ref({
  fecha_inicio: date.formatDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'YYYY-MM-DD'),
  fecha_fin: date.formatDate(new Date(), 'YYYY-MM-DD')
});

const hasData = computed(() => rawData.value.length > 0);

// LÓGICA DE AGRUPACIÓN (Por Llenadero)
const dataAgrupada = computed(() => {
  const grupos = {};

  rawData.value.forEach(carga => {
    // Determinar el llenadero principal de la carga (basado en los tanques destino o en el llenadero asigando)
    let llenadero = 'SIN ASIGNAR';
    if (carga.tanques_descarga && carga.tanques_descarga.length > 0 && carga.tanques_descarga[0].Tanque?.Llenadero) {
      llenadero = carga.tanques_descarga[0].Tanque.Llenadero.nombre_llenadero;
    } else if (carga.Tanque?.Llenadero) {
      llenadero = carga.Tanque.Llenadero.nombre_llenadero;
    }

    if (!grupos[llenadero]) {
      grupos[llenadero] = {
        cargas: [],
        totalLlenadero: 0
      };
    }

    grupos[llenadero].cargas.push(carga);
    grupos[llenadero].totalLlenadero += Number(carga.litros_recibidos || 0);
  });

  return grupos;
});

// FETCH DATA
const loadReportData = async () => {
  loading.value = true;
  try {
    // Traemos las cargas usando paginación grande para que entren todas las del periodo
    const response = await api.get('/cargas-cisterna', { 
      params: { 
        limit: 5000, 
        fecha_inicio: filters.value.fecha_inicio,
        fecha_fin: filters.value.fecha_fin,
        sortBy: 'fecha_llegada',
        descending: false
      } 
    });
    // Filtramos solo las que no estén ANULADAS
    rawData.value = (response.data.data || []).filter(c => c.estado !== 'ANULADA');
  } catch (error) {
    console.error(error);
    $q.notify({ type: 'negative', message: 'Error al cargar los datos del reporte.' });
  } finally {
    loading.value = false;
  }
};

// EXPORT TO EXCEL LÓGICA
import { useExcelExport } from '../../composables/useExcelExport';
const { exportToExcel: doExcelExport } = useExcelExport();

const exportToExcel = () => {
  // Construir la data plana para el Excel a partir de los datos agrupados
  const excelData = [];

  for (const [llenaderoName, grupo] of Object.entries(dataAgrupada.value)) {
    grupo.cargas.forEach(carga => {
      // Combustible principal
      const combustibleName = carga.Tanque?.TipoCombustible?.nombre || 'S/I';
      // Mes
      const mesNombre = date.formatDate(carga.fecha_llegada, 'MMMM').toUpperCase(); // ej: JUNIO

      excelData.push({
        llenadero: llenaderoName,
        placa: carga.Vehiculo?.placa || 'S/I',
        factura: carga.numero_guia,
        fecha: carga.fecha_llegada,
        combustible: combustibleName,
        mes: mesNombre,
        litros: Number(carga.litros_recibidos || 0),
        destino: getDestinosText(carga)
      });
    });
  }

  const columns = [
    { label: 'N°', field: (_, row, index) => index + 1 },
    { label: 'PLACA VEHÍCULO (GANDOLA)', field: 'placa' },
    { label: 'N° FACTURA', field: 'factura' },
    { label: 'FECHA FACTURA', field: 'fecha', format: v => formatDate(v) },
    { label: 'TIPO COMBUSTIBLE', field: 'combustible' },
    { label: 'MES', field: 'mes' },
    { label: 'LITROS FACTURA', field: 'litros' },
    { label: 'DESTINO', field: 'destino' }
  ];

  doExcelExport({
    rows: excelData,
    columns: columns,
    filename: 'Recepciones_Cisternas',
    sheetName: 'Recepciones',
    meta: [
      `Reporte de Recepciones de Cisternas`,
      `Período: ${formatDate(filters.value.fecha_inicio)} al ${formatDate(filters.value.fecha_fin)}`
    ]
  });
};

// HELPERS DE VISTA
const formatDate = (dateStr) => {
  return date.formatDate(dateStr, 'DD/MM/YYYY');
};

const getDestinosText = (carga) => {
  if (carga.tanques_descarga && carga.tanques_descarga.length > 0) {
    return carga.tanques_descarga.map(t => t.Tanque?.codigo || 'Tq').join(', ');
  }
  return carga.Tanque?.codigo || 'N/A';
};

// Estilos dinámicos sin hardcodear nombres (Mala Práctica corregida)
const colorPalettes = [
  { bg: 'bg-blue-600', text: 'text-blue-600' },
  { bg: 'bg-indigo-600', text: 'text-indigo-600' },
  { bg: 'bg-emerald-600', text: 'text-emerald-600' },
  { bg: 'bg-amber-600', text: 'text-amber-600' },
  { bg: 'bg-rose-600', text: 'text-rose-600' },
  { bg: 'bg-cyan-600', text: 'text-cyan-600' },
  { bg: 'bg-violet-600', text: 'text-violet-600' }
];

// Generar un índice consistente basado en el texto del llenadero
const getPaletteIndex = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % colorPalettes.length;
};

const getCardColorClass = (llenaderoName) => {
  return colorPalettes[getPaletteIndex(llenaderoName)].bg;
};

const getTextColorClass = (llenaderoName) => {
  return colorPalettes[getPaletteIndex(llenaderoName)].text;
};

onMounted(() => {
  loadReportData();
});
</script>

<style scoped>
/* Evitar conflictos si Tailwind no inyectó bien preflight */
ul { list-style: none; padding: 0; margin: 0; }
</style>

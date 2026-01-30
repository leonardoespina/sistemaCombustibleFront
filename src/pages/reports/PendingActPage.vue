<template>
  <q-page class="q-pa-md page-background">
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- HEADER CON CONTEXTO -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <div class="row items-center q-mb-lg">
      <div class="col">
        <div class="text-h4 text-weight-bold">Pendientes por Acta</div>
        <div class="text-subtitle1 text-grey-7">
          Despachos realizados sin acta generada
        </div>
      </div>
      <div class="col-auto">
        <q-btn
          outline
          color="primary"
          icon="refresh"
          label="Actualizar"
          @click="fetchReportData"
          :loading="loading"
        />
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- TARJETAS RESUMEN (KPIs) -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <div class="row q-col-gutter-md q-mb-lg">
      <!-- Card Gasolina -->
      <div class="col-12 col-sm-6 col-md-4">
        <q-card
          class="summary-card cursor-pointer"
          :class="{ 'card-selected': selectedFuel === 'GASOLINA' }"
          @click="selectedFuel = 'GASOLINA'"
        >
          <q-card-section class="row items-center no-wrap">
            <div class="fuel-icon-wrapper bg-amber-1">
              <q-icon name="local_gas_station" size="md" color="amber-8" />
            </div>
            <div class="q-ml-md">
              <div class="text-h3 text-weight-bold text-amber-9">
                {{ stats.gasolina.count }}
              </div>
              <div class="text-subtitle2 text-grey-7">Gasolina Pendiente</div>
            </div>
            <q-space />
            <div class="text-right">
              <div class="text-h6 text-weight-medium">
                {{ formatNumber(stats.gasolina.litros) }}
              </div>
              <div class="text-caption text-grey">Litros</div>
            </div>
          </q-card-section>

          <!-- Indicador de selección -->
          <div
            v-if="selectedFuel === 'GASOLINA'"
            class="selection-indicator bg-amber"
          />
        </q-card>
      </div>

      <!-- Card Gasoil -->
      <div class="col-12 col-sm-6 col-md-4">
        <q-card
          class="summary-card cursor-pointer"
          :class="{ 'card-selected': selectedFuel === 'GASOIL' }"
          @click="selectedFuel = 'GASOIL'"
        >
          <q-card-section class="row items-center no-wrap">
            <div class="fuel-icon-wrapper bg-deep-purple-1">
              <q-icon name="oil_barrel" size="md" color="deep-purple-8" />
            </div>
            <div class="q-ml-md">
              <div class="text-h3 text-weight-bold text-deep-purple-9">
                {{ stats.gasoil.count }}
              </div>
              <div class="text-subtitle2 text-grey-7">Gasoil Pendiente</div>
            </div>
            <q-space />
            <div class="text-right">
              <div class="text-h6 text-weight-medium">
                {{ formatNumber(stats.gasoil.litros) }}
              </div>
              <div class="text-caption text-grey">Litros</div>
            </div>
          </q-card-section>

          <div
            v-if="selectedFuel === 'GASOIL'"
            class="selection-indicator bg-deep-purple"
          />
        </q-card>
      </div>

      <!-- Card Total -->
      <div class="col-12 col-md-4">
        <q-card class="summary-card bg-primary text-white">
          <q-card-section class="row items-center no-wrap">
            <div class="fuel-icon-wrapper bg-white">
              <q-icon name="pending_actions" size="md" color="primary" />
            </div>
            <div class="q-ml-md">
              <div class="text-h3 text-weight-bold">
                {{ stats.total.count }}
              </div>
              <div class="text-subtitle2" style="opacity: 0.8">
                Total Pendientes
              </div>
            </div>
            <q-space />
            <div class="text-right">
              <div class="text-h6 text-weight-medium">
                {{ formatNumber(stats.total.litros) }}
              </div>
              <div class="text-caption" style="opacity: 0.7">
                Litros Totales
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- TABLA PRINCIPAL -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <q-card class="table-card">
      <!-- Toolbar -->
      <q-card-section class="q-pb-none">
        <div class="row items-center q-gutter-md">
          <!-- Título dinámico -->
          <div class="col-12 col-sm-auto">
            <div class="row items-center no-wrap">
              <q-icon
                :name="
                  selectedFuel === 'GASOLINA'
                    ? 'local_gas_station'
                    : 'oil_barrel'
                "
                :color="
                  selectedFuel === 'GASOLINA' ? 'amber-8' : 'deep-purple-8'
                "
                size="sm"
                class="q-mr-sm"
              />
              <span class="text-h6">
                Despachos de
                {{ selectedFuel === "GASOLINA" ? "Gasolina" : "Gasoil" }}
              </span>
              <q-badge
                :color="selectedFuel === 'GASOLINA' ? 'amber' : 'deep-purple'"
                :label="filteredCount"
                class="q-ml-sm"
              />
            </div>
          </div>

          <q-space />

          <!-- Búsqueda -->
          <div class="col-12 col-sm-4 col-md-3">
            <q-input
              v-model="search"
              dense
              outlined
              placeholder="Buscar placa, chofer..."
              clearable
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <!-- Acciones de exportar -->
          <div class="col-auto">
            <q-btn-dropdown
              color="primary"
              icon="download"
              label="Exportar"
              :disable="filteredCount === 0"
              no-caps
              unelevated
            >
              <q-list>
                <q-item clickable v-close-popup @click="exportTable('csv')">
                  <q-item-section avatar>
                    <q-icon name="description" color="green" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Exportar CSV</q-item-label>
                    <q-item-label caption>Formato para Excel</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="exportTable('pdf')">
                  <q-item-section avatar>
                    <q-icon name="picture_as_pdf" color="red" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Exportar PDF</q-item-label>
                    <q-item-label caption>Documento imprimible</q-item-label>
                  </q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable v-close-popup @click="printTable">
                  <q-item-section avatar>
                    <q-icon name="print" color="grey-7" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Imprimir</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>
          </div>
        </div>
      </q-card-section>

      <!-- Tabla -->
      <q-table
        flat
        :rows="filteredData"
        :columns="columns"
        row-key="id_despacho"
        :loading="loading"
        :pagination="pagination"
        no-data-label="No hay despachos pendientes"
        :rows-per-page-options="[10, 25, 50, 0]"
        class="sticky-header-table"
      >
        <!-- Celda personalizada: Fecha con indicador de antigüedad -->
        <template #body-cell-fecha="props">
          <q-td :props="props">
            <div class="row items-center no-wrap">
              <q-icon
                :name="getAgeIcon(props.row.fecha_hora).icon"
                :color="getAgeIcon(props.row.fecha_hora).color"
                size="xs"
                class="q-mr-sm"
              />
              <div>
                <div>{{ formatDate(props.row.fecha_hora) }}</div>
                <div class="text-caption text-grey">
                  {{ getRelativeTime(props.row.fecha_hora) }}
                </div>
              </div>
            </div>
          </q-td>
        </template>

        <!-- Celda personalizada: Placa con chip -->
        <template #body-cell-placa="props">
          <q-td :props="props">
            <q-chip
              dense
              square
              color="grey-3"
              text-color="grey-9"
              icon="directions_car"
            >
              {{ props.value }}
            </q-chip>
          </q-td>
        </template>

        <!-- Celda personalizada: Tipo Destino -->
        <template #body-cell-tipo_destino="props">
          <q-td :props="props" class="text-center">
            <q-chip
              dense
              :color="props.value === 'VEHICULO' ? 'blue-1' : 'orange-1'"
              :text-color="props.value === 'VEHICULO' ? 'blue-8' : 'orange-8'"
              :icon="
                props.value === 'VEHICULO' ? 'directions_car' : 'inventory_2'
              "
            >
              {{ props.value === "VEHICULO" ? "Vehículo" : "Bidón" }}
            </q-chip>
          </q-td>
        </template>

        <!-- Celda personalizada: Litros -->
        <template #body-cell-litros_despachados="props">
          <q-td :props="props" class="text-right">
            <span class="text-weight-bold text-primary">
              {{ formatNumber(props.value) }}
            </span>
            <span class="text-caption text-grey q-ml-xs">Lts</span>
          </q-td>
        </template>

        <!-- Footer con totales - CORREGIDO -->
        <template #bottom-row>
          <q-tr class="bg-grey-2 text-weight-bold">
            <q-td colspan="6" class="text-right">
              <span v-if="search && search.trim()">
                Total filtrado ({{ filteredCount }} registros):
              </span>
              <span v-else>
                Total de litros pendientes ({{ filteredCount }} registros):
              </span>
            </q-td>
            <q-td class="text-right text-primary text-h6">
              {{ formatNumber(filteredTotalLitros) }} Lts
            </q-td>
            <q-td />
          </q-tr>
        </template>

        <!-- Estado vacío personalizado -->
        <template #no-data>
          <div class="full-width column items-center q-pa-xl text-grey-6">
            <q-icon name="check_circle" size="64px" color="positive" />
            <div class="text-h6 q-mt-md">¡Todo al día!</div>
            <div class="text-body2">
              No hay despachos de {{ selectedFuel.toLowerCase() }} pendientes
              por acta
            </div>
          </div>
        </template>
      </q-table>
    </q-card>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- ALERTA DE PENDIENTES ANTIGUOS (Condicional) -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <q-banner v-if="hasOldPending" class="bg-warning-1 q-mt-md" rounded>
      <template #avatar>
        <q-icon name="warning" color="warning" />
      </template>
      <div class="text-weight-medium">Atención: Tienes pendientes antiguos</div>
      <div class="text-caption">
        Hay {{ oldPendingCount }} despachos con más de 7 días sin generar acta
      </div>
      <template #action>
        <q-btn flat color="warning" label="Ver antiguos" @click="filterOld" />
      </template>
    </q-banner>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { date, exportFile, useQuasar } from "quasar";

import api from "../../api/index.js";
const $q = useQuasar();

// ═══════════════════════════════════════════════════════════════════════════
// ESTADO
// ═══════════════════════════════════════════════════════════════════════════
const loading = ref(false);
const selectedFuel = ref("GASOLINA");
const search = ref("");
const reportData = ref({
  GASOLINA: [],
  GASOIL: [],
});

const pagination = ref({
  sortBy: "fecha",
  descending: true,
  page: 1,
  rowsPerPage: 10,
});

// ═══════════════════════════════════════════════════════════════════════════
// COLUMNAS
// ═══════════════════════════════════════════════════════════════════════════
const columns = [
  {
    name: "fecha",
    label: "Fecha",
    field: "fecha_hora",
    sortable: true,
    align: "left",
  },
  {
    name: "placa",
    label: "Placa",
    field: "placa",
    sortable: true,
    align: "left",
  },
  {
    name: "vehiculo_info",
    label: "Vehículo",
    field: (row) => `${row.marca || ""} ${row.modelo || ""}`.trim(),
    align: "left",
  },
  {
    name: "chofer",
    label: "Chofer",
    field: "chofer",
    sortable: true,
    align: "left",
  },
  {
    name: "gerencia",
    label: "Gerencia",
    field: "gerencia",
    sortable: true,
    align: "left",
  },
  {
    name: "tipo_destino",
    label: "Destino",
    field: "tipo_destino",
    sortable: true,
    align: "center",
  },
  {
    name: "litros_despachados",
    label: "Litros",
    field: "litros_despachados",
    sortable: true,
    align: "right",
  },
  {
    name: "usuario",
    label: "Despachador",
    field: "usuario",
    align: "left",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS - CÁLCULO SEGURO DE LITROS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convierte un valor a número de forma segura
 * @param {any} value - Valor a convertir
 * @returns {number} - Número válido o 0
 */
function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

/**
 * Suma los litros de un array de despachos
 * @param {Array} data - Array de despachos
 * @returns {number} - Total de litros
 */
function sumLitros(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return 0;
  }
  return data.reduce((total, row) => {
    return total + toNumber(row.litros_despachados);
  }, 0);
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPUTED - DATOS
// ═══════════════════════════════════════════════════════════════════════════

/** Datos del tipo de combustible seleccionado */
const currentData = computed(() => {
  const data = reportData.value[selectedFuel.value];
  return Array.isArray(data) ? data : [];
});

/** Datos filtrados por búsqueda */
const filteredData = computed(() => {
  if (!search.value || search.value.trim() === "") {
    return currentData.value;
  }

  const needle = search.value.toLowerCase().trim();

  return currentData.value.filter((row) => {
    const searchFields = [
      row.placa,
      row.chofer,
      row.gerencia,
      row.usuario,
      row.marca,
      row.modelo,
    ];

    return searchFields.some(
      (field) => field && String(field).toLowerCase().includes(needle)
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// COMPUTED - ESTADÍSTICAS (CORREGIDO)
// ═══════════════════════════════════════════════════════════════════════════

/** Estadísticas generales para las tarjetas KPI */
const stats = computed(() => {
  const gasolinaData = Array.isArray(reportData.value.GASOLINA)
    ? reportData.value.GASOLINA
    : [];
  const gasoilData = Array.isArray(reportData.value.GASOIL)
    ? reportData.value.GASOIL
    : [];

  const gasolinaLitros = sumLitros(gasolinaData);
  const gasoilLitros = sumLitros(gasoilData);

  return {
    gasolina: {
      count: gasolinaData.length,
      litros: gasolinaLitros,
    },
    gasoil: {
      count: gasoilData.length,
      litros: gasoilLitros,
    },
    total: {
      count: gasolinaData.length + gasoilData.length,
      litros: gasolinaLitros + gasoilLitros,
    },
  };
});

/** Estadísticas del combustible seleccionado (sin filtro de búsqueda) */
const currentStats = computed(() => {
  return selectedFuel.value === "GASOLINA"
    ? stats.value.gasolina
    : stats.value.gasoil;
});

/** Total de litros de los datos FILTRADOS (para el footer de la tabla) */
const filteredTotalLitros = computed(() => {
  return sumLitros(filteredData.value);
});

/** Cantidad de registros filtrados */
const filteredCount = computed(() => {
  return filteredData.value.length;
});

// ═══════════════════════════════════════════════════════════════════════════
// COMPUTED - PENDIENTES ANTIGUOS
// ═══════════════════════════════════════════════════════════════════════════

const hasOldPending = computed(() => oldPendingCount.value > 0);

const oldPendingCount = computed(() => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const allData = [
    ...(Array.isArray(reportData.value.GASOLINA)
      ? reportData.value.GASOLINA
      : []),
    ...(Array.isArray(reportData.value.GASOIL) ? reportData.value.GASOIL : []),
  ];

  return allData.filter((row) => {
    const fecha = new Date(row.fecha_hora);
    return !isNaN(fecha.getTime()) && fecha < sevenDaysAgo;
  }).length;
});

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS - FORMATO
// ═══════════════════════════════════════════════════════════════════════════

function formatNumber(value) {
  const num = toNumber(value);
  return new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return date.formatDate(dateStr, "DD/MM/YYYY HH:mm");
}

function getRelativeTime(dateStr) {
  if (!dateStr) return "";

  const now = new Date();
  const then = new Date(dateStr);

  if (isNaN(then.getTime())) return "";

  const diffDays = Math.floor((now - then) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  return `Hace ${Math.floor(diffDays / 30)} meses`;
}

function getAgeIcon(dateStr) {
  if (!dateStr) return { icon: "help", color: "grey" };

  const now = new Date();
  const then = new Date(dateStr);

  if (isNaN(then.getTime())) return { icon: "help", color: "grey" };

  const diffDays = Math.floor((now - then) / (1000 * 60 * 60 * 24));

  if (diffDays <= 2) return { icon: "schedule", color: "positive" };
  if (diffDays <= 7) return { icon: "schedule", color: "warning" };
  return { icon: "warning", color: "negative" };
}

function filterOld() {
  $q.notify({
    message: "Filtro de antiguos aplicado",
    color: "warning",
    icon: "filter_list",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════════════════════════════════
async function fetchReportData() {
  loading.value = true;
  try {
    const response = await api.get("/reportes/pendientes");

    // Asegurar estructura correcta de los datos
    const data = response.data || {};

    reportData.value = {
      GASOLINA: Array.isArray(data.GASOLINA) ? data.GASOLINA : [],
      GASOIL: Array.isArray(data.GASOIL) ? data.GASOIL : [],
    };

    // Debug: verificar datos recibidos
    console.log("📊 Datos cargados:", {
      gasolina: reportData.value.GASOLINA.length,
      gasoil: reportData.value.GASOIL.length,
      statsCalculados: stats.value,
    });
  } catch (error) {
    console.error("Error fetching report data", error);
    $q.notify({
      message: "Error al cargar los datos",
      color: "negative",
      icon: "error",
    });

    // Reset a valores vacíos en caso de error
    reportData.value = { GASOLINA: [], GASOIL: [] };
  } finally {
    loading.value = false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTAR
// ═══════════════════════════════════════════════════════════════════════════
function wrapCsvValue(val, formatFn, row) {
  let formatted = formatFn !== void 0 ? formatFn(val, row) : val;
  formatted =
    formatted === void 0 || formatted === null ? "" : String(formatted);
  formatted = formatted.split('"').join('""');
  return `"${formatted}"`;
}

function exportTable(format) {
  if (format === "csv") {
    const content = [columns.map((col) => wrapCsvValue(col.label))]
      .concat(
        filteredData.value.map((row) =>
          columns
            .map((col) =>
              wrapCsvValue(
                typeof col.field === "function"
                  ? col.field(row)
                  : row[col.field === void 0 ? col.name : col.field],
                col.format,
                row
              )
            )
            .join(",")
        )
      )
      .join("\r\n");

    const status = exportFile(
      `pendientes-${selectedFuel.value.toLowerCase()}-${date.formatDate(
        Date.now(),
        "YYYYMMDD"
      )}.csv`,
      content,
      "text/csv"
    );

    if (status !== true) {
      $q.notify({
        message: "Navegador denegó la descarga",
        color: "negative",
        icon: "warning",
      });
    }
  } else if (format === "pdf") {
    $q.notify({
      message: "Generando PDF...",
      color: "info",
      icon: "picture_as_pdf",
    });
  }
}

function printTable() {
  window.print();
}

// ═══════════════════════════════════════════════════════════════════════════
// LIFECYCLE
// ═══════════════════════════════════════════════════════════════════════════
onMounted(() => {
  fetchReportData();
});
</script>

<style lang="scss" scoped>
@use "sass:color";

.page-background {
  background: #f5f7fa;
  min-height: 100vh;
}

// ═══════════════════════════════════════════════════════════════
// TARJETAS RESUMEN
// ═══════════════════════════════════════════════════════════════
.summary-card {
  transition: all 0.2s ease;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  &.card-selected {
    border-color: var(--q-primary);
  }
}

.fuel-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selection-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
}

// ═══════════════════════════════════════════════════════════════
// TABLA
// ═══════════════════════════════════════════════════════════════
.table-card {
  border-radius: 12px;
}

.sticky-header-table {
  max-height: 500px;

  :deep(thead tr th) {
    position: sticky;
    z-index: 1;
    background: #f5f5f5;
  }

  :deep(thead tr:first-child th) {
    top: 0;
  }
}

// ═══════════════════════════════════════════════════════════════
// RESPONSIVE
// ═══════════════════════════════════════════════════════════════
@media (max-width: 599px) {
  .summary-card {
    .text-h3 {
      font-size: 1.75rem;
    }
  }

  .fuel-icon-wrapper {
    width: 44px;
    height: 44px;
  }
}

// ═══════════════════════════════════════════════════════════════
// DARK MODE
// ═══════════════════════════════════════════════════════════════
.body--dark {
  .page-background {
    background: $dark-page;
  }

  .summary-card:not(.bg-primary) {
    background: $dark;
  }

  .sticky-header-table {
    :deep(thead tr th) {
      background: color.adjust($dark, $lightness: 5%);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// PRINT
// ═══════════════════════════════════════════════════════════════
@media print {
  .summary-card,
  .q-btn,
  .q-input,
  .q-banner {
    display: none !important;
  }

  .table-card {
    box-shadow: none;
  }
}
</style>

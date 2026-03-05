<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-y-md">

      <!-- ─── HEADER ─────────────────────────────────────────── -->
      <div class="row items-center justify-between q-mb-sm">
        <div class="col-12 col-md-auto">
          <h4 class="text-h4 q-my-none text-primary text-weight-bold">
            <q-icon name="lock_clock" class="q-mr-sm" />
            Cierre de Turnos
          </h4>
          <div class="text-caption text-grey-7">Conciliación de Inventario y Lote por Llenadero</div>
        </div>
        <div class="col-12 col-md-auto q-mt-sm q-mt-md-none">
          <q-btn
            color="primary"
            icon="add"
            label="Generar Cierre"
            unelevated
            @click="showGenerarDialog = true"
          />
        </div>
      </div>

      <!-- ─── FILTROS ────────────────────────────────────────── -->
      <q-card flat bordered class="bg-grey-1">
        <q-expansion-item
          icon="filter_list"
          label="Filtros de Búsqueda"
          header-class="text-weight-medium"
        >
          <q-card-section>
            <div class="row q-col-gutter-md items-end">
              <div class="col-12 col-sm-3">
                <q-select
                  dense outlined clearable
                  v-model="filters.id_llenadero"
                  :options="llenaderosList"
                  option-value="id_llenadero"
                  option-label="nombre_llenadero"
                  label="Llenadero"
                  emit-value map-options
                />
              </div>
              <div class="col-12 col-sm-2">
                <q-select
                  dense outlined clearable
                  v-model="filters.estado"
                  :options="['CERRADO', 'PENDIENTE']"
                  label="Estado"
                />
              </div>
              <div class="col-12 col-sm-2">
                <q-input dense outlined v-model="filters.fecha_inicio" type="date" label="Desde" />
              </div>
              <div class="col-12 col-sm-2">
                <q-input dense outlined v-model="filters.fecha_fin" type="date" label="Hasta" />
              </div>
              <div class="col-12 col-sm-3 row q-gutter-sm justify-end">
                <q-btn flat color="grey-7" label="Limpiar" @click="clearFilters" />
                <q-btn color="secondary" label="Filtrar" unelevated @click="applyFilters" />
              </div>
            </div>
          </q-card-section>
        </q-expansion-item>
      </q-card>

      <!-- ─── TABLA ──────────────────────────────────────────── -->
      <q-table
        :rows="rows"
        :columns="columns"
        row-key="id_cierre"
        :loading="loading"
        v-model:pagination="pagination"
        @request="onRequest"
        flat bordered
        binary-state-sort
        :rows-per-page-options="[10, 20, 50]"
      >
        <!-- Turno badge -->
        <template #body-cell-turno="{ row }">
          <q-td auto-width>
            <q-badge
              :color="row.turno === 'DIURNO' ? 'amber-8' : 'indigo-8'"
              :label="row.turno"
            />
          </q-td>
        </template>

        <!-- Estado badge -->
        <template #body-cell-estado="{ row }">
          <q-td auto-width>
            <q-badge
              :color="row.estado === 'CERRADO' ? 'positive' : 'warning'"
              :label="row.estado"
            />
          </q-td>
        </template>

        <!-- Despachos count -->
        <template #body-cell-despachos="{ row }">
          <q-td auto-width class="text-center">
            <q-badge
              v-if="row.Solicitudes?.length"
              color="blue-2" text-color="blue-9"
              :label="`${row.Solicitudes.length} sol.`"
            />
            <span v-else class="text-grey-5">—</span>
          </q-td>
        </template>

        <!-- Total despachado (estilo diferencia neta como en Mediciones) -->
        <template #body-cell-total_despachado="{ row }">
          <q-td auto-width>
            <template v-if="row.Solicitudes?.length">
              <div class="text-primary text-weight-bold">
                <q-icon name="local_shipping" size="xs" class="q-mr-xs" />
                {{ row.Solicitudes.reduce((s, x) => s + parseFloat(x.cantidad_despachada || 0), 0).toLocaleString() }} L
              </div>
            </template>
            <span v-else class="text-grey-5">—</span>
          </q-td>
        </template>

        <!-- Acciones -->
        <template #body-cell-acciones="{ row }">
          <q-td auto-width class="q-gutter-x-xs">
            <q-btn
              dense round flat
              color="primary" icon="visibility"
              @click="openDetalle(row)"
            >
              <q-tooltip>Ver Detalles</q-tooltip>
            </q-btn>
            <q-btn
              dense round flat
              color="secondary" icon="description"
              @click="verReporte(row)"
            >
              <q-tooltip>Reporte Final</q-tooltip>
            </q-btn>
          </q-td>
        </template>

        <!-- empty -->
        <template #no-data>
          <div class="column items-center q-pa-xl text-grey-6 full-width">
            <q-icon name="lock_clock" size="64px" color="grey-3" />
            <div class="text-h6 q-mt-sm">Sin cierres registrados</div>
            <div class="text-caption">Usa el botón "Generar Cierre" para iniciar</div>
          </div>
        </template>
      </q-table>
    </div>

    <!-- ─── DIALOG: GENERAR CIERRE ────────────────────────── -->
    <GenerarCierreDialog
      v-model="showGenerarDialog"
      :loading="loading"
      :cargando-tanques="cargandoTanques"
      :llenaderos-list="llenaderosList"
      :pcp-list="pcpList"
      :tanques="tanquesActivos"
      @llenadero-changed="onLlenaderoChanged"
      @save="onGenerarCierre"
    />

    <!-- ─── DIALOG: DETALLE ────────────────────────────────── -->
    <q-dialog v-model="showDetalleDialog" maximized transition-show="slide-up">
      <q-card>
        <q-bar class="bg-primary text-white">
          <q-icon name="lock_clock" />
          <div class="q-ml-sm text-weight-bold">
            Detalle — Cierre #{{ cierreSeleccionado?.id_cierre }}
          </div>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup />
        </q-bar>

        <q-card-section v-if="cierreSeleccionado" class="q-pa-lg">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6 col-md-3">
              <div class="text-caption text-grey-7">Llenadero</div>
              <div class="text-body1 text-weight-medium">{{ cierreSeleccionado.Llenadero?.nombre_llenadero ?? '—' }}</div>
            </div>
            <div class="col-12 col-sm-6 col-md-2">
              <div class="text-caption text-grey-7">Fecha</div>
              <div class="text-body1 text-weight-medium">{{ cierreSeleccionado.fecha_lote }}</div>
            </div>
            <div class="col-12 col-sm-6 col-md-2">
              <div class="text-caption text-grey-7">Turno</div>
              <q-badge :color="cierreSeleccionado.turno === 'DIURNO' ? 'amber-8' : 'indigo-8'" :label="cierreSeleccionado.turno" />
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <div class="text-caption text-grey-7">Período</div>
              <div class="text-body1 text-weight-medium">
                {{ cierreSeleccionado.hora_inicio_lote }} → {{ cierreSeleccionado.hora_cierre_lote }}
              </div>
            </div>
            <div class="col-12 col-sm-6 col-md-2">
              <div class="text-caption text-grey-7">Estado</div>
              <q-badge :color="cierreSeleccionado.estado === 'CERRADO' ? 'positive' : 'warning'" :label="cierreSeleccionado.estado" />
            </div>
          </div>

          <q-separator class="q-my-md" />
          <div class="text-subtitle2 text-primary q-mb-sm">Almacenista</div>
          <div class="text-body2">
            {{ cierreSeleccionado.Almacenista ? `${cierreSeleccionado.Almacenista.nombre} ${cierreSeleccionado.Almacenista.apellido}` : '—' }}
          </div>
          

          <q-separator v-if="cierreSeleccionado.observaciones" class="q-my-md" />
          <div v-if="cierreSeleccionado.observaciones">
            <div class="text-subtitle2 text-primary q-mb-sm">Observaciones</div>
            <div class="text-body2">{{ cierreSeleccionado.observaciones }}</div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cerrar" v-close-popup />
          <q-btn
            unelevated color="secondary" icon="description"
            label="Ver Reporte" @click="verReporte(cierreSeleccionado); showDetalleDialog = false"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ─── DIALOG: REPORTE ─────────────────────────────────── -->
    <q-dialog v-model="showReporteDialog" maximized transition-show="slide-up">
      <q-card>
        <q-bar class="bg-secondary text-white">
          <q-icon name="description" />
          <div class="q-ml-sm text-weight-bold">
            Reporte Final — Cierre #{{ cierreSeleccionado?.id_cierre }}
          </div>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup />
        </q-bar>

        <q-inner-loading :showing="loading && !reporteActual">
          <q-spinner-gears size="50px" color="secondary" />
          <div class="q-mt-sm text-grey-7">Generando reporte...</div>
        </q-inner-loading>

        <q-card-section v-if="reporteActual" class="q-pa-lg">

          <!-- Encabezado info -->
          <div class="row q-col-gutter-md q-mb-md">
            <div v-for="(val, label) in encabezadoResumen" :key="label" class="col-auto">
              <div class="text-caption text-grey-6">{{ label }}</div>
              <div class="text-body2 text-weight-bold">{{ val }}</div>
              
            </div class="col-auto">
             <div class="text-caption text-body5 text-red-6 text-weight-bold" >Total Despachado: {{ totalDespachado }}</div>
            
          </div>



          <!-- Tabla de despachos con cantidad solicitada + niveles por tanque -->
          <q-table
            :rows="reporteActual.filas"
            :columns="columnasReporte"
            flat bordered dense
            :rows-per-page-options="[0]"
            hide-bottom
          >
            <!-- Body completo para poder colorear columnas dinámicas por tanque -->
            <template #body="{ row }">
              <q-tr>
                <q-td class="text-center text-caption">{{ row.item }}</q-td>
                <q-td class="text-caption">{{ row.fecha }}</q-td>
                <q-td class="text-caption">{{ row.nombre_apellido }}</q-td>
                <q-td class="text-caption">{{ row.placa }}</q-td>
                <q-td class="text-caption">{{ row.dependencia }}</q-td>
                <q-td class="text-caption">{{ row.subdependencia }}</q-td>

                <!-- Solicitado -->
                <q-td class="text-right text-caption text-grey-7">
                  {{ Number(row.cant_solicitada).toLocaleString() }}
                </q-td>

                <!-- Despachado -->
                <q-td class="text-right text-weight-bold text-primary text-caption">
                  {{ Number(row.cant_despachada).toLocaleString() }}
                </q-td>

                <!-- Diferencia -->
                <q-td
                  class="text-right text-weight-bold text-caption"
                  :class="(row.cant_solicitada - row.cant_despachada) > 0 ? 'text-warning' : 'text-positive'"
                >
                  {{ (row.cant_solicitada - row.cant_despachada).toLocaleString() }}
                </q-td>

                <!-- Stock por tanque — color naranja como en la imagen -->
                <q-td
                  v-for="t in reporteActual.encabezado.tanques"
                  :key="t.codigo"
                  class="text-right text-caption text-weight-bold text-deep-orange-8"
                >
                  {{ row.stock_tanques?.[t.codigo] != null
                    ? Number(row.stock_tanques[t.codigo]).toLocaleString()
                    : '—' }}
                </q-td>

                <!-- Stock Total — azul negrita -->
                <q-td class="text-right text-weight-bold text-primary text-caption">
                  {{ Number(row.stock_total).toLocaleString() }}
                </q-td>

                <q-td class="text-caption">{{ row.almacen }}</q-td>
                <q-td class="text-caption">{{ row.pcp }}</q-td>
              </q-tr>
            </template>
          </q-table>


          <div v-if="!reporteActual.filas.length" class="text-center text-grey-6 q-pa-xl">
            <q-icon name="inbox" size="48px" class="q-mb-sm" />
            <div>Sin despachos asociados a este cierre</div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { computed } from "vue";
import { useCierreTurnoPage } from "../../components/closings/composables/useCierreTurnoPage.js";
import GenerarCierreDialog from "../../components/closings/GenerarCierreDialog.vue";

const {
  rows, loading, filter, pagination, reporteActual,
  showGenerarDialog, showReporteDialog, showDetalleDialog,
  filters, llenaderosList, pcpList,
  tanquesActivos, cargandoTanques,
  cierreSeleccionado,
  columns,
  onRequest, applyFilters, clearFilters,
  onLlenaderoChanged, onGenerarCierre,
  openDetalle, verReporte,
} = useCierreTurnoPage();

// Encabezado legible del reporte
const encabezadoResumen = computed(() => {
  if (!reporteActual.value) return {};
  const e = reporteActual.value.encabezado;
  return {
    "Llenadero": e.llenadero ?? "—",
    "Turno": e.turno ?? "—",
    "Fecha": e.fecha_lote ?? "—",
    "Período": `${e.hora_inicio ?? "—"} → ${e.hora_cierre ?? "—"}`,
    "Almacenista": e.almacenista || "—",
    
  };
});

// Columnas dinámicas del reporte con cant_solicitada + columnas por tanque
const columnasReporte = computed(() => {
  if (!reporteActual.value) return [];
  const base = [
    { name: "item",             label: "#",            field: "item",             align: "center", style: "width:40px" },
    { name: "fecha",            label: "Fecha/Hora",   field: "fecha",            align: "left"  },
    { name: "nombre_apellido",  label: "Solicitante",  field: "nombre_apellido",  align: "left"  },
    { name: "placa",            label: "Placa",        field: "placa",            align: "left"  },
    { name: "dependencia",      label: "Dependencia",  field: "dependencia",      align: "left"  },
    { name: "subdependencia",   label: "Sub-dep.",     field: "subdependencia",   align: "left"  },
    { name: "cant_solicitada",  label: "Solicitado",   field: "cant_solicitada",  align: "right" },
    { name: "cant_despachada",  label: "Despachado",   field: "cant_despachada",  align: "right" },
    { name: "diferencia",       label: "Diferencia",   field: (r) => r.cant_solicitada - r.cant_despachada, align: "right" },
  ];

  // Una columna por cada tanque del llenadero en orden del encabezado
  const stockCols = (reporteActual.value.encabezado?.tanques ?? []).map((t) => ({
    name:  `stock_${t.codigo}`,
    label: `Stock ${t.codigo}`,
    field: (row) =>
      row.stock_tanques?.[t.codigo] != null
        ? `${Number(row.stock_tanques[t.codigo]).toLocaleString()} L`
        : '—',
    align: "right",
  }));

  return [
    ...base,
    ...stockCols,
    { name: "stock_total", label: "Stock Total", field: "stock_total", align: "right" },
    { name: "almacen",     label: "Almacén",     field: "almacen",     align: "left"  },
    { name: "pcp",         label: "PCP",         field: "pcp",         align: "left"  },
  ];
});


const totalDespachado = computed(() => {
  if (!reporteActual.value?.filas) return 0;
  return reporteActual.value.filas.reduce(
    (sum, f) => sum + parseFloat(f.cant_despachada || 0), 0
  );
});
</script>

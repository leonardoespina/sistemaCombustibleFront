<template>
  <q-page class="q-pa-md page-background">
    <!-- HEADER -->
    <div class="row items-center q-mb-lg">
      <div class="col">
        <div class="text-h4 text-weight-bold">Pendientes por Acta</div>
        <div class="text-subtitle1 text-grey-7">Despachos realizados sin acta generada</div>
      </div>
      <div class="col-auto">
        <q-btn outline color="primary" icon="refresh" label="Actualizar"
          @click="store.fetchReport" :loading="store.loading" />
      </div>
    </div>

    <!-- KPIs -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-6 col-md-4">
        <q-card class="summary-card cursor-pointer"
          :class="{ 'card-selected': selectedFuel === 'GASOLINA' }"
          @click="selectedFuel = 'GASOLINA'">
          <q-card-section class="row items-center no-wrap">
            <div class="fuel-icon-wrapper bg-amber-1">
              <q-icon name="local_gas_station" size="md" color="amber-8" />
            </div>
            <div class="q-ml-md">
              <div class="text-h3 text-weight-bold text-amber-9">{{ store.stats.gasolina.count }}</div>
              <div class="text-subtitle2 text-grey-7">Gasolina Pendiente</div>
            </div>
            <q-space />
            <div class="text-right">
              <div class="text-h6 text-weight-medium">{{ formatNumber(store.stats.gasolina.litros) }}</div>
              <div class="text-caption text-grey">Litros</div>
            </div>
          </q-card-section>
          <div v-if="selectedFuel === 'GASOLINA'" class="selection-indicator bg-amber" />
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-4">
        <q-card class="summary-card cursor-pointer"
          :class="{ 'card-selected': selectedFuel === 'GASOIL' }"
          @click="selectedFuel = 'GASOIL'">
          <q-card-section class="row items-center no-wrap">
            <div class="fuel-icon-wrapper bg-deep-purple-1">
              <q-icon name="oil_barrel" size="md" color="deep-purple-8" />
            </div>
            <div class="q-ml-md">
              <div class="text-h3 text-weight-bold text-deep-purple-9">{{ store.stats.gasoil.count }}</div>
              <div class="text-subtitle2 text-grey-7">Gasoil Pendiente</div>
            </div>
            <q-space />
            <div class="text-right">
              <div class="text-h6 text-weight-medium">{{ formatNumber(store.stats.gasoil.litros) }}</div>
              <div class="text-caption text-grey">Litros</div>
            </div>
          </q-card-section>
          <div v-if="selectedFuel === 'GASOIL'" class="selection-indicator bg-deep-purple" />
        </q-card>
      </div>

      <div class="col-12 col-md-4">
        <q-card class="summary-card bg-primary text-white">
          <q-card-section class="row items-center no-wrap">
            <div class="fuel-icon-wrapper bg-white">
              <q-icon name="pending_actions" size="md" color="primary" />
            </div>
            <div class="q-ml-md">
              <div class="text-h3 text-weight-bold">{{ store.stats.total.count }}</div>
              <div class="text-subtitle2" style="opacity:.8">Total Pendientes</div>
            </div>
            <q-space />
            <div class="text-right">
              <div class="text-h6 text-weight-medium">{{ formatNumber(store.stats.total.litros) }}</div>
              <div class="text-caption" style="opacity:.7">Litros Totales</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- TABLA -->
    <q-card class="table-card">
      <q-card-section class="q-pb-none">
        <div class="row items-center q-gutter-md">
          <div class="col-12 col-sm-auto">
            <div class="row items-center no-wrap">
              <q-icon
                :name="selectedFuel === 'GASOLINA' ? 'local_gas_station' : 'oil_barrel'"
                :color="selectedFuel === 'GASOLINA' ? 'amber-8' : 'deep-purple-8'"
                size="sm" class="q-mr-sm"
              />
              <span class="text-h6">
                Despachos de {{ selectedFuel === 'GASOLINA' ? 'Gasolina' : 'Gasoil' }}
              </span>
              <q-badge
                :color="selectedFuel === 'GASOLINA' ? 'amber' : 'deep-purple'"
                :label="filteredCount" class="q-ml-sm"
              />
            </div>
          </div>
          <q-space />
          <div class="col-12 col-sm-4 col-md-3">
            <q-input v-model="search" dense outlined placeholder="Buscar placa, chofer..." clearable>
              <template #prepend><q-icon name="search" /></template>
            </q-input>
          </div>
          <div class="col-auto">
            <q-btn-dropdown color="primary" icon="download" label="Exportar"
              :disable="filteredCount === 0" no-caps unelevated>
              <q-list>
                <q-item clickable v-close-popup @click="exportTable('csv')">
                  <q-item-section avatar><q-icon name="description" color="green" /></q-item-section>
                  <q-item-section><q-item-label>Exportar CSV</q-item-label></q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable v-close-popup @click="printTable">
                  <q-item-section avatar><q-icon name="print" color="grey-7" /></q-item-section>
                  <q-item-section><q-item-label>Imprimir</q-item-label></q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>
          </div>
        </div>
      </q-card-section>

      <q-table flat :rows="filteredData" :columns="columns" row-key="id_despacho"
        :loading="store.loading" :pagination="pagination"
        no-data-label="No hay despachos pendientes"
        :rows-per-page-options="[10, 25, 50, 0]" class="sticky-header-table">

        <template #body-cell-fecha="props">
          <q-td :props="props">
            <div class="row items-center no-wrap">
              <q-icon :name="getAgeIcon(props.row.fecha_hora).icon"
                :color="getAgeIcon(props.row.fecha_hora).color" size="xs" class="q-mr-sm" />
              <div>
                <div>{{ formatDate(props.row.fecha_hora) }}</div>
                <div class="text-caption text-grey">{{ getRelativeTime(props.row.fecha_hora) }}</div>
              </div>
            </div>
          </q-td>
        </template>

        <template #body-cell-placa="props">
          <q-td :props="props">
            <q-chip dense square color="grey-3" text-color="grey-9" icon="directions_car">
              {{ props.value }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-tipo_destino="props">
          <q-td :props="props" class="text-center">
            <q-chip dense
              :color="props.value === 'VEHICULO' ? 'blue-1' : 'orange-1'"
              :text-color="props.value === 'VEHICULO' ? 'blue-8' : 'orange-8'"
              :icon="props.value === 'VEHICULO' ? 'directions_car' : 'inventory_2'">
              {{ props.value === 'VEHICULO' ? 'Vehículo' : 'Bidón' }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-litros_despachados="props">
          <q-td :props="props" class="text-right">
            <span class="text-weight-bold text-primary">{{ formatNumber(props.value) }}</span>
            <span class="text-caption text-grey q-ml-xs">Lts</span>
          </q-td>
        </template>

        <template #bottom-row>
          <q-tr class="bg-grey-2 text-weight-bold">
            <q-td colspan="6" class="text-right">
              <span v-if="search?.trim()">Total filtrado ({{ filteredCount }} registros):</span>
              <span v-else>Total litros pendientes ({{ filteredCount }} registros):</span>
            </q-td>
            <q-td class="text-right text-primary text-h6">{{ formatNumber(filteredTotalLitros) }} Lts</q-td>
            <q-td />
          </q-tr>
        </template>

        <template #no-data>
          <div class="full-width column items-center q-pa-xl text-grey-6">
            <q-icon name="check_circle" size="64px" color="positive" />
            <div class="text-h6 q-mt-md">¡Todo al día!</div>
            <div class="text-body2">No hay despachos de {{ selectedFuel.toLowerCase() }} pendientes por acta</div>
          </div>
        </template>
      </q-table>
    </q-card>

    <!-- ALERTA PENDIENTES ANTIGUOS -->
    <q-banner v-if="store.hasOldPending" class="bg-warning-1 q-mt-md" rounded>
      <template #avatar><q-icon name="warning" color="warning" /></template>
      <div class="text-weight-medium">Atención: Tienes pendientes antiguos</div>
      <div class="text-caption">
        Hay {{ store.oldPendingCount }} despachos con más de 7 días sin generar acta
      </div>
      <template #action>
        <q-btn flat color="warning" label="Ver antiguos" @click="filterOld" />
      </template>
    </q-banner>
  </q-page>
</template>

<script setup>
import { usePendingActPage } from '../../composables/usePendingActPage';

const {
  store, selectedFuel, search, columns, pagination,
  filteredData, filteredCount, filteredTotalLitros,
  formatNumber, formatDate, getRelativeTime, getAgeIcon,
  filterOld, exportTable, printTable,
} = usePendingActPage();
</script>

<style lang="scss" scoped>
.page-background { background: #f5f7fa; min-height: 100vh; }
.summary-card {
  transition: all 0.2s ease; border: 2px solid transparent;
  position: relative; overflow: hidden;
  &:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,.1); }
  &.card-selected { border-color: var(--q-primary); }
}
.fuel-icon-wrapper { width: 56px; height: 56px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.selection-indicator { position: absolute; bottom: 0; left: 0; right: 0; height: 4px; }
.table-card { border-radius: 12px; }
.sticky-header-table {
  max-height: 500px;
  :deep(thead tr th) { position: sticky; z-index: 1; background: #f5f5f5; }
  :deep(thead tr:first-child th) { top: 0; }
}
</style>

<template>
  <q-page :class="$q.screen.lt.sm ? 'q-pa-sm' : 'q-pa-md'" class="bg-grey-2">
    <div class="q-gutter-y-md">

      <!-- HEADER RESPONSIVE -->
      <div class="row items-center no-wrap">
        <div class="col">
          <div :class="$q.screen.lt.sm ? 'text-h6' : 'text-h5'" class="text-weight-bold q-mb-none">
            Pendientes por Acta
          </div>
          <div class="text-caption text-grey-7">Despachos realizados sin acta generada</div>
        </div>
        <div class="col-auto">
          <q-btn
            outline color="primary" icon="refresh"
            :label="$q.screen.gt.xs ? 'Actualizar' : ''"
            @click="store.fetchReport" :loading="store.loading"
            dense
          />
        </div>
      </div>

      <!-- KPIs RESPONSIVE -->
      <div class="row q-col-gutter-sm">
        <!-- Gasolina -->
        <div class="col-12 col-sm-6 col-md-4">
          <q-card
            class="cursor-pointer transition-all"
            :class="selectedFuel === 'GASOLINA' ? 'bg-amber-1' : 'bg-white'"
            style="border: 2px solid transparent"
            :style="selectedFuel === 'GASOLINA' ? 'border-color: var(--q-amber)' : ''"
            @click="selectedFuel = 'GASOLINA'"
            flat bordered
          >
            <q-card-section class="row items-center no-wrap q-pa-sm">
              <q-avatar color="amber-1" text-color="amber-8" icon="local_gas_station" size="48px" />
              <div class="q-ml-sm col">
                <div class="text-h5 text-weight-bold text-amber-9">{{ store.stats.gasolina.count }}</div>
                <div class="text-caption text-grey-7">Gasolina Pendiente</div>
              </div>
              <div class="text-right col-auto">
                <div class="text-subtitle2 text-weight-bold">{{ formatNumber(store.stats.gasolina.litros) }}</div>
                <div class="text-caption text-grey">Litros</div>
              </div>
            </q-card-section>
            <q-linear-progress v-if="selectedFuel === 'GASOLINA'" color="amber" size="3px" :value="1" />
          </q-card>
        </div>

        <!-- Gasoil -->
        <div class="col-12 col-sm-6 col-md-4">
          <q-card
            class="cursor-pointer transition-all"
            :class="selectedFuel === 'GASOIL' ? 'bg-deep-purple-1' : 'bg-white'"
            style="border: 2px solid transparent"
            :style="selectedFuel === 'GASOIL' ? 'border-color: var(--q-deep-purple)' : ''"
            @click="selectedFuel = 'GASOIL'"
            flat bordered
          >
            <q-card-section class="row items-center no-wrap q-pa-sm">
              <q-avatar color="deep-purple-1" text-color="deep-purple-8" icon="oil_barrel" size="48px" />
              <div class="q-ml-sm col">
                <div class="text-h5 text-weight-bold text-deep-purple-9">{{ store.stats.gasoil.count }}</div>
                <div class="text-caption text-grey-7">Gasoil Pendiente</div>
              </div>
              <div class="text-right col-auto">
                <div class="text-subtitle2 text-weight-bold">{{ formatNumber(store.stats.gasoil.litros) }}</div>
                <div class="text-caption text-grey">Litros</div>
              </div>
            </q-card-section>
            <q-linear-progress v-if="selectedFuel === 'GASOIL'" color="deep-purple" size="3px" :value="1" />
          </q-card>
        </div>

        <!-- Total -->
        <div class="col-12 col-md-4">
          <q-card flat bordered class="bg-primary text-white">
            <q-card-section class="row items-center no-wrap q-pa-sm">
              <q-avatar color="white" text-color="primary" icon="pending_actions" size="48px" />
              <div class="q-ml-sm col">
                <div class="text-h5 text-weight-bold">{{ store.stats.total.count }}</div>
                <div class="text-caption" style="opacity:.8">Total Pendientes</div>
              </div>
              <div class="text-right col-auto">
                <div class="text-subtitle2 text-weight-bold">{{ formatNumber(store.stats.total.litros) }}</div>
                <div class="text-caption" style="opacity:.7">Litros Totales</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- TABLA -->
      <q-card flat bordered>
        <q-card-section class="q-pb-none" :class="$q.screen.lt.sm ? 'q-pa-sm' : 'q-pa-md'">
          <div class="row items-center q-col-gutter-sm">
            <div class="col-12 col-sm-auto">
              <div class="row items-center no-wrap">
                <q-icon
                  :name="selectedFuel === 'GASOLINA' ? 'local_gas_station' : 'oil_barrel'"
                  :color="selectedFuel === 'GASOLINA' ? 'amber-8' : 'deep-purple-8'"
                  size="sm" class="q-mr-xs"
                />
                <span class="text-subtitle1 text-weight-bold">
                  {{ selectedFuel === 'GASOLINA' ? 'Gasolina' : 'Gasoil' }}
                </span>
                <q-badge
                  :color="selectedFuel === 'GASOLINA' ? 'amber' : 'deep-purple'"
                  :label="filteredCount" class="q-ml-sm"
                />
              </div>
            </div>
            <q-space />
            <div class="col-12 col-sm-5 col-md-4">
              <q-input v-model="search" dense outlined placeholder="Buscar placa, chofer..." clearable>
                <template #prepend><q-icon name="search" /></template>
              </q-input>
            </div>
            <div class="col-auto">
              <q-btn-dropdown color="primary" icon="download" :label="$q.screen.gt.xs ? 'Exportar' : ''"
                :disable="filteredCount === 0" no-caps unelevated dense>
                <q-list>
                  <q-item clickable v-close-popup @click="exportTable('csv')">
                    <q-item-section avatar><q-icon name="description" color="green" /></q-item-section>
                    <q-item-section><q-item-label>CSV</q-item-label></q-item-section>
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

        <q-table
          flat :rows="filteredData" :columns="columns" row-key="id_despacho"
          :loading="store.loading" :pagination="pagination"
          no-data-label="No hay despachos pendientes"
          :rows-per-page-options="[10, 25, 50, 0]"
          wrap-cells dense
          style="max-height: 500px"
        >
          <template #body-cell-fecha="props">
            <q-td :props="props">
              <div class="row items-center no-wrap">
                <q-icon :name="getAgeIcon(props.row.fecha_hora).icon"
                  :color="getAgeIcon(props.row.fecha_hora).color" size="xs" class="q-mr-xs" />
                <div>
                  <div class="text-caption">{{ formatDate(props.row.fecha_hora) }}</div>
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
                :icon="props.value === 'VEHICULO' ? 'directions_car' : 'inventory_2'"
              >
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
              <q-td colspan="6" class="text-right text-caption">
                <span v-if="search?.trim()">Total filtrado ({{ filteredCount }}):</span>
                <span v-else>Total litros pendientes ({{ filteredCount }}):</span>
              </q-td>
              <q-td class="text-right text-primary text-subtitle1">{{ formatNumber(filteredTotalLitros) }} Lts</q-td>
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
      <q-banner v-if="store.hasOldPending" class="bg-orange-1" rounded>
        <template #avatar><q-icon name="warning" color="warning" /></template>
        <div class="text-weight-medium">Atención: Tienes pendientes antiguos</div>
        <div class="text-caption">
          Hay {{ store.oldPendingCount }} despachos con más de 7 días sin generar acta
        </div>
        <template #action>
          <q-btn flat color="warning" label="Ver antiguos" @click="filterOld" />
        </template>
      </q-banner>

    </div>
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

<style scoped>
.transition-all {
  transition: all 0.2s ease;
}
</style>

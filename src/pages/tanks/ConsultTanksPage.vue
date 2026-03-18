<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-y-md">
      <!-- Título de la sección -->
      <div class="row items-center justify-between">
        <h4 class="text-h4 q-my-none text-primary">Disponibilidad de Tanques</h4>
      </div>

      <!-- Resumen por Llenadero -->
      <div v-if="loadingLlenaderos" class="flex flex-center q-pa-lg">
        <q-spinner color="primary" size="3em" />
      </div>
      
      <div v-else class="row q-col-gutter-md">
        <div 
          class="col-12 col-md-6 col-lg-4" 
          v-for="llenadero in llenaderosStats" 
          :key="llenadero.id_llenadero"
        >
          <q-card class="bg-grey-1 shadow-2 rounded-borders">
            <q-card-section>
              <div class="text-h6 text-primary q-mb-sm">
                <q-icon name="ev_station" size="sm" class="q-mr-xs" />
                {{ llenadero.nombre_llenadero }}
              </div>
              
              <div v-if="llenadero.estadisticas && llenadero.estadisticas.length > 0">
                <div 
                  v-for="(stat, idx) in llenadero.estadisticas" 
                  :key="idx" 
                  class="q-mb-md"
                >
                  <div class="row justify-between text-subtitle2 text-grey-8 q-mb-xs">
                    <span>{{ stat.nombre_combustible }}</span>
                    <span>{{ stat.disponibilidad_total.toLocaleString() }} L / {{ stat.capacidad_total.toLocaleString() }} L</span>
                  </div>
                  <q-linear-progress 
                    rounded
                    size="15px" 
                    :value="stat.capacidad_total > 0 ? (stat.disponibilidad_total / stat.capacidad_total) : 0" 
                    :color="getProgressColor(stat.capacidad_total > 0 ? (stat.disponibilidad_total / stat.capacidad_total) : 0)" 
                  />
                  <div class="text-caption text-grey-6 text-right q-mt-xs">
                    {{ stat.capacidad_total > 0 ? ((stat.disponibilidad_total / stat.capacidad_total) * 100).toFixed(1) : 0 }}%
                  </div>
                </div>
              </div>
              <div v-else class="text-caption text-grey text-center q-pa-md">
                Sin tanques asignados
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <q-separator class="q-my-md" />

      <!-- Detalle de Tanques en Tabla -->
      <div class="text-h6 text-primary q-mb-sm">Detalle Individual de Tanques</div>
      <q-table
        :rows="tanques"
        :columns="columns"
        row-key="id_tanque"
        :loading="loadingTanques"
        :pagination="{ rowsPerPage: 10 }"
        v-model:filter="filter"
        flat
        bordered
      >
        <template v-slot:top-right>
          <q-input
            borderless
            dense
            debounce="300"
            v-model="filter"
            placeholder="Buscar tanque..."
          >
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </template>

        <template v-slot:body-cell-nivel="props">
          <q-td :props="props">
            <div class="column items-center">
              <div class="text-caption">
                {{ props.row.nivel_actual }} / {{ props.row.capacidad_maxima }} L
              </div>
              <q-linear-progress
                size="15px"
                :value="props.row.capacidad_maxima > 0 ? props.row.nivel_actual / props.row.capacidad_maxima : 0"
                :color="getProgressColor(props.row.capacidad_maxima > 0 ? props.row.nivel_actual / props.row.capacidad_maxima : 0)"
                class="q-mt-xs rounded-borders"
                style="width: 100px"
              />
            </div>
          </q-td>
        </template>
        
        <template v-slot:body-cell-activo_despacho="props">
          <q-td :props="props" align="center">
            <q-icon
              :name="props.row.activo_para_despacho ? 'check_circle' : 'cancel'"
              :color="props.row.activo_para_despacho ? 'positive' : 'grey-5'"
              size="sm"
            >
              <q-tooltip>{{ props.row.activo_para_despacho ? 'Activo para despacho' : 'Inactivo para despacho' }}</q-tooltip>
            </q-icon>
          </q-td>
        </template>
      </q-table>
    </div>
  </q-page>
</template>

<script setup>
import { useConsultTanks } from './composables/useConsultTanks';

const {
  llenaderosStats,
  tanques,
  loadingLlenaderos,
  loadingTanques,
  filter,
  getProgressColor
} = useConsultTanks();

// Definición de Columnas de la Tabla
const columns = [
  { name: "llenadero", label: "Llenadero", field: (row) => row.Llenadero?.nombre_llenadero, align: "left", sortable: true },
  { name: "codigo", label: "Código", field: "codigo", sortable: true, align: "left" },
  { name: "nombre", label: "Nombre Tanque", field: "nombre", sortable: true, align: "left" },
  { name: "combustible", label: "Combustible", field: (row) => row.TipoCombustible?.nombre, align: "left", sortable: true },
  { name: "tipo", label: "Tipo", field: "tipo_tanque", align: "center", sortable: true },
  { name: "nivel", label: "Ocupación Actual", align: "center" },
  { name: "activo_despacho", label: "Uso", align: "center", sortable: true }
];
</script>

<style scoped>
.my-card {
  width: 100%;
}
</style>

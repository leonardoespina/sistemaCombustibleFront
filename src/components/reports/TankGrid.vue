<template>
  <!--
    TankGrid.vue
    Renderiza la cuadrícula de cilindros agrupada por TipoCombustible.

    Estructura:
      Por cada tipo de combustible que exista en los datos:
        - Título de sección (nombre del tipo de combustible)
        - Un TankCylinder por cada Llenadero que tenga ese tipo
        - Un TankCylinder resumen "TOTAL" al final del grupo
  -->
  <div v-if="datos && datos.length" class="tank-grid-root">

    <!-- Leyenda global -->
    <div class="legend-bar">
      <span class="legend-item">
        <span class="dot dot-empty"></span> Capacidad disponible
      </span>
      <span class="legend-item">
        <span class="dot dot-stock"></span> Stock actual
      </span>
      <span class="legend-item">
        <span class="dot dot-consumo"></span> Consumo del período
      </span>
    </div>

    <!-- Fila horizontal: un bloque por cada TipoCombustible -->
    <div class="tc-blocks-row">

      <div
        v-for="tc in tiposCombustibleOrdenados"
        :key="tc.id_tipo_combustible"
        class="tc-block"
      >
        <!-- Cabecera del tipo de combustible -->
        <div class="tc-header">
          <q-icon name="local_gas_station" size="sm" class="q-mr-xs" />
          <span>{{ tc.nombre_combustible }}</span>
        </div>

        <!-- Cilindros -->
        <div class="cylinders-row">
          <!-- Uno por llenadero -->
          <TankCylinder
            v-for="ll in llenaderosPorTC(tc.id_tipo_combustible)"
            :key="`${ll.id_llenadero}_${tc.id_tipo_combustible}`"
            :uid="`ll-${ll.id_llenadero}-tc-${tc.id_tipo_combustible}`"
            :nombre="ll.nombre_llenadero"
            :capacidad="ll.tcData.capacidad_total"
            :stock="ll.tcData.stock_actual"
            :consumido="ll.tcData.consumido_periodo"
            :width="cylinderW"
            :height="cylinderH"
          />

          <!-- Separador vertical -->
          <div class="total-separator"></div>

          <!-- Cilindro total -->
          <TankCylinder
            :uid="`total-tc-${tc.id_tipo_combustible}`"
            :nombre="`TOTAL ${tc.nombre_combustible}`"
            :capacidad="tc.capacidad_total"
            :stock="tc.stock_actual"
            :consumido="tc.consumido_periodo"
            :width="cylinderW"
            :height="cylinderH"
            class="total-cylinder"
          />
        </div>

      </div>
      <!-- /tc-block -->

    </div>
    <!-- /tc-blocks-row -->

  </div>
  <!-- /tank-grid-root -->

  <div v-else class="no-data">
    <q-icon name="inbox" size="3rem" color="grey-5" />
    <div class="q-mt-sm text-grey-6">Sin datos de tanques activos</div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import TankCylinder from "./TankCylinder.vue";

const props = defineProps({
    /** Array de llenaderos con sus tipos_combustible (respuesta del backend) */
    datos:                  { type: Array, default: () => [] },
    /** Totales por tipo de combustible */
    totalesPorCombustible:  { type: Array, default: () => [] },
    cylinderW:              { type: Number, default: 100 },
    cylinderH:              { type: Number, default: 230 },
});

/** Tipos de combustible ordenados por nombre */
const tiposCombustibleOrdenados = computed(() =>
    [...props.totalesPorCombustible].sort((a, b) =>
        a.nombre_combustible.localeCompare(b.nombre_combustible)
    )
);

/**
 * Devuelve los llenaderos que tienen tanques del tipo de combustible indicado,
 * combinando sus datos de stock + consumo.
 */
function llenaderosPorTC(idTC) {
    return props.datos
        .map((ll) => {
            const tcData = ll.tipos_combustible.find(
                (tc) => tc.id_tipo_combustible === idTC
            );
            if (!tcData) return null;
            return { ...ll, tcData };
        })
        .filter(Boolean);
}
</script>

<style scoped>
.tank-grid-root {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Leyenda */
.legend-bar {
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
  font-size: 12px;
  color: #455A64;
  padding: 8px 0;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.dot {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 3px;
}
.dot-empty   { background: #C8DCF0; border: 1px solid #90CAF9; }
.dot-stock   { background: #1565C0; }
.dot-consumo { background: #F5A623; }

/* Contenedor horizontal de todos los bloques de combustible */
.tc-blocks-row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-start;
}

/* Bloque por tipo de combustible — tamaño según su contenido */
.tc-block {
  background: #F8FAFC;
  border: 1px solid #E3EAF2;
  border-radius: 12px;
  padding: 16px 20px;
  flex: 0 0 auto;
}

.tc-header {
  display: flex;
  align-items: center;
  font-weight: 700;
  font-size: 15px;
  color: #1565C0;
  margin-bottom: 16px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* Fila de cilindros dentro de cada bloque */
.cylinders-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 16px;
  align-items: flex-end;
}

/* Separador visual entre llenaderos y total */
.total-separator {
  width: 2px;
  background: #BBDEFB;
  align-self: stretch;
  border-radius: 1px;
  margin: 0 4px;
}

.total-cylinder :deep(.tank-name) {
  color: #0D47A1;
  font-size: 12px;
}

.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px;
  color: #90A4AE;
  font-size: 14px;
}

/* Responsive */
@media (max-width: 600px) {
  .tc-blocks-row {
    flex-direction: column;
  }
  .cylinders-row {
    flex-wrap: wrap;
    gap: 10px;
  }
  .total-separator {
    display: none;
  }
}
</style>

<template>
  <q-page class="q-pa-md bg-grey-2">

    <!-- ========================================= -->
    <!--  DASHBOARD ESTÁNDAR (usuario normal)       -->
    <!-- ========================================= -->
    <div v-if="isEstandar" class="q-gutter-y-md">

      <!-- HEADER -->
      <div class="row items-center justify-between q-mb-md">
        <div class="row items-center col-12 col-sm-auto q-mb-sm q-sm-mb-none">
          <q-icon name="home" size="3rem" color="primary" class="q-mr-md" />
          <div>
            <div class="text-h5 text-sm-h4 q-my-none text-weight-bold text-primary">
              Mi Panel de Combustible
            </div>
            <p class="text-grey-7 q-mb-none text-caption text-sm-body1">
              Bienvenido, <strong>{{ userName }}</strong> — {{ userDependency }}
            </p>
          </div>
        </div>
        <div class="col-12 col-sm-auto text-right text-sm-left">
          <q-btn
            unelevated
            icon="refresh"
            color="primary"
            label="Actualizar"
            @click="fetchCupos"
            :loading="loadingCupos"
          />
        </div>
      </div>

      <!-- TARJETAS RESUMEN -->
      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="bg-white text-center q-pa-md rounded-borders">
            <q-icon name="local_gas_station" size="2.5rem" color="primary" />
            <div class="text-h5 text-weight-bold text-primary q-mt-sm">
              {{ totalAsignado }} L
            </div>
            <div class="text-caption text-grey-7">Total Asignado</div>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="bg-white text-center q-pa-md rounded-borders">
            <q-icon name="show_chart" size="2.5rem" color="orange" />
            <div class="text-h5 text-weight-bold text-orange q-mt-sm">
              {{ totalConsumido }} L
            </div>
            <div class="text-caption text-grey-7">Total Consumido</div>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="bg-white text-center q-pa-md rounded-borders">
            <q-icon name="savings" size="2.5rem" color="positive" />
            <div class="text-h5 text-weight-bold text-positive q-mt-sm">
              {{ totalDisponible }} L
            </div>
            <div class="text-caption text-grey-7">Total Disponible</div>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="bg-white text-center q-pa-md rounded-borders">
            <q-icon name="donut_large" size="2.5rem" :color="colorUsoPorcentaje" />
            <div
              class="text-h5 text-weight-bold q-mt-sm"
              :class="`text-${colorUsoPorcentaje}`"
            >
              {{ usoPorcentajeGeneral }}%
            </div>
            <div class="text-caption text-grey-7">% de Uso General</div>
          </q-card>
        </div>
      </div>

      <!-- TABLA DE CUPOS -->
      <q-card flat bordered class="bg-white">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-h6 text-weight-bold">
              <q-icon name="assignment_ind" color="primary" class="q-mr-xs" />
              Mis Cupos — {{ periodoDisplay }}
            </div>
            <div class="text-caption text-grey-7">
              Estado de los cupos de combustible asignados a tu dependencia
            </div>
          </div>
          <q-input
            dense
            outlined
            v-model="periodo"
            type="month"
            label="Periodo"
            style="min-width: 160px"
            @update:model-value="fetchCupos"
          />
        </q-card-section>

        <q-table
          flat
          :rows="cupos"
          :columns="columns"
          row-key="id_cupo_actual"
          :loading="loadingCupos"
          no-data-label="No se encontraron cupos asignados para este periodo"
          :pagination="{ rowsPerPage: 10 }"
        >
          <!-- Disponibilidad con barra de progreso -->
          <template v-slot:body-cell-disponibilidad="props">
            <q-td :props="props">
              <div class="column q-gutter-xs" style="min-width: 150px">
                <div class="row justify-between text-caption text-weight-bold">
                  <span>{{ props.row.disponible }} L</span>
                  <span>{{ props.row.porcentaje_uso }}% Uso</span>
                </div>
                <q-linear-progress
                  rounded
                  size="10px"
                  :value="parseFloat(props.row.porcentaje_uso) / 100"
                  :color="getProgressColor(parseFloat(props.row.porcentaje_uso))"
                >
                  <q-tooltip>
                    {{ props.row.consumido }} L consumidos de {{ props.row.asignado }} L
                  </q-tooltip>
                </q-linear-progress>
              </div>
            </q-td>
          </template>

          <!-- Estado con chip de color -->
          <template v-slot:body-cell-estado="props">
            <q-td :props="props">
              <q-chip
                dense
                :color="getEstadoColor(props.row.estado)"
                text-color="white"
                size="sm"
                class="text-weight-bold"
              >
                {{ props.row.estado }}
              </q-chip>
            </q-td>
          </template>
        </q-table>

        <!-- Empty state -->
        <div
          v-if="!loadingCupos && cupos.length === 0"
          class="text-center q-pa-xl text-grey-6"
        >
          <q-icon name="sentiment_dissatisfied" size="4rem" />
          <div class="text-h6">No se encontraron registros.</div>
          <div>Verifique que su usuario tenga una dependencia asignada.</div>
        </div>
      </q-card>

      <!-- ACCESOS RÁPIDOS -->
      <q-card v-if="userRole !== 'INSPECTOR'" flat bordered class="bg-white">
        <q-card-section>
          <div class="text-h6 text-weight-bold q-mb-md">
            <q-icon name="bolt" color="primary" class="q-mr-xs" />
            Accesos Rápidos
          </div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6 col-md-3">
              <q-btn
                unelevated
                color="primary"
                icon="local_gas_station"
                label="Mis Solicitudes"
                class="full-width"
                to="/solicitudes"
              />
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <q-btn
                unelevated
                color="teal"
                icon="assignment_ind"
                label="Mis Cupos"
                class="full-width"
                to="/reportes/mis-cupos"
              />
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <q-btn
                unelevated
                color="deep-orange"
                icon="today"
                label="Reporte Diario"
                class="full-width"
                to="/reportes/diario"
              />
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <q-btn
                unelevated
                color="indigo"
                icon="analytics"
                label="Ver Reportes"
                class="full-width"
                to="/reportes/mis-cupos"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

    </div>

    <!-- ========================================= -->
    <!--  DASHBOARD ALMACEN                         -->
    <!-- ========================================= -->
    <div v-else-if="isAlmacenOrSeguridad" class="q-gutter-y-md">

      <!-- HEADER -->
      <div class="row items-center justify-between q-mb-md">
        <div class="row items-center col-12 col-sm-auto q-mb-sm q-sm-mb-none">
          <q-icon name="warehouse" size="3rem" color="brown" class="q-mr-md" />
          <div>
            <div class="text-h5 text-sm-h4 q-my-none text-weight-bold" style="color: #5D4037">
              Dashboard de Almacén
            </div>
            <p class="text-grey-7 q-mb-none text-caption text-sm-body1">
              Bienvenido, <strong>{{ userName }}</strong> — {{ userDependency }}
            </p>
          </div>
        </div>
        <div class="col-12 col-sm-auto text-right text-sm-left">
          <q-btn
            unelevated
            icon="refresh"
            color="brown"
            label="Actualizar"
            @click="fetchStats"
            :loading="loading"
          />
        </div>
      </div>

      <!-- ESTADO DE TANQUES (LLENADEROS) -->
      <q-card flat bordered class="bg-white">
        <q-card-section>
          <div class="text-h6 text-weight-bold q-mb-md">
            <q-icon name="oil_barrel" color="brown" class="q-mr-xs" />
            Estado de Tanques (Llenaderos)
          </div>

          <div class="row q-col-gutter-md justify-start">
            <div
              v-for="ll in stats.llenaderos"
              :key="ll.id_llenadero"
              class="col-12 col-sm-6 col-md-3 col-lg-2"
            >
              <LiquidLlenadero :llenadero="ll" class="q-mx-auto" style="max-width: 300px" />
            </div>
          </div>

          <div
            v-if="stats.llenaderos.length === 0 && !loading"
            class="text-center q-pa-lg text-grey-6"
          >
            <q-icon name="oil_barrel" size="3rem" />
            <div class="text-subtitle1">No hay tanques registrados.</div>
          </div>
        </q-card-section>
      </q-card>

      <!-- MÓDULOS DEL SISTEMA -->
      <div class="text-h6 text-weight-bold q-px-xs">
        <q-icon name="apps" color="grey-7" class="q-mr-xs" />
        Módulos del Sistema
      </div>

      <div class="row q-col-gutter-md">
        <div
          v-for="modulo in modulosDashboard"
          :key="modulo.titulo"
          class="col-12 col-sm-6 col-md-4"
        >
          <q-card flat bordered class="bg-white rounded-borders full-height">
            <q-card-section class="row items-center no-wrap q-pb-xs">
              <q-avatar
                :color="modulo.color"
                text-color="white"
                size="48px"
                class="q-mr-md"
              >
                <q-icon :name="modulo.icon" size="1.4rem" />
              </q-avatar>
              <div>
                <div class="text-subtitle1 text-weight-bold">
                  {{ modulo.titulo }}
                </div>
                <div class="text-caption text-grey-7">
                  {{ modulo.descripcion }}
                </div>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-actions class="q-px-md q-pb-md q-pt-sm q-gutter-xs wrap">
              <q-btn
                v-for="accion in modulo.acciones"
                :key="accion.to"
                unelevated
                dense
                :color="modulo.color"
                :icon="accion.icon"
                :label="accion.label"
                :to="accion.to"
                size="sm"
              />
            </q-card-actions>
          </q-card>
        </div>
      </div>

    </div>

    <!-- ========================================= -->
    <!--  DASHBOARD OPERATIVO (admin / operativo)  -->
    <!-- ========================================= -->
    <div v-else>
      <div class="row q-col-gutter-md justify-center">

        <!-- HEADER -->
        <div class="col-12 row items-center justify-between q-mb-sm">
          <div class="text-h5 text-sm-h4 text-weight-bold text-primary q-mb-sm q-sm-mb-none">
            Estado de Llenaderos SIRECC
          </div>
          <div class="col-12 col-sm-auto text-right text-sm-left">
            <q-btn
              unelevated
              icon="refresh"
              color="primary"
              label="Actualizar"
              @click="fetchStats"
              :loading="loading"
            />
          </div>
        </div>

        <!-- LLENADEROS -->
        <div
          v-for="ll in stats.llenaderos"
          :key="ll.id_llenadero"
          class="col-12 col-sm-6 col-md-3 col-lg-2"
        >
          <LiquidLlenadero :llenadero="ll" class="q-mx-auto" style="max-width: 300px" />
        </div>

        <!-- SIN DATOS -->
        <div
          v-if="stats.llenaderos.length === 0 && !loading"
          class="col-12 flex flex-center q-pa-xl"
        >
          <q-banner class="bg-warning text-white rounded-borders">
            No se encontraron llenaderos activos registrados en el sistema.
          </q-banner>
        </div>

      </div>
    </div>

  </q-page>
</template>

<script setup>
import { useIndexPage } from "../composables/useIndexPage";
import LiquidLlenadero from "../components/LiquidLlenadero.vue";

const {
  isEstandar,
  isAlmacenOrSeguridad,
  userName,
  userDependency,
  userRole,
  loading,
  stats,
  fetchStats,
  modulosDashboard,
  loadingCupos,
  cupos,
  periodo,
  periodoDisplay,
  totalAsignado,
  totalConsumido,
  totalDisponible,
  usoPorcentajeGeneral,
  colorUsoPorcentaje,
  fetchCupos,
  columns,
  getProgressColor,
  getEstadoColor,
} = useIndexPage();
</script>

<template>
  <q-page :class="$q.screen.lt.sm ? 'q-pa-sm' : 'q-pa-md'" class="bg-grey-2">
    <div class="q-gutter-y-md">

      <!-- HEADER RESPONSIVE -->
      <div class="row items-center q-col-gutter-sm">
        <div class="col-auto">
          <q-icon name="assignment_ind" size="2rem" color="primary" />
        </div>
        <div class="col">
          <div :class="$q.screen.lt.sm ? 'text-h6' : 'text-h5'" class="text-weight-bold text-primary q-mb-none">
            Mis Cupos Asignados
          </div>
          <div class="text-caption text-grey-7">
            Estado de los cupos de combustible de tu dependencia
          </div>
        </div>
      </div>

      <!-- FILTROS -->
      <q-card flat bordered class="bg-white">
        <q-card-section :class="$q.screen.lt.sm ? 'q-pa-sm' : 'q-pa-md'">
          <div class="row q-col-gutter-sm items-end">
            <div class="col-12 col-sm-5 col-md-4">
              <q-input
                dense outlined
                v-model="periodo"
                type="month"
                label="Periodo de Consulta"
                hint="Seleccione mes y año"
              />
            </div>
            <div class="col-12 col-sm-4 col-md-3">
              <q-btn
                color="primary" icon="search" label="Consultar Cupos"
                unelevated class="full-width"
                @click="fetchCupos"
                :loading="loading"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- TABLA DE RESULTADOS -->
      <q-card flat bordered v-if="cupos.length > 0 || hasSearched">
        <q-card-section :class="$q.screen.lt.sm ? 'q-pa-sm' : 'q-pa-md'">
          <div :class="$q.screen.lt.sm ? 'text-subtitle2' : 'text-h6'" class="q-mb-xs">
            Resultados para: {{ periodoDisplay }}
          </div>
          <div class="text-caption text-grey-8" v-if="usuarioSolicitante">
            Usuario: {{ usuarioSolicitante }}
          </div>
        </q-card-section>

        <q-table
          flat
          :rows="cupos"
          :columns="columns"
          row-key="id_cupo_actual"
          :loading="loading"
          no-data-label="No se encontraron cupos asignados para este periodo"
          :pagination="{ rowsPerPage: 10 }"
          wrap-cells
          dense
        >
          <!-- Disponibilidad -->
          <template v-slot:body-cell-disponibilidad="props">
            <q-td :props="props">
              <div class="column q-gutter-xs" style="min-width: 120px">
                <div class="row justify-between text-caption text-weight-bold">
                  <span>{{ props.row.disponible }} L</span>
                  <span>{{ props.row.porcentaje_uso }}%</span>
                </div>
                <q-linear-progress
                  rounded size="8px"
                  :value="parseFloat(props.row.porcentaje_uso) / 100"
                  :color="getProgressColor(parseFloat(props.row.porcentaje_uso))"
                >
                  <q-tooltip>{{ props.row.consumido }} L de {{ props.row.asignado }} L</q-tooltip>
                </q-linear-progress>
              </div>
            </q-td>
          </template>

          <!-- Estado -->
          <template v-slot:body-cell-estado="props">
            <q-td :props="props">
              <q-chip
                dense :color="getEstadoColor(props.row.estado)"
                text-color="white" size="sm" class="text-weight-bold"
              >
                {{ props.row.estado }}
              </q-chip>
            </q-td>
          </template>
        </q-table>
      </q-card>

      <!-- EMPTY STATE -->
      <div
        v-if="!loading && hasSearched && cupos.length === 0"
        class="text-center q-pa-xl text-grey-6"
      >
        <q-icon name="sentiment_dissatisfied" size="4rem" />
        <div class="text-h6 q-mt-sm">No se encontraron registros.</div>
        <div class="text-caption">Verifique que su usuario tenga una dependencia asignada.</div>
      </div>

    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import api from "../../api";
import { useQuasar, date } from "quasar";

const $q = useQuasar();

const loading = ref(false);
const cupos = ref([]);
const usuarioSolicitante = ref("");
const hasSearched = ref(false);
const periodo = ref(date.formatDate(Date.now(), "YYYY-MM"));

const periodoDisplay = computed(() => {
  if (!periodo.value) return "";
  const [year, month] = periodo.value.split("-");
  const fecha = new Date(year, month - 1);
  return date.formatDate(fecha, "MMMM YYYY").toUpperCase();
});

const columns = [
  { name: "dependencia",     label: "Dependencia",     field: "dependencia",     align: "left",   sortable: true },
  { name: "subdependencia",  label: "Subdependencia",  field: "subdependencia",  align: "left",   sortable: true },
  { name: "categoria",       label: "Categoría",       field: "categoria",       align: "left",   sortable: true },
  { name: "tipo_combustible",label: "Combustible",     field: "tipo_combustible",align: "center", sortable: true },
  { name: "asignado",        label: "Asignado (L)",    field: "asignado",        align: "center", sortable: true },
  { name: "consumido",       label: "Consumido (L)",   field: "consumido",       align: "center", sortable: true },
  { name: "recargado",       label: "Recargado (L)",   field: "recargado",       align: "center" },
  { name: "disponibilidad",  label: "Disp. / Uso",     field: "disponible",      align: "center", sortable: true },
  { name: "estado",          label: "Estado",          field: "estado",          align: "center", sortable: true },
];

const fetchCupos = async () => {
  if (!periodo.value) {
    $q.notify({ type: "warning", message: "Seleccione un periodo válido" });
    return;
  }
  loading.value = true;
  hasSearched.value = true;
  cupos.value = [];
  try {
    const response = await api.get("/reportes/mis-cupos", { params: { periodo: periodo.value } });
    cupos.value = response.data.data;
    usuarioSolicitante.value = response.data.usuario_solicitante;
    if (cupos.value.length === 0) {
      $q.notify({ type: "info", message: "No se encontraron cupos para este periodo." });
    }
  } catch (error) {
    console.error(error);
    $q.notify({ type: "negative", message: "Error al consultar sus cupos. Verifique su conexión o intente más tarde." });
  } finally {
    loading.value = false;
  }
};

const getProgressColor = (porcentaje) => {
  if (porcentaje >= 90) return "negative";
  if (porcentaje >= 75) return "orange";
  return "positive";
};

const getEstadoColor = (estado) => {
  switch (estado) {
    case "ACTIVO":  return "positive";
    case "AGOTADO": return "negative";
    case "CERRADO": return "grey";
    default:        return "primary";
  }
};

onMounted(() => {
  fetchCupos();
});
</script>

<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    maximized
  >
    <q-card>
      <q-toolbar class="bg-primary text-white">
        <q-toolbar-title>Vista Previa de Acta de Cierre</q-toolbar-title>
        <q-btn
          flat
          round
          dense
          icon="print"
          @click="print"
          label="Imprimir"
          class="q-mr-sm"
        />
        <q-btn flat round dense icon="close" v-close-popup />
      </q-toolbar>

      <q-card-section class="q-pa-lg scroll" id="printable-area">
        <!-- ENCABEZADO -->
        <div class="row q-mb-md">
          <div class="col-6">
            <div style="font-size: 11px">
              Prevención y Control de Pérdidas<br />
              FGE-PCP-04 01/04/2024
            </div>
          </div>
          <div class="col-6 text-right">
            <img src="/logo.png" alt="Logo" style="height: 60px" />
          </div>
        </div>

        <!-- TÍTULO -->
        <div class="text-center q-mb-lg">
          <div
            class="text-h5 text-weight-bold"
            style="text-decoration: underline"
          >
            ACTA DE CIERRE
          </div>
        </div>

        <!-- DATOS PRINCIPALES -->
        <div class="q-mb-md">
          <div class="row">
            <div class="col-12">
              <strong>TURNO:</strong>
              <span style="text-decoration: underline">{{
                acta?.datos_generales?.turno || "_________"
              }}</span>
            </div>
          </div>
          <div class="row q-mt-sm">
            <div class="col-12">
              <strong>INSPECTOR DE SERVICIO:</strong>
              <span style="text-decoration: underline">{{
                acta?.datos_generales?.inspector_servicio ||
                "__________________"
              }}</span>
            </div>
          </div>
        </div>

        <!-- PÁRRAFO PRINCIPAL -->
        <div class="q-mb-lg" style="text-align: justify; line-height: 1.8">
          Siendo las
          <strong>{{ formatHora(acta?.datos_generales?.fecha_cierre) }}</strong>
          horas del día
          <strong>{{ formatDia(acta?.datos_generales?.fecha_cierre) }}</strong
          >, fecha
          <strong>{{
            formatFechaCompleta(acta?.datos_generales?.fecha_cierre)
          }}</strong>
          se
          <strong>
            inició el turno con un volumen disponible de combustible
            {{ formatNumber(acta?.seccion_principal?.nivel_inicio) }}
            Lts</strong
          >
          en la estación de Planta La Camorra (PLC), con la finalidad de llevar
          un control del combustible suministrado, surtiéndole la cantidad de
          <strong
            >{{
              formatNumber(acta?.seccion_principal?.consumo_planta)
            }}
            Lts</strong
          >
          de combustible para el consumo de la planta; la cantidad de
          <strong>{{ formatNumber(generadores) }} Lts</strong>
          para los Generadores Eléctricos; y la cantidad de
          <strong>{{ formatNumber(consumoVehiculosNeto) }} Lts</strong>
          para los Vehículos livianos y pesados que complementan las
          operaciones; quedando en el tanque la cantidad de
          <strong
            >{{
              formatNumber(acta?.seccion_principal?.total_disponible)
            }}
            Lts</strong
          >
          de gasoil.
        </div>

        <!-- INVENTARIO -->
        <div class="row q-col-gutter-md q-mb-lg">
          <!-- TANQUES GASOLINA -->
          <div class="col-6">
            <div class="text-subtitle1 text-weight-bold">TANQUES GASOLINA:</div>
            <div
              v-for="(tanque, index) in tanquesGasolina"
              :key="tanque.nombre"
              class="q-mt-xs"
            >
              <div>
                <span style="text-decoration: underline"
                  ><strong>{{ tanque.nombre }} </strong>:
                  {{ formatNumber(tanque.nivel_final) }} <strong>Evap:</strong>
                  {{ formatNumber(tanque.evaporizacion) }}</span
                >
              </div>
            </div>
            <div class="q-mt-md">
              <div>
                <strong>INICIO:</strong>
                <span style="text-decoration: underline"
                  >{{ totalGasolinaInicio }} Lts</span
                >
              </div>
              <div>
                <strong>CONSUMO:</strong>
                <span style="text-decoration: underline"
                  >{{ totalGasolinaConsumo }} sLts</span
                >
              </div>
              <div>
                <strong>STOCK:</strong>
                <span style="text-decoration: underline"
                  >{{
                    formatNumber(
                      acta?.inventario_gasolina?.stock_total -
                        acta?.inventario_gasolina?.evaporizacion_total
                    )
                  }}
                  Lts</span
                >
              </div>
              <div>
                <strong>Total de Evaporizacion:</strong>
                <span style="text-decoration: underline"
                  >{{
                    formatNumber(acta?.inventario_gasolina?.evaporizacion_total)
                  }}
                  Lts</span
                >
              </div>
            </div>
          </div>

          <!-- TANQUES GASOIL -->
          <div class="col-6">
            <div class="text-subtitle1 text-weight-bold">TANQUES GASOIL:</div>
            <div
              v-for="(tanque, index) in tanquesGasoil"
              :key="tanque.nombre"
              class="q-mt-xs"
            >
              <div>
                <strong>
                  <span style="text-decoration: underline"
                    ><strong> {{ tanque.nombre }}</strong
                    >: {{ formatNumber(tanque.nivel_final) }}</span
                  ></strong
                >
              </div>
            </div>
            <div v-if="tanquePrincipal" class="q-mt-xs">
              <div>
                <strong>
                  <span style="text-decoration: underline"
                    >{{ tanquePrincipal.nombre }} :
                    {{ formatNumber(tanquePrincipal.nivel_final) }}</span
                  ></strong
                >
              </div>
            </div>
            <div class="q-mt-md">
              <div>
                <strong>TOTAL:</strong>
                <span style="text-decoration: underline"
                  >{{
                    formatNumber(acta?.inventario_gasoil?.stock_total)
                  }}
                  Lts</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- OBSERVACIÓN -->
        <div class="q-mb-lg">
          <div><strong>OBSERVACIÓN:</strong></div>
          <div
            style="
              border-bottom: 1px solid black;
              min-height: 30px;
              margin-top: 5px;
            "
          >
            {{ acta?.observacion || "" }}
          </div>
          <div
            style="
              border-bottom: 1px solid black;
              min-height: 30px;
              margin-top: 5px;
            "
          ></div>
        </div>

        <!-- TABLA DE FIRMAS -->
        <div class="q-mb-md">
          <div class="text-subtitle1 text-weight-bold q-mb-sm">
            QUIENES FIRMAN:
          </div>
          <table
            style="
              width: 100%;
              border-collapse: collapse;
              border: 1px solid black;
            "
          >
            <thead>
              <tr>
                <th
                  style="
                    border: 1px solid black;
                    padding: 8px;
                    text-align: center;
                    background-color: #f5f5f5;
                  "
                >
                  Departamento
                </th>
                <th
                  style="
                    border: 1px solid black;
                    padding: 8px;
                    text-align: center;
                    background-color: #f5f5f5;
                  "
                >
                  Nombre y Apellido
                </th>
                <th
                  style="
                    border: 1px solid black;
                    padding: 8px;
                    text-align: center;
                    background-color: #f5f5f5;
                  "
                >
                  Cédula
                </th>
                <th
                  style="
                    border: 1px solid black;
                    padding: 8px;
                    text-align: center;
                    background-color: #f5f5f5;
                  "
                >
                  Firma
                </th>
              </tr>
            </thead>
            <tbody>
              <!-- FILA PCP (INSPECTOR) -->
              <tr>
                <td
                  style="
                    border: 1px solid black;
                    padding: 20px;
                    font-weight: 600;
                  "
                >
                  PCP
                </td>
                <td style="border: 1px solid black; padding: 20px">
                  {{ datosInspector.nombre }}
                </td>
                <td style="border: 1px solid black; padding: 20px">
                  {{ datosInspector.cedula }}
                </td>
                <td style="border: 1px solid black; padding: 20px"></td>
              </tr>

              <!-- FILA ALMACENISTA -->
              <tr>
                <td
                  style="
                    border: 1px solid black;
                    padding: 20px;
                    font-weight: 600;
                  "
                >
                  ALMACENISTA
                </td>
                <td style="border: 1px solid black; padding: 20px">
                  {{ datosAlmacenista.nombre }}
                </td>
                <td style="border: 1px solid black; padding: 20px">
                  {{ datosAlmacenista.cedula }}
                </td>
                <td style="border: 1px solid black; padding: 20px"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PIE DE PÁGINA -->
        <div class="text-center q-mt-lg" style="font-size: 12px">
          Gerencia de Prevención y Control de Pérdidas.
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from "vue";
import { date } from "quasar";

const props = defineProps({
  modelValue: Boolean,
  acta: Object,
});

const emit = defineEmits(["update:modelValue"]);

const generadores = computed(() => {
  // Extraer datos del usuario (PCP/Inspector) desde snapshot_desglose_despachos
  let desgloseConsumo = props.acta?.seccion_principal?.desglose_consumo;

  const generador = JSON.parse(desgloseConsumo);

  return generador.generadores;
});

// ========== COMPUTED PROPERTIES PARA DATOS DE FIRMAS ==========
const datosInspector = computed(() => {
  // Extraer datos del usuario (PCP/Inspector) desde snapshot_desglose_despachos
  let desgloseConsumo = props.acta?.seccion_principal?.desglose_consumo;

  // Si viene como string, parsearlo
  if (typeof desgloseConsumo === "string") {
    try {
      desgloseConsumo = JSON.parse(desgloseConsumo);
    } catch (e) {
      console.error("Error al parsear desglose_consumo:", e);
      desgloseConsumo = null;
    }
  }

  const usuario = desgloseConsumo?.usuario;

  if (usuario && usuario.nombre && usuario.apellido) {
    return {
      nombre: `${usuario.nombre} ${usuario.apellido}`,
      cedula: usuario.cedula || "___________",
    };
  }

  return {
    nombre: "___________________",
    cedula: "___________",
  };
});

const datosAlmacenista = computed(() => {
  // Extraer datos del almacenista desde snapshot_desglose_despachos
  let desgloseConsumo = props.acta?.seccion_principal?.desglose_consumo;

  // Si viene como string, parsearlo
  if (typeof desgloseConsumo === "string") {
    try {
      desgloseConsumo = JSON.parse(desgloseConsumo);
    } catch (e) {
      console.error("Error al parsear desglose_consumo:", e);
      desgloseConsumo = null;
    }
  }

  const almacenista = desgloseConsumo?.almacenista;

  if (almacenista && almacenista.nombre && almacenista.apellido) {
    return {
      nombre: `${almacenista.nombre} ${almacenista.apellido}`,
      cedula: almacenista.cedula || "___________",
    };
  }

  return {
    nombre: "___________________",
    cedula: "___________",
  };
});
// ==============================================================

// Filtrar tanques por tipo
const tanquesGasolina = computed(() => {
  return props.acta?.inventario_gasolina?.tanques || [];
});

const tanquesGasoil = computed(() => {
  const tanques = props.acta?.inventario_gasoil?.tanques || [];
  return tanques.filter((t) => !t.es_principal);
});

const tanquePrincipal = computed(() => {
  const tanques = props.acta?.inventario_gasoil?.tanques || [];
  return tanques.find((t) => t.es_principal);
});

const totalGasolinaInicio = computed(() => {
  // Sumar todos los niveles iniciales de gasolina
  return props.acta.inventario_gasolina.saldo_inicial_total || 0;
});

const totalGasolinaConsumo = computed(() => {
  return props.acta?.inventario_gasolina?.consumo_total_despachos || [];
});

// Calculamos el consumo neto de vehículos. Ahora, consumo_total_despachos
// del backend ya no incluye generadores, por lo que no necesitamos restarlos aquí nuevamente.
const consumoVehiculosNeto = computed(() => {
  return parseFloat(
    props.acta?.seccion_principal?.consumo_total_despachos || 0
  );
});

// ========== FUNCIONES DE FORMATO ==========
function formatNumber(value) {
  if (!value && value !== 0) return "0";
  const num = parseFloat(value);
  return isNaN(num) ? "0" : num.toFixed(2);
}

function parseFecha(fechaStr) {
  if (!fechaStr) return null;
  if (fechaStr instanceof Date) return fechaStr;
  // Si es ISO (tiene guiones 2023-01-01), new Date lo maneja bien (UTC/Local)
  if (typeof fechaStr === "string" && fechaStr.indexOf("-") > -1) {
    return new Date(fechaStr);
  }
  // Si viene con barras (01/01/2023), asumimos DD/MM/YYYY
  // Intentamos extraer con hora primero
  let d = date.extractDate(fechaStr, "DD/MM/YYYY HH:mm:ss");

  // Verificamos validez:
  if (isNaN(d.getTime())) {
    d = date.extractDate(fechaStr, "DD/MM/YYYY");
  }

  if (isNaN(d.getTime())) {
    return new Date(fechaStr); // Fallback
  }
  return d;
}

function formatFecha(fechaStr) {
  const d = parseFecha(fechaStr);
  if (!d || isNaN(d.getTime())) return "__/__/____";
  return date.formatDate(d, "DD/MM/YYYY");
}

function formatFechaCompleta(fechaStr) {
  return formatFecha(fechaStr);
}

function formatHora(fechaStr) {
  const d = parseFecha(fechaStr);
  if (!d || isNaN(d.getTime())) return "__:__";
  return date.formatDate(d, "HH:mm");
}

function formatDia(fechaStr) {
  const d = parseFecha(fechaStr);
  if (!d || isNaN(d.getTime())) return "____";
  const dias = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  return dias[d.getDay()];
}

function print() {
  window.print();
}
</script>

<style scoped>
/* Estilos para impresión */
@media print {
  body * {
    visibility: hidden;
  }
  #printable-area,
  #printable-area * {
    visibility: visible;
  }
  #printable-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    padding: 20px;
  }
  .q-btn,
  .q-toolbar {
    display: none !important;
  }

  /* Evitar saltos de página en elementos importantes */
  table {
    page-break-inside: avoid;
  }

  /* Asegurar que los bordes se vean en la impresión */
  table,
  th,
  td {
    border: 1px solid black !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  th {
    background-color: #f5f5f5 !important;
  }
}

@page {
  size: letter;
  margin: 1cm;
}

/* Estilos generales */
table {
  font-size: 14px;
}

th {
  font-weight: 600;
}

td {
  vertical-align: middle;
}

/* Mejorar la legibilidad */
.text-h5 {
  font-size: 1.5rem;
}

.text-subtitle1 {
  font-size: 1.1rem;
}

.text-body2 {
  font-size: 0.95rem;
}
</style>

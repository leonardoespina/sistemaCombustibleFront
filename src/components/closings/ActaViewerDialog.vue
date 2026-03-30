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
        <q-btn
          flat
          round
          dense
          icon="picture_as_pdf"
          @click="downloadPDF"
          label="PDF"
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
            inició el turno con un volumen disponible de {{ inicioTurnoTexto }}</strong>, con la finalidad de llevar
          un control del combustible suministrado. Durante el transcurso del turno se surtió la cantidad de
          <strong
            >{{
              formatNumber(acta?.seccion_principal?.consumo_planta)
            }}
            Lts</strong
          >
          de Gasoil para el consumo de la planta, y la cantidad de
          <strong>{{ formatNumber(generadores) }} Lts</strong>
          de Gasoil para los Generadores Eléctricos. Así mismo, se registra un consumo de 
          <strong>{{ formatNumber(consumoVehiculosNeto) }} Lts</strong>
          de Gasoil para el despliegue de los Vehículos livianos y pesados que complementan las
          operaciones; quedando un stock final disponible de 
          <strong
            >{{
              formatNumber(acta?.seccion_principal?.total_disponible)
            }}
            Lts</strong
          >
          de Gasoil.
        </div>
        <q-inner-loading :showing="!acta">
          <q-spinner-gears size="50px" color="primary" />
        </q-inner-loading>


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
                <span class="text-weight-bold" style="text-decoration: underline">
                  {{ tanque.nombre }}: {{ formatNumber(tanque.nivel_final) }}
                </span>
              </div>
            </div>
            <div class="q-mt-md">
              <div>
                <strong>INICIO:</strong>
                <span style="text-decoration: underline"
                  >{{ formatNumber(totalGasolinaInicio) }} Lts</span
                >
              </div>
              <div>
                <strong>CONSUMO:</strong>
                <span style="text-decoration: underline"
                  >{{ formatNumber(totalGasolinaConsumo) }} Lts</span
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
                <span class="text-weight-bold" style="text-decoration: underline">
                  {{ tanque.nombre }}: {{ formatNumber(tanque.nivel_final) }}
                </span>
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
import { pdfService } from "../../services/pdfService";

const props = defineProps({
  modelValue: Boolean,
  acta: Object,
});

const emit = defineEmits(["update:modelValue"]);

const generadores = computed(() => {
  let dc = props.acta?.seccion_principal?.desglose_consumo;
  if (!dc) return 0;
  try {
    const data = typeof dc === "string" ? JSON.parse(dc) : dc;
    return data.generadores || 0;
  } catch (e) {
    return 0;
  }
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
  return props.acta?.inventario_gasoil?.tanques || [];
});

const tanquePrincipal = computed(() => {
  const tanques = props.acta?.inventario_gasoil?.tanques || [];
  return tanques.find((t) => t.es_principal);
});

const totalGasolinaInicio = computed(() => {
  return props.acta?.inventario_gasolina?.saldo_inicial_total || 0;
});

const totalGasolinaConsumo = computed(() => {
  return props.acta?.inventario_gasolina?.consumo_total_despachos || 0;
});

// Calculamos el inicio de turno dinamico por combustibles
const inicioTurnoTexto = computed(() => {
  if (!props.acta) return '';

  const llenaderoInfo = props.acta?.datos_generales?.llenadero?.trim() || 'Planta La Camorra (PLC)';
  
  const saldoGasoil = props.acta?.inventario_gasoil?.saldo_inicial_total;
  if (saldoGasoil != null && saldoGasoil > 0) {
    return `en el Llenadero ${llenaderoInfo} GASOIL con total de ${formatNumber(saldoGasoil)} LTS`;
  }
  
  return `en la estación de ${llenaderoInfo} con un total de ${formatNumber(props.acta?.seccion_principal?.nivel_inicio)} LTS`; 
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

/** Genera la exportación formal a PDF con FIDELIDAD TOTAL */
async function downloadPDF() {
  if (!props.acta) return;

  // Intentamos obtener el logo en base64
  let logoBase64 = null;
  try {
    const response = await fetch('/logo.png');
    const blob = await response.blob();
    logoBase64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadBase64 = () => resolve(reader.result); // Fallback logic depends on reader
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("No se pudo cargar el logo para el PDF", e);
  }

  // 1. Texto narrativo con marcas de negrita (**)
  const fechaCierre = props.acta?.datos_generales?.fecha_cierre;
  const textoPrincipal = `Siendo las **${formatHora(fechaCierre)}** horas del día **${formatDia(fechaCierre)}**, fecha **${formatFechaCompleta(fechaCierre)}** se inició el turno con un volumen disponible de **${inicioTurnoTexto.value}**, con la finalidad de llevar un control del combustible suministrado. Durante el transcurso del turno se surtió la cantidad de **${formatNumber(props.acta?.seccion_principal?.consumo_planta)} Lts** de Gasoil para el consumo de la planta, y la cantidad de **${formatNumber(generadores.value)} Lts** de Gasoil para los Generadores Eléctricos. Así mismo, se registra un consumo de **${formatNumber(consumoVehiculosNeto.value)} Lts** de Gasoil para el despliegue de los Vehículos livianos y pesados que complementan las operaciones; quedando un stock final disponible de **${formatNumber(props.acta?.seccion_principal?.total_disponible)} Lts** de Gasoil.`;

  // 2. Estructura de Inventario (Dos Columnas)
  const gasolinaList = tanquesGasolina.value.map(t => ({
    label: t.nombre,
    value: formatNumber(t.nivel_final)
  }));

  const gasoilList = tanquesGasoil.value.map(t => ({
    label: t.nombre,
    value: formatNumber(t.nivel_final)
  }));

  const resumenGasolina = [
    { label: "INICIO", value: formatNumber(totalGasolinaInicio.value) + " Lts" },
    { label: "CONSUMO", value: formatNumber(totalGasolinaConsumo.value) + " Lts" },
    { label: "STOCK", value: formatNumber(props.acta?.inventario_gasolina?.stock_total - props.acta?.inventario_gasolina?.evaporizacion_total) + " Lts" },
    { label: "Total de Evaporizacion", value: formatNumber(props.acta?.inventario_gasolina?.evaporizacion_total) + " Lts" }
  ];

  const totalGasoilVal = formatNumber(props.acta?.inventario_gasoil?.stock_total) + " Lts";

  // 3. Firmas
  const signatures = [
    { dept: "PCP", name: datosInspector.value.nombre, id: datosInspector.value.cedula },
    { dept: "ALMACENISTA", name: datosAlmacenista.value.nombre, id: datosAlmacenista.value.cedula }
  ];

  // 4. Invocar servicio
  pdfService.exportActa({
    logo: logoBase64,
    bodyText: textoPrincipal,
    gasolina: gasolinaList,
    gasoil: gasoilList,
    resumenGasolina: resumenGasolina,
    totalGasoil: totalGasoilVal,
    signatureData: signatures,
    observacion: props.acta?.observacion || "Sin observaciones registradas.",
    fileName: `Acta_Cierre_${date.formatDate(fechaCierre, 'YYYYMMDD_HHmm')}.pdf`,
    metadata: {
      turno: props.acta?.datos_generales?.turno || "_________",
      inspector: props.acta?.datos_generales?.inspector_servicio || "__________________"
    }
  });
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

<template>
  <q-page :class="$q.screen.lt.sm ? 'q-pa-sm bg-grey-2' : 'q-pa-md bg-grey-2'">
    <!-- TARJETA SUPERIOR: VALIDACIÓN Y CIERRE DE TICKET (ESTILO ORIGINAL) -->
    <q-card class="shadow-1 rounded-borders q-mb-md bg-white">
      <q-card-section class="q-pb-none">
        <div class="row items-center justify-between no-wrap">
          <div>
            <div class="text-h5 text-primary text-weight-bold">
              Validación y Cierre de Ticket
            </div>
            <div class="text-subtitle2 text-grey-7">
              Escanee el código QR del ticket despachado
            </div>
          </div>
          <q-badge
            :color="isOnline ? 'positive' : 'negative'"
            class="q-py-xs q-px-sm text-weight-bold shadow-1"
            style="font-size: 0.85rem"
          >
            <q-icon
              :name="isOnline ? 'wifi' : 'wifi_off'"
              size="16px"
              class="q-mr-xs"
            />
            {{ isOnline ? "En Línea" : "Sin Conexión" }}
          </q-badge>
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-sm items-center">
          <div class="col-grow">
            <q-input
              v-model="searchCode"
              label="Código de Ticket"
              outlined
              dense
              autofocus
              @keyup.enter="searchTicket"
              bg-color="white"
              :loading="loading"
              clearable
            >
              <template v-slot:append>
                <q-btn
                  flat
                  dense
                  round
                  color="primary"
                  icon="qr_code_scanner"
                  @click="showScanner = true"
                >
                  <q-tooltip>Escanear QR con Cámara</q-tooltip>
                </q-btn>
              </template>
            </q-input>
          </div>
          <div class="col-auto">
            <q-btn
              icon="search"
              label="BUSCAR"
              color="primary"
              unelevated
              @click="searchTicket"
              :loading="loading"
              class="text-weight-bold"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- DISTRIBUCIÓN PRINCIPAL RESPONSIVE (2 COLUMNAS) -->
    <div class="row q-col-gutter-md">
      <!-- COLUMNA IZQUIERDA: DETALLES DEL TICKET ACTIVO Y MÉTRICAS -->
      <div class="col-12 col-lg-6 col-md-6">
        <!-- BANNER DE CONFIRMACIÓN DEL ÚLTIMO ESCANEADO -->
        <q-banner
          v-if="ultimoTicketProcesado"
          rounded
          class="bg-positive text-white q-mb-md shadow-1 slide-fade"
        >
          <template v-slot:avatar>
            <q-icon name="check_circle" size="32px" color="white" />
          </template>
          <div class="text-weight-bold text-subtitle2">
            ¡Ticket #{{ ultimoTicketProcesado.codigo_ticket }} Validado con Éxito!
          </div>
          <div class="text-caption">
            Unidad: {{ ultimoTicketProcesado.placa || 'S/P' }} |
            Despachado: {{ ultimoTicketProcesado.cantidad_despachada || ultimoTicketProcesado.cantidad_litros }} Lts |
            Hora: {{ ultimoTicketProcesado.hora_validacion }}
          </div>
          <template v-slot:action>
            <q-btn
              flat
              color="white"
              dense
              label="Ver"
              icon="visibility"
              @click="verTicket(ultimoTicketProcesado)"
            />
            <q-btn
              flat
              round
              dense
              icon="close"
              color="white"
              @click="ultimoTicketProcesado = null"
            />
          </template>
        </q-banner>

        <!-- Ticket Info Activo -->
        <q-card v-if="ticket" class="shadow-2 rounded-borders q-mb-md slide-fade">
          <q-card-section class="bg-primary text-white q-py-sm">
            <div class="row items-center justify-between">
              <div class="text-h6 text-weight-bold">
                Ticket #{{ ticket.codigo_ticket }}
              </div>
              <q-badge
                color="white"
                text-color="primary"
                class="text-weight-bold"
                :label="ticket.estado"
              />
            </div>
          </q-card-section>

          <q-card-section>
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey">Dependencia</div>
                <div class="text-body2 text-weight-medium">
                  {{ ticket.Dependencia?.nombre_dependencia || 'N/A' }}
                </div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey">Subdependencia</div>
                <div class="text-body2 text-weight-medium">
                  {{ ticket.Subdependencia?.nombre || 'N/A' }}
                </div>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey">Combustible</div>
                <div class="text-body2 text-weight-bold text-primary">
                  {{ ticket.TipoCombustible?.nombre || 'N/A' }}
                </div>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey">Llenadero</div>
                <div class="text-body2">
                  {{ ticket.Llenadero?.nombre_llenadero || 'N/A' }}
                </div>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey">Conductor</div>
                <div class="text-body2">
                  {{ ticket.Solicitante?.nombre }}
                  {{ ticket.Solicitante?.apellido }}
                </div>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey">Placa</div>
                <div class="text-body2 text-weight-bolder text-dark">
                  {{ ticket.placa || "N/A" }}
                </div>
              </div>

              <q-separator class="col-12 q-my-sm" />

              <div class="col-12 text-center bg-grey-1 q-pa-sm rounded-borders">
                <div class="text-caption text-grey-8 text-weight-medium">
                  Cantidad Aprobada para Surtir
                </div>
                <div class="text-h3 text-primary text-weight-bolder">
                  {{ ticket.cantidad_litros }} <span class="text-h6">Lts</span>
                </div>
              </div>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-actions align="center" class="q-pa-md q-gutter-sm">
            <q-btn
              push
              color="positive"
              icon="check_circle"
              label="Carga Completa (Confirmar)"
              size="md"
              class="col-grow text-weight-bold"
              @click="openDialog('CONFIRMATION')"
            />
            <q-btn
              push
              color="warning"
              text-color="dark"
              icon="warning"
              label="Reportar Diferencia"
              size="md"
              class="col-grow text-weight-bold"
              @click="openDialog('DIFFERENCE')"
            />
          </q-card-actions>
        </q-card>

        <!-- Mensaje si no hay ticket buscado -->
        <div
          v-else-if="searched && !ticket"
          class="text-center text-grey-6 q-pa-xl bg-white rounded-borders shadow-1 q-mb-md"
        >
          <q-icon name="search_off" size="3.5rem" color="grey-5" />
          <div class="text-subtitle1 text-weight-medium q-mt-sm">
            No se encontró el ticket o no está listo para validación
          </div>
          <div class="text-caption text-grey-6">
            Verifique el código o asegúrese de que el ticket esté en estado IMPRESA.
          </div>
        </div>

        <!-- TARJETAS DE MÉTRICAS (KPIS EN VIVO) - DEBAJO DE LA INFORMACIÓN DEL TICKET -->
        <div class="row q-col-gutter-sm">
          <!-- Tickets Validados -->
          <div class="col-12">
            <q-card class="shadow-1 rounded-borders bg-white">
              <q-card-section class="q-pa-sm row items-center no-wrap">
                <q-avatar
                  size="44px"
                  font-size="22px"
                  color="primary"
                  text-color="white"
                  icon="confirmation_number"
                  class="q-mr-sm shadow-1"
                />
                <div class="ellipsis">
                  <div class="text-caption text-grey-7 text-weight-medium">
                    Tickets Validados
                  </div>
                  <div class="text-h6 text-weight-bolder text-primary">
                    {{ totalTickets }}
                    <span class="text-caption text-grey-6 text-weight-normal">tickets</span>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Total Litros Despachados -->
          <div class="col-12">
            <q-card class="shadow-1 rounded-borders bg-white">
              <q-card-section class="q-pa-sm row items-center no-wrap">
                <q-avatar
                  size="44px"
                  font-size="22px"
                  color="blue-grey-8"
                  text-color="white"
                  icon="opacity"
                  class="q-mr-sm shadow-1"
                />
                <div class="ellipsis">
                  <div class="text-caption text-grey-7 text-weight-medium">
                    Total Litros
                  </div>
                  <div class="text-h6 text-weight-bolder text-blue-grey-9">
                    {{ formatLitros(totalLitrosGeneral) }}
                    <span class="text-caption text-grey-6 text-weight-normal">Lts</span>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Total Gasoil Despachado -->
          <div class="col-12">
            <q-card class="shadow-1 rounded-borders bg-white">
              <q-card-section class="q-pa-sm row items-center no-wrap">
                <q-avatar
                  size="44px"
                  font-size="22px"
                  color="amber-9"
                  text-color="white"
                  icon="local_gas_station"
                  class="q-mr-sm shadow-1"
                />
                <div class="ellipsis">
                  <div class="text-caption text-grey-7 text-weight-medium">
                    Total Gasoil
                  </div>
                  <div class="text-h6 text-weight-bolder text-amber-10">
                    {{ formatLitros(totalGasoil) }}
                    <span class="text-caption text-grey-6 text-weight-normal">Lts</span>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Total Gasolina Despachada -->
          <div class="col-12">
            <q-card class="shadow-1 rounded-borders bg-white">
              <q-card-section class="q-pa-sm row items-center no-wrap">
                <q-avatar
                  size="44px"
                  font-size="22px"
                  color="teal"
                  text-color="white"
                  icon="directions_car"
                  class="q-mr-sm shadow-1"
                />
                <div class="ellipsis">
                  <div class="text-caption text-grey-7 text-weight-medium">
                    Total Gasolina
                  </div>
                  <div class="text-h6 text-weight-bolder text-teal-9">
                    {{ formatLitros(totalGasolina) }}
                    <span class="text-caption text-grey-6 text-weight-normal">Lts</span>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <!-- COLUMNA DERECHA: VALIDACIONES DEL TURNO (BITÁCORA EN VIVO) -->
      <div class="col-12 col-lg-6 col-md-6">
        <q-card class="shadow-1 rounded-borders full-height">
          <q-card-section class="bg-grey-1 q-py-sm">
            <div class="row items-center justify-between">
              <div class="row items-center q-gutter-x-xs">
                <q-icon name="fact_check" color="primary" size="sm" />
                <div class="text-subtitle1 text-weight-bold text-primary">
                  Validaciones del Turno
                </div>
                <q-badge color="primary" rounded class="q-ml-xs text-weight-bold">
                  {{ validacionesFiltradas.length }}
                </q-badge>
              </div>

              <div class="row items-center q-gutter-x-xs">
                <q-btn
                  flat
                  dense
                  round
                  icon="refresh"
                  color="primary"
                  :loading="loadingReporte"
                  @click="cargarValidaciones"
                >
                  <q-tooltip>Actualizar lista</q-tooltip>
                </q-btn>
              </div>
            </div>

            <!-- BARRA DE FILTROS SIMPLE Y DIRECTA (LLENADERO + FECHAS + HORAS EN SELECT) -->
            <div class="row q-col-gutter-xs items-center q-mt-xs">
              <!-- Selector de Llenadero -->
              <div class="col-12 col-md-4">
                <q-select
                  v-model="filtroLlenadero"
                  :options="opcionesLlenaderos"
                  option-value="id_llenadero"
                  option-label="nombre_llenadero"
                  emit-value
                  map-options
                  dense
                  outlined
                  bg-color="white"
                  label="Llenadero"
                  @update:model-value="onCambioLlenadero"
                >
                  <template v-slot:prepend>
                    <q-icon name="local_gas_station" size="xs" color="primary" />
                  </template>
                </q-select>
              </div>

              <!-- Desde: Fecha + Hora -->
              <div class="col-6 col-md-2">
                <q-input
                  v-model="fechaDesde"
                  type="date"
                  dense
                  outlined
                  bg-color="white"
                  label="Fecha Desde"
                />
              </div>
              <div class="col-6 col-md-2">
                <q-input
                  v-model="horaDesde"
                  type="time"
                  dense
                  outlined
                  bg-color="white"
                  label="Hora Inicio"
                >
                  <template v-slot:prepend>
                    <q-icon name="schedule" color="primary" />
                  </template>
                </q-input>
              </div>

              <!-- Hasta: Fecha + Hora -->
              <div class="col-6 col-md-2">
                <q-input
                  v-model="fechaHasta"
                  type="date"
                  dense
                  outlined
                  bg-color="white"
                  label="Fecha Hasta"
                />
              </div>
              <div class="col-6 col-md-2">
                <q-input
                  v-model="horaHasta"
                  type="time"
                  dense
                  outlined
                  bg-color="white"
                  label="Hora Fin"
                >
                  <template v-slot:prepend>
                    <q-icon name="schedule" color="primary" />
                  </template>
                </q-input>
              </div>
            </div>
          </q-card-section>

          <!-- Filtro rápido de lista -->
          <q-card-section class="q-py-xs q-px-sm" v-if="validacionesFiltradas.length > 5 || filtroBusquedaLista">
            <q-input
              v-model="filtroBusquedaLista"
              dense
              outlined
              placeholder="Filtrar por número de ticket..."
              clearable
              bg-color="white"
            >
              <template v-slot:prepend>
                <q-icon name="filter_alt" size="xs" />
              </template>
            </q-input>
          </q-card-section>

          <q-separator />

          <!-- Lista de Tickets Escaneados -->
          <q-card-section class="q-pa-none">
            <!-- Estado Vacío -->
            <div
              v-if="validacionesFiltradas.length === 0"
              class="text-center text-grey-5 q-pa-xl"
            >
              <q-icon name="receipt_long" size="4rem" color="grey-4" />
              <div class="text-subtitle2 text-weight-bold q-mt-sm">
                No hay tickets validados en este período
              </div>
              <div class="text-caption text-grey-6">
                Los tickets escaneados aparecerán en esta bitácora en tiempo real.
              </div>
            </div>

            <!-- Lista con Scroll -->
            <q-scroll-area
              v-else
              style="height: 460px; max-height: 60vh"
              class="q-pa-none"
            >
              <q-list separator>
                <q-item
                  v-for="(item, index) in validacionesFiltradas"
                  :key="item.id_solicitud || item.codigo_ticket || index"
                  class="q-py-xs"
                  clickable
                  @click="verTicket(item)"
                >
                  <q-item-section avatar style="min-width: 32px">
                    <q-icon name="receipt_long" color="primary" size="sm" />
                  </q-item-section>

                  <q-item-section>
                    <div class="row items-center justify-between no-wrap">
                      <div class="row items-center q-gutter-x-xs wrap">
                        <span class="text-subtitle1 text-weight-bolder text-primary">
                          #{{ item.codigo_ticket }}
                        </span>
                        <q-badge color="blue-1" text-color="primary" class="q-ml-xs text-caption text-weight-bold">
                          Sol: {{ formatLitros(getLitrosSolicitados(item)) }} Lts
                        </q-badge>
                        <q-badge
                          :color="getLitrosDespachados(item) < getLitrosSolicitados(item) ? 'orange-2' : 'positive'"
                          :text-color="getLitrosDespachados(item) < getLitrosSolicitados(item) ? 'orange-9' : 'white'"
                          class="q-ml-xs text-caption text-weight-bold"
                        >
                          Desp: {{ formatLitros(getLitrosDespachados(item)) }} Lts
                        </q-badge>
                      </div>
                    </div>
                    <div class="row items-center text-caption text-grey-7 q-gutter-x-xs">
                      <span>{{ formatHoraItem(item.fecha_validacion) }}</span>
                      <span v-if="item.validador_nombre || item.Validador?.nombre" class="text-grey-6">
                        • PCP: {{ item.validador_nombre || item.Validador?.nombre }}
                      </span>
                    </div>
                  </q-item-section>

                  <q-item-section side>
                    <q-btn
                      flat
                      round
                      dense
                      icon="visibility"
                      color="primary"
                      @click.stop="verTicket(item)"
                    >
                      <q-tooltip>Ver Ticket Térmico</q-tooltip>
                    </q-btn>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-scroll-area>
          </q-card-section>

          <q-separator />

          <!-- SUMATORIA Y TOTALES DE LA BITÁCORA -->
          <q-card-section class="bg-grey-1 q-py-sm">
            <div class="row items-center justify-between no-wrap">
              <div class="text-caption text-weight-bolder text-grey-9">
                TOTAL VALIDADO:
              </div>
              <div class="row items-center q-gutter-x-xs">
                <q-badge color="primary" class="text-weight-bold text-caption q-px-sm shadow-1">
                  {{ totalTickets }} Tickets
                </q-badge>
                <q-badge color="positive" class="text-weight-bold text-caption q-px-sm shadow-1">
                  {{ formatLitros(totalLitrosGeneral) }} Lts
                </q-badge>
              </div>
            </div>

            <!-- Desglose por Combustible -->
            <div class="row items-center justify-end q-gutter-x-md text-caption text-grey-8 q-mt-xs">
              <div>
                Gasoil: <strong class="text-amber-10">{{ formatLitros(totalGasoil) }} Lts</strong>
              </div>
              <div>
                Gasolina: <strong class="text-teal-9">{{ formatLitros(totalGasolina) }} Lts</strong>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- DIÁLOGO DE VALIDACIÓN (CONFIRMACIÓN / DIFERENCIA) -->
    <ValidationDialog
      v-model="showDialog"
      :mode="dialogMode"
      :ticket="ticket || {}"
      @confirm="handleValidation"
    />

    <!-- DIÁLOGO REUTILIZADO: VISTA PREVIA DE TICKET TÉRMICO -->
    <TicketPreviewDialog
      v-model="showPreview"
      :ticket="ticketParaPreview"
    />

    <!-- DIÁLOGO SCANNER QR CON CÁMARA -->
    <q-dialog v-model="showScanner">
      <q-card style="width: 350px; max-width: 90vw" class="rounded-borders">
        <q-card-section class="row items-center q-pb-none bg-primary text-white">
          <div class="text-subtitle1 text-weight-bold">Escanear Ticket QR</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup color="white" />
        </q-card-section>

        <q-card-section class="q-pa-none bg-black">
          <div style="height: 300px; width: 100%; position: relative">
            <qrcode-stream
              v-if="showScanner"
              @detect="onDetect"
              @error="onError"
            >
              <div class="scan-overlay row justify-center items-center full-height">
                <div class="scan-box"></div>
              </div>
            </qrcode-stream>
          </div>
        </q-card-section>

        <q-card-section class="text-caption text-center text-grey-7">
          Apunte la cámara hacia el código QR impreso en el ticket
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { date, useQuasar } from "quasar";
import { QrcodeStream } from "vue-qrcode-reader";
import api from "../../api";
import ValidationDialog from "../../components/dispatches/ValidationDialog.vue";
import TicketPreviewDialog from "../../components/dispatches/TicketPreviewDialog.vue";

const $q = useQuasar();

// --- ESTADOS REACTIVOS PRINCIPALES ---
const searchCode = ref("");
const ticket = ref(null);
const loading = ref(false);
const searched = ref(false);
const showDialog = ref(false);
const dialogMode = ref("CONFIRMATION");
const showScanner = ref(false);

// --- FILTROS DE PERÍODO (FECHAS + HORAS EN SELECT) Y LLENADERO ---
const obtenerTurnoInicial = () => {
  const ahora = new Date();
  const hora = ahora.getHours();
  let dInicio = new Date(ahora);
  let dFin = new Date(ahora);

  if (hora >= 6 && hora < 18) {
    // Turno Diurno: 06:00 a 18:00
    dInicio.setHours(6, 0, 0, 0);
    dFin.setHours(18, 0, 0, 0);
  } else {
    // Turno Nocturno: 18:00 a 06:00
    if (hora < 6) {
      dInicio.setDate(dInicio.getDate() - 1);
      dInicio.setHours(18, 0, 0, 0);
      dFin.setHours(6, 0, 0, 0);
    } else {
      dInicio.setHours(18, 0, 0, 0);
      dFin.setDate(dFin.getDate() + 1);
      dFin.setHours(6, 0, 0, 0);
    }
  }

  return {
    fechaDesde: date.formatDate(dInicio, "YYYY-MM-DD"),
    horaDesde: date.formatDate(dInicio, "HH:mm"),
    fechaHasta: date.formatDate(dFin, "YYYY-MM-DD"),
    horaHasta: date.formatDate(dFin, "HH:mm"),
  };
};

const turnoInit = obtenerTurnoInicial();
const fechaDesde = ref(turnoInit.fechaDesde);
const horaDesde = ref(turnoInit.horaDesde);
const fechaHasta = ref(turnoInit.fechaHasta);
const horaHasta = ref(turnoInit.horaHasta);

const rangoFiltro = computed(() => ({
  desde: `${fechaDesde.value || ""} ${horaDesde.value || "00:00"}`.trim(),
  hasta: `${fechaHasta.value || ""} ${horaHasta.value || "23:59"}`.trim(),
}));

// --- PERSISTENCIA DEL LLENADERO EN LOCALSTORAGE ---
const STORAGE_LLENADERO_KEY = "pcp_filtro_llenadero";

const getSavedLlenadero = () => {
  try {
    const val = localStorage.getItem(STORAGE_LLENADERO_KEY);
    if (!val || val === "null" || val === "undefined") return null;
    const num = Number(val);
    return isNaN(num) ? val : num;
  } catch {
    return null;
  }
};

const filtroLlenadero = ref(getSavedLlenadero()); // null = Todos los Llenaderos, o el ID guardado
const listaLlenaderos = ref([]);

// Observador para mantener sincronizado localStorage en todo momento
watch(filtroLlenadero, (newVal) => {
  try {
    if (newVal === null || newVal === undefined) {
      localStorage.removeItem(STORAGE_LLENADERO_KEY);
    } else {
      localStorage.setItem(STORAGE_LLENADERO_KEY, String(newVal));
    }
  } catch (e) {
    console.warn("No se pudo guardar llenadero en localStorage:", e);
  }
});

const opcionesLlenaderos = computed(() => {
  return [
    { id_llenadero: null, nombre_llenadero: "Todos los Llenaderos" },
    ...listaLlenaderos.value.map((l) => ({
      id_llenadero: l.id_llenadero,
      nombre_llenadero: l.nombre_llenadero,
    })),
  ];
});

const cargarLlenaderos = async () => {
  try {
    const { data } = await api.get("/llenaderos/lista");
    listaLlenaderos.value = Array.isArray(data) ? data : (data?.data || []);
  } catch (e) {
    console.warn("No se pudo cargar la lista de llenaderos:", e?.message);
  }
};

// --- BITÁCORA Y RESUMEN ---
const validacionesHoy = ref([]);
const loadingReporte = ref(false);
const filtroBusquedaLista = ref("");
const ultimoTicketProcesado = ref(null);

// --- DIÁLOGO REUTILIZADO PARA VER TICKET ---
const showPreview = ref(false);
const ticketParaPreview = ref({});

// --- ESTADO DE CONECTIVIDAD ---
const isOnline = ref(navigator.onLine ?? true);

const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine;
};

// --- USUARIO LOGUEADO Y ROL PCP ---
const usuarioLogueado = computed(() => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
});

const nombreInspector = computed(() => {
  const u = usuarioLogueado.value;
  if (!u || !u.nombre) return "Inspector PCP";
  return `${u.nombre} ${u.apellido || ""}`.trim();
});

// --- PERSISTENCIA LOCAL EN LOCALSTORAGE ---
const getStorageKey = () => {
  const llenaderoId = filtroLlenadero.value || "todos";
  return `pcp_validaciones_${llenaderoId}`;
};

const guardarEnLocalStorage = () => {
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(validacionesHoy.value));
  } catch (e) {
    console.warn("No se pudo guardar bitácora en localStorage:", e);
  }
};

const cargarDesdeLocalStorage = () => {
  try {
    const raw = localStorage.getItem(getStorageKey());
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        validacionesHoy.value = parsed;
      }
    }
  } catch (e) {
    console.warn("Error leyendo localStorage:", e);
  }
};

const onCambioLlenadero = () => {
  cargarDesdeLocalStorage();
  cargarValidaciones();
};

// --- FILTRADO POR FECHA Y LLENADERO ---
const estaEnRango = (fechaVal) => {
  if (!fechaVal) return false;
  const itemTime = new Date(fechaVal).getTime();
  if (isNaN(itemTime)) return false;

  let desdeTime = 0;
  let hastaTime = Infinity;

  if (rangoFiltro.value?.desde) {
    const dStr = String(rangoFiltro.value.desde).trim();
    const parsedD = date.extractDate(dStr, "YYYY-MM-DD HH:mm");
    if (parsedD && !isNaN(parsedD.getTime())) desdeTime = parsedD.getTime();
  }

  if (rangoFiltro.value?.hasta) {
    const hStr = String(rangoFiltro.value.hasta).trim();
    const parsedH = date.extractDate(hStr, "YYYY-MM-DD HH:mm");
    if (parsedH && !isNaN(parsedH.getTime())) {
      parsedH.setSeconds(59, 999);
      hastaTime = parsedH.getTime();
    }
  }

  return itemTime >= desdeTime && itemTime <= hastaTime;
};

const coincideLlenadero = (item) => {
  if (!filtroLlenadero.value) return true;
  const itemLlenadero = item.id_llenadero || item.Llenadero?.id_llenadero;
  if (!itemLlenadero) return true;
  return Number(itemLlenadero) === Number(filtroLlenadero.value);
};

// --- CONSULTA AL SERVIDOR (SIN RESTRICCIÓN DE USUARIO - SOPORTE MULTI-INSPECTOR) ---
const cargarValidaciones = async () => {
  loadingReporte.value = true;
  try {
    const params = {
      estado: "FINALIZADA",
      limit: 200,
      sortBy: "fecha_validacion",
      descending: true,
    };
    if (filtroLlenadero.value) {
      params.id_llenadero = filtroLlenadero.value;
    }

    const { data } = await api.get("/solicitudes", { params });
    const listaServidor = data?.data || [];

    const mapeados = listaServidor.map((d) => ({
      ...d,
      cantidad_despachada: getItemLiters(d),
      hora_validacion: formatHoraItem(d.fecha_validacion),
      estado: d.estado || "FINALIZADA",
    }));

    // Fusionamos preservando escaneos locales recientes de primero
    const mapCodigos = new Set();
    const fusionados = [];

    // 1. Primero los de la sesión actual
    validacionesHoy.value.forEach((v) => {
      if (!mapCodigos.has(v.codigo_ticket)) {
        mapCodigos.add(v.codigo_ticket);
        fusionados.push(v);
      }
    });

    // 2. Luego los que vengan del servidor
    mapeados.forEach((m) => {
      if (!mapCodigos.has(m.codigo_ticket)) {
        mapCodigos.add(m.codigo_ticket);
        fusionados.push(m);
      }
    });

    validacionesHoy.value = fusionados;
    guardarEnLocalStorage();
  } catch (error) {
    console.warn("No se pudo sincronizar reporte del servidor (modo local activo):", error.message);
  } finally {
    loadingReporte.value = false;
  }
};

// --- HELPERS PARA EXTRACCIÓN DE LITROS Y COMBUSTIBLE ---
const getItemLiters = (item) => {
  if (!item) return 0;
  const desp = Number(item.cantidad_despachada);
  if (!isNaN(desp) && desp > 0) return desp;

  const sol = Number(item.cantidad_litros);
  if (!isNaN(sol) && sol > 0) return sol;

  const snap = Number(item.ticket_snapshot?.litros);
  if (!isNaN(snap) && snap > 0) return snap;

  const fallback = Number(item.litros);
  if (!isNaN(fallback) && fallback > 0) return fallback;

  return 0;
};

const getLitrosSolicitados = (item) => {
  if (!item) return 0;
  const sol = Number(item.cantidad_litros);
  if (!isNaN(sol) && sol > 0) return sol;
  const snap = Number(item.ticket_snapshot?.litros_solicitados || item.ticket_snapshot?.cantidad_litros || item.ticket_snapshot?.litros);
  if (!isNaN(snap) && snap > 0) return snap;
  return getItemLiters(item);
};

const getLitrosDespachados = (item) => {
  if (!item) return 0;
  const desp = Number(item.cantidad_despachada);
  if (!isNaN(desp) && desp > 0) return desp;
  const snap = Number(item.ticket_snapshot?.cantidad_despachada || item.ticket_snapshot?.litros_despachados);
  if (!isNaN(snap) && snap > 0) return snap;
  return getItemLiters(item);
};

const getItemFuel = (item) => {
  if (!item) return "";
  return String(
    item.TipoCombustible?.nombre ||
    item.combustible ||
    item.ticket_snapshot?.renglon ||
    item.renglon ||
    ""
  ).toUpperCase();
};

// --- COMPUTADAS DE TOTALES Y FILTROS REACTIVOS ---
const validacionesFiltradas = computed(() => {
  return validacionesHoy.value.filter((v) => {
    // 1. Rango de Fecha y Hora (Desde - Hasta)
    if (!estaEnRango(v.fecha_validacion)) return false;

    // 2. Llenadero
    if (!coincideLlenadero(v)) return false;

    // 3. Búsqueda rápida por texto
    if (filtroBusquedaLista.value) {
      const q = filtroBusquedaLista.value.toLowerCase().trim();
      const cod = (v.codigo_ticket || "").toLowerCase();
      const plc = (v.placa || "").toLowerCase();
      const dep = (v.Subdependencia?.nombre || v.subdependencia || "").toLowerCase();
      if (!cod.includes(q) && !plc.includes(q) && !dep.includes(q)) return false;
    }

    return true;
  });
});

const totalTickets = computed(() => validacionesFiltradas.value.length);

const totalLitrosGeneral = computed(() => {
  return validacionesFiltradas.value.reduce((acc, v) => acc + getItemLiters(v), 0);
});

const totalGasoil = computed(() => {
  return validacionesFiltradas.value
    .filter((v) => {
      const c = getItemFuel(v);
      return c.includes("GASOIL") || c.includes("DIESEL");
    })
    .reduce((acc, v) => acc + getItemLiters(v), 0);
});

const totalGasolina = computed(() => {
  return validacionesFiltradas.value
    .filter((v) => {
      const c = getItemFuel(v);
      return c.includes("GASOLINA");
    })
    .reduce((acc, v) => acc + getItemLiters(v), 0);
});

// --- ACCIONES Y MÉTODOS ---
const searchTicket = async () => {
  if (!searchCode.value) return;

  loading.value = true;
  ticket.value = null;
  searched.value = false;

  try {
    const response = await api.get(`/validacion/ticket/${searchCode.value.trim()}`);

    if (response.data.status === "READY") {
      ticket.value = response.data.ticket;
      $q.notify({
        type: "positive",
        message: "Ticket recuperado exitosamente",
        icon: "task_alt",
      });
    } else {
      $q.notify({
        type: "warning",
        message: response.data.msg,
        icon: "warning",
      });
    }
  } catch (error) {
    console.error(error);
    const msg = error.response?.data?.msg || "Error buscando ticket";
    $q.notify({ type: "negative", message: msg, icon: "error" });
  } finally {
    loading.value = false;
    searched.value = true;
  }
};

const openDialog = (mode) => {
  dialogMode.value = mode;
  showDialog.value = true;
};

const handleValidation = async (payload) => {
  try {
    $q.loading.show({ message: "Procesando cierre y asentando en base de datos..." });

    const body = {
      codigo_ticket: ticket.value.codigo_ticket,
      cantidad_real_cargada: payload.cantidad_real,
      observaciones: payload.observaciones,
      password_confirmacion: payload.password,
    };

    const response = await api.post("/validacion/finalizar", body);

    $q.notify({
      type: "positive",
      message: response.data.msg,
      caption: response.data.detalle,
      icon: "check_circle",
      timeout: 3500,
    });

    // Guardamos en la bitácora reactiva de hoy asociada al usuario actual
    const nuevoRegistro = {
      ...(ticket.value || {}),
      ...(response.data.ticket || {}),
      TipoCombustible: ticket.value?.TipoCombustible || response.data.ticket?.TipoCombustible,
      Subdependencia: ticket.value?.Subdependencia || response.data.ticket?.Subdependencia,
      Dependencia: ticket.value?.Dependencia || response.data.ticket?.Dependencia,
      id_validador: usuarioLogueado.value?.id_usuario,
      validador_nombre: nombreInspector.value,
      cantidad_despachada: parseFloat(payload.cantidad_real || ticket.value?.cantidad_litros || 0),
      cantidad_litros: parseFloat(ticket.value?.cantidad_litros || payload.cantidad_real || 0),
      fecha_validacion: new Date().toISOString(),
      hora_validacion: date.formatDate(Date.now(), "hh:mm:ss A"),
      estado: "FINALIZADA",
      ticket_snapshot: response.data.ticket?.ticket_snapshot || ticket.value?.ticket_snapshot,
    };

    validacionesHoy.value.unshift(nuevoRegistro);
    ultimoTicketProcesado.value = nuevoRegistro;
    guardarEnLocalStorage();

    // Limpiamos pantalla de búsqueda activa
    showDialog.value = false;
    ticket.value = null;
    searchCode.value = "";
    searched.value = false;
  } catch (error) {
    console.error(error);
    const msg = error.response?.data?.msg || "Error finalizando ticket";
    $q.notify({ type: "negative", message: msg, icon: "error" });
  } finally {
    $q.loading.hide();
  }
};

// --- VISUALIZAR TICKET CON TICKETPREVIEWDIALOG ---
const verTicket = (item) => {
  ticketParaPreview.value = {
    ...item,
    // Garantizar que displayData de TicketPreviewDialog tome el snapshot o datos directos
    snapshot: item.ticket_snapshot || item.snapshot,
    codigo_ticket: item.codigo_ticket,
  };
  showPreview.value = true;
};

// --- QR SCANNER HANDLERS ---
const onDetect = (detectedCodes) => {
  const code = detectedCodes[0]?.rawValue;
  if (code) {
    searchCode.value = code;
    showScanner.value = false;
    searchTicket();
  }
};

const onError = (error) => {
  console.error("QR Error:", error);
  if (error.name === "NotAllowedError") {
    $q.notify({ type: "negative", message: "Permiso de cámara denegado", icon: "videocam_off" });
  } else if (error.name === "NotFoundError") {
    $q.notify({ type: "negative", message: "No se encontró cámara en este dispositivo", icon: "no_photography" });
  } else {
    $q.notify({ type: "warning", message: "Error de cámara: " + error.message });
  }
};

// --- HELPERS VISUALES ---
const formatLitros = (val) => {
  const num = parseFloat(val || 0);
  return isNaN(num) ? "0,00" : num.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatHoraItem = (fechaStr) => {
  if (!fechaStr) return date.formatDate(Date.now(), "hh:mm A");
  return date.formatDate(new Date(fechaStr), "hh:mm A");
};

const getFuelColor = (item) => {
  const c = (item.TipoCombustible?.nombre || item.combustible || "").toUpperCase();
  if (c.includes("GASOIL") || c.includes("DIESEL")) return "amber-9";
  if (c.includes("GASOLINA")) return "teal";
  return "primary";
};

const getFuelName = (item) => {
  return item.TipoCombustible?.nombre || item.combustible || "Combustible";
};

// --- CICLO DE VIDA ---
onMounted(async () => {
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);
  await cargarLlenaderos();
  cargarDesdeLocalStorage();
  cargarValidaciones();
});

onUnmounted(() => {
  window.removeEventListener("online", updateOnlineStatus);
  window.removeEventListener("offline", updateOnlineStatus);
});
</script>

<style scoped>
.scan-box {
  width: 200px;
  height: 200px;
  border: 2px solid rgba(0, 255, 0, 0.6);
  box-shadow: 0 0 0 1000px rgba(0, 0, 0, 0.5);
  border-radius: 12px;
}
.slide-fade {
  animation: slide-in 0.3s ease-out;
}
@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

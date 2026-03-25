<template>
  <q-dialog v-model="visible">
    <q-card style="width: 450px; max-width: 90vw" class="q-pa-sm">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6 text-primary row items-center">
          <q-icon name="receipt_long" size="md" class="q-mr-sm" />
          Vista Previa de Ticket
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pa-md overflow-hidden">
        <!-- Contenedor del Ticket (Estilo Térmico Original) -->
        <div
          class="ticket-container bg-white q-pa-sm text-mono shadow-2 text-black"
          style="font-size: 11px"
        >
          <!-- Logo y Encabezado -->
          <div class="text-center">
            <div class="text-weight-bold">MIBITURVEN, S.A.</div>
            <div>El Dorado, Edo Bolivar</div>
            <div>{{ displayData.fecha_impresion_string || formatDateTime(displayData.fecha_impresion) }}</div>
            <div class="divider">
              ********************************
            </div>
            <div class="text-weight-bold">SGC: Modulo Combustible</div>
            <div class="divider">
              ***********************************************
            </div>
          </div>

          <!-- Cuerpo del Ticket -->
          <div class="q-mt-sm">
            <div>Solicitud No: {{ displayData.codigo }}</div>
            <div>Codigo Beneficiario: {{ displayData.beneficiario_codigo }}</div>
            <div class="text-weight-bold">
              {{ displayData.dependencia_nombre }}
            </div>
            <div>Solicitante: {{ displayData.solicitante_nombre }}</div>
            <div>Renglon: {{ displayData.renglon }}</div>
            <div>LTS: {{ displayData.litros }}</div>

            <!-- Datos de Venta (Solo si aplica) -->
            <div v-if="displayData.hasPrice">
              <div>
                Precio x LTS {{ Number(displayData.precio).toFixed(2) }} ({{
                  displayData.moneda
                }})
              </div>
              <div>
                Total a pagar:
                {{ (displayData.litros * displayData.precio).toFixed(2) }} ({{
                  displayData.moneda
                }})
              </div>
            </div>
            <div v-else>
              <div>Precio x LTS 0 (0)</div>
              <div>Total a pagar: 0 (0)</div>
            </div>

            <div>Llenadero: {{ displayData.llenadero }}</div>
            <div>Flota: {{ displayData.flota }}</div>
            <div>Placa: {{ displayData.placa }}</div>
            <div>Despacho: {{ displayData.suministro }}</div>

            <div class="q-mt-sm">
              <div>Autorizacion: {{ displayData.autorizacion }}</div>
              <div>Recibido: {{ displayData.recibido }}</div>
              <div>C.I.: {{ displayData.cedula }}</div>
              <div>Almacen: {{ displayData.almacen }}</div>
              <div>Operacion: {{ displayData.operacion }}</div>
            </div>
          </div>

          <!-- Líneas de Conformidad -->
          <div class="q-mt-md">
            <div>Conformidad PCP: ___________________________</div>
            <div class="q-mt-xs">
              Conformidad DGCIM: _________________________
            </div>
          </div>

          <div class="text-center q-mt-sm">
            <div>
              {{
                displayData.es_copia
                  ? "Copia (Re-Impresion)"
                  : "Original (Impresion)"
              }}
            </div>
            <div class="text-center q-my-xs">
              <img
                v-if="qrCodeDataUrl"
                :src="qrCodeDataUrl"
                style="width: 80px; height: 80px"
              />
            </div>
            <div class="text-caption" style="font-size: 8px">
              <div class="divider">
                ********************************
              </div>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="bg-white q-px-md q-pb-md">
        <q-btn
          unelevated
          label="Reimprimir (Original + Copia)"
          color="indigo"
          icon="print"
          :loading="isPrinting"
          @click="printBoth"
        />
        <q-btn
          outline
          label="Solo Original"
          color="indigo-7"
          icon="receipt"
          :loading="isPrinting"
          @click="printTicket"
        />
        <q-btn flat label="Cerrar" color="grey-8" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch, nextTick } from "vue";
import { date, useQuasar } from "quasar";
import QRCode from "qrcode";

const props = defineProps({
  modelValue: Boolean,
  ticket: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["update:modelValue"]);

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const ticketData = computed(() => props.ticket || {});

// Usar snapshot inmutable del backend si existe; si no, normalizar datos relacionales (fallback retrocompatible)
const displayData = computed(() => {
  const snap = ticketData.value?.snapshot;
  if (snap) return snap;
  // --- Fallback: normalización desde datos relacionales ---
  return normalized.value;
});

const normalized = computed(() => {
  const t = ticketData.value;
  // Si tiene la propiedad 'solicitud', es el formato de impresión. Si no, es la solicitud directa.
  const s = t.solicitud || t;

  return {
    codigo: t.codigo || s.codigo_ticket || "S/C",
    fecha_impresion: s.fecha_impresion || s.fecha_solicitud,
    fecha_impresion_string: "", // Se llenará en tiempo de visualización si no viene en el snapshot
    beneficiario_codigo: s.Dependencia?.codigo || "S/C",
    dependencia_nombre: s.Subdependencia?.nombre ? s.Subdependencia.nombre : (s.Dependencia?.nombre_dependencia || "S/D"),
    solicitante_nombre: s.Solicitante
      ? `${s.Solicitante.nombre} ${s.Solicitante.apellido}`
      : "S/S",
    renglon: s.TipoCombustible?.nombre || "S/R",
    litros: s.cantidad_litros || "0",
    precio: s.PrecioCombustible?.precio || 0,
    moneda: s.PrecioCombustible?.Moneda?.nombre || "USD",
    hasPrice: !!s.PrecioCombustible,
    llenadero: s.Llenadero?.nombre_llenadero || "S/L",
    flota: s.flota || "NO APLICA",
    placa: s.placa || "NO APLICA",
    suministro: s.tipo_suministro === "BIDON" ? "Bidon" : "Regular",
    autorizacion: s.Aprobador
      ? `${s.Aprobador.nombre} ${s.Aprobador.apellido}`
      : "S/A",
    recibido: t.receptor?.nombre || s.Receptor?.nombre || "S/R",
    cedula: t.receptor?.cedula || s.Receptor?.cedula || "S/I",
    almacen:
      t.almacenista?.nombre ||
      (s.Almacenista
        ? `${s.Almacenista.nombre} ${s.Almacenista.apellido}`
        : "S/A"),
    operacion: s.Dependencia?.tipo_venta === "VENTA" ? "VENTA" : "LOCAL",
    es_copia: !!t.es_copia || s.numero_impresiones > 1,
  };
});

const formatDate = (val) => {
  if (!val) return date.formatDate(new Date(), "DD/MM/YYYY HH:mm");
  return date.formatDate(val, "DD/MM/YYYY HH:mm");
};

const formatDateTime = (val) => {
  if (!val) return date.formatDate(new Date(), "DD/MM/YYYY hh:mm:ss A");
  return date.formatDate(val, "DD/MM/YYYY hh:mm:ss A");
};

const simulateDownload = () => {
  // Aquí se podría integrar html2canvas para descargar la imagen en el futuro
  alert(
    "Esta funcionalidad requiere una librería de exportación (ej. html2pdf). Por ahora solo visualización.",
  );
};

const $q = useQuasar();

const PRINT_SERVER_URL = 'http://localhost:3001';

const isPrinting = ref(false);

// Re-impresión: solo Original usando snapshot o datos actuales
const printTicket = async () => {
  isPrinting.value = true;
  try {
    const data = { ...displayData.value, es_copia: false };
    const response = await fetch(`${PRINT_SERVER_URL}/print`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (response.ok) {
      $q.notify({ color: "positive", message: "Original enviado a la impresora", icon: "print" });
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error al imprimir");
    }
  } catch (error) {
    console.error("Error conectando con el servidor de impresión", error);
    $q.notify({
      color: "negative",
      message: "No se pudo conectar a la impresora local. Verifique que el servidor de impresión (.exe) esté en ejecución.",
      icon: "error",
      timeout: 5000
    });
  } finally {
    isPrinting.value = false;
  }
};

// Re-impresión: Original + Copia
const printBoth = async () => {
  isPrinting.value = true;
  try {
    const data = { ...displayData.value };
    const response = await fetch(`${PRINT_SERVER_URL}/print-both`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (response.ok) {
      $q.notify({ color: "positive", message: "Original + Copia enviados a la impresora", icon: "print" });
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error al imprimir");
    }
  } catch (error) {
    console.error("Error conectando con el servidor de impresión", error);
    $q.notify({
      color: "negative",
      message: "No se pudo conectar a la impresora local. Verifique que el servidor de impresión (.exe) esté en ejecución.",
      icon: "error",
      timeout: 5000
    });
  } finally {
    isPrinting.value = false;
  }
};

const qrCodeDataUrl = ref("");

const generateQR = async () => {
  if (!normalized.value.codigo) return;
  try {
    qrCodeDataUrl.value = await QRCode.toDataURL(normalized.value.codigo, {
      width: 150, // Aumentado para mejor legibilidad en térmica
      margin: 1,
    });
  } catch (err) {
    console.error("Error generando QR", err);
  }
};

watch(
  () => props.ticket,
  () => {
    nextTick(generateQR);
  },
  { immediate: true, deep: true },
);
</script>

<style scoped>
.text-mono {
  font-family: "Courier New", Courier, monospace;
}
.ticket-container {
  border: 1px solid #ccc;
  color: #000;
  line-height: 1.1;
  max-width: 300px;
  margin: 0 auto;
  background-color: #fdfdfd;
}
.divider {
  overflow: hidden;
  white-space: nowrap;
  letter-spacing: -1px;
}
.border-dashed {
  border: 1px dashed #000;
}
.qr-placeholder {
  border: 5px solid #000;
  padding: 5px;
}
</style>

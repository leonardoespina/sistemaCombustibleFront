<template>
  <q-dialog v-model="visible" persistent>
    <q-card style="width: 350px; max-width: 90vw;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Vista Previa de Ticket</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pa-md overflow-hidden">
        <!-- Contenedor del Ticket (Estilo Térmico) -->
        <div class="ticket-container bg-white q-pa-sm text-mono shadow-2 text-black" style="font-size: 11px;">
          <!-- Logo y Encabezado -->
          <div class="text-center">
            <div class="text-weight-bold">MIBITURVEN, S.A.</div>
            <div>El Dorado, Edo Bolivar</div>
            <div>{{ formatDateTime(normalized.fecha_impresion) }}</div>
            <div class="divider">***********************************************</div>
            <div class="text-weight-bold">SGC: Modulo Combustible</div>
            <div class="divider">***********************************************</div>
          </div>

          <!-- Cuerpo del Ticket -->
          <div class="q-mt-sm">
            <div>Solicitud No: {{ normalized.codigo }}</div>
            <div>Codigo Beneficiario: {{ normalized.beneficiario_codigo }}</div>
            <div class="text-weight-bold">{{ normalized.dependencia_nombre }}</div>
            <div>Solicitante: {{ normalized.solicitante_nombre }}</div>
            <div>Renglon: {{ normalized.renglon }}</div>
            <div>LTS: {{ normalized.litros }}</div>
            
            <!-- Datos de Venta (Solo si aplica) -->
            <div v-if="normalized.hasPrice">
               <div>Precio x LTS {{ normalized.precio }} ({{ normalized.moneda }})</div>
               <div>Total a pagar: {{ (normalized.litros * normalized.precio).toFixed(2) }} ({{ normalized.moneda }})</div>
            </div>
            <div v-else>
               <div>Precio x LTS 0 (0)</div>
               <div>Total a pagar: 0 (0)</div>
            </div>

            <div>Llenadero: {{ normalized.llenadero }}</div>
            <div>Flota: {{ normalized.flota }}</div>
            <div>Placa: {{ normalized.placa }}</div>
            <div>Despacho: {{ normalized.suministro }}</div>
            
            <div class="q-mt-sm">
              <div>Autorizacion: {{ normalized.autorizacion }}</div>
              <div>Recibido: {{ normalized.recibido }}</div>
              <div>C.I.: {{ normalized.cedula }}</div>
              <div>Almacen: {{ normalized.almacen }}</div>
              <div>Operacion: {{ normalized.operacion }}</div>
            </div>
          </div>

          <!-- Líneas de Conformidad -->
          <div class="q-mt-md">
            <div>Conformidad PCP: ___________________________</div>
            <div class="q-mt-xs">Conformidad DGCIM: _________________________</div>
          </div>

          <div class="text-center q-mt-sm">
            <div>{{ normalized.es_copia ? 'Copia (Re-Impresion)' : 'Original (Impresion)' }}</div>
            <div class="text-center q-my-xs">
              <img v-if="qrCodeDataUrl" :src="qrCodeDataUrl" style="width: 80px; height: 80px;" />
            </div>
            <div class="text-caption" style="font-size: 8px;">
              <div class="divider">***********************************************</div>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="bg-grey-1">
        <q-btn flat label="Descargar PDF (Simulado)" color="grey-7" icon="download" @click="simulateDownload" />
        <q-btn unelevated label="Cerrar" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from "vue";
import { date } from "quasar";

const props = defineProps({
  modelValue: Boolean,
  ticket: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(["update:modelValue"]);

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v)
});

const ticketData = computed(() => props.ticket || {});

// Normalizar datos para que el template funcione con Solicitud directa (Lista) 
// o con objeto Ticket (Acción Impresión)
const normalized = computed(() => {
  const t = ticketData.value;
  // Si tiene la propiedad 'solicitud', es el formato de impresión. Si no, es la solicitud directa.
  const s = t.solicitud || t;
  
  return {
    codigo: t.codigo || s.codigo_ticket || 'S/C',
    fecha_impresion: s.fecha_impresion || s.fecha_solicitud,
    beneficiario_codigo: s.Dependencia?.codigo || 'S/C',
    dependencia_nombre: s.Dependencia?.nombre_dependencia || 'S/D',
    solicitante_nombre: s.Solicitante ? `${s.Solicitante.nombre} ${s.Solicitante.apellido}` : 'S/S',
    renglon: s.TipoCombustible?.nombre || 'S/R',
    litros: s.cantidad_litros || '0',
    precio: s.PrecioCombustible?.precio || 0,
    moneda: s.PrecioCombustible?.Moneda?.nombre || 'USD',
    hasPrice: !!s.PrecioCombustible,
    llenadero: s.Llenadero?.nombre_llenadero || 'S/L',
    flota: s.flota || 'NO APLICA',
    placa: s.placa || 'NO APLICA',
    suministro: s.tipo_suministro === 'BIDON' ? 'Bidon' : 'Regular',
    autorizacion: s.Aprobador ? `${s.Aprobador.nombre} ${s.Aprobador.apellido}` : 'S/A',
    recibido: t.receptor?.nombre || s.Receptor?.nombre || 'S/R',
    cedula: t.receptor?.cedula || s.Receptor?.cedula || 'S/I',
    almacen: t.almacenista?.nombre || (s.Almacenista ? `${s.Almacenista.nombre} ${s.Almacenista.apellido}` : 'S/A'),
    operacion: s.Dependencia?.tipo_venta === 'VENTA' ? 'VENTA' : 'LOCAL',
    es_copia: !!t.es_copia || (s.numero_impresiones > 1)
  };
});

const formatDate = (val) => {
  if (!val) return date.formatDate(new Date(), "DD/MM/YYYY HH:mm");
  return date.formatDate(val, "DD/MM/YYYY HH:mm");
};

const formatDateTime = (val) => {
  if (!val) return date.formatDate(new Date(), "YYYY-MM-DD h:mm:ss A");
  return date.formatDate(val, "YYYY-MM-DD h:mm:ss A");
};

const simulateDownload = () => {
  // Aquí se podría integrar html2canvas para descargar la imagen en el futuro
  alert("Esta funcionalidad requiere una librería de exportación (ej. html2pdf). Por ahora solo visualización.");
};

// Generación de QR
import QRCode from "qrcode";
import { ref, watch, nextTick } from "vue";

const qrCodeDataUrl = ref("");

const generateQR = async () => {
    if (!normalized.value.codigo) return;
    try {
        qrCodeDataUrl.value = await QRCode.toDataURL(normalized.value.codigo, { width: 100, margin: 1 });
    } catch (err) {
        console.error("Error generando QR", err);
    }
};

watch(() => props.ticket, () => {
   nextTick(generateQR);
}, { immediate: true, deep: true });

</script>

<style scoped>
.text-mono {
  font-family: 'Courier New', Courier, monospace;
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
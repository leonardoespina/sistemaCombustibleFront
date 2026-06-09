<template>
  <q-dialog v-model="isOpen" maximized transition-show="slide-up" transition-hide="slide-down">
    <div style="background-color: #ffffff; display: flex; flex-direction: column; height: 100vh; width: 100vw; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; overflow: hidden;">
      
      <!-- HEADER DEL DIALOG -->
      <div style="padding: 8px 24px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; z-index: 10; flex-shrink: 0;">
        <div style="font-size: 16px; font-weight: 700; color: #0f172a; display: flex; align-items: center;">
          <q-icon name="analytics" size="20px" style="margin-right: 8px; color: #2563eb;" />
          Panel Ejecutivo de Recepciones
        </div>
        <q-btn icon="close" flat round dense v-close-popup color="grey-8">
          <q-tooltip>Cerrar Presentación</q-tooltip>
        </q-btn>
      </div>

      <!-- CONTENIDO PRINCIPAL -->
      <div style="flex-grow: 1; padding: 8px 12px; display: flex; flex-direction: column; overflow: hidden; box-sizing: border-box;">
        
        <!-- GRID DE COLUMNAS -->
        <div style="display: flex; gap: 12px; flex-grow: 1; justify-content: center; align-items: flex-start; box-sizing: border-box;">
          
          <div 
            v-for="(group, gIdx) in reportGroups" 
            :key="gIdx" 
            style="flex: 1; display: flex; flex-direction: column; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; height: 100%;"
          >
            
            <!-- ENCABEZADO DE COLUMNA -->
            <div :style="{ backgroundColor: getCardColorHex(group.llenadero), padding: '6px 12px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }">
              <div style="display: flex; flex-direction: column;">
                <div style="font-size: 15px; font-weight: 800; letter-spacing: 0.5px; line-height: 1;">
                  {{ group.llenadero }}
                </div>
                <div style="font-size: 10px; font-weight: 700; opacity: 0.9; margin-top: 2px;">
                  {{ group.combustible }}
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 16px; font-weight: 900; line-height: 1;">
                  {{ Number(group.total_litros).toLocaleString('de-DE', { minimumFractionDigits: 0 }) }} <span style="font-size: 11px; font-weight: normal;">L</span>
                </div>
              </div>
            </div>

            <!-- LISTA EN FORMATO TABLA PARA ALINEACIÓN PERFECTA -->
            <div style="flex-grow: 1; padding: 0; background-color: #ffffff; overflow-y: auto;">
              <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; position: sticky; top: 0; z-index: 5;">
                  <tr>
                    <th style="padding: 4px 6px; font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase;">Placa</th>
                    <th style="padding: 4px 6px; font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase;">Factura</th>
                    <th style="padding: 4px 6px; font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase;">Fecha</th>
                    <th style="padding: 4px 6px; font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase;">Tanque</th>
                    <th style="padding: 4px 6px; font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; text-align: right;">Litros</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="(item, idx) in group.items" 
                    :key="item.nro"
                    :style="{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }"
                  >
                    <td style="padding: 2px 6px; font-size: 11px; font-weight: 800; color: #1e293b; white-space: nowrap;">
                      {{ item.placa || 'S/I' }}
                    </td>
                    <td style="padding: 2px 6px; font-size: 11px; font-weight: 700; color: #0f172a; white-space: nowrap;">
                      #{{ item.factura }}
                    </td>
                    <td style="padding: 2px 6px; font-size: 10px; font-weight: 600; color: #475569; white-space: nowrap;">
                      {{ formatDate(item.fecha_factura) }}
                    </td>
                    <td style="padding: 2px 6px; font-size: 9px; font-weight: 700; color: #475569; line-height: 1.1;">
                      <span style="background: #e2e8f0; padding: 1px 4px; border-radius: 4px; display: inline-block;">
                        {{ item.destino }}
                      </span>
                    </td>
                    <td :style="{ padding: '2px 6px', fontSize: '12px', fontWeight: '800', textAlign: 'right', color: getCardColorHex(group.llenadero), whiteSpace: 'nowrap' }">
                      {{ Number(item.litros || 0).toLocaleString('de-DE', { minimumFractionDigits: 0 }) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
          </div>

        </div>
      </div>
    </div>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue';
import { date } from 'quasar';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  reportGroups: { type: Array, required: true }
});

const emit = defineEmits(['update:modelValue']);

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const formatDate = (dateStr) => {
  return date.formatDate(dateStr, 'DD/MM/YYYY');
};

const hexPalettes = [
  '#2563eb', // Royal Blue
  '#4f46e5', // Indigo
  '#059669', // Emerald
  '#d97706', // Amber
  '#e11d48', // Rose
  '#0891b2', // Cyan
  '#7c3aed'  // Violet
];

const getPaletteIndex = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % hexPalettes.length;
};

const getCardColorHex = (llenaderoName) => {
  if (!llenaderoName) return '#4b5563'; 
  return hexPalettes[getPaletteIndex(llenaderoName)];
};
</script>

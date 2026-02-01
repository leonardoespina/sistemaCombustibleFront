<template>
  <q-page class="q-pa-md bg-grey-2">
    <q-card>
      <q-card-section>
        <!-- Header Legacy Style -->
        <div class="q-mb-sm q-pa-sm rounded-borders" style="border: 1px solid #e0e0e0">
          <div class="row items-center justify-between q-mb-lg">
            <div>
              <div class="text-h4 text-primary text-weight-bold">Despacho</div>
              <div class="text-subtitle1 text-grey-8">Gestión de Tickets Listos para Despacho</div>
            </div>
          </div>
          <!-- Filtros Legacy -->
          <div class="row items-center q-col-gutter-x-md">
            <div class="col-auto text-weight-medium">Buscar Por</div>
            
            <!-- Radio Buttons -->
            <div class="col-auto">
              <q-radio v-model="searchType" val="fecha" label="Fecha" dense size="sm" />
              <q-radio v-model="searchType" val="solicitud" label="No Solicitud" dense size="sm" />
            </div>

            <!-- Inputs -->
            <div class="col-auto" style="min-width: 200px;">
              <q-input 
                v-if="searchType === 'fecha'"
                v-model="filterDate" 
                dense 
                outlined 
                type="date" 
                bg-color="white"
              />
              <q-input 
                v-else
                v-model="filterText" 
                dense 
                outlined 
                placeholder="Número de solicitud..." 
                bg-color="white"
              />
            </div>

            <div class="col-auto">
              <q-btn icon="search" color="primary" round dense size="sm" @click="loadRequests" />
            </div>

            <div class="col text-right">
              <div class="row justify-end items-center">
                  <span class="text-caption q-mr-sm">Código:</span>
                  <q-input v-model="filterCode" dense outlined style="width: 200px" bg-color="white" />
              </div>
            </div>
          </div>
        </div>
      </q-card-section>

      <!-- TABLA LEGACY -->
      <q-table
        :rows="rows"
        :columns="columns"
        row-key="id_solicitud"
        dense
        class="shadow-0"
        :loading="loading"
        v-model:pagination="pagination"
        :rows-number="pagination.rowsNumber"
        :rows-per-page-options="[20, 50, 100]"
        @request="handleRequest"
        separator="cell"
      >
        <!-- Header Customization for Blue Background -->
        <template v-slot:header="props">
          <q-tr :props="props" class="bg-blue-9 text-white">
            <q-th
              v-for="col in props.cols"
              :key="col.name"
              :props="props"
              class="text-white"
            >
              {{ col.label }}
            </q-th>
          </q-tr>
        </template>

        <!-- Body Customization -->
        <template v-slot:body="props">
          <q-tr 
            :props="props" 
            @click="openBiometricDialog(props.row)"
            class="cursor-pointer"
            :class="getRowClass(props.row)"
          >
            <q-td key="index" :props="props">
              <span class="text-weight-bold text-white bg-blue-9 q-px-xs">#{{ props.rowIndex + 1 }}</span>
            </q-td>
            <q-td key="codigo_ticket" :props="props" class="text-weight-medium text-caption">
              {{ props.row.codigo_ticket }}
            </q-td>
            <q-td key="flota" :props="props" class="text-caption">
              {{ props.row.modelo || 'N/A' }} 
            </q-td>
            <q-td key="tipo" :props="props" class="text-caption">
              {{ props.row.TipoCombustible?.nombre }}
            </q-td>
            <q-td key="dependencia" :props="props" class="text-caption">
              {{ props.row.Subdependencium?.nombre }}
            </q-td>
            <q-td key="solicitante" :props="props" class="text-weight-bold text-caption">
              {{ props.row.Solicitante?.nombre }} {{ props.row.Solicitante?.apellido }}
            </q-td>
            <q-td key="litros" :props="props" class="text-right text-caption">
              {{ props.row.cantidad_litros }}
            </q-td>
            <q-td key="estado" :props="props" class="text-caption">
              {{ props.row.estado }}
            </q-td>
            <q-td key="placa" :props="props" class="text-caption">
              {{ props.row.placa }}
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </q-card>

    <SmartBiometricDialog
      v-model="isBiometricDialogVisible"
      :request-data="selectedRequest"
      @ticketGenerated="handleTicketGenerated"
    />

    <!-- Diálogo de Vista Previa Digital -->
    <TicketPreviewDialog
      v-model="isTicketVisible"
      :ticket="selectedTicket"
    />
  </q-page>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, defineAsyncComponent, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRequestStore } from '../../stores/requestStore'; 
import { storeToRefs } from 'pinia';
import api from '../../api';
import socketServiceName from '../../services/socket';
const SmartBiometricDialog = defineAsyncComponent(() => 
  import('../../components/dispatches/SmartBiometricDialog.vue')
);
const TicketPreviewDialog = defineAsyncComponent(() => 
  import('../../components/dispatches/TicketPreviewDialog.vue')
);

const $q = useQuasar();
const requestStore = useRequestStore();
const loading = ref(false);

const isBiometricDialogVisible = ref(false);
const isTicketVisible = ref(false);
const selectedRequest = ref({});
const selectedTicket = ref(null);

// --- FILTROS ---
const searchType = ref('fecha');
const filterDate = ref(new Date().toISOString().split('T')[0]);
const filterText = ref('');
const filterCode = ref('');

// --- PAGINACIÓN (Server-Side) ---
const rows = ref([]);
const pagination = ref({
  sortBy: 'fecha_solicitud',
  descending: true,
  page: 1,
  rowsPerPage: 50, 
  rowsNumber: 10
});

const columns = [
  { name: 'index', label: 'No.', align: 'left', field: 'index' },
  { name: 'codigo_ticket', label: 'No. Solicitud', align: 'left', field: 'codigo_ticket', sortable: true },
  { name: 'flota', label: 'Flota', align: 'left', field: 'modelo' },
  { name: 'tipo', label: 'Tipo', align: 'left', field: row => row.TipoCombustible?.nombre },
  { name: 'dependencia', label: 'Dependencia II', align: 'left', field: row => row.Subdependencium?.nombre },
  { name: 'solicitante', label: 'Solicitante', align: 'left', field: row => row.Solicitante?.nombre },
  { name: 'litros', label: 'Litros', align: 'right', field: 'cantidad_litros' },
  { name: 'estado', label: 'Estatus', align: 'center', field: 'estado' },
  { name: 'placa', label: 'placa', align: 'left', field: 'placa', sortable: true },
];

/**
 * Función central de carga (llamada por q-table @request y por botón buscar)
 */
const loadRequests = async (props = { pagination: pagination.value }) => {
  loading.value = true;
  
  // Actualizar ref de paginación con lo que venga del request (o valor actual)
  const { page, rowsPerPage, sortBy, descending } = props.pagination;
  
  // Construir params para backend
  const params = {
    page: page,
    limit: rowsPerPage, // Backend usa 'limit'
    sort: sortBy ? `${sortBy}:${descending ? 'DESC' : 'ASC'}` : undefined
  };

  // Mapeo Inteligente de Filtros
  // Prioridad 1: Código (Placa/Ticket) - Si escribe aquí, buscamos global
  if (filterCode.value) {
      params.search = filterCode.value;
  } 
  // Prioridad 2: Filtros de Radio (Fecha vs Solicitud)
  else if (searchType.value === 'solicitud' && filterText.value) {
       params.search = filterText.value;
  } 
  else if (searchType.value === 'fecha' && filterDate.value) {
       // El backend espera fecha_inicio y fecha_fin para rango
       // Si es un solo día, mandamos el mismo día 00:00 a 23:59 (backend suele manejarlo o enviamos fechas)
       params.fecha_inicio = filterDate.value; 
       params.fecha_fin = filterDate.value;
  }

  // LOG DEBUG
  console.log("--> Enviando solicitud a API /despacho/solicitudes con params:", params);

  try {
    const response = await api.get('/despacho/solicitudes', { params });
    
    // LOG DEBUG
    console.log("<-- Respuesta API recibida:", response.data);

    // Backend responde: { data: [...], pagination: { totalItems, ... } } o standard paginate response
    // Ajustar según estructura real result.rows vs result.data
    const responseData = response.data;
    
    // Asignar filas (si viene anidado en data o rows)
    const newRows = responseData.data || responseData.rows || [];
    rows.value = newRows;
    
    console.log("--> Filas asignadas a la tabla:", newRows.length, newRows);

    // Actualizar Paginación Local
    pagination.value.page = page;
    pagination.value.rowsPerPage = rowsPerPage;
    pagination.value.sortBy = sortBy;
    pagination.value.descending = descending;
    pagination.value.rowsNumber = responseData.pagination?.totalItems || responseData.count || 0;

  } catch (error) {
    console.error("Error cargando solicitudes", error);
    $q.notify({type:'negative', message: 'Error recuperando datos'});
  } finally {
    loading.value = false;
  }
};

// --- HANDLERS ---
const handleRequest = (props) => {
    loadRequests(props);
};

// Wrappers para botones de búsqueda manual que resetean a pag 1
const triggerSearch = () => {
    const newPagination = { ...pagination.value, page: 1 };
    loadRequests({ pagination: newPagination });
};

// --- SOCKET ---
const handleSocketUpdate = (data) => {
    // Con paginación servidor, actualizar es complejo (¿está el item en esta página?)
    // Estrategia simple: Si es 'APROBADA', recargar la página actual para ver si entra.
    // O si es IMPORTANTE la inmediatez, insertarla manualmente si cabe.
    
    // Como es "Despacho", la velocidad importa.
    // Si llega una nueva aprobada, la ponemos arriba si estamos en pag 1.
    if (data.estado === 'APROBADA') {
        if (pagination.value.page === 1) {
            // Verificar si ya existe para no duplicar
             const idx = rows.value.findIndex(r => r.id_solicitud === data.id_solicitud);
             if (idx >= 0) {
                 Object.assign(rows.value[idx], data); // Update in place
             } else {
                 rows.value.unshift(data); // Add to top
                 // Si nos pasamos del rowsPerPage, quitamos el último (opcional visual)
                 if (rows.value.length > pagination.value.rowsPerPage) {
                     rows.value.pop();
                 }
                 pagination.value.rowsNumber++; // Aumentar contador total
             }
        } else {
             // Si estamos en otra página, solo notificamos o actualizamos contador (opcional)
             // O forzamos recarga
             // loadRequests(); 
             $q.notify({message: 'Nueva solicitud aprobada', icon: 'print', color: 'info'});
        }
    } else {
        // Si cambió de estado (ej. IMPRESA), quitarla de la lista si está visible
        const idx = rows.value.findIndex(r => r.id_solicitud === data.id_solicitud);
        if (idx >= 0) {
            rows.value.splice(idx, 1);
            pagination.value.rowsNumber--;
        }
    }
};

onMounted(() => {
    triggerSearch(); // Carga inicial
    socketServiceName.on('solicitud:actualizada', handleSocketUpdate);
    socketServiceName.on('solicitud:creada', handleSocketUpdate);
});

onBeforeUnmount(() => {
    socketServiceName.off('solicitud:actualizada', handleSocketUpdate);
    socketServiceName.off('solicitud:creada', handleSocketUpdate);
});

const openBiometricDialog = (request) => {
    selectedRequest.value = request;
    isBiometricDialogVisible.value = true;
};

const handleTicketGenerated = (ticket) => {
    // 1. Quitar de la lista (ya no está APROBADA)
    const idx = rows.value.findIndex(r => r.id_solicitud === selectedRequest.value.id_solicitud);
    if (idx >= 0) rows.value.splice(idx, 1);
    
    // 2. Mostrar la vista previa digital inmediatamente
    selectedTicket.value = ticket;
    isTicketVisible.value = true;
};

const getRowClass = (row) => 'bg-green-1';
</script>

 

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
          <!-- Filtros Modernos Toggle -->
          <div class="row items-center q-col-gutter-sm scroll-x">
            <!-- Selector de Estado (Visualización) -->
            <div class="col-12 col-md-auto">
              <q-select
                v-if="$q.screen.lt.md"
                v-model="statusFilter"
                :options="[
                  { label: 'Pendientes', value: 'APROBADA', icon: 'schedule' },
                  { label: 'Impresas', value: 'IMPRESA', icon: 'print' },
                  { label: 'Finalizadas', value: 'FINALIZADA', icon: 'check_circle' },
                  { label: 'Vencidas', value: 'VENCIDA', icon: 'warning' },
                  { label: 'Todas', value: 'TODAS', icon: 'list' }
                ]"
                label="Filtrar por Estado"
                dense
                outlined
                bg-color="white"
                emit-value
                map-options
                @update:model-value="triggerSearch"
                class="full-width"
              >
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <q-icon :name="scope.opt.icon" color="primary" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ scope.opt.label }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
                <template v-slot:selected-item="scope">
                  <div class="row items-center">
                    <q-icon :name="scope.opt.icon" color="primary" class="q-mr-xs" />
                    <span>{{ scope.opt.label }}</span>
                  </div>
                </template>
              </q-select>

              <q-btn-toggle
                v-else
                v-model="statusFilter"
                toggle-color="primary"
                flat
                unelevated
                dense
                rounded
                :options="[
                  { label: 'Pendientes', value: 'APROBADA', icon: 'schedule' },
                  { label: 'Impresas', value: 'IMPRESA', icon: 'print' },
                  { label: 'Finalizadas', value: 'FINALIZADA', icon: 'check_circle' },
                  { label: 'Vencidas', value: 'VENCIDA', icon: 'warning' },
                  { label: 'Todas', value: 'TODAS', icon: 'list' }
                ]"
                @update:model-value="triggerSearch"
              />
            </div>

            <q-separator vertical inset class="gt-sm q-mx-md" />

            <!-- Selector de Tipo de Búsqueda -->
            <div class="col-12 col-sm-auto">
              <q-btn-toggle
                v-model="searchType"
                toggle-color="primary"
                flat
                dense
                rounded
                :options="[
                  { label: 'Por Fecha', value: 'fecha', icon: 'event' },
                  { label: 'Por Solicitud', value: 'solicitud', icon: 'tag' }
                ]"
              />
            </div>

            <!-- Input Dinámico de Búsqueda -->
            <div class="col-12 col-sm-auto" style="min-width: 200px;">
              <q-input 
                v-if="searchType === 'fecha'"
                v-model="filterDate" 
                dense 
                outlined 
                type="date" 
                bg-color="white"
                @update:model-value="triggerSearch"
              />
              <q-input 
                v-else
                v-model="filterText" 
                dense 
                outlined 
                placeholder="Número de solicitud..." 
                bg-color="white"
                @keyup.enter="triggerSearch"
              />
            </div>

            <div class="col-auto">
              <q-btn icon="search" color="primary" round dense size="sm" @click="triggerSearch" />
            </div>

            <q-space />

            <!-- Búsqueda Global (Placa/Ticket) -->
            <div class="col-12 col-md-auto">
              <q-input v-model="filterCode" dense outlined style="width: 100%; min-width: 250px" bg-color="white" placeholder="Placa o Ticket (Global)...">
                <template v-slot:append>
                  <q-icon name="search" />
                </template>
              </q-input>
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

        <template v-slot:body="props">
          <q-tr 
            :props="props" 
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
              {{ props.row.Subdependencia?.nombre }}
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
            <q-td key="acciones" :props="props" class="text-right">
              <!-- Botón Dinámico: Huella (si está por imprimir) o Impresora (si ya está impresa) -->
              <q-btn
                v-if="props.row.estado === 'APROBADA'"
                dense
                round
                flat
                color="positive"
                icon="fingerprint"
                class="q-mr-xs"
                @click="openBiometricDialog(props.row)"
              >
                <q-tooltip>Captar Huella y Generar Ticket</q-tooltip>
              </q-btn>

              <q-btn
                v-if="['IMPRESA', 'FINALIZADA', 'DESPACHADA'].includes(props.row.estado)"
                dense
                round
                flat
                color="indigo"
                icon="print"
                class="q-mr-xs"
                @click="onViewTicket(props.row)"
              >
                <q-tooltip>Ver/Imprimir Ticket Original</q-tooltip>
              </q-btn>

              <q-btn
                dense
                round
                flat
                color="primary"
                icon="info"
                @click="onShowDetails(props.row)"
              >
                <q-tooltip>Ver Detalles</q-tooltip>
              </q-btn>
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

    <!-- Diálogo de Detalles -->
    <RequestDetailsDialog
      v-model="isDetailsVisible"
      :request-data="selectedRequest"
      @print="openBiometricDialog"
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
const RequestDetailsDialog = defineAsyncComponent(() => 
  import('../../components/dispatches/RequestDetailsDialog.vue')
);

const $q = useQuasar();
const requestStore = useRequestStore();
const loading = ref(false);

const isBiometricDialogVisible = ref(false);
const isTicketVisible = ref(false);
const isDetailsVisible = ref(false);
const selectedRequest = ref({});
const selectedTicket = ref(null);

// --- FILTROS ---
const searchType = ref('fecha');
const filterDate = ref(new Date().toISOString().split('T')[0]);
const filterText = ref('');
const filterCode = ref('');
const statusFilter = ref('APROBADA');

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
  { name: 'dependencia', label: 'Dependencia II', align: 'left', field: row => row.Subdependencia?.nombre },
  { name: 'solicitante', label: 'Solicitante', align: 'left', field: row => row.Solicitante ? `${row.Solicitante.nombre} ${row.Solicitante.apellido}` : 'N/A' },
  { name: 'litros', label: 'Litros (Solic.)', align: 'right', field: 'cantidad_litros' },
  { name: 'litros_desp', label: 'Litros (Real)', align: 'right', field: row => row.cantidad_despachada || '-' },
  { name: 'estado', label: 'Estatus', align: 'center', field: 'estado' },
  { name: 'placa', label: 'Placa', align: 'left', field: 'placa', sortable: true },
  { name: 'acciones', label: '', align: 'right' },
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
  params.estado = statusFilter.value;

  if (filterCode.value) {
      params.search = filterCode.value;
  } 
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
    if (data.estado === 'APROBADA' && statusFilter.value !== 'IMPRESA') {
        if (pagination.value.page === 1) {
             const idx = rows.value.findIndex(r => r.id_solicitud === data.id_solicitud);
             if (idx >= 0) {
                 Object.assign(rows.value[idx], data);
             } else {
                 rows.value.unshift(data);
                 if (rows.value.length > pagination.value.rowsPerPage) rows.value.pop();
                 pagination.value.rowsNumber++;
             }
        }
    } else if (data.estado === 'IMPRESA') {
        // Actualizar si está en la lista (independientemente del filtro activo, si existe se actualiza)
        const idx = rows.value.findIndex(r => r.id_solicitud === data.id_solicitud);
        if (idx >= 0) {
            if (statusFilter.value === 'APROBADA') {
                rows.value.splice(idx, 1);
                pagination.value.rowsNumber--;
            } else {
                Object.assign(rows.value[idx], data);
            }
        }
    } else {
        // DESPACHADA, ANULADA, etc -> Quitar siempre
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
    if (request.estado === 'IMPRESA') {
        onViewTicket(request);
        return;
    }
    selectedRequest.value = request;
    isBiometricDialogVisible.value = true;
};

const onViewTicket = async (request) => {
  try {
    $q.loading.show({ message: 'Obteniendo datos del ticket...' });
    const response = await requestStore.reprintTicket(request.id_solicitud);
    if (response && response.ticket) {
       selectedTicket.value = response.ticket;
       isTicketVisible.value = true;
    }
  } finally {
    $q.loading.hide();
  }
}

const handleTicketGenerated = (ticket) => {
    // 1. Quitar de la lista (ya no está APROBADA)
    const idx = rows.value.findIndex(r => r.id_solicitud === selectedRequest.value.id_solicitud);
    if (idx >= 0) rows.value.splice(idx, 1);
    
    // 2. Mostrar la vista previa digital inmediatamente
    selectedTicket.value = ticket;
    isTicketVisible.value = true;
};

const onShowDetails = (request) => {
    selectedRequest.value = request;
    isDetailsVisible.value = true;
};

const getRowClass = (row) => {
    if (row.estado === 'IMPRESA') return 'bg-indigo-1';
    if (row.estado === 'FINALIZADA') return 'bg-grey-3';
    return 'bg-green-1';
};
</script>

 

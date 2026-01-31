<!-- src/components/dispatches/RequestFormDialog.vue -->
<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="bg-grey-2 overflow-hidden column no-wrap">
      <!-- Cabecera estilo ventana desktop -->
      <q-bar class="bg-primary text-white q-py-md">
        <q-icon name="local_gas_station" />
        <div class="text-weight-bold text-subtitle1">Nueva Solicitud de Combustible</div>
        <q-space />
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Cerrar Ventana</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section class="col q-pa-md scroll">
        <q-form @submit.prevent="onSave">
          <div class="row q-col-gutter-md items-stretch">
            
            <!-- SECCIÓN IZQUIERDA: CONFIGURACIÓN Y FLOTA -->
            <div class="col-12 col-md-7 column q-gutter-y-md">
              
              <!-- CARD CONFIGURACIÓN -->
              <q-card flat bordered class="bg-white">
                <q-card-section class="q-py-xs bg-grey-3">
                  <div class="text-subtitle2 text-weight-bolder text-grey-9">Configuración de Solicitud</div>
                </q-card-section>
                <q-separator />
                <q-card-section class="q-pa-md q-gutter-y-md">
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-sm-6">
                      <div class="text-caption text-weight-bold text-grey-8 q-mb-xs">Dependencia / Unidad:</div>
                      <q-select
                        v-model="selectedSubdependencia"
                        outlined
                        dense
                        square
                        bg-color="white"
                        use-input
                        :options="filteredSubdependenciaOptions"
                        option-value="id_subdependencia"
                        option-label="nombre"
                        emit-value
                        map-options
                        @filter="filterSubdependencias"
                        @update:model-value="onSubdependenciaChange"
                        :loading="loadingSubdependencias"
                      />
                    </div>
                    <div class="col-12 col-sm-6">
                      <div class="text-caption text-weight-bold text-grey-8 q-mb-xs">Tipo Combustible:</div>
                      <q-select
                        v-model="selectedCombustible"
                        outlined
                        dense
                        square
                        bg-color="white"
                        :options="combustibleOptions"
                        option-value="id_tipo_combustible"
                        option-label="nombre"
                        emit-value
                        map-options
                        @update:model-value="onCombustibleChange"
                      />
                    </div>
                  </div>
                  <div class="row">
                    <div class="col-12">
                      <div class="text-caption text-weight-bold text-grey-8 q-mb-xs">LLenadero de Despacho:</div>
                      <q-select
                        v-model="formData.id_llenadero"
                        outlined
                        dense
                        square
                        bg-color="white"
                        :options="llenaderoOptions"
                        option-value="id_llenadero"
                        option-label="nombre_llenadero"
                        emit-value
                        map-options
                        :disable="!selectedCombustible"
                        :loading="loadingLlenaderos"
                      />
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <!-- CARD TABLA DE FLOTA -->
              <q-card flat bordered class="bg-white col">
                <q-card-section class="q-py-xs bg-grey-3 row items-center">
                  <div class="text-subtitle2 text-weight-bolder text-grey-9">Vehículo a Despachar</div>
                  <q-space />
                  <q-input
                    v-model="filterPlaca"
                    placeholder="Filtrar por Placa..."
                    dense
                    outlined
                    square
                    bg-color="white"
                    class="q-my-xs"
                    style="width: 200px"
                    @update:model-value="triggerFilterVehicles"
                  >
                    <template v-slot:append>
                      <q-icon name="search" size="xs" color="primary" />
                    </template>
                  </q-input>
                </q-card-section>
                <q-separator />
                <q-card-section class="q-pa-none overflow-hidden">
                  <q-markup-table dense flat square class="full-width scroll" style="height: 170px">
                    <thead class="bg-grey-9 text-white">
                      <tr>
                        <th class="text-left" style="width: 50px">No</th>
                        <th class="text-left" style="width: 80px">ID</th>
                        <th class="text-left">Placa / Modelo de Vehículo</th>
                        <th class="text-left" style="width: 120px">Tipo Comb.</th>
                      </tr>
                    </thead>
                    <tbody class="bg-white">
                      <tr 
                        v-for="(v, index) in vehicleOptions" 
                        :key="v.id_vehiculo"
                        @click="selectVehicleRow(v)"
                        class="cursor-pointer transition-all"
                        :class="selectedVehicle?.id_vehiculo === v.id_vehiculo ? 'bg-blue-1 text-primary text-weight-bolder' : 'hover-bg-grey-1'"
                      >
                        <td class="text-caption text-grey-6 text-center">#{{ index + 1 }}</td>
                        <td class="text-weight-medium">{{ v.id_vehiculo }}</td>
                        <td>
                           <div class="text-weight-bold">{{ v.placa }}</div>
                           <div class="text-caption text-grey-7">{{ v.Modelo?.nombre || 'S/M' }}</div>
                        </td>
                        <td>
                          <q-badge :color="getFuelColor(v.TipoCombustible?.nombre)" label-color="white">
                            {{ v.TipoCombustible?.nombre || 'N/A' }}
                          </q-badge>
                        </td>
                      </tr>
                      <tr v-if="vehicleOptions.length === 0">
                        <td colspan="4" class="text-center text-grey q-pa-xl">
                          <q-icon name="directions_car" size="lg" color="grey-4" class="q-mb-sm display-block" />
                          <div class="text-weight-medium">Seleccione Dependencia y Combustible para listar vehículos</div>
                        </td>
                      </tr>
                    </tbody>
                  </q-markup-table>
                </q-card-section>
              </q-card>

              <!-- BARRA DE ACCIONES INTEGRADA -->
              <div class="row justify-between items-center q-mt-sm">
                <div class="row q-gutter-sm">
                  <q-btn unelevated color="primary" class="shadow-1" padding="sm lg" type="submit" :loading="loading" :disable="!canSubmit">
                    <div class="row items-center no-wrap">
                      <q-icon name="send" size="xs" class="q-mr-sm" />
                      <div class="text-caption text-weight-bolder text-uppercase">Enviar Solicitud</div>
                    </div>
                  </q-btn>
                  <q-btn unelevated color="grey-8" class="shadow-1" padding="sm lg" @click="resetForm">
                    <div class="row items-center no-wrap">
                      <q-icon name="refresh" size="xs" class="q-mr-sm" />
                      <div class="text-caption text-weight-bolder text-uppercase">Limpiar</div>
                    </div>
                  </q-btn>
                </div>
                
                <div class="row q-gutter-sm">
                  <q-btn unelevated color="cyan-8" class="shadow-1" padding="sm lg">
                    <div class="row items-center no-wrap">
                      <q-icon name="note_add" size="xs" class="q-mr-sm" />
                      <div class="text-caption text-weight-bolder text-uppercase">Nota</div>
                    </div>
                  </q-btn>
                  <q-btn unelevated color="negative" class="shadow-1" padding="sm lg" v-close-popup>
                    <div class="row items-center no-wrap">
                      <q-icon name="power_settings_new" size="xs" class="q-mr-sm" />
                      <div class="text-caption text-weight-bolder text-uppercase">Salir</div>
                    </div>
                  </q-btn>
                </div>
              </div>
            </div>

            <!-- SECCIÓN DERECHA: DATOS DE CONTROL E INVENTARIO -->
            <div class="col-12 col-md-5 column q-gutter-y-md">
              
              <!-- CARD DATOS CONTROL -->
              <q-card flat bordered class="bg-white">
                <q-card-section class="q-pa-md q-gutter-y-sm">
                  <div class="row items-center">
                    <div class="col-5 text-right q-pr-lg text-weight-bold text-grey-8">Cantidad Litros:</div>
                    <div class="col-7">
                      <q-input v-model.number="formData.cantidad_litros" type="number" outlined dense square bg-color="white" class="text-weight-bolder" :rules="[val => !!val || 'Requerido']" hide-bottom-space />
                    </div>
                  </div>
                  <div class="row items-center">
                    <div class="col-5 text-right q-pr-lg text-weight-bold text-grey-8">Modalidad:</div>
                    <div class="col-7">
                      <q-select 
                        v-model="formData.tipo_solicitud" 
                        outlined 
                        dense 
                        square 
                        bg-color="white" 
                        :options="availableModalities" 
                        @update:model-value="onTipoSolicitudChange"
                        disable
                        readonly
                      />
                    </div>
                  </div>

                  <!-- SECCIÓN DE VENTA (CONDICIONAL) -->
                  <template v-if="formData.tipo_solicitud === 'VENTA'">
                    <div class="row items-center">
                      <div class="col-5 text-right q-pr-lg text-weight-bold text-grey-8">Precio / Moneda:</div>
                      <div class="col-7">
                        <q-select
                          v-model="selectedPrecioObj"
                          outlined
                          dense
                          square
                          bg-color="white"
                          :options="precioOptions"
                          option-label="etiqueta_precio"
                          :rules="[val => !!val || 'Requerido']"
                          hide-bottom-space
                        >
                           <template v-slot:option="scope">
                              <q-item v-bind="scope.itemProps">
                                <q-item-section>
                                  <q-item-label>{{ scope.opt.Moneda?.nombre }}</q-item-label>
                                  <q-item-label caption>{{ scope.opt.precio }} por Litro</q-item-label>
                                </q-item-section>
                              </q-item>
                            </template>
                        </q-select>
                      </div>
                    </div>
                    <div class="row items-center bg-blue-1 q-pa-sm rounded-borders">
                      <div class="col-5 text-right q-pr-lg text-weight-bolder text-primary">TOTAL A PAGAR:</div>
                      <div class="col-7 text-h6 text-weight-bolder text-primary">
                        {{ calculatedTotal }} <small>{{ selectedPrecioObj?.Moneda?.simbolo || '' }}</small>
                      </div>
                    </div>
                  </template>

                  <q-separator class="q-my-sm" />

                  <div class="row items-center">
                    <div class="col-5 text-right q-pr-lg text-weight-bold text-grey-8">Solicitante:</div>
                    <div class="col-7">
                      <q-input :model-value="solicitanteName" outlined dense square readonly bg-color="grey-1" class="text-uppercase" />
                    </div>
                  </div>
                  <div class="row items-center">
                    <div class="col-5 text-right q-pr-lg text-weight-bold text-grey-8">Fecha / Hora:</div>
                    <div class="col-7">
                      <div class="row q-col-gutter-xs">
                        <div class="col-7">
                          <q-input :model-value="currentDate" outlined dense square readonly bg-color="grey-1" class="text-center" />
                        </div>
                        <div class="col-5">
                          <q-input :model-value="currentTime" outlined dense square readonly bg-color="grey-1" class="text-center" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="row items-center">
                    <div class="col-5 text-right q-pr-lg text-weight-bold text-grey-8">Tipo Suministro:</div>
                    <div class="col-7">
                      <q-select v-model="formData.tipo_suministro" outlined dense square bg-color="white" :options="['REGULAR', 'BIDON']" />
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <!-- CARD INVENTARIO (CUPO) -->
              <q-card flat bordered class="bg-blue-grey-1 col">
                 <q-card-section class="q-py-xs bg-blue-grey-3 text-white">
                  <div class="text-subtitle2 text-weight-bolder">Cupo Mensual Disponible</div>
                </q-card-section>
                <q-separator />
                <q-card-section class="q-pa-md q-gutter-y-md">
                  
                  <div class="row q-col-gutter-lg">
                    <div class="col-6">
                      <div class="text-overline text-blue-grey-8 leading-none q-mb-xs">Asignado</div>
                      <div class="text-h5 text-primary text-weight-bolder">{{ formatVolume(quotaInfo?.asignado) }} <small class="text-caption">LTS</small></div>
                    </div>
                    <div class="col-6 text-right">
                      <div class="text-overline text-blue-grey-8 leading-none q-mb-xs">Disponible</div>
                      <div class="text-h5 text-weight-bolder" :class="quotaInfo?.disponible > 0 ? 'text-green-8' : 'text-negative'">{{ formatVolume(quotaInfo?.disponible) }}</div>
                    </div>
                  </div>

                  <q-separator dotted />
                  
                  <div class="row bg-white q-pa-md rounded-borders shadow-1 items-center">
                    <div class="col-7">
                      <div class="text-overline text-grey-7 leading-none q-mb-xs">Consumo Acumulado</div>
                      <div class="text-h5 text-deep-orange-9 text-weight-bolder">{{ formatVolume(quotaInfo?.consumido) }} <small class="text-caption">LTS</small></div>
                    </div>
                    <div class="col-5 column items-center">
                      <q-circular-progress
                        show-value
                        font-size="12px"
                        :value="Number(quotaInfo?.porcentaje || 0)"
                        size="70px"
                        :thickness="0.25"
                        color="deep-orange-9"
                        track-color="grey-2"
                        class="text-weight-bolder"
                      >
                        {{ quotaInfo?.porcentaje || 0 }}%
                      </q-circular-progress>
                      <div class="text-caption text-weight-bold text-grey-8 q-mt-xs text-uppercase">% Consumo</div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>

            </div>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useQuasar, date } from "quasar";
import api from "../../api";
import socket from "../../services/socket";

const props = defineProps({
  modelValue: Boolean,
});

const emit = defineEmits(["update:modelValue", "save"]);
const $q = useQuasar();

// State
const loading = ref(false);
const loadingSubdependencias = ref(false);
const loadingVehicles = ref(false);
const loadingLlenaderos = ref(false);

const selectedCombustible = ref(null);
const selectedVehicle = ref(null);
const selectedSubdependencia = ref(null);
const selectedPrecioObj = ref(null);

const subdependenciaOptions = ref([]);
const filteredSubdependenciaOptions = ref([]);
const combustibleOptions = ref([]);
const vehicleOptions = ref([]);
const llenaderoOptions = ref([]);
const precioOptions = ref([]);

const filterPlaca = ref("");
const quotaInfo = ref(null);
const solicitanteName = ref("");
const currentDate = ref(date.formatDate(Date.now(), 'DD/MM/YYYY'));
const currentTime = ref(date.formatDate(Date.now(), 'HH:mm:ss'));

const formData = ref({
  id_categoria: null,
  id_dependencia: null,
  id_llenadero: null,
  cantidad_litros: null,
  tipo_suministro: "REGULAR",
  tipo_solicitud: "INSTITUCIONAL",
  id_precio: null,
});

let fetchedVehicles = [];

// Computed
const availableModalities = computed(() => {
  const options = ["INSTITUCIONAL"];
  const sub = subdependenciaOptions.value.find(s => s.id_subdependencia === selectedSubdependencia.value);
  console.log("availableModalities - sub:", sub);
  if (sub?.cobra_venta || sub?.cobra_venta === 1 || sub?.cobra_venta === '1' || sub?.cobra_venta === true) {
    options.push("VENTA");
  }
  return options;
});

const calculatedTotal = computed(() => {
  if (!selectedPrecioObj.value || !formData.value.cantidad_litros) return "0";
  const total = parseFloat(selectedPrecioObj.value.precio) * parseFloat(formData.value.cantidad_litros);
  
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4
  }).format(total);
});

const canSubmit = computed(() => {
  const hasQuota = quotaInfo.value && parseFloat(quotaInfo.value.disponible) >= parseFloat(formData.value.cantidad_litros || 0);
  const isVentaValid = formData.value.tipo_solicitud === 'VENTA' 
    ? (!!selectedPrecioObj.value) 
    : true;

  return (
    formData.value.id_llenadero &&
    formData.value.cantidad_litros > 0 &&
    selectedVehicle.value &&
    selectedCombustible.value &&
    hasQuota &&
    isVentaValid
  );
});

// Lifecycle
onMounted(() => {
  loadInitialData();
  setInterval(() => {
    currentTime.value = date.formatDate(Date.now(), 'HH:mm:ss');
  }, 1000);

  // Escuchar actualizaciones de cupo vía Socket.io
  socket.on("cupo:consumo", handleSocketUpdate);
  socket.on("cupo:recarga", handleSocketUpdate);
});

onUnmounted(() => {
  socket.off("cupo:consumo", handleSocketUpdate);
  socket.off("cupo:recarga", handleSocketUpdate);
});

// Helpers
const getFuelColor = (name) => {
    if (!name) return 'grey';
    const n = name.toLowerCase();
    if (n.includes('gasolina')) return 'green-7';
    if (n.includes('diesel') || n.includes('gasoil')) return 'blue-grey-8';
    return 'blue-8';
};

const formatVolume = (val) => {
    if (val === undefined || val === null) return '0';
    return Number(val).toLocaleString('es-VE');
};

// Methods
function handleSocketUpdate(data) {
  console.log("Evento de socket recibido:", data);
  fetchQuotaInfo();
}

async function loadInitialData() {
  try {
    loading.value = true;
    loadingSubdependencias.value = true;

    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    if (user) {
        solicitanteName.value = `${user.nombre} ${user.apellido}`;
        formData.value.id_categoria = user.id_categoria;
        formData.value.id_dependencia = user.id_dependencia;
    }

    try {
      const resSub = await api.get("/solicitudes/subdependencias-autorizadas");
      subdependenciaOptions.value = resSub.data;
      filteredSubdependenciaOptions.value = resSub.data;

      if (subdependenciaOptions.value.length === 1) {
        selectedSubdependencia.value = subdependenciaOptions.value[0].id_subdependencia;
        await onSubdependenciaChange(selectedSubdependencia.value);
      }
    } catch (e) {
      console.error("Error al cargar subdependencias:", e);
    }

    try {
      const resComb = await api.get("/tipos-combustible/lista");
      combustibleOptions.value = resComb.data.data || resComb.data;
    } catch (e) {
      console.error("Error al cargar combustibles:", e);
    }
  } catch (error) {
    console.error("Error cargando datos iniciales:", error);
  } finally {
    loading.value = false;
    loadingSubdependencias.value = false;
  }
}

function resetForm() {
  selectedVehicle.value = null;
  selectedSubdependencia.value = null;
  selectedCombustible.value = null;
  selectedPrecioObj.value = null;
  llenaderoOptions.value = [];
  precioOptions.value = [];
  vehicleOptions.value = [];
  fetchedVehicles = [];
  filterPlaca.value = "";
  quotaInfo.value = null;
  
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  formData.value = {
    id_categoria: user?.id_categoria || null,
    id_dependencia: user?.id_dependencia || null,
    id_llenadero: null,
    cantidad_litros: null,
    tipo_suministro: "REGULAR",
    tipo_solicitud: "INSTITUCIONAL",
    id_precio: null,
  };
}

async function fetchQuotaInfo() {
  if (!selectedSubdependencia.value || !selectedCombustible.value) {
    quotaInfo.value = null;
    return;
  }

  try {
    const resCupo = await api.get("/cupos/especifico", {
      params: {
        id_subdependencia: selectedSubdependencia.value,
        id_tipo_combustible: selectedCombustible.value,
      },
    });
    const cupo = resCupo.data.data;
    if (cupo) {
      const asignado = parseFloat(cupo.cantidad_asignada);
      const consumido = parseFloat(cupo.cantidad_consumida);
      quotaInfo.value = {
        disponible: parseFloat(cupo.cantidad_disponible),
        asignado: asignado,
        consumido: consumido,
        porcentaje: asignado > 0 ? ((consumido / asignado) * 100).toFixed(1) : 0
      };
    }
  } catch (e) {
    console.warn("Cupo no disponible para esta combinación");
    quotaInfo.value = { disponible: 0, asignado: 0, consumido: 0, porcentaje: 0 };
  }
}

async function onSubdependenciaChange(subId) {
  selectedVehicle.value = null;
  const sub = subdependenciaOptions.value.find(s => s.id_subdependencia === subId);
  console.log("Subdependencia seleccionada:", sub);
  console.log("Cobra venta:", sub?.cobra_venta);

  if (sub?.cobra_venta || sub?.cobra_venta === 1 || sub?.cobra_venta === '1' || sub?.cobra_venta === true) {
    formData.value.tipo_solicitud = "VENTA";
  } else {
    formData.value.tipo_solicitud = "INSTITUCIONAL";
  }

  if (subId && selectedCombustible.value) {
    await fetchVehicles();
    await fetchQuotaInfo();
  } else {
    vehicleOptions.value = [];
    fetchedVehicles = [];
    quotaInfo.value = null;
  }
}

async function onCombustibleChange(combId) {
  formData.value.id_llenadero = null;
  selectedVehicle.value = null;
  selectedPrecioObj.value = null;
  precioOptions.value = [];

  if (!combId) {
    llenaderoOptions.value = [];
    vehicleOptions.value = [];
    quotaInfo.value = null;
    return;
  }

  try {
    loadingLlenaderos.value = true;
    const resLlen = await api.get("/solicitudes/llenaderos-por-combustible", {
      params: { id_tipo_combustible: combId },
    });
    llenaderoOptions.value = resLlen.data;
  } catch (e) {
    console.error("Error cargando llenaderos:", e);
  } finally {
    loadingLlenaderos.value = false;
  }

  if (selectedSubdependencia.value) {
    await fetchVehicles();
    await fetchQuotaInfo();
  }
  loadPrecios(combId);
}

async function fetchVehicles() {
  if (!selectedSubdependencia.value || !selectedCombustible.value) return;

  try {
    loadingVehicles.value = true;
    const resVeh = await api.get("/vehiculos", {
      params: {
        id_subdependencia: selectedSubdependencia.value,
        id_tipo_combustible: selectedCombustible.value,
        limit: 1000,
      },
    });

    const data = resVeh.data.data || resVeh.data;
    fetchedVehicles = Array.isArray(data) ? data : [];
    vehicleOptions.value = fetchedVehicles;
  } catch (error) {
    console.error("Error cargando vehículos:", error);
  } finally {
    loadingVehicles.value = false;
  }
}

function triggerFilterVehicles(val) {
    const needle = val.toLowerCase();
    vehicleOptions.value = fetchedVehicles.filter(
      (v) => v.placa.toLowerCase().indexOf(needle) > -1
    );
}

function selectVehicleRow(vehicle) {
    selectedVehicle.value = vehicle;
}

function filterSubdependencias(val, update) {
  if (val === "") {
    update(() => {
      filteredSubdependenciaOptions.value = subdependenciaOptions.value;
    });
    return;
  }
  update(() => {
    const needle = val.toLowerCase();
    filteredSubdependenciaOptions.value = subdependenciaOptions.value.filter(
      (v) => v.nombre.toLowerCase().indexOf(needle) > -1,
    );
  });
}

async function loadPrecios(id_tipo_combustible) {
  if (!id_tipo_combustible) return;
  try {
    const resPrecios = await api.get(`/precios/combustible/${id_tipo_combustible}`);
    precioOptions.value = resPrecios.data.map(p => ({
        ...p,
        etiqueta_precio: `${p.Moneda?.nombre}: ${p.precio} x Lto`
    }));
  } catch (e) {
    console.error("Error cargando precios:", e);
  }
}

function onTipoSolicitudChange(val) {
  if (val !== "VENTA") {
    selectedPrecioObj.value = null;
    formData.value.id_precio = null;
  }
}

function onSave() {
  if (!canSubmit.value) return;

  const payload = {
    ...formData.value,
    id_vehiculo: selectedVehicle.value.id_vehiculo,
    placa: selectedVehicle.value.placa,
    marca: selectedVehicle.value.Marca?.nombre,
    modelo: selectedVehicle.value.Modelo?.nombre,
    flota: selectedVehicle.value.flota || "GENERAL",
    id_tipo_combustible: selectedCombustible.value,
    id_subdependencia: selectedSubdependencia.value,
    id_precio: selectedPrecioObj.value?.id_precio || null,
    // Nuevos campos solicitados para auditoría y visualización
    monto_total: parseFloat(selectedPrecioObj.value?.precio || 0) * parseFloat(formData.value.cantidad_litros),
    solicitante: solicitanteName.value,
    fecha_solicitud: currentDate.value,
    hora_solicitud: currentTime.value
  };

  emit("save", payload);
}
</script>
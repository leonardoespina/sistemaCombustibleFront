<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <q-card style="width: 800px; max-width: 90vw">
      <q-card-section class="row items-center">
        <div class="text-h6">
          {{ isEditing ? "Editar Tanque" : "Nuevo Tanque" }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-form @submit.prevent="onSave">
        <q-card-section class="q-pt-none">
          <div class="row q-col-gutter-md">
            <!-- Sección: Identificación -->
            <div class="col-12 text-subtitle2 text-primary">Identificación</div>
            
            <div class="col-12 col-md-4">
              <q-input
                dense
                outlined
                v-model="formData.codigo"
                label="Código *"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>
            <div class="col-12 col-md-8">
              <q-input
                dense
                outlined
                v-model="formData.nombre"
                label="Nombre del Tanque *"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>

            <!-- Sección: Ubicación y Tipo -->
            <div class="col-12 col-md-6">
              <q-select
                dense
                outlined
                v-model="formData.id_llenadero"
                :options="llenaderoOptions"
                label="Llenadero *"
                option-label="nombre_llenadero"
                option-value="id_llenadero"
                emit-value
                map-options
                use-input
                @filter="filterLlenaderos"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-select
                dense
                outlined
                v-model="formData.id_tipo_combustible"
                :options="combustibleOptions"
                label="Tipo de Combustible *"
                option-label="nombre"
                option-value="id_tipo_combustible"
                emit-value
                map-options
                use-input
                @filter="filterCombustibles"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>

            <!-- Sección: Especificaciones Técnicas -->
            <div class="col-12 text-subtitle2 text-primary q-pt-sm">Especificaciones Técnicas</div>
            
            <div class="col-12 col-md-4">
              <q-select
                dense
                outlined
                v-model="formData.tipo_tanque"
                :options="['RECTANGULAR', 'CILINDRICO']"
                label="Tipo de Tanque *"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-select
                dense
                outlined
                v-model="formData.unidad_medida"
                :options="[
                  { label: 'CM', value: 'CM' },
                  { label: 'PULG', value: 'PULGADAS' },
                  { label: 'MM', value: 'MM' }
                ]"
                label="Unidad de Medida *"
                emit-value
                map-options
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                dense
                outlined
                v-model.number="formData.capacidad_maxima"
                type="number"
                label="Capacidad Máxima (L) *"
                suffix="L"
                :rules="[(val) => val > 0 || 'Debe ser mayor a 0']"
              />
            </div>

            <!-- Nivel Actual -->
            <div class="col-12 col-md-4">
              <q-input
                dense
                outlined
                v-model.number="formData.nivel_actual"
                type="number"
                label="Nivel Actual (L) *"
                suffix="L"
                hint="Inventario inicial o actual"
                :rules="[(val) => val >= 0 || 'Debe ser mayor o igual a 0']"
              />
            </div>

            <!-- Dimensiones Dinámicas -->
            <div class="col-12 col-md-3">
              <q-input
                dense
                outlined
                v-model.number="formData.alto"
                type="number"
                label="Alto"
                :suffix="formData.unidad_medida"
              />
            </div>
            <div class="col-12 col-md-3">
              <q-input
                dense
                outlined
                v-model.number="formData.largo"
                type="number"
                label="Largo"
                :suffix="formData.unidad_medida"
              />
            </div>
            
            <div class="col-12 col-md-3" v-if="formData.tipo_tanque === 'RECTANGULAR'">
              <q-input
                dense
                outlined
                v-model.number="formData.ancho"
                type="number"
                label="Ancho"
                :suffix="formData.unidad_medida"
              />
            </div>
            <div class="col-12 col-md-3" v-if="formData.tipo_tanque === 'CILINDRICO'">
              <q-input
                dense
                outlined
                v-model.number="formData.radio"
                type="number"
                label="Radio"
                :suffix="formData.unidad_medida"
              />
            </div>

            <!-- Sección: Alarmas y Estado -->
            <div class="col-12 text-subtitle2 text-primary q-pt-sm">Alarmas y Estado</div>
            
            <div class="col-12 col-md-4">
              <q-input
                dense
                outlined
                v-model.number="formData.nivel_alarma_bajo"
                type="number"
                label="Nivel Alarma Bajo"
                color="orange"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                dense
                outlined
                v-model.number="formData.nivel_alarma_alto"
                type="number"
                label="Nivel Alarma Alto"
                color="negative"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-select
                dense
                outlined
                v-model="formData.estado"
                :options="['ACTIVO', 'INACTIVO', 'MANTENIMIENTO', 'CONTAMINADO']"
                label="Estado"
              />
            </div>

            <!-- Opción de Aforo -->
            <div class="col-12 q-pt-md">
               <q-toggle 
                 v-model="formData.con_aforo" 
                 label="El tanque posee tabla de aforo (Calibración manual)" 
                 color="primary"
                 icon="table_chart"
               />
               <div v-if="formData.con_aforo" class="text-caption text-grey-7 q-ml-lg">
                 * Se utilizará la tabla de aforo cargada para los cálculos de volumen.
               </div>
               <div v-else class="text-caption text-grey-7 q-ml-lg">
                 * El volumen se calculará automáticamente mediante fórmulas geométricas.
               </div>
            </div>

            <!-- SECCIÓN: TABLA DE AFORO -->
            <div v-if="formData.con_aforo" class="col-12">
              <q-separator q-my-md />
              <div class="row items-center justify-between q-mb-sm">
                <div class="text-subtitle2 text-primary">Tabla de Calibración (Aforo)</div>
                <div class="q-gutter-sm">
                  <q-btn flat dense icon="code" color="secondary" label="Carga JSON" @click="openJsonEditor">
                    <q-tooltip>Pegar datos en formato JSON</q-tooltip>
                  </q-btn>
                  <q-btn dense icon="add" color="primary" label="Nueva Fila" @click="addAforoRow" />
                </div>
              </div>

              <div class="aforo-container border-grey q-pa-sm rounded-borders scroll" style="max-height: 300px;">
                <div v-if="!formData.aforo || formData.aforo.length === 0" class="text-center q-pa-md text-grey-6">
                  No hay datos cargados. Use el botón "Nueva Fila" o "Carga JSON".
                </div>
                <div v-else>
                  <div class="row q-col-gutter-sm q-mb-xs text-weight-bold text-grey-8">
                    <div class="col-5">Altura ({{ formData.unidad_medida }})</div>
                    <div class="col-5">Volumen (Litros)</div>
                    <div class="col-2 text-center">Acción</div>
                  </div>

                  <div v-for="(row, index) in formData.aforo" :key="index" class="row q-col-gutter-sm q-mb-sm items-center">
                    <div class="col-5">
                      <q-input 
                        v-model.number="row.altura" 
                        type="number" 
                        dense 
                        outlined 
                        step="0.01" 
                        :suffix="formData.unidad_medida"
                      />
                    </div>
                    <div class="col-5">
                      <q-input v-model.number="row.volumen" type="number" dense outlined step="0.01" />
                    </div>
                    <div class="col-2 text-center">
                      <q-btn flat round dense icon="delete" color="negative" @click="removeAforoRow(index)" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn label="Guardar" type="submit" color="primary" :loading="loading" />
        </q-card-actions>
      </q-form>
    </q-card>

    <!-- DIÁLOGO INTERNO: EDITOR JSON -->
    <q-dialog v-model="jsonEditorVisible">
      <q-card style="width: 500px">
        <q-card-section>
          <div class="text-h6">Carga Masiva de Aforo</div>
          <div class="text-caption">Pegue un arreglo de objetos: [ { "altura": 10, "volumen": 150 }, ... ]</div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="rawJson"
            type="textarea"
            outlined
            rows="10"
            placeholder='[ {"altura": 1, "volumen": 50}, {"altura": 2, "volumen": 100} ]'
            :error="!!jsonError"
            :error-message="jsonError"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Importar" @click="applyJson" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script setup>
import { ref, watch, onMounted, toRefs, nextTick } from "vue";
import api from "../../api";

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
  isEditing: Boolean,
  loading: Boolean
});

const emit = defineEmits(["update:modelValue", "save"]);

const formData = ref({});
const llenaderoOptions = ref([]);
const combustibleOptions = ref([]);

// Gestión de Aforo
const jsonEditorVisible = ref(false);
const rawJson = ref("");
const jsonError = ref("");

// Para filtros locales
let allLlenaderos = [];
let allCombustibles = [];

onMounted(async () => {
    if (props.modelValue) await initializeForm();
});

watch(() => props.modelValue, async (val) => {
    if (val) await initializeForm();
});

async function initializeForm() {
    // 1. Reset
    formData.value = {};
    llenaderoOptions.value = [];
    combustibleOptions.value = [];

    const data = props.initialData ? { ...props.initialData } : {};

    // 2. Inyectar opciones actuales (Eager Loading) con reconstrucción para asegurar nombres
    if (props.isEditing) {
        if (data.Llenadero) {
          llenaderoOptions.value = [{
            id_llenadero: data.id_llenadero,
            nombre_llenadero: data.Llenadero.nombre_llenadero
          }];
        }
        if (data.TipoCombustible) {
          combustibleOptions.value = [{
            id_tipo_combustible: data.id_tipo_combustible,
            nombre: data.TipoCombustible.nombre
          }];
        }
    }

    // 3. Cargar catálogos completos de fondo (sin pisar los iniciales si ya existen)
    await loadCatalogs();

    // 4. Mapeo de valores
    formData.value = {
        codigo: data.codigo || "",
        nombre: data.nombre || "",
        id_llenadero: data.id_llenadero ? Number(data.id_llenadero) : null,
        id_tipo_combustible: data.id_tipo_combustible ? Number(data.id_tipo_combustible) : null,
        tipo_tanque: data.tipo_tanque || "RECTANGULAR",
        capacidad_maxima: data.capacidad_maxima ? Number(data.capacidad_maxima) : 0,
        nivel_actual: data.nivel_actual ? Number(data.nivel_actual) : 0,
        nivel_alarma_bajo: data.nivel_alarma_bajo ? Number(data.nivel_alarma_bajo) : null,
        nivel_alarma_alto: data.nivel_alarma_alto ? Number(data.nivel_alarma_alto) : null,
        unidad_medida: data.unidad_medida || "CM",
        alto: data.alto ? Number(data.alto) : null,
        radio: data.radio ? Number(data.radio) : null,
        largo: data.largo ? Number(data.largo) : null,
        ancho: data.ancho ? Number(data.ancho) : null,
        estado: data.estado || "ACTIVO",
        con_aforo: !!data.con_aforo,
        aforo: Array.isArray(data.aforo) ? [...data.aforo] : [],
        unidad_medida: data.unidad_medida || "CM"
    };
}

async function loadCatalogs() {
    try {
        const [resLlen, resComb] = await Promise.all([
            api.get("/llenaderos/lista"),
            api.get("/tipos-combustible/lista")
        ]);
        
        allLlenaderos = Array.isArray(resLlen.data) ? resLlen.data : (resLlen.data?.data || []);
        allCombustibles = Array.isArray(resComb.data) ? resComb.data : (resComb.data?.data || []);
        
        // Unir opciones iniciales con el catálogo completo para evitar duplicados y mantener selección
        if (props.isEditing) {
          llenaderoOptions.value = mergeOptions(llenaderoOptions.value, allLlenaderos, 'id_llenadero');
          combustibleOptions.value = mergeOptions(combustibleOptions.value, allCombustibles, 'id_tipo_combustible');
        } else {
          llenaderoOptions.value = allLlenaderos;
          combustibleOptions.value = allCombustibles;
        }
    } catch (e) {
        console.error("Error cargando catálogos:", e);
    }
}

/**
 * Utilidad para mezclar la opción seleccionada con la lista completa sin duplicados
 */
function mergeOptions(selectedList, fullList, key) {
  const selected = selectedList[0];
  if (!selected) return fullList;
  const filteredFull = fullList.filter(item => item[key] !== selected[key]);
  return [selected, ...filteredFull];
}

function filterLlenaderos(val, update) {
    update(() => {
        if (val === "") {
            llenaderoOptions.value = allLlenaderos;
        } else {
            const needle = val.toLowerCase();
            llenaderoOptions.value = allLlenaderos.filter(v => v.nombre_llenadero.toLowerCase().indexOf(needle) > -1);
        }
    });
}

function filterCombustibles(val, update) {
    update(() => {
        if (val === "") {
            combustibleOptions.value = allCombustibles;
        } else {
            const needle = val.toLowerCase();
            combustibleOptions.value = allCombustibles.filter(v => v.nombre.toLowerCase().indexOf(needle) > -1);
        }
    });
}

// --- MÉTODOS DE AFORO ---

function addAforoRow() {
  if (!formData.value.aforo) formData.value.aforo = [];
  formData.value.aforo.push({ altura: 0, volumen: 0 });
}

function removeAforoRow(index) {
  formData.value.aforo.splice(index, 1);
}

function openJsonEditor() {
  rawJson.value = JSON.stringify(formData.value.aforo, null, 2);
  jsonError.value = "";
  jsonEditorVisible.value = true;
}

function applyJson() {
  try {
    const parsed = JSON.parse(rawJson.value);
    if (!Array.isArray(parsed)) throw new Error("Debe ser un arreglo [ { ... } ]");
    
    const isValid = parsed.every(i => i.hasOwnProperty('altura') && i.hasOwnProperty('volumen'));
    if (!isValid) throw new Error("Cada objeto debe tener 'altura' y 'volumen'");

    formData.value.aforo = parsed;
    jsonEditorVisible.value = false;
  } catch (e) {
    jsonError.value = e.message;
  }
}

async function onSave() {
    await nextTick();
    const payload = { ...formData.value };
    if (!payload.radio) payload.radio = null;
    if (!payload.ancho) payload.ancho = null;
    emit("save", payload);
}
</script>

<style scoped>
.aforo-container {
  border: 1px solid #ddd;
  background: #f9f9f9;
}
</style>

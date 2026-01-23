<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <q-card style="width: 900px; max-width: 90vw">
      <q-card-section>
        <div class="text-h6">
          {{ isEditing ? "Editar Tanque" : "Nuevo Tanque" }}
        </div>
      </q-card-section>

      <q-form @submit.prevent="onSave">
        <q-card-section class="q-pt-none scroll" style="max-height: 70vh">
          <div class="row q-col-gutter-md">
            <!-- === DATOS GENERALES === -->
            <div class="col-12 text-subtitle2 text-primary">
              Datos Generales
            </div>
            <div class="col-12 col-md-6">
              <q-input
                dense
                v-model="formData.codigo"
                label="Código"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                dense
                v-model="formData.nombre"
                label="Nombre"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>
            <div class="col-12">
              <q-input
                dense
                v-model="formData.ubicacion"
                label="Ubicación"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>

            <!-- COMBUSTIBLE Y JERARQUÍA -->
            <div class="col-12 col-md-4">
              <q-select
                dense
                filled
                v-model="formData.tipo_combustible"
                :options="['GASOIL', 'GASOLINA']"
                label="Combustible"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>

            <!-- NUEVO CAMPO JERARQUÍA -->
            <div class="col-12 col-md-4">
              <q-select
                dense
                filled
                v-model="formData.tipo_jerarquia"
                :options="['PRINCIPAL', 'AUXILIAR']"
                label="Jerarquía"
                :rules="[(val) => !!val || 'Requerido']"
              >
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section>
                      <q-item-label>{{ scope.opt }}</q-item-label>
                      <q-item-label caption v-if="scope.opt === 'PRINCIPAL'"
                        >Tanque madre (Único por combustible)</q-item-label
                      >
                      <q-item-label caption v-if="scope.opt === 'AUXILIAR'"
                        >Tanque de reserva</q-item-label
                      >
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <div class="col-12 col-md-4">
              <q-select
                dense
                filled
                v-model="formData.unidad_medida"
                :options="['CM', 'PULGADAS']"
                label="Unidad Medida"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>

            <!-- TIPO DE TANQUE -->
            <div class="col-12 text-subtitle2 text-primary q-pt-lg">
              Tipo de Tanque
            </div>
            <div class="col-12">
              <q-option-group
                v-model="formData.tipo_tanque"
                :options="[
                  { label: 'Cilíndrico', value: 'CILINDRICO' },
                  { label: 'Rectangular', value: 'RECTANGULAR' },
                ]"
                color="primary"
                inline
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>

            <!-- DIMENSIONES -->
            <div class="col-12 text-subtitle2 text-primary q-pt-lg">
              Dimensiones
            </div>
            <!-- Campos para Tanque Cilíndrico -->
            <template v-if="formData.tipo_tanque === 'CILINDRICO'">
              <div class="col-12 col-md-6">
                <q-input
                  dense
                  v-model.number="formData.radio"
                  label="Radio"
                  type="number"
                  :rules="[
                    (val) =>
                      (formData.tipo_tanque === 'CILINDRICO'
                        ? !!val && val > 0
                        : true) || 'Requerido y > 0',
                  ]"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  dense
                  v-model.number="formData.largo"
                  label="Largo"
                  type="number"
                  :rules="[
                    (val) =>
                      (formData.tipo_tanque === 'CILINDRICO'
                        ? !!val && val > 0
                        : true) || 'Requerido y > 0',
                  ]"
                />
              </div>
            </template>

            <!-- Campos para Tanque Rectangular -->
            <template v-else-if="formData.tipo_tanque === 'RECTANGULAR'">
              <div class="col-12 col-md-4">
                <q-input
                  dense
                  v-model.number="formData.largo"
                  label="Largo"
                  type="number"
                  :rules="[
                    (val) =>
                      (formData.tipo_tanque === 'RECTANGULAR'
                        ? !!val && val > 0
                        : true) || 'Requerido y > 0',
                  ]"
                />
              </div>
              <div class="col-12 col-md-4">
                <q-input
                  dense
                  v-model.number="formData.ancho"
                  label="Ancho"
                  type="number"
                  :rules="[
                    (val) =>
                      (formData.tipo_tanque === 'RECTANGULAR'
                        ? !!val && val > 0
                        : true) || 'Requerido y > 0',
                  ]"
                />
              </div>
              <div class="col-12 col-md-4">
                <q-input
                  dense
                  v-model.number="formData.alto"
                  label="Alto"
                  type="number"
                  :rules="[
                    (val) =>
                      (formData.tipo_tanque === 'RECTANGULAR'
                        ? !!val && val > 0
                        : true) || 'Requerido y > 0',
                  ]"
                />
              </div>
            </template>

            <div class="col-12 text-subtitle2 text-primary q-pt-lg">
              Capacidad y Niveles (Litros)
            </div>
            <div class="col-12 col-md-4">
              <q-input
                dense
                v-model.number="formData.capacidad_maxima"
                label="Capacidad Máx"
                type="number"
                suffix="L"
                :rules="[(val) => val > 0 || 'Mayor a 0']"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                dense
                v-model.number="formData.nivel_alarma"
                label="Alarma Mínima"
                type="number"
                suffix="L"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                dense
                v-model.number="formData.nivel_actual"
                label="Nivel Actual"
                type="number"
                suffix="L"
              />
            </div>

            <div class="col-12" v-if="isEditing">
              <q-select
                dense
                v-model="formData.estado"
                :options="['ACTIVO', 'INACTIVO', 'MANTENIMIENTO']"
                label="Estado"
              />
            </div>

            <!-- === TABLA DE AFORO (IGUAL QUE ANTES) === -->
            <!-- ... (código de tabla de aforo que ya tenías) ... -->
            <div class="col-12">
              <q-separator class="q-my-md" />
              <div class="row items-center justify-between q-mb-sm">
                <div class="text-subtitle2 text-primary">
                  Tabla de Aforo ({{ formData.unidad_medida }} -> Litros)
                </div>
                <div>
                  <q-btn
                    size="sm"
                    color="secondary"
                    icon="code"
                    label="Importar JSON"
                    @click="showJsonImport = true"
                    class="q-mr-sm"
                  />
                  <q-btn
                    size="sm"
                    color="primary"
                    icon="add"
                    label="Agregar Fila"
                    @click="addAforoRow"
                  />
                </div>
              </div>

              <div
                v-if="aforoRows.length === 0"
                class="text-grey text-center q-pa-md bg-grey-2 rounded-borders"
              >
                No hay datos de aforo. Agregue filas o importe un JSON.
              </div>

              <div v-else>
                <div
                  class="row q-col-gutter-sm q-mb-xs text-caption text-grey-7"
                >
                  <div class="col-5">Medida ({{ formData.unidad_medida }})</div>
                  <div class="col-5">Volumen (Litros)</div>
                  <div class="col-2"></div>
                </div>
                <div
                  class="row q-col-gutter-sm q-mb-sm"
                  v-for="(row, index) in aforoRows"
                  :key="index"
                >
                  <div class="col-5">
                    <q-input
                      dense
                      v-model.number="row.medida"
                      type="number"
                      placeholder="0"
                    />
                  </div>
                  <div class="col-5">
                    <q-input
                      dense
                      v-model.number="row.litros"
                      type="number"
                      placeholder="0"
                    />
                  </div>
                  <div class="col-2 flex flex-center">
                    <q-btn
                      flat
                      round
                      dense
                      color="negative"
                      icon="delete"
                      @click="removeAforoRow(index)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>

        <!-- ... (Botones y Diálogo JSON igual) ... -->
        <q-separator />
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn label="Guardar" type="submit" color="primary" />
        </q-card-actions>
      </q-form>
    </q-card>

    <!-- DIÁLOGO JSON (Igual que antes) -->
    <q-dialog v-model="showJsonImport">
      <!-- ... -->
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Importar Aforo desde JSON</div>
          <div class="text-caption text-grey">
            Formato: { "10": 100, "20": 200 }
          </div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="jsonInput"
            type="textarea"
            outlined
            rows="10"
            label="Pegue el JSON aquí"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            label="Procesar e Importar"
            color="primary"
            @click="processJsonImport"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script setup>
// ... (Imports y lógica igual que antes) ...
import { ref, watch, nextTick } from "vue";
import { useQuasar } from "quasar";

const $q = useQuasar();
const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
  isEditing: Boolean,
});

const emit = defineEmits(["update:modelValue", "save"]);

const formData = ref({});
const aforoRows = ref([]);
const showJsonImport = ref(false);
const jsonInput = ref("");

watch(
  () => props.modelValue,
  (isNowOpen) => {
    if (isNowOpen) {
      formData.value = {
        codigo: props.initialData?.codigo || "",
        nombre: props.initialData?.nombre || "",
        ubicacion: props.initialData?.ubicacion || "",
        tipo_combustible: props.initialData?.tipo_combustible || "GASOLINA",

        // NUEVO CAMPO
        tipo_jerarquia: props.initialData?.tipo_jerarquia || "AUXILIAR",

        unidad_medida: props.initialData?.unidad_medida || "CM",
        radio: props.initialData?.radio
          ? Number(props.initialData.radio)
          : null,
        largo: props.initialData?.largo
          ? Number(props.initialData.largo)
          : null,
        alto: props.initialData?.alto // Renombrado de longitud
          ? Number(props.initialData.alto)
          : null,
        ancho: props.initialData?.ancho // Nuevo campo
          ? Number(props.initialData.ancho)
          : null,
        tipo_tanque: props.initialData?.tipo_tanque || "CILINDRICO", // Nuevo campo, por defecto CILINDRICO
        capacidad_maxima: props.initialData?.capacidad_maxima
          ? Number(props.initialData.capacidad_maxima)
          : null,
        nivel_alarma: props.initialData?.nivel_alarma
          ? Number(props.initialData.nivel_alarma)
          : null,
        nivel_actual: props.initialData?.nivel_actual
          ? Number(props.initialData.nivel_actual)
          : 0,
        estado: props.initialData?.estado || "ACTIVO",
      };

      // ... (Carga de aforo igual) ...
      aforoRows.value = [];
      if (props.initialData?.tabla_aforo) {
        let aforoObj = props.initialData.tabla_aforo;
        if (typeof aforoObj === "string") {
          try {
            aforoObj = JSON.parse(aforoObj);
          } catch (e) {
            aforoObj = {};
          }
        }
        if (typeof aforoObj === "object" && aforoObj !== null) {
          Object.keys(aforoObj).forEach((key) => {
            const medidaVal = Number(key);
            const litrosVal = Number(aforoObj[key]);
            if (!isNaN(medidaVal)) {
              aforoRows.value.push({
                medida: medidaVal,
                litros: !isNaN(litrosVal) ? litrosVal : 0,
              });
            }
          });
          aforoRows.value.sort((a, b) => a.medida - b.medida);
        }
      }
    }
  }
);

// ... (Métodos de aforo y guardado iguales) ...
function addAforoRow() {
  aforoRows.value.push({ medida: null, litros: null });
}

function removeAforoRow(index) {
  aforoRows.value.splice(index, 1);
}

function processJsonImport() {
  try {
    const parsed = JSON.parse(jsonInput.value);
    if (typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error(
        'El formato debe ser un objeto JSON { "medida": litros }'
      );
    }
    aforoRows.value = [];
    Object.keys(parsed).forEach((key) => {
      const medidaVal = Number(key);
      const litrosVal = Number(parsed[key]);
      if (!isNaN(medidaVal) && !isNaN(litrosVal)) {
        aforoRows.value.push({ medida: medidaVal, litros: litrosVal });
      }
    });
    aforoRows.value.sort((a, b) => a.medida - b.medida);
    $q.notify({ type: "positive", message: "Aforo importado correctamente." });
    showJsonImport.value = false;
    jsonInput.value = "";
  } catch (e) {
    $q.notify({
      type: "negative",
      message: "Error al leer JSON: " + e.message,
    });
  }
}

async function onSave() {
  await nextTick();
  const aforoJSON = {};
  aforoRows.value.forEach((row) => {
    if (row.medida !== null && row.medida !== "" && row.litros !== null) {
      aforoJSON[row.medida] = row.litros;
    }
  });
  formData.value.tabla_aforo =
    Object.keys(aforoJSON).length > 0 ? aforoJSON : null;
  emit("save", formData.value);
}
</script>

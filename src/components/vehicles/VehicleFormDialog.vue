<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <q-card style="width: 700px; max-width: 80vw">
      <q-card-section>
        <div class="text-h6">
          {{ isEditing ? "Editar Registro" : "Nuevo Registro" }}
        </div>
      </q-card-section>

      <q-form @submit.prevent="onSave">
        <q-card-section class="q-pt-none">
          <!-- === TIPO DE ACTIVO (TOGGLE) === -->
          <div class="row q-mb-md bg-grey-1 q-pa-sm rounded-borders">
            <div class="col-12 flex items-center">
              <q-icon
                :name="formData.es_generador ? 'bolt' : 'directions_car'"
                size="sm"
                class="q-mr-sm text-grey-8"
              />
              <span class="text-subtitle2 q-mr-md">Tipo de Activo:</span>
              <q-toggle
                v-model="formData.es_generador"
                label="Es Generador / Planta Eléctrica"
                color="orange"
                left-label
              />
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <!-- Placa / Código Dinámico -->
            <div class="col-12 col-md-6">
              <q-input
                dense
                v-model="formData.placa"
                :label="
                  formData.es_generador
                    ? 'Código de Activo (Ej: GEN-01)'
                    : 'Placa Vehículo'
                "
                :rules="[(val) => !!val || 'Requerido']"
                :hint="
                  formData.es_generador
                    ? 'Identificador único'
                    : 'Formato: AAA-0000'
                "
              />
            </div>

            <div class="col-12 col-md-6">
              <q-input
                dense
                v-model="formData.anio"
                label="Año"
                type="number"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-input
                dense
                v-model="formData.color"
                label="Color"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-select
                dense
                filled
                v-model="formData.id_gerencia"
                label="Gerencia Asignada (Opcional)"
                :options="managements"
                option-value="id_gerencia"
                option-label="nombre"
                emit-value
                map-options
                clearable
              />
            </div>

            <div class="col-12 text-subtitle2 text-primary q-pt-lg">
              Datos Técnicos
            </div>

            <div class="col-12 col-md-6">
              <q-select
                dense
                filled
                use-input
                v-model="formData.id_marca"
                label="Marca"
                :options="filteredBrandOptions"
                @filter="filterBrandFn"
                option-value="id_marca"
                option-label="nombre"
                emit-value
                map-options
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-select
                dense
                filled
                v-model="formData.id_modelo"
                label="Modelo"
                :options="models"
                option-value="id_modelo"
                option-label="nombre"
                emit-value
                map-options
                :disable="!formData.id_marca"
                :loading="loadingModels"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-select
                dense
                filled
                v-model="formData.tipoCombustible"
                label="Tipo de Combustible"
                :options="['GASOIL', 'GASOLINA']"
                emit-value
                map-options
                :rules="[(val) => !!val || 'Requerido']"
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
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn label="Guardar" type="submit" color="primary" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, toRefs, nextTick } from "vue";

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
  isEditing: Boolean,
  brands: { type: Array, default: () => [] },
  models: { type: Array, default: () => [] },
  managements: { type: Array, default: () => [] },
  loadingModels: Boolean,
});

const emit = defineEmits(["update:modelValue", "save", "brand-changed"]);

const formData = ref({});
const { brands, models } = toRefs(props);
const filteredBrandOptions = ref([]);

// --- INICIALIZACIÓN ---
watch(
  () => props.modelValue,
  (isNowOpen) => {
    if (isNowOpen) {
      formData.value = {
        placa: props.initialData?.placa || "",
        anio: props.initialData?.anio || null,
        color: props.initialData?.color || "",
        id_marca: props.initialData?.id_marca || null,
        id_modelo: props.initialData?.id_modelo || null,
        id_gerencia: props.initialData?.id_gerencia || null,
        // NUEVO CAMPO
        es_generador: props.initialData?.es_generador || false,
        tipoCombustible: props.initialData?.tipoCombustible || "GASOIL",
        estado: props.initialData?.estado || "ACTIVO",
      };
      filteredBrandOptions.value = brands.value;

      if (props.isEditing && formData.value.id_marca) {
        emit("brand-changed", formData.value.id_marca);
      }
    }
  }
);

// --- LÓGICA DE SELECTS EN CASCADA ---
watch(
  () => formData.value.id_marca,
  (newBrandId, oldBrandId) => {
    if (newBrandId !== oldBrandId) {
      formData.value.id_modelo = null;
      emit("brand-changed", newBrandId);
    }
  }
);

// --- REFRESCAR MODELO EN EDICIÓN ---
watch(models, (newModels) => {
  if (newModels.length > 0 && props.initialData?.id_modelo) {
    if (newModels.some((m) => m.id_modelo === props.initialData.id_modelo)) {
      formData.value.id_modelo = props.initialData.id_modelo;
    }
  }
});

// --- FILTRO DE MARCAS ---
function filterBrandFn(val, update) {
  if (val === "") {
    update(() => {
      filteredBrandOptions.value = brands.value;
    });
    return;
  }
  update(() => {
    const needle = val.toLowerCase();
    if (Array.isArray(brands.value)) {
      filteredBrandOptions.value = brands.value.filter(
        (v) => v && v.nombre && v.nombre.toLowerCase().indexOf(needle) > -1
      );
    }
  });
}

async function onSave() {
  await nextTick();
  emit("save", formData.value);
}
</script>

<!-- src/components/vehicles/VehicleFormDialog.vue -->
<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <q-card style="width: 800px; max-width: 90vw">
      <q-card-section>
        <div class="text-h6">
          {{ isEditing ? "Editar Registro" : "Nuevo Registro" }}
        </div>
      </q-card-section>

      <q-form @submit.prevent="handleSave">
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

          <!-- === SIN PLACA (CHECKBOX) === -->
          <div class="row q-mb-md bg-grey-1 q-pa-sm rounded-borders">
            <div class="col-12 flex items-center">
              <q-checkbox
                v-model="formData.es_sin_placa"
                label="Sin Placa (Generar Correlativo)"
                color="primary"
                left-label
                @update:model-value="onSinPlacaChange"
              />
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <!-- Sección: Identificación -->
            <div class="col-12 text-subtitle2 text-primary">Identificación</div>

            <div class="col-12 col-md-4">
              <q-input
                dense
                outlined
                v-model="formData.placa"
                :label="formData.es_generador ? 'Código de Activo' : 'Placa'"
                :rules="[(val) => !!val || 'Requerido']"
                :loading="loadingCorrelativo"
              />
            </div>

            <!-- Sección: Datos Técnicos -->
            <div class="col-12 text-subtitle2 text-primary q-pt-sm">
              Datos Técnicos
            </div>

            <div class="col-12 col-md-4">
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
            <div class="col-12 col-md-4">
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
            <div class="col-12 col-md-4">
              <q-select
                dense
                filled
                v-model="formData.id_tipo_combustible"
                label="Tipo de Combustible"
                :options="tipoCombustibleStore.rows"
                option-value="id_tipo_combustible"
                option-label="nombre"
                emit-value
                map-options
                :loading="tipoCombustibleStore.loading"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>

            <!-- Sección: Ubicación Jerárquica -->
            <div class="col-12 text-subtitle2 text-primary q-pt-sm">
              Ubicación Jerárquica
            </div>

            <div class="col-12">
              <OrganizationalHierarchy
                v-if="!isInitializing"
                v-model:categoryId="formData.id_categoria"
                v-model:dependencyId="formData.id_dependencia"
                v-model:subdependencyId="formData.id_subdependencia"
                :initial-category="mappedCategory"
                :initial-dependency="mappedDependency"
                :initial-subdependency="mappedSubdependency"
              />
            </div>

            <div class="col-12" v-if="isEditing">
              <q-select
                dense
                outlined
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
import { useVehicleForm } from "./composables/useVehicleForm.js";
import OrganizationalHierarchy from "../OrganizationalHierarchy.vue";

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
  isEditing: Boolean,
  brands: { type: Array, default: () => [] },
  models: { type: Array, default: () => [] },
  loadingModels: Boolean,
});

const emit = defineEmits(["update:modelValue", "save", "brand-changed"]);

// Delegamos la lógica al composable
const {
  formData,
  isInitializing,
  filteredBrandOptions,
  tipoCombustibleStore,
  loadingCorrelativo,
  mappedCategory,
  mappedDependency,
  mappedSubdependency,
  filterBrandFn,
  onSinPlacaChange,
  handleSave,
} = useVehicleForm(props, emit);
</script>

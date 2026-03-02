<!-- src/components/cupos/CupoFormDialog.vue -->
<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <q-card style="width: 600px; max-width: 80vw">
      <!-- HEADER -->
      <q-card-section>
        <div class="text-h6">
          {{
            isEditing
              ? "Editar Configuración de Cupo"
              : "Nueva Configuración de Cupo"
          }}
        </div>
      </q-card-section>

      <!-- FORMULARIO -->
      <q-form @submit.prevent="handleSave">
        <q-card-section class="q-gutter-md">
          <!-- Jerarquía Organizacional (Categoría > Dependencia > Subdependencia) -->
          <OrganizationalHierarchy
            v-if="!isInitializing"
            v-model:categoryId="formData.id_categoria"
            v-model:dependencyId="formData.id_dependencia"
            v-model:subdependencyId="formData.id_subdependencia"
            :initial-category="mappedCategory"
            :initial-dependency="mappedDependency"
            :initial-subdependency="mappedSubdependency"
          />

          <!-- Tipo de Combustible -->
          <q-select
            dense
            v-model="formData.id_tipo_combustible"
            :options="tipoCombustibleOptions"
            label="Tipo de Combustible"
            option-label="nombre"
            option-value="id_tipo_combustible"
            emit-value
            map-options
            :loading="loadingTipos"
            :rules="validationRules.id_tipo_combustible"
            hint="Selecciona el tipo de combustible para este cupo"
          />

          <!-- Cantidad Mensual -->
          <q-input
            dense
            v-model.number="formData.cantidad_mensual"
            type="number"
            label="Asignación Mensual (Litros)"
            suffix="L"
            :rules="validationRules.cantidad_mensual"
            counter
            hint="Cantidad de litros asignados mensualmente"
          />

          <!-- Toggle Activo (solo en modo edición) -->
          <q-toggle
            v-if="isEditing"
            v-model="formData.activo"
            label="Cupo Activo"
            color="positive"
          />
        </q-card-section>

        <!-- ACCIONES -->
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            flat
            label="Guardar"
            type="submit"
            color="primary"
            :loading="loading"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
// ============================================
// IMPORTS
// ============================================
import { onMounted, computed, onUnmounted } from "vue";
import { useQuasar } from "quasar";
import { useTipoCombustibleStore } from "../../stores/tipoCombustibleStore";
import { useCupoStore } from "../../stores/cupoStore";
import socket from "../../services/socket.js";
import OrganizationalHierarchy from "../OrganizationalHierarchy.vue";
import { useCupoForm } from "./composables/useCupoForm.js";

// ============================================
// PROPS & EMITS
// ============================================
const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
  isEditing: Boolean,
  loading: Boolean,
});

const emit = defineEmits(["update:modelValue", "dataUpdated"]);

// ============================================
// COMPOSABLES & STORES
// ============================================
const $q = useQuasar();
const tipoCombustibleStore = useTipoCombustibleStore();
const cupoStore = useCupoStore();

// Composable del formulario (maneja estado, validaciones, y guardado)
const { formData, isInitializing, validationRules, handleSave } = useCupoForm(
  props,
  emit,
  cupoStore
);

// ============================================
// DATOS PARA SELECTS
// ============================================

// Opciones de tipos de combustible (cargadas del store)
const tipoCombustibleOptions = computed(() => tipoCombustibleStore.rows);

// Loading state del store de tipos de combustible
const loadingTipos = computed(() => tipoCombustibleStore.loading);

// ============================================
// MAPEO DE DATOS INICIALES
// ============================================
// Necesario para que OrganizationalHierarchy reciba objetos con la estructura correcta

const mappedCategory = computed(() => {
  if (!props.initialData?.Categoria) return null;
  return {
    id_categoria: props.initialData.id_categoria,
    nombre: props.initialData.Categoria.nombre,
  };
});

const mappedDependency = computed(() => {
  if (!props.initialData?.Dependencia) return null;
  return {
    id_dependencia: props.initialData.id_dependencia,
    nombre_dependencia: props.initialData.Dependencia.nombre_dependencia,
  };
});

const mappedSubdependency = computed(() => {
  if (!props.initialData?.Subdependencia) return null;
  return {
    id_subdependencia: props.initialData.id_subdependencia,
    nombre: props.initialData.Subdependencia.nombre,
  };
});

// ============================================
// LIFECYCLE HOOKS
// ============================================

/**
 * Al montar el componente:
 * 1. Cargar tipos de combustible si no están cargados
 * 2. Configurar listeners de Socket.IO para sincronización en tiempo real
 */
onMounted(async () => {
  // Cargar tipos de combustible si la lista está vacía
  if (tipoCombustibleStore.rows.length === 0) {
    await tipoCombustibleStore.fetchTiposCombustible();
  }

  // Listener para cupos base creados
  socket.on("cupo:creado", (data) => {
    emit("dataUpdated", data);
  });

  // Listener para cupos base actualizados
  // Incluye notificación de edición concurrente
  socket.on("cupo:actualizado", (data) => {
    // Si estamos editando y otro usuario modifica el mismo cupo, notificar
    if (
      props.isEditing &&
      props.initialData?.id_cupo_base === data.id_cupo_base
    ) {
      $q.notify({
        type: "warning",
        message: "⚠️ Esta configuración de cupo fue actualizada por otro usuario",
        icon: "warning",
        position: "top",
        timeout: 4000,
        actions: [
          {
            label: "Recargar",
            color: "white",
            handler: () => {
              emit("dataUpdated", data);
            },
          },
        ],
      });
    }
    emit("dataUpdated", data);
  });
});

/**
 * Al desmontar el componente:
 * Limpiar listeners de Socket.IO para evitar memory leaks
 */
onUnmounted(() => {
  socket.off("cupo:creado");
  socket.off("cupo:actualizado");
});
</script>


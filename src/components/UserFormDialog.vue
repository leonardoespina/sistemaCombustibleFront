<!-- src/components/UserFormDialog.vue -->
<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">
          {{ isEditing ? "Editar Usuario" : "Nuevo Usuario" }}
        </div>
      </q-card-section>

      <q-form @submit.prevent="onSave">
        <q-card-section class="q-gutter-md">
          <q-input
            dense
            v-model="formData.nombre"
            label="Nombre"
            autofocus
            :rules="[(val) => !!val || 'Campo requerido']"
          />
          <q-input
            dense
            v-model="formData.apellido"
            label="Apellido"
            :rules="[(val) => !!val || 'Campo requerido']"
          />
          <q-input
            dense
            v-model="formData.cedula"
            label="Cédula"
            :rules="[(val) => !!val || 'Campo requerido']"
          />
          <q-input
            dense
            v-model="formData.password"
            :label="isEditing ? 'Nueva Contraseña (Opcional)' : 'Contraseña'"
            type="password"
            :rules="isEditing ? [] : [(val) => !!val || 'Campo requerido']"
          />
          <q-select
            dense
            v-model="formData.tipo_usuario"
            :options="[
              'ADMIN',
              'GERENTE',
              'JEFE DIVISION',
              'SUPERVISOR',
              'COORDINADOR',
              'INSPECTOR',
              'ALMACENISTA',
            ]"
            label="Tipo de Usuario"
            :rules="[(val) => !!val || 'Campo requerido']"
          />
          <q-select
            dense
            v-model="formData.estado"
            :options="['ACTIVO', 'INACTIVO']"
            label="Estado"
            :rules="[(val) => !!val || 'Campo requerido']"
          />

          <q-separator />
          <OrganizationalHierarchy
            v-model:categoryId="formData.id_categoria"
            v-model:dependencyId="formData.id_dependencia"
            v-model:subdependencyId="formData.id_subdependencia"
            :initial-category="initialData?.Categoria"
            :initial-dependency="initialData?.Dependencia"
            :initial-subdependency="initialData?.Subdependencia"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn flat label="Guardar" type="submit" color="primary" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from "vue";
import socket from "../services/socket.js";

import OrganizationalHierarchy from "./OrganizationalHierarchy.vue";

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
  isEditing: Boolean,
});

const emit = defineEmits(["update:modelValue", "save", "dataUpdated"]);

const formData = ref({});

// Flag para proteger la inicialización
const isInitializing = ref(false);

// Listeners de Socket.io
onMounted(async () => {
  socket.on("usuarios:creado", (data) => {
    emit("dataUpdated", data);
  });

  socket.on("usuarios:actualizado", (data) => {
    emit("dataUpdated", data);
  });

  if (props.modelValue) {
    await initializeForm();
  }
});

onUnmounted(() => {
  socket.off("usuarios:creado");
  socket.off("usuarios:actualizado");
});

// Watch para cuando se abre el diálogo (por si acaso, aunque la key forzará remount)
watch(
  () => props.modelValue,
  async (val) => {
    if (val) await initializeForm();
  },
);

async function initializeForm() {
  isInitializing.value = true;

  console.log("Iniciando formulario de usuario...", props.initialData);

  // 1. Limpiar estado local
  formData.value = {}; // Reset total

  const data = props.initialData ? { ...props.initialData } : {};

  // 2. Mapeo de datos al formulario
  formData.value = {
    nombre: data.nombre || "",
    apellido: data.apellido || "",
    cedula: data.cedula || "",
    password: "",
    tipo_usuario: data.tipo_usuario || "INSPECTOR",
    estado: data.estado || "ACTIVO",
    id_categoria: data.id_categoria || null,
    id_dependencia: data.id_dependencia || null,
    id_subdependencia: data.id_subdependencia || null,
  };

  await nextTick();
  isInitializing.value = false;
  console.log("Formulario inicializado. isInitializing released.");
}

function onSave() {
  // Asegurar que subdependencia sea null si no está seleccionada
  const payload = { ...formData.value };
  if (!payload.id_subdependencia) payload.id_subdependencia = null;

  emit("save", payload);
}
</script>

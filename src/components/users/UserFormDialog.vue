<!-- src/components/users/UserFormDialog.vue -->
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

      <q-form @submit.prevent="handleSave">
        <q-card-section class="q-gutter-md">
          <q-input
            dense
            v-model="formData.nombre"
            label="Nombre"
            autofocus
            :rules="validationRules.nombre"
            counter
            maxlength="50"
            hint="Solo letras y espacios"
          />
          <q-input
            dense
            v-model="formData.apellido"
            label="Apellido"
            :rules="validationRules.apellido"
            counter
            maxlength="50"
            hint="Solo letras y espacios"
          />
          <q-input
            dense
            v-model="formData.cedula"
            label="Cédula"
            :rules="validationRules.cedula"
            hint="Ej: V-12345678, 12345678"
            @update:model-value="(val) => (formData.cedula = val?.toUpperCase())"
          />
          <q-input
            dense
            v-model="formData.password"
            :label="isEditing ? 'Nueva Contraseña (Opcional)' : 'Contraseña'"
            type="password"
            :rules="isEditing ? validationRules.passwordEditar : validationRules.passwordCrear"
            counter
            maxlength="50"
            :hint="isEditing ? 'Dejar vacío para mantener la actual' : 'Mínimo 6 caracteres'"
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
            :rules="validationRules.tipo_usuario"
          />
          <q-select
            dense
            v-model="formData.estado"
            :options="['ACTIVO', 'INACTIVO']"
            label="Estado"
            :rules="validationRules.estado"
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
import { onMounted, onUnmounted } from "vue";
import { useQuasar } from "quasar";
import socket from "../../services/socket.js";
import OrganizationalHierarchy from "../OrganizationalHierarchy.vue";
import { useUserForm } from "./composables/useUserForm.js";

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
  isEditing: Boolean,
});

const emit = defineEmits(["update:modelValue", "save", "dataUpdated"]);
const $q = useQuasar();

// Composable del formulario
const {
  formData,
  isInitializing,
  validationRules,
  handleSave,
} = useUserForm(props, emit);

// Listeners de Socket.io para sincronización en tiempo real
onMounted(() => {
  socket.on("usuarios:creado", (data) => {
    emit("dataUpdated", data);
  });

  socket.on("usuarios:actualizado", (data) => {
    // Notificación de edición concurrente
    if (props.isEditing && props.initialData?.id_usuario === data.id_usuario) {
      $q.notify({
        type: "warning",
        message: "⚠️ Este usuario fue actualizado por otro usuario",
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

onUnmounted(() => {
  socket.off("usuarios:creado");
  socket.off("usuarios:actualizado");
});
</script>

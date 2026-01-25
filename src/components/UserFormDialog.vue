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
          <div class="text-subtitle2 q-mb-xs">Ubicación Organizacional</div>

          <q-select
            dense
            v-model="formData.id_categoria"
            :options="categoriaOptions"
            label="Categoría"
            use-input
            input-debounce="300"
            @filter="filterCategoria"
            option-label="nombre"
            option-value="id_categoria"
            emit-value
            map-options
            :rules="[(val) => !!val || 'Campo requerido']"
          />

          <q-select
            dense
            v-model="formData.id_dependencia"
            :options="dependenciaOptions"
            label="Dependencia"
            :disable="!formData.id_categoria"
            use-input
            input-debounce="300"
            @filter="filterDependencia"
            option-label="nombre_dependencia"
            option-value="id_dependencia"
            emit-value
            map-options
            :rules="[(val) => !!val || 'Campo requerido']"
          />

          <q-select
            dense
            v-model="formData.id_subdependencia"
            :options="subdependenciaOptions"
            label="Subdependencia"
            :disable="!formData.id_dependencia"
            use-input
            input-debounce="300"
            @filter="filterSubdependencia"
            option-label="nombre"
            option-value="id_subdependencia"
            emit-value
            map-options
            clearable
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
import api from "../api";

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
  isEditing: Boolean,
});

const emit = defineEmits(["update:modelValue", "save", "dataUpdated"]);

const formData = ref({});
const categoriaOptions = ref([]);
const dependenciaOptions = ref([]);
const subdependenciaOptions = ref([]);

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
  }
);

async function initializeForm() {
  isInitializing.value = true;
  
  console.log("Iniciando formulario de usuario...", props.initialData);

  // 1. Limpiar estado local
  categoriaOptions.value = [];
  dependenciaOptions.value = [];
  subdependenciaOptions.value = [];
  formData.value = {}; // Reset total

  const data = props.initialData ? { ...props.initialData } : {};

  // 2. Inyección Proactiva de Opciones (Eager Loading)
  if (props.isEditing) {
    if (data.Categoria) {
        console.log("Inyectando categoría:", data.Categoria);
        categoriaOptions.value = [data.Categoria];
    }
    if (data.Dependencia) {
        console.log("Inyectando dependencia:", data.Dependencia);
        dependenciaOptions.value = [data.Dependencia];
    }
    if (data.Subdependencia) {
        console.log("Inyectando subdependencia:", data.Subdependencia);
        subdependenciaOptions.value = [data.Subdependencia];
    }
  } else {
    // Si es nuevo, cargamos las categorías iniciales
    await filterCategoria("", (opts) => opts());
  }

  // 3. Mapeo de datos al formulario
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

// Watchers para cascada (Protegidos)
watch(
  () => formData.value.id_categoria,
  (newVal, oldVal) => {
    if (isInitializing.value) return;
    if (newVal !== oldVal) {
      if (oldVal !== undefined && oldVal !== null) {
        console.log("Cambio manual de categoría detected. Limpiando hijos.");
        formData.value.id_dependencia = null;
        formData.value.id_subdependencia = null;
        dependenciaOptions.value = [];
        subdependenciaOptions.value = [];
      }
    }
  },
);

watch(
  () => formData.value.id_dependencia,
  (newVal, oldVal) => {
    if (isInitializing.value) return;
    if (newVal !== oldVal) {
       if (oldVal !== undefined && oldVal !== null) {
        console.log("Cambio manual de dependencia detected. Limpiando hijos.");
        formData.value.id_subdependencia = null;
        subdependenciaOptions.value = [];
       }
    }
  },
);

// Filter functions
const filterCategoria = async (val, update) => {
  update(async () => {
    try {
      const { data } = await api.get("/categorias/jerarquia", {
        params: { search: val },
      });
      categoriaOptions.value = data.data;
    } catch (error) {
      console.error("Error cargando categorías:", error);
    }
  });
};

const filterDependencia = async (val, update) => {
  if (!formData.value.id_categoria) {
    update(() => {
      dependenciaOptions.value = [];
    });
    return;
  }
  update(async () => {
    try {
      const { data } = await api.get("/categorias/jerarquia", {
        params: {
          type: "categoria",
          parentId: formData.value.id_categoria,
          search: val,
        },
      });
      dependenciaOptions.value = data.data;
    } catch (error) {
      console.error("Error cargando dependencias:", error);
    }
  });
};

const filterSubdependencia = async (val, update) => {
  if (!formData.value.id_dependencia) {
    update(() => {
      subdependenciaOptions.value = [];
    });
    return;
  }
  update(async () => {
    try {
      const { data } = await api.get("/categorias/jerarquia", {
        params: {
          type: "dependencia",
          parentId: formData.value.id_dependencia,
          search: val,
        },
      });
      subdependenciaOptions.value = data.data;
    } catch (error) {
      console.error("Error cargando subdependencias:", error);
    }
  });
};

function onSave() {
  // Asegurar que subdependencia sea null si no está seleccionada
  const payload = { ...formData.value };
  if (!payload.id_subdependencia) payload.id_subdependencia = null;
  
  emit("save", payload);
}
</script>

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
            :disable="
              !formData.id_dependencia || subdependenciaOptions.length === 0
            "
            use-input
            input-debounce="300"
            @filter="filterSubdependencia"
            option-label="nombre"
            option-value="id_subdependencia"
            emit-value
            map-options
            :rules="[
              (val) =>
                subdependenciaOptions.length === 0 ||
                !!val ||
                'Campo requerido cuando existen subdependencias',
            ]"
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
import { ref, watch, onMounted, onUnmounted } from "vue";
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

// Listeners de Socket.io
onMounted(() => {
  socket.on("usuarios:creado", (data) => {
    emit("dataUpdated", data);
  });

  socket.on("usuarios:actualizado", (data) => {
    emit("dataUpdated", data);
  });
});

onUnmounted(() => {
  socket.off("usuarios:creado");
  socket.off("usuarios:actualizado");
});

// Cuando el diálogo se abre, poblamos el formulario
watch(
  () => props.modelValue,
  async (isNowOpen) => {
    if (isNowOpen) {
      formData.value = { ...props.initialData };
      if (!props.isEditing) {
        // Valores por defecto para un nuevo usuario
        formData.value.tipo_usuario = "INSPECTOR";
        formData.value.estado = "ACTIVO";
        categoriaOptions.value = [];
        dependenciaOptions.value = [];
        subdependenciaOptions.value = [];
      } else {
        // Precargar categoría actual para que el select muestre el nombre
        try {
          const { data } = await api.get("/categorias/jerarquia", {
            params: { search: "" }, // Cargar iniciales
          });
          categoriaOptions.value = data.data;
        } catch (e) {
          console.error(e);
        }

        // Si estamos editando, cargar las opciones de las dependencias y subdependencias
        if (formData.value.id_categoria) {
          try {
            const { data } = await api.get("/categorias/jerarquia", {
              params: {
                type: "categoria",
                parentId: formData.value.id_categoria,
              },
            });
            dependenciaOptions.value = data.data;
          } catch (e) {
            console.error(e);
          }
        }
        if (formData.value.id_dependencia) {
          try {
            const { data } = await api.get("/categorias/jerarquia", {
              params: {
                type: "dependencia",
                parentId: formData.value.id_dependencia,
              },
            });
            subdependenciaOptions.value = data.data;
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
  },
);

// Watchers para cascada
watch(
  () => formData.value.id_categoria,
  async (newVal, oldVal) => {
    // Solo limpiar si el cambio es manual (el usuario cambió la categoría)
    // No limpiar si se está poblando el formulario al abrir el diálogo de edición
    if (oldVal !== undefined && props.modelValue) {
      formData.value.id_dependencia = null;
      formData.value.id_subdependencia = null;
    }
    dependenciaOptions.value = [];
    subdependenciaOptions.value = [];
    if (newVal) {
      try {
        const { data } = await api.get("/categorias/jerarquia", {
          params: { type: "categoria", parentId: newVal },
        });
        dependenciaOptions.value = data.data;
      } catch (error) {
        console.error("Error precargando dependencias:", error);
      }
    }
  },
);

watch(
  () => formData.value.id_dependencia,
  async (newVal, oldVal) => {
    if (oldVal !== undefined && props.modelValue) {
      formData.value.id_subdependencia = null;
    }
    subdependenciaOptions.value = [];
    if (newVal) {
      try {
        const { data } = await api.get("/categorias/jerarquia", {
          params: { type: "dependencia", parentId: newVal },
        });
        subdependenciaOptions.value = data.data;
      } catch (error) {
        console.error("Error precargando subdependencias:", error);
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
  emit("save", formData.value);
}
</script>

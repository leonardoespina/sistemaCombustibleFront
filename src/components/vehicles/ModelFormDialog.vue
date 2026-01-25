<!-- src/components/vehicles/ModelFormDialog.vue -->
<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">
          {{ isEditing ? "Editar Modelo" : "Nuevo Modelo" }}
        </div>
      </q-card-section>

      <q-form @submit.prevent="onSave">
        <q-card-section class="q-gutter-md">
          <!-- === SELECT DE MARCA CON LÓGICA DE FILTRADO === -->
          <q-select
            dense
            filled
            v-model="formData.id_marca"
            use-input
            label="Marca del Vehículo"
            :options="filteredBrandOptions"
            @filter="filterBrandFn"
            :rules="[(val) => !!val || 'Debe seleccionar una marca']"
            option-value="id_marca"
            option-label="nombre"
            emit-value
            map-options
          >
            <template v-slot:no-option>
              <q-item
                ><q-item-section class="text-grey"
                  >No hay resultados</q-item-section
                ></q-item
              >
            </template>
          </q-select>

          <q-input
            dense
            v-model="formData.nombre"
            label="Nombre del Modelo"
            :rules="[(val) => !!val || 'El nombre es requerido']"
          />

          <q-select
            v-if="isEditing"
            dense
            v-model="formData.estado"
            :options="['ACTIVO', 'INACTIVO']"
            label="Estado"
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
import { ref, watch, toRefs, onMounted, onUnmounted } from "vue";
import socket from "../../services/socket.js";

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
  isEditing: Boolean,
  brands: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue", "save", "dataUpdated"]);
const { brands } = toRefs(props);
const formData = ref({});
const filteredBrandOptions = ref([]); // Array local para las opciones filtradas

// Listeners de Socket.io
onMounted(() => {
  socket.on("modelo:creado", (data) => {
    emit("dataUpdated", data);
  });

  socket.on("modelo:actualizado", (data) => {
    emit("dataUpdated", data);
  });
});

onUnmounted(() => {
  socket.off("modelo:creado");
  socket.off("modelo:actualizado");
});

// --- Lógica de inicialización ---
watch(
  () => props.modelValue,
  (isNowOpen) => {
    if (isNowOpen) {
      formData.value = {
        nombre: props.initialData?.nombre || "",
        id_marca: props.initialData?.id_marca || null,
        estado: props.initialData?.estado || "ACTIVO",
      };
      // Al abrir, las opciones filtradas son todas las marcas
      filteredBrandOptions.value = brands.value;
    }
  }
);

// --- ¡NUEVA FUNCIÓN DE FILTRADO PARA MARCAS! ---
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

function onSave() {
  emit("save", formData.value);
}
</script>

<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <q-card style="width: 500px; max-width: 80vw">
      <q-card-section>
        <div class="text-h6">
          {{ isEditing ? "Editar Subdependencia" : "Nueva Subdependencia" }}
        </div>
      </q-card-section>

      <q-form @submit.prevent="onSave" class="q-gutter-md">
        <q-card-section>
          <q-select
            dense
            v-model="formData.id_dependencia"
            :options="dependenciaOptions"
            option-value="id_dependencia"
            option-label="nombre_dependencia"
            label="Dependencia"
            emit-value
            map-options
            :rules="[(val) => !!val || 'Requerido']"
          />
          <q-input
            dense
            v-model="formData.nombre"
            label="Nombre"
            :rules="[(val) => !!val || 'Requerido']"
          />
          <q-select
            v-if="isEditing"
            dense
            v-model="formData.estatus"
            :options="['ACTIVO', 'INACTIVO']"
            label="Estatus"
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
import { useDependenciaStore } from "../../stores/dependenciaStore.js";
import { storeToRefs } from "pinia";

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
  isEditing: Boolean,
});

const emit = defineEmits(["update:modelValue", "save"]);

const dependenciaStore = useDependenciaStore();
const { rows: dependenciaOptions } = storeToRefs(dependenciaStore);

const formData = ref({});

onMounted(() => {
    dependenciaStore.fetchDependencias();
    dependenciaStore.initSocket();
});

onUnmounted(() => {
    dependenciaStore.cleanupSocket();
});

watch(
  () => props.modelValue,
  (isNowOpen) => {
    if (isNowOpen) {
      formData.value = {
        id_dependencia: props.initialData?.id_dependencia || null,
        nombre: props.initialData?.nombre || "",
        estatus: props.initialData?.estatus || "ACTIVO",
      };
    }
  }
);

function onSave() {
  emit("save", formData.value);
}
</script>

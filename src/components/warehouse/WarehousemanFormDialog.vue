<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <q-card style="width: 700px; max-width: 90vw">
      <q-card-section>
        <div class="text-h6">
          {{ isEditing ? "Editar Almacenista" : "Nuevo Almacenista" }}
        </div>
      </q-card-section>

      <q-form @submit.prevent="onSave">
        <q-card-section class="q-pt-none">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                dense
                v-model="formData.nombre"
                label="Nombre"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                dense
                v-model="formData.apellido"
                label="Apellido"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-input
                dense
                v-model="formData.cedula"
                label="Cédula"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                dense
                v-model="formData.telefono"
                label="Teléfono"
                mask="####-#######"
                unmasked-value
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>

            <div class="col-12">
              <q-input
                dense
                v-model="formData.cargo"
                label="Cargo"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>

            <div class="col-12" v-if="isEditing">
              <q-select
                dense
                v-model="formData.estado"
                :options="['ACTIVO', 'INACTIVO']"
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
import { ref, watch, nextTick } from "vue";

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
  isEditing: Boolean,
});

const emit = defineEmits(["update:modelValue", "save"]);

const formData = ref({});

// --- INICIALIZACIÓN ---
watch(
  () => props.modelValue,
  (isNowOpen) => {
    if (isNowOpen) {
      formData.value = {
        nombre: props.initialData?.nombre || "",
        apellido: props.initialData?.apellido || "",
        cedula: props.initialData?.cedula || "",
        telefono: props.initialData?.telefono || "",
        cargo: props.initialData?.cargo || "",
        estado: props.initialData?.estado || "ACTIVO",
      };
    }
  }
);

async function onSave() {
  await nextTick(); // Sincronización de seguridad
  emit("save", formData.value);
}
</script>

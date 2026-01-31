<!-- src/components/dispensers/DispenserFormDialog.vue -->
<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">
          {{ isEditing ? "Editar Dispensador" : "Nuevo Dispensador" }}
        </div>
      </q-card-section>

      <q-form @submit.prevent="onSave">
        <q-card-section class="q-gutter-md">
          <q-input
            dense
            outlined
            v-model="formData.codigo"
            label="Código *"
            autofocus
            :rules="[(val) => !!val || 'El código es requerido']"
          />
          <q-input
            dense
            outlined
            v-model="formData.nombre"
            label="Nombre / Descripción *"
            :rules="[(val) => !!val || 'El nombre es requerido']"
          />

          <q-select
            dense
            outlined
            v-model="formData.id_tanque"
            :options="tankOptions"
            option-value="id_tanque"
            option-label="nombre"
            label="Tanque Asociado *"
            emit-value
            map-options
            :loading="loadingTanks"
            :rules="[(val) => !!val || 'Debe seleccionar un tanque']"
          >
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>{{ scope.opt.nombre }}</q-item-label>
                  <q-item-label caption>{{ scope.opt.codigo }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <q-select
            v-if="isEditing"
            dense
            outlined
            v-model="formData.estado"
            :options="['ACTIVO', 'INACTIVO', 'MANTENIMIENTO']"
            label="Estado"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn label="Guardar" type="submit" color="primary" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import api from "../../api";

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
  isEditing: Boolean,
});

const emit = defineEmits(["update:modelValue", "save"]);

const formData = ref({});
const tankOptions = ref([]);
const loadingTanks = ref(false);

const fetchTanks = async () => {
  loadingTanks.value = true;
  try {
    const response = await api.get("/tanques/lista");
    tankOptions.value = response.data;
  } catch (error) {
    console.error("Error al cargar tanques:", error);
  } finally {
    loadingTanks.value = false;
  }
};

onMounted(() => {
  fetchTanks();
});

watch(
  () => props.modelValue,
  (isNowOpen) => {
    if (isNowOpen) {
      formData.value = {
        codigo: props.initialData?.codigo || "",
        nombre: props.initialData?.nombre || "",
        id_tanque: props.initialData?.id_tanque || null,
        estado: props.initialData?.estado || "ACTIVO",
      };
    }
  },
);

function onSave() {
  emit("save", formData.value);
}
</script>

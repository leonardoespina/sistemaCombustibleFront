<<<<<<< HEAD
<!-- src/components/dispensers/DispenserFormDialog.vue -->
=======
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
<<<<<<< HEAD
    <q-card style="min-width: 400px">
=======
    <q-card style="width: 600px; max-width: 90vw">
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
      <q-card-section>
        <div class="text-h6">
          {{ isEditing ? "Editar Dispensador" : "Nuevo Dispensador" }}
        </div>
      </q-card-section>

      <q-form @submit.prevent="onSave">
<<<<<<< HEAD
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

=======
        <q-card-section class="q-pt-none">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-input
                dense
                v-model="formData.nombre"
                label="Nombre / Identificador"
                hint="Ej: Surtidor Gasolina 01"
                :rules="[(val) => !!val || 'Requerido']"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-input
                dense
                v-model.number="formData.odometro_actual"
                type="number"
                label="Lectura Odómetro"
                suffix="Lts"
                :rules="[(val) => val >= 0 || 'No puede ser negativo']"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-select
                dense
                filled
                v-model="formData.id_tanque_asociado"
                :options="tanksList"
                option-value="id_tanque"
                :option-label="
                  (opt) =>
                    `${opt.codigo} - ${opt.nombre} (${opt.tipo_combustible})`
                "
                label="Tanque Asociado"
                emit-value
                map-options
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

>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn label="Guardar" type="submit" color="primary" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
<<<<<<< HEAD
import { ref, watch, onMounted } from "vue";
import api from "../../api";
=======
import { ref, watch, nextTick } from "vue";
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
  isEditing: Boolean,
<<<<<<< HEAD
=======
  tanksList: { type: Array, default: () => [] },
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
});

const emit = defineEmits(["update:modelValue", "save"]);

const formData = ref({});
<<<<<<< HEAD
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

=======

// --- INICIALIZACIÓN ---
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
watch(
  () => props.modelValue,
  (isNowOpen) => {
    if (isNowOpen) {
      formData.value = {
<<<<<<< HEAD
        codigo: props.initialData?.codigo || "",
        nombre: props.initialData?.nombre || "",
        id_tanque: props.initialData?.id_tanque || null,
=======
        nombre: props.initialData?.nombre || "",
        odometro_actual:
          props.initialData?.odometro_actual !== undefined
            ? Number(props.initialData.odometro_actual)
            : 0,
        id_tanque_asociado: props.initialData?.id_tanque_asociado || null,
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
        estado: props.initialData?.estado || "ACTIVO",
      };
    }
  }
);

<<<<<<< HEAD
function onSave() {
=======
async function onSave() {
  await nextTick();
>>>>>>> 02b334619dae414adb78ae740ff2a77f2151687d
  emit("save", formData.value);
}
</script>

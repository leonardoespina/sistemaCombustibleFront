<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card style="min-width: 350px">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">Configuración Inicial</div>
      </q-card-section>

      <q-card-section class="q-pt-md">
        <q-banner rounded class="bg-blue-1 text-primary q-mb-md shadow-1">
          <template v-slot:avatar>
            <q-icon name="info" color="primary" />
          </template>
          <div class="text-subtitle2 text-weight-medium">
            Seleccione las sedes que desea tener disponibles en su área de trabajo.
          </div>
          <div class="text-caption q-mt-xs text-grey-8">
            <b>Esta configuración se solicitará por única vez.</b> Si en el futuro necesita agregar o remover sedes, podrá modificarlo en cualquier momento desde el menú de su Perfil en la opción <b>"Cambiar de Sede"</b>.
          </div>
        </q-banner>
        <q-select
          v-model="selectedLlenadero"
          :options="llenaderosList"
          option-value="id_llenadero"
          option-label="nombre_llenadero"
          label="Sedes Permitidas"
          outlined
          dense
          multiple
          use-chips
          emit-value
          map-options
        >
          <template v-slot:option="{ itemProps, opt, selected, toggleOption }">
            <q-item v-bind="itemProps">
              <q-item-section side>
                <q-checkbox :model-value="selected" @update:model-value="toggleOption(opt)" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ opt.nombre_llenadero }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn 
          unelevated 
          label="Confirmar Ubicación" 
          color="primary" 
          @click="saveAndClose" 
          :disable="!selectedLlenadero || selectedLlenadero.length === 0" 
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  llenaderosList: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['saved']);

const isOpen = ref(false);
const selectedLlenadero = ref([]);

const checkLlenadero = () => {
  const stored = localStorage.getItem('defaultLlenaderoId');
  if (!stored) {
    isOpen.value = true;
  } else {
    try {
      const parsed = JSON.parse(stored);
      selectedLlenadero.value = Array.isArray(parsed) ? parsed : [parseInt(stored, 10)];
      emit('saved', selectedLlenadero.value);
    } catch (e) {
      selectedLlenadero.value = [parseInt(stored, 10)];
      emit('saved', selectedLlenadero.value);
    }
  }
};

const openForce = () => {
  isOpen.value = true;
};

const saveAndClose = () => {
  if (selectedLlenadero.value && selectedLlenadero.value.length > 0) {
    localStorage.setItem('defaultLlenaderoId', JSON.stringify(selectedLlenadero.value));
    isOpen.value = false;
    emit('saved', selectedLlenadero.value);
  }
};

defineExpose({
  checkLlenadero,
  openForce
});
</script>

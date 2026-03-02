<!-- src/components/users/ChangePasswordDialog.vue -->
<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <q-card style="width: 400px; max-width: 90vw">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">Cambiar Contraseña</div>
      </q-card-section>

      <q-form @submit.prevent="handleSave">
        <q-card-section class="q-gutter-md">
          <!-- CONTRASEÑA ACTUAL -->
          <q-input
            v-model="passwordActual"
            :type="showCurrent ? 'text' : 'password'"
            label="Contraseña Actual"
            dense
            outlined
            :rules="[rules.required]"
          >
            <template v-slot:append>
              <q-icon
                :name="showCurrent ? 'visibility' : 'visibility_off'"
                class="cursor-pointer"
                @click="showCurrent = !showCurrent"
              />
            </template>
          </q-input>

          <!-- NUEVA CONTRASEÑA -->
          <q-input
            v-model="nuevaPassword"
            :type="showNew ? 'text' : 'password'"
            label="Nueva Contraseña"
            dense
            outlined
            hint="Mínimo 6 caracteres"
            :rules="[rules.required, rules.minLength]"
          >
            <template v-slot:append>
              <q-icon
                :name="showNew ? 'visibility' : 'visibility_off'"
                class="cursor-pointer"
                @click="showNew = !showNew"
              />
            </template>
          </q-input>

          <!-- CONFIRMAR CONTRASEÑA -->
          <q-input
            v-model="confirmarPassword"
            :type="showConfirm ? 'text' : 'password'"
            label="Confirmar Nueva Contraseña"
            dense
            outlined
            :rules="[rules.required, rules.match]"
          >
            <template v-slot:append>
              <q-icon
                :name="showConfirm ? 'visibility' : 'visibility_off'"
                class="cursor-pointer"
                @click="showConfirm = !showConfirm"
              />
            </template>
          </q-input>
        </q-card-section>

        <q-card-actions align="right" class="q-pb-md q-pr-md">
          <q-btn
            flat
            label="Cancelar"
            color="grey-7"
            v-close-popup
            :disable="loading"
          />
          <q-btn
            unelevated
            label="Actualizar"
            color="primary"
            type="submit"
            :loading="loading"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useChangePasswordForm } from "./composables/useChangePasswordForm.js";

const props = defineProps({
  modelValue: Boolean,
});

const emit = defineEmits(["update:modelValue", "logout"]);

// Usamos el composable que centraliza la lógica, validaciones y sockets
const {
  passwordActual,
  nuevaPassword,
  confirmarPassword,
  showCurrent,
  showNew,
  showConfirm,
  loading,
  rules,
  handleSave,
} = useChangePasswordForm(props, emit);
</script>

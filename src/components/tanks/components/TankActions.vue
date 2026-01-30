<template>
  <div class="card-actions">
    <q-btn flat round size="sm" icon="visibility" @click="$emit('view', tank)">
      <q-tooltip>Ver detalles</q-tooltip>
    </q-btn>
    <q-btn flat round size="sm" icon="edit" @click="$emit('edit', tank)">
      <q-tooltip>Editar</q-tooltip>
    </q-btn>
    <q-btn flat round size="sm" icon="history" @click="$emit('history', tank)">
      <q-tooltip>Historial</q-tooltip>
    </q-btn>
  </div>
</template>

<script setup>
defineProps({
  tank: {
    type: Object,
    required: true,
  },
});

defineEmits(["view", "edit", "history"]);
</script>

<style scoped>
.card-actions {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%) translateY(20px);
  display: flex;
  gap: 4px;
  background: white;
  padding: 4px 8px;
  border-radius: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  opacity: 0;
  transition: all 0.3s ease;
}
</style>

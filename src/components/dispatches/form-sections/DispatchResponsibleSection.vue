<template>
  <div
    v-show="!isMobile || currentStep === 3"
    :class="{ 'q-mt-lg': !isMobile }"
  >
    <div class="section-header">
      <q-icon name="badge" color="primary" size="sm" />
      <span class="text-subtitle1 text-weight-medium q-ml-sm">
        Responsable del Despacho
      </span>
    </div>

    <div class="row q-col-gutter-md q-mt-sm">
      <div class="col-12" :class="{ 'col-md-6': !isMobile }">
        <q-select
          outlined
          :dense="!isMobile"
          use-input
          hide-selected
          fill-input
          input-debounce="0"
          v-model="formData.id_almacenista"
          :options="warehousemanOptions"
          @filter="(val, update) => $emit('filterWarehousemen', val, update)"
          option-value="id_almacenista"
          :option-label="getWarehousemanLabel"
          label="Almacenista (Despachador)"
          emit-value
          map-options
          :rules="[rules.required]"
        >
          <template #prepend>
            <q-icon name="engineering" />
          </template>
          <template #no-option>
            <q-item>
              <q-item-section class="text-grey text-center">
                <q-icon name="search_off" class="q-mb-sm" size="md" />
                No encontrado
              </q-item-section>
            </q-item>
          </template>
          <template #option="{ opt, itemProps }">
            <q-item v-bind="itemProps">
              <q-item-section avatar>
                <q-icon name="engineering" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ opt.nombre }} {{ opt.apellido }}</q-item-label>
                <q-item-label caption>CI: {{ opt.cedula }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>

      <div class="col-12" :class="{ 'col-md-6': !isMobile }">
        <q-input
          outlined
          :dense="!isMobile"
          v-model="formData.observacion"
          type="textarea"
          label="Observaciones (Opcional)"
          :rows="isMobile ? 3 : 2"
          autogrow
        >
          <template #prepend>
            <q-icon name="notes" />
          </template>
        </q-input>
      </div>

      <!-- Resumen solo en móvil, paso 3 -->
      <div v-if="isMobile" class="col-12">
        <q-card flat bordered class="bg-grey-1">
          <q-card-section>
            <div class="text-subtitle2 text-grey-8 q-mb-sm">
              <q-icon name="summarize" class="q-mr-xs" />
              Resumen del Despacho
            </div>
            <div class="summary-grid">
              <div>
                <strong>Ticket:</strong>
                {{ formData.numero_ticket || "-" }}
              </div>
              <div>
                <strong>Cantidad:</strong>
                {{ formData.cantidad_despachada || 0 }} Lts
              </div>
              <div><strong>Destino:</strong> {{ formData.tipo_destino }}</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  formData: { type: Object, required: true },
  isMobile: Boolean,
  currentStep: Number,
  rules: Object,
  warehousemanOptions: Array,
  getWarehousemanLabel: Function,
});

defineEmits(["filterWarehousemen"]);
</script>

<style lang="scss" scoped>
.section-header {
  display: flex;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--q-primary);
  margin-bottom: 8px;
}

.summary-grid {
  display: grid;
  gap: 8px;
  font-size: 14px;
}
</style>

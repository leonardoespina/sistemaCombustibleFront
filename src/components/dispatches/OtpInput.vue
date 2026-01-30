<template>
  <q-field
    :label="label"
    :error="error"
    :error-message="errorMessage"
    outlined
    dense
    stack-label
  >
    <template #prepend>
      <q-icon name="confirmation_number" />
    </template>

    <template #control>
      <div class="otp-row">
        <input
          v-for="(digit, i) in digits"
          :key="i"
          ref="inputs"
          type="text"
          inputmode="numeric"
          maxlength="1"
          class="otp-box"
          :class="{ filled: digit }"
          :value="digit"
          @input="onInput($event, i)"
          @keydown="onKeydown($event, i)"
          @paste="onPaste"
        />
      </div>
    </template>

    <template v-if="modelValue" #append>
      <q-icon name="close" class="cursor-pointer" @click="clear" />
    </template>
  </q-field>
</template>

<script setup>
import { ref, computed, nextTick } from "vue";

const props = defineProps({
  modelValue: { type: String, default: "" },
  label: { type: String, default: "N° Ticket" },
  length: { type: Number, default: 5 },
  error: Boolean,
  errorMessage: String,
});

const emit = defineEmits(["update:modelValue", "complete"]);

const inputs = ref([]);

const digits = computed(() => {
  const arr = (props.modelValue || "").split("").slice(0, props.length);
  while (arr.length < props.length) arr.push("");
  return arr;
});

function updateValue(newDigits) {
  const value = newDigits.join("");
  emit("update:modelValue", value);
  if (value.length === props.length) emit("complete", value);
}

function onInput(e, i) {
  const val = e.target.value.replace(/\D/g, "").slice(-1);
  const arr = [...digits.value];
  arr[i] = val;
  updateValue(arr);

  if (val && i < props.length - 1) {
    nextTick(() => inputs.value[i + 1]?.focus());
  }
}

function onKeydown(e, i) {
  if (e.key === "Backspace" && !digits.value[i] && i > 0) {
    nextTick(() => inputs.value[i - 1]?.focus());
  }
  if (e.key === "ArrowLeft" && i > 0) inputs.value[i - 1]?.focus();
  if (e.key === "ArrowRight" && i < props.length - 1)
    inputs.value[i + 1]?.focus();
}

function onPaste(e) {
  e.preventDefault();
  const text = e.clipboardData
    .getData("text")
    .replace(/\D/g, "")
    .slice(0, props.length);
  emit("update:modelValue", text);
  nextTick(() =>
    inputs.value[Math.min(text.length, props.length - 1)]?.focus()
  );
}

function clear() {
  emit("update:modelValue", "");
  nextTick(() => inputs.value[0]?.focus());
}

defineExpose({ focus: () => inputs.value[0]?.focus(), clear });
</script>

<style scoped>
.otp-row {
  display: flex;
  gap: 8px;
  padding: 8px 0;
}

.otp-box {
  width: 40px;
  height: 44px;
  border: 2px solid #ddd;
  border-radius: 8px;
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  font-family: monospace;
  outline: none;
  transition: all 0.15s;
}

.otp-box:focus {
  border-color: var(--q-primary);
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.15);
}

.otp-box.filled {
  background: #e3f2fd;
  border-color: var(--q-primary);
  color: var(--q-primary);
}

/* Responsive - móvil */
@media (max-width: 599px) {
  .otp-box {
    width: 44px;
    height: 50px;
    font-size: 22px;
  }

  .otp-row {
    justify-content: center;
  }
}

/* Dark mode */
.body--dark .otp-box {
  background: #1e1e1e;
  border-color: #444;
  color: #fff;
}

.body--dark .otp-box.filled {
  background: #1a365d;
  border-color: var(--q-primary);
}
</style>

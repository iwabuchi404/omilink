<script setup lang="ts">
defineProps<{
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
}>();

defineEmits(['click'])
</script>

<template>
  <button 
    :type="type || 'button'"
    :disabled="loading || disabled"
    :class="['c-btn', `c-btn--${variant || 'primary'}`, { 'is-loading': loading }]"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="c-btn__loader"></span>
    <span :class="{ 'c-btn__content--hidden': loading }">
      <slot></slot>
    </span>
  </button>
</template>

<style scoped>
.c-btn {
  position: relative;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  padding: 10px 24px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.95rem;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.c-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.c-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(0.5);
}

.c-btn--primary {
  background: var(--color-primary);
  color: white;
  box-shadow: 0 2px 4px rgba(26, 115, 232, 0.2);
}
.c-btn--primary:not(:disabled):hover {
  background: var(--color-primary-hover);
  box-shadow: 0 4px 8px rgba(26, 115, 232, 0.3);
}

.c-btn--secondary {
  background: var(--color-bg-page);
  color: var(--color-text-main);
  border-color: var(--color-border);
}
.c-btn--secondary:not(:disabled):hover {
  background: var(--color-bg-surface);
  border-color: var(--color-text-muted);
}

.c-btn--danger {
  background: var(--color-danger);
  color: white;
}
.c-btn--danger:not(:disabled):hover {
  background: var(--color-danger-hover);
}

.c-btn__loader {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2.5px solid rgba(255, 255, 255, 0.3);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spinner 0.8s linear infinite;
}

.c-btn--secondary .c-btn__loader {
  border-color: rgba(0, 0, 0, 0.1);
  border-top-color: var(--color-text-main);
}

.c-btn__content--hidden {
  opacity: 0;
}

@keyframes spinner {
  to { transform: rotate(360deg); }
}
</style>

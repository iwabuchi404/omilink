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
  padding: 12px 28px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.95rem;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.c-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.c-btn:active:not(:disabled) {
  transform: translateY(0.5px);
  transition-duration: 0.1s;
}

.c-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.c-btn--primary {
  background: linear-gradient(135deg, #c05848, var(--color-accent));
  color: white;
  border: none;
  box-shadow: 
    inset 1px 1.5px 0 rgba(255, 255, 255, 0.22),
    0 4px 12px rgba(30, 20, 15, 0.25);
}

.c-btn--primary:not(:disabled):hover {
  filter: brightness(1.1);
  box-shadow: 
    inset 1px 1.5px 0 rgba(255, 255, 255, 0.25),
    0 8px 18px rgba(30, 20, 15, 0.35);
}

.c-btn--primary:not(:disabled):active {
  box-shadow: inset 2px 3px 6px rgba(0,0,0,0.3);
}

.c-btn--secondary {
  background: linear-gradient(145deg, var(--color-bg-surface), var(--color-bg-page));
  color: var(--color-text-main);
  border: 1px solid var(--color-border);
  box-shadow: 
    inset 1px 1px 0 rgba(255, 255, 255, 0.8),
    2px 3px 6px rgba(80, 50, 30, 0.05);
}

.c-btn--secondary:not(:disabled):hover {
  background: var(--color-bg-surface);
  border-color: var(--color-text-muted);
  box-shadow: 
    inset 1px 1px 0 rgba(255, 255, 255, 0.9),
    4px 6px 12px rgba(80, 50, 30, 0.08);
}

.c-btn--secondary:not(:disabled):active {
  background: var(--color-bg-page);
  box-shadow: inset 1px 1px 4px rgba(80, 50, 30, 0.12);
}

.c-btn--danger {
  background: #fff;
  color: var(--color-danger);
  border: 1px solid rgba(176, 80, 64, 0.2);
}
.c-btn--danger:not(:disabled):hover {
  background: var(--color-danger);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(176, 80, 64, 0.25);
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

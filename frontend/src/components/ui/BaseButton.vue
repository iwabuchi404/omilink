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
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.c-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.c-btn--primary { background: #007bff; color: white; }
.c-btn--primary:not(:disabled):hover { background: #0056b3; }

.c-btn--secondary { background: #e9ecef; color: #333; }
.c-btn--secondary:not(:disabled):hover { background: #dde0e3; }

.c-btn--danger { background: #dc3545; color: white; }
.c-btn--danger:not(:disabled):hover { background: #c82333; }

.c-btn__loader {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spinner 0.8s linear infinite;
}

.c-btn--secondary .c-btn__loader {
  border-color: rgba(0,0,0,0.1);
  border-top-color: #333;
}

.c-btn__content--hidden {
  opacity: 0;
}

@keyframes spinner {
  to { transform: rotate(360deg); }
}
</style>

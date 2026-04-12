<script setup lang="ts">
defineProps<{
  show: boolean;
  title?: string;
  maxWidth?: string;
}>();

defineEmits(['close']);
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="c-modal-overlay" @click.self="$emit('close')">
      <div class="c-modal" :style="{ maxWidth: maxWidth || '560px' }">
        <div class="c-modal__header" v-if="title || $slots.header">
          <slot name="header">
            <h3 class="c-modal__title">{{ title }}</h3>
          </slot>
          <button class="c-modal__close-btn" @click="$emit('close')">✕</button>
        </div>
        
        <div class="c-modal__body">
          <slot></slot>
        </div>
        
        <div class="c-modal__footer" v-if="$slots.footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.c-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 24px;
}

[data-theme="dark"] .c-modal-overlay {
  background: rgba(0, 0, 0, 0.6);
}

.c-modal {
  background: var(--color-bg-modal);
  padding: 40px;
  border-radius: 20px;
  width: 100%;
  box-shadow: var(--shadow-lg);
  position: relative;
  transition: background-color 0.3s ease;
}

.c-modal__header {
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.c-modal__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-text-main);
  letter-spacing: -0.01em;
}

.c-modal__close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 8px;
  border-radius: 10px;
  transition: all 0.2s ease;
  line-height: 1;
  margin-top: -8px;
  margin-right: -8px;
}

.c-modal__close-btn:hover {
  background-color: var(--color-bg-page);
  color: var(--color-text-main);
}

.c-modal__body {
  color: var(--color-text-main);
}

.c-modal__footer {
  margin-top: 32px;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}

@media (max-width: 768px) {
  .c-modal {
    padding: 24px;
    border-radius: 16px;
  }
}
</style>

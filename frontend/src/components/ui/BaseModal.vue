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
  padding: 44px;
  border-radius: 20px;
  width: 100%;
  /* Premium multi-layered shadow */
  box-shadow: 
    0 10px 30px rgba(0,0,0,0.15),
    0 30px 60px rgba(0,0,0,0.1),
    inset 1px 1px 0 rgba(255,255,255,0.8);
  position: relative;
  transition: background-color 0.3s ease;
  border: 1px solid var(--color-card-border);
}

[data-theme="dark"] .c-modal {
  box-shadow: 
    0 20px 40px rgba(0,0,0,0.5),
    inset 1px 1px 1px rgba(255,255,170,0.03);
}

.c-modal__header {
  margin-bottom: 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.c-modal__title {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--color-text-main);
  letter-spacing: -0.02em;
}

.c-modal__close-btn {
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  font-size: 1.1rem;
  color: var(--color-text-muted);
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 2px 2px 5px rgba(0,0,0,0.05), -1px -1px 3px rgba(255,255,255,0.8);
}

.c-modal__close-btn:hover {
  background-color: var(--color-bg-surface);
  color: var(--color-danger);
  transform: translateY(-1px);
  box-shadow: 4px 4px 10px rgba(0,0,0,0.08), -2px -2px 6px rgba(255,255,255,1);
}

.c-modal__close-btn:active {
  transform: translateY(0);
  box-shadow: inset 2px 2px 5px rgba(0,0,0,0.1);
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

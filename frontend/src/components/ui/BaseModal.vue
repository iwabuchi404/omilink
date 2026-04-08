<script setup lang="ts">
defineProps<{
  show: boolean;
  title?: string;
  maxWidth?: string;
}>();

defineEmits(['close']);
</script>

<template>
  <div v-if="show" class="c-modal-overlay" @click.self="$emit('close')">
    <div class="c-modal" :style="{ maxWidth: maxWidth || '500px' }">
      <div class="c-modal__header" v-if="title || $slots.header">
        <slot name="header">
          <h3 class="c-modal__title">{{ title }}</h3>
        </slot>
      </div>
      
      <div class="c-modal__body">
        <slot></slot>
      </div>
      
      <div class="c-modal__footer" v-if="$slots.footer">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
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
  padding: 20px;
}

.c-modal {
  background: white;
  padding: 30px;
  border-radius: 16px;
  width: 100%;
  box-shadow: 0 20px 50px rgba(0,0,0,0.3);
}

.c-modal__header {
  margin-bottom: 24px;
}

.c-modal__title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
}

.c-modal__footer {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>

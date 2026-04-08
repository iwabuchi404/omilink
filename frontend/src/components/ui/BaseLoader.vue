<script setup lang="ts">
defineProps<{
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'white' | 'gray';
  text?: string;
}>();
</script>

<template>
  <div class="c-loader-wrapper">
    <div :class="['c-loader', `c-loader--${size || 'medium'}`, `c-loader--${color || 'primary'}`]"></div>
    <span v-if="text" class="c-loader-text" :class="[`c-loader-text--${color || 'primary'}`]">{{ text }}</span>
  </div>
</template>

<style scoped>
.c-loader-wrapper {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.c-loader {
  border-radius: 50%;
  border-style: solid;
  animation: spinner 0.8s linear infinite;
}

/* Sizes */
.c-loader--small { width: 16px; height: 16px; border-width: 2px; }
.c-loader--medium { width: 32px; height: 32px; border-width: 3px; }
.c-loader--large { width: 48px; height: 48px; border-width: 4px; }

/* Colors */
.c-loader--primary {
  border-color: rgba(0, 123, 255, 0.2);
  border-top-color: #007bff;
}
.c-loader--white {
  border-color: rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
}
.c-loader--gray {
  border-color: rgba(0, 0, 0, 0.1);
  border-top-color: #6c757d;
}

.c-loader-text {
  font-size: 0.9rem;
  font-weight: 500;
}
.c-loader-text--primary { color: #007bff; }
.c-loader-text--white { color: #ffffff; }
.c-loader-text--gray { color: #6c757d; }

@keyframes spinner {
  to { transform: rotate(360deg); }
}
</style>

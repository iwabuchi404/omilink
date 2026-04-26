<script setup lang="ts">
import { } from 'vue';
import BaseModal from '../ui/BaseModal.vue';
import BaseButton from '../ui/BaseButton.vue';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const handleStart = () => {
  localStorage.setItem('omi_has_seen_welcome', 'true');
  emit('close');
};
</script>

<template>
  <BaseModal :show="show" maxWidth="500px" @close="handleStart">
    <div class="c-welcome">
      <div class="c-welcome__icon">
        <img src="/logo.svg" alt="OmiLink" class="c-welcome__logo" />
      </div>
      
      <h2 class="c-welcome__title">{{ $t('welcome.title') }}</h2>
      
      <p class="c-welcome__desc">
        {{ $t('welcome.desc') }}
      </p>

      <div class="c-welcome__actions">
        <BaseButton variant="primary" @click="handleStart" class="c-welcome__btn">
          {{ $t('welcome.cta') }} <span class="c-welcome__arrow">→</span>
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.c-welcome {
  text-align: center;
  padding: 10px 0;
}

.c-welcome__icon {
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
}

.c-welcome__logo {
  width: 80px;
  height: 80px;
  filter: drop-shadow(0 10px 15px rgba(176, 80, 64, 0.2));
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.c-welcome__title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-text-main);
  margin-bottom: 20px;
  letter-spacing: -0.03em;
}

.c-welcome__desc {
  font-size: 1.1rem;
  line-height: 1.7;
  color: var(--color-text-muted);
  margin-bottom: 40px;
  max-width: 360px;
  margin-left: auto;
  margin-right: auto;
}

.c-welcome__actions {
  display: flex;
  justify-content: center;
}

.c-welcome__btn {
  padding: 16px 48px;
  font-size: 1.2rem;
}

.c-welcome__arrow {
  margin-left: 8px;
  transition: transform 0.2s;
}

.c-welcome__btn:hover .c-welcome__arrow {
  transform: translateX(4px);
}
</style>

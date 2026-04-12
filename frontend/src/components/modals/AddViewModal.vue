<script setup lang="ts">
import { ref } from 'vue';
import pb from '../../lib/pocketbase';
import type { ViewsResponse } from '../../lib/pocketbase-types';
import BaseModal from '../ui/BaseModal.vue';
import BaseButton from '../ui/BaseButton.vue';

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'viewCreated', view: ViewsResponse): void;
}>();

const name = ref('');
const cols = ref(8);
const cellSize = ref<'small' | 'medium' | 'large'>('medium');
const loading = ref(false);
const error = ref('');

async function handleSubmit() {
  if (!name.value.trim()) {
    error.value = 'View name is required.';
    return;
  }

  loading.value = true;
  error.value = '';
  try {
    const created = await pb.collection('views').create<ViewsResponse>({
      user: pb.authStore.model?.id || '',
      name: name.value,
      cols: Number(cols.value),
      cell_size: cellSize.value,
    });
    emit('viewCreated', created);
    resetForm();
  } catch (err: any) {
    console.error('Failed to create view:', err);
    error.value = err.message || 'Failed to create view';
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  name.value = '';
  cols.value = 8;
  cellSize.value = 'medium';
  error.value = '';
}

function close() {
  resetForm();
  emit('close');
}
</script>

<template>
  <BaseModal :show="true" :title="$t('modal.newView')" maxWidth="420px" @close="close">
    <form @submit.prevent="handleSubmit" class="c-modal__form">
      <div class="c-modal__field">
        <label>{{ $t('modal.viewName') }}</label>
        <input v-model="name" type="text" :placeholder="$t('modal.viewNamePlaceholder')" required autofocus />
      </div>

      <div class="c-modal__field">
        <label>{{ $t('modal.columns') }} <span class="c-modal__hint">({{ cols }} {{ $t('modal.columnsCount') }})</span></label>
        <input v-model.number="cols" type="range" min="4" max="16" step="2" />
        <div class="c-modal__range-labels">
          <span>4</span><span>8</span><span>12</span><span>16</span>
        </div>
      </div>

      <div class="c-modal__field">
        <label>{{ $t('modal.cellSize') }}</label>
        <div class="c-modal__cell-sizes">
          <button 
            v-for="size in ['small', 'medium', 'large']" 
            :key="size"
            type="button"
            :class="{ 'is-selected': cellSize === size }"
            @click="cellSize = size as 'small' | 'medium' | 'large'"
          >
            {{ size }}
          </button>
        </div>
      </div>

      <p v-if="error" class="c-modal__error">{{ error }}</p>

      <div class="c-modal__actions">
        <BaseButton variant="secondary" @click="close">{{ $t('modal.cancel') }}</BaseButton>
        <BaseButton type="submit" variant="primary" :loading="loading">
          {{ loading ? $t('modal.creating') : $t('modal.createView') }}
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>

<style scoped>
.c-modal__field {
  margin-bottom: 24px;
}

.c-modal__field label {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.c-modal__hint {
  font-weight: 400;
  color: var(--color-text-muted);
  text-transform: none;
  letter-spacing: 0;
  opacity: 0.6;
}

.c-modal__field input[type="text"] {
  width: 100%;
  padding: 12px 16px;
  background-color: var(--color-bg-page);
  border: 1.5px solid var(--color-border);
  border-radius: 12px;
  font-size: 1rem;
  color: var(--color-text-main);
  outline: none;
  transition: all 0.2s ease;
}

.c-modal__field input[type="text"]:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(26, 115, 232, 0.1);
}

.c-modal__field input[type="range"] {
  width: 100%;
  accent-color: var(--color-primary);
  margin: 12px 0;
}

.c-modal__range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 4px;
  font-weight: 600;
}

.c-modal__cell-sizes {
  display: flex;
  gap: 12px;
}

.c-modal__cell-sizes button {
  flex: 1;
  padding: 12px;
  border: 2px solid var(--color-border);
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  background: var(--color-bg-page);
  color: var(--color-text-muted);
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: capitalize;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.c-modal__cell-sizes button:hover {
  border-color: var(--color-text-muted);
  color: var(--color-text-main);
}

.c-modal__cell-sizes button.is-selected {
  border-color: var(--color-primary);
  background-color: var(--color-bg-surface);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.c-modal__error {
  color: var(--color-danger);
  font-size: 0.85rem;
  margin: 12px 0;
  padding: 10px;
  background: rgba(220, 53, 69, 0.05);
  border-radius: 8px;
}

.c-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 32px;
}
</style>

<script setup lang="ts">
import { ref } from 'vue';
import pb from '../../lib/pocketbase';
import type { ViewsResponse } from '../../lib/pocketbase-types';
import BaseModal from '../ui/BaseModal.vue';
import BaseButton from '../ui/BaseButton.vue';

const props = defineProps<{
  show: boolean;
  view?: ViewsResponse | null; // If provided, we are in edit mode
  canDelete?: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'viewCreated', view: ViewsResponse): void;
  (e: 'viewUpdated', view: ViewsResponse): void;
  (e: 'viewDeleted', id: string): void;
}>();

const name = ref(props.view?.name || '');
const cols = ref(props.view?.cols || 6);
const rows = ref(props.view?.rows || 6);
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
    const data = {
      user: pb.authStore.model?.id,
      name: name.value,
      cols: cols.value,
      rows: rows.value,
      cell_size: 'medium',
    };

    if (props.view) {
      // Update mode
      const updated = await pb.collection('views').update<ViewsResponse>(props.view.id, data);
      emit('viewUpdated', updated);
    } else {
      // Create mode
      const created = await pb.collection('views').create<ViewsResponse>(data);
      emit('viewCreated', created);
    }
    close();
  } catch (err: any) {
    console.error('Failed to save view:', err);
    error.value = err.message || 'Failed to save view';
  } finally {
    loading.value = false;
  }
}

async function handleDelete() {
  if (!props.view) return;
  if (!confirm('Are you sure you want to delete this view? This action cannot be undone.')) return;

  loading.value = true;
  try {
    await pb.collection('views').delete(props.view.id);
    emit('viewDeleted', props.view.id);
    close();
  } catch (err: any) {
    console.error('Failed to delete view:', err);
    error.value = err.message || 'Failed to delete view';
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  name.value = '';
  cols.value = 6;
  rows.value = 6;
  error.value = '';
}

function close() {
  resetForm();
  emit('close');
}
</script>

<template>
  <BaseModal 
    :show="show" 
    :title="view ? $t('modal.viewSettings') : $t('modal.newView')" 
    maxWidth="420px" 
    @close="close"
  >
    <form @submit.prevent="handleSubmit" class="c-modal__form">
      <div class="c-modal__field">
        <label>{{ $t('modal.viewName') }}</label>
        <input v-model="name" type="text" :placeholder="$t('modal.viewNamePlaceholder')" required autofocus />
      </div>

      <div class="c-modal__field">
        <label>{{ $t('modal.columns') }}: {{ cols }}</label>
        <div class="c-modal__slider-container">
          <input 
            type="range" 
            v-model.number="cols" 
            min="2" 
            max="16" 
            step="1"
            class="c-modal__slider"
          />
          <div class="c-modal__slider-labels">
            <span>2</span>
            <span>16</span>
          </div>
        </div>
      </div>

      <div class="c-modal__field">
        <label>{{ $t('modal.rows') }}: {{ rows }}</label>
        <div class="c-modal__slider-container">
          <input 
            type="range" 
            v-model.number="rows" 
            min="2" 
            max="20" 
            step="1"
            class="c-modal__slider"
          />
          <div class="c-modal__slider-labels">
            <span>2</span>
            <span>20</span>
          </div>
        </div>
      </div>

      <p v-if="error" class="c-modal__error">{{ error }}</p>

      <div class="c-modal__actions">
        <BaseButton v-if="view && canDelete" variant="danger" @click="handleDelete" :disabled="loading" style="margin-right: auto;">
          {{ $t('modal.delete') }}
        </BaseButton>
        <BaseButton variant="secondary" @click="close">{{ $t('modal.cancel') }}</BaseButton>
        <BaseButton type="submit" variant="primary" :loading="loading">
          {{ view ? $t('modal.save') : $t('modal.createView') }}
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

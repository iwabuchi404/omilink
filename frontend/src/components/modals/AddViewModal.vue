<script setup lang="ts">
import { ref } from 'vue';
import pb from '../../lib/pocketbase';
import type { ViewsResponse } from '../../lib/pocketbase-types';

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
  <div class="c-modal-overlay" @click.self="close">
    <div class="c-modal">
      <h3 class="c-modal__title">New View</h3>

      <form @submit.prevent="handleSubmit" class="c-modal__form">
        <div class="c-modal__field">
          <label>View Name</label>
          <input v-model="name" type="text" placeholder="e.g. Tech, Reading List..." required autofocus />
        </div>

        <div class="c-modal__field">
          <label>Columns <span class="c-modal__hint">({{ cols }} columns)</span></label>
          <input v-model.number="cols" type="range" min="4" max="16" step="2" />
          <div class="c-modal__range-labels">
            <span>4</span><span>8</span><span>12</span><span>16</span>
          </div>
        </div>

        <div class="c-modal__field">
          <label>Cell Size</label>
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
          <button type="button" @click="close" class="btn-secondary">Cancel</button>
          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? 'Creating...' : 'Create View' }}
          </button>
        </div>
      </form>
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
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.c-modal {
  background: white;
  padding: 28px;
  border-radius: 12px;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 15px 40px rgba(0,0,0,0.2);
}

.c-modal__title {
  margin: 0 0 24px 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #1a1a2e;
}

.c-modal__field {
  margin-bottom: 20px;
}

.c-modal__field label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 6px;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.c-modal__hint {
  font-weight: normal;
  color: #999;
  text-transform: none;
  letter-spacing: 0;
}

.c-modal__field input[type="text"] {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}

.c-modal__field input[type="text"]:focus {
  border-color: #1a73e8;
  box-shadow: 0 0 0 2px rgba(26,115,232,0.15);
}

.c-modal__field input[type="range"] {
  width: 100%;
  accent-color: #1a73e8;
}

.c-modal__range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #999;
  margin-top: 4px;
}

.c-modal__cell-sizes {
  display: flex;
  gap: 8px;
}

.c-modal__cell-sizes button {
  flex: 1;
  padding: 8px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  text-align: center;
  cursor: pointer;
  background: white;
  color: #666;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: capitalize;
  transition: all 0.2s;
}

.c-modal__cell-sizes button:hover {
  border-color: #1a73e8;
  color: #1a73e8;
}

.c-modal__cell-sizes button.is-selected {
  border-color: #1a73e8;
  background-color: #e8f0fe;
  color: #1a73e8;
  font-weight: 600;
}

.c-modal__error {
  color: #d93025;
  font-size: 0.85rem;
  margin: 0 0 10px 0;
}

.c-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}

.btn-primary {
  background: #1a73e8;
  color: white;
  border: none;
  padding: 10px 22px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #1557b0;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: transparent;
  border: 1px solid #ddd;
  padding: 10px 22px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #555;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f5f5f5;
}
</style>

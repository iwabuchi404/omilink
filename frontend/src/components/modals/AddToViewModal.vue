<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import pb from '../../lib/pocketbase';
import type { ViewsResponse } from '../../lib/pocketbase-types';
import { findNextFreePosition } from '../../lib/placement';
import BaseModal from '../ui/BaseModal.vue';
import BaseButton from '../ui/BaseButton.vue';

interface ViewItem {
  itemId: string;
  title: string;
  type: 'bookmark' | 'memo';
}

const props = defineProps<{
  show: boolean;
  item: ViewItem | null;
  views: ViewsResponse[];
  currentViewId: string;
}>();

const emit = defineEmits(['close', 'success']);

const selectedViewId = ref('');
const loading = ref(false);
const error = ref('');

// Filter out INBOX and current view. Handle cases where props.views might be undefined initially.
const availableViews = computed(() => {
  return props.views.filter(v => v.id !== props.currentViewId);
});

// Watch targetViews to set initial selectedViewId
watch(availableViews, (newViews) => {
  if (newViews.length > 0 && !selectedViewId.value) {
    selectedViewId.value = newViews[0]!.id;
  }
}, { immediate: true });

async function handleSubmit() {
  if (!props.item || !selectedViewId.value) return;
  
  loading.value = true;
  error.value = '';
  
  try {
    const targetView = props.views.find(v => v.id === selectedViewId.value);
    if (!targetView) throw new Error('Target view not found');

    // 1. Check if already placed in target view
    const existing = await pb.collection('placements').getList(1, 1, {
      filter: `item = "${props.item.itemId}" && view = "${selectedViewId.value}"`
    });
    
    if (existing.totalItems > 0) {
      error.value = 'Already placed in this view';
      loading.value = false;
      return;
    }

    // 2. Find next free position in target view
    const viewPlacements = await pb.collection('placements').getFullList({
      filter: `view = "${selectedViewId.value}"`
    });
    
    const pos = findNextFreePosition(
      viewPlacements.map(p => ({ col: p.col, row: p.row, width: p.width, height: p.height })),
      targetView.cols,
      props.item.type === 'bookmark' ? 1 : 2, // w
      props.item.type === 'bookmark' ? 2 : 2  // h
    );

    // 3. Create placement
    await pb.collection('placements').create({
      user: pb.authStore.model?.id,
      view: selectedViewId.value,
      item: props.item.itemId,
      col: pos.col,
      row: pos.row,
      width: props.item.type === 'bookmark' ? 1 : 2,
      height: props.item.type === 'bookmark' ? 2 : 2
    });

    emit('success');
    close();
  } catch (err: any) {
    console.error('Failed to add to view:', err);
    error.value = err.message || 'Failed to add to view';
  } finally {
    loading.value = false;
  }
}

function close() {
  emit('close');
}
</script>

<template>
  <BaseModal :show="show && !!item" @close="close">
    <template #header>
      <h3 class="c-modal__title">Add to Another View</h3>
      <p v-if="item" class="c-modal__subtitle">Select a view to place "{{ item.title }}" in.</p>
    </template>
      
    <form @submit.prevent="handleSubmit" class="c-modal__form">
      <div class="c-modal__field">
        <label>Target View</label>
        <select v-model="selectedViewId" required>
          <option v-for="v in availableViews" :key="v.id" :value="v.id">
            {{ v.name }}
          </option>
        </select>
        <p v-if="availableViews.length === 0" class="c-modal__hint">
          No other views available. Create one first!
        </p>
      </div>

      <p v-if="error" class="c-modal__error">{{ error }}</p>

      <div class="c-modal__actions">
        <BaseButton variant="secondary" @click="close">Cancel</BaseButton>
        <BaseButton 
          type="submit" 
          variant="primary" 
          :loading="loading"
          :disabled="availableViews.length === 0"
          @click="handleSubmit"
        >
          {{ loading ? 'Adding...' : 'Add to View' }}
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>

<style scoped>
.c-modal__title {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 1.4rem;
  font-weight: 700;
}

.c-modal__subtitle {
  color: #666;
  margin-bottom: 24px;
  font-size: 0.9rem;
}

.c-modal__field {
  margin-bottom: 20px;
}

.c-modal__field label {
  display: block;
  font-size: 0.85rem;
  margin-bottom: 8px;
  color: #555;
  font-weight: 600;
}

.c-modal__field select {
  width: 100%;
  padding: 12px;
  border: 1.5px solid #eee;
  border-radius: 10px;
  font-size: 1rem;
}

.c-modal__hint {
  font-size: 0.8rem;
  color: #dc3545;
  margin-top: 8px;
}

.c-modal__error {
  color: #dc3545;
  font-size: 0.85rem;
  margin-bottom: 15px;
}
</style>

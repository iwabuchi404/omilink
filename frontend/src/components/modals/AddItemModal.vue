<script setup lang="ts">
import { ref, watch } from 'vue';
import pb from '../../lib/pocketbase';
import type { ItemsRecord, PlacementsRecord, ViewsResponse } from '../../lib/pocketbase-types';

const props = defineProps<{
  show: boolean;
  currentView: ViewsResponse;
  views: ViewsResponse[];
}>();

const emit = defineEmits(['close', 'success']);

const type = ref<'bookmark' | 'memo'>('bookmark');
const url = ref('');
const title = ref('');
const content = ref('');
const faviconUrl = ref('');
const loading = ref(false);
const fetchingTitle = ref(false);
const error = ref('');
const selectedViewId = ref(props.currentView?.id || '');

async function fetchTitle() {
  if (!url.value) return;
  fetchingTitle.value = true;
  error.value = '';
  console.log('[AddItemModal] Starting fetchTitle for:', url.value);
  try {
    const res = await fetch(`${pb.baseUrl}/ogp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url.value }),
    });

    console.log('[AddItemModal] Fetch response status:', res.status);
    
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('[AddItemModal] Fetch failed:', errorData);
        throw new Error(errorData.error || 'Failed to fetch title');
    }

    const data = await res.json();
    console.log('[AddItemModal] Received OGP data:', data);

    if (data.title) {
        console.log('[AddItemModal] Setting title:', data.title);
        title.value = data.title;
    }
    if (data.description && !content.value) {
        console.log('[AddItemModal] Setting description:', data.description);
        content.value = data.description;
    }
    if (data.favicon) {
        console.log('[AddItemModal] Setting favicon:', data.favicon);
        faviconUrl.value = data.favicon;
    }
  } catch (err: any) {
    console.error('[AddItemModal] Fetch title exception:', err);
    error.value = `Fetch error: ${err.message || 'Check console for details'}`;
  } finally {
    fetchingTitle.value = false;
  }
}

// Keep selectedViewId in sync if currentView changes
watch(() => props.currentView?.id, (id) => {
  if (id) selectedViewId.value = id;
}, { immediate: true });

async function handleSubmit() {
  loading.value = true;
  error.value = '';
  try {
    const viewId = selectedViewId.value;

    // Fetch existing placements to compute auto-placement position
    const existingPlacements = await pb.collection('placements').getFullList<PlacementsRecord>({
      filter: `view = "${viewId}"`,
      fields: 'row,height',
    });

    let maxBottom = 0;
    for (const p of existingPlacements) {
        const bottom = (p.row ?? 0) + (p.height ?? 1);
        if (bottom > maxBottom) maxBottom = bottom;
    }

    const itemW = 2;
    const itemH = type.value === 'memo' ? 2 : 1;
    // Phase 11 UX: Place at the bottom-left of the current view
    const position = { col: 0, row: maxBottom };

    // Create the Item record
    const itemData: Partial<ItemsRecord> = {
      user: pb.authStore.model?.id || '',
      type: type.value,
      title: title.value || (type.value === 'bookmark' ? url.value : 'New Note'),
      description: type.value === 'bookmark' ? content.value : '',
      memo: type.value === 'memo' ? content.value : '',
      favicon_url: faviconUrl.value,
      ogp_fetched: !!faviconUrl.value || !!title.value,
    };
    if (type.value === 'bookmark') {
      itemData.url = url.value;
    }
    const createdItem = await pb.collection('items').create(itemData);

    // Create the Placement record at auto-computed position
    const placementData: Partial<PlacementsRecord> = {
      user: pb.authStore.model?.id || '',
      view: viewId,
      item: createdItem.id,
      col: position.col,
      row: position.row,
      width: itemW,
      height: itemH,
    };
    await pb.collection('placements').create(placementData);

    emit('success');
    resetForm();
  } catch (err: any) {
    console.error('Failed to add item:', err);
    error.value = err.message || 'Failed to add item';
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  url.value = '';
  title.value = '';
  content.value = '';
  faviconUrl.value = '';
  type.value = 'bookmark';
}

function close() {
  resetForm();
  emit('close');
}
</script>

<template>
  <div v-if="show" class="c-modal-overlay" @click.self="close">
    <div class="c-modal">
      <h3 class="c-modal__title">New Item</h3>
      
      <!-- Type selector -->
      <div class="c-modal__type-selector">
        <button 
          :class="['c-modal__type-btn', { 'is-active': type === 'bookmark' }]" 
          @click="type = 'bookmark'"
        >
          🔗 Bookmark
        </button>
        <button 
          :class="['c-modal__type-btn', { 'is-active': type === 'memo' }]" 
          @click="type = 'memo'"
        >
          📝 Memo
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="c-modal__form">
        <!-- URL (bookmark only) -->
        <div v-if="type === 'bookmark'" class="c-modal__field">
          <label>URL</label>
          <div class="c-modal__input-group">
            <input v-model="url" type="url" placeholder="https://..." required />
            <button 
              type="button" 
              class="btn-fetch" 
              @click="fetchTitle" 
              :disabled="!url || fetchingTitle"
            >
              {{ fetchingTitle ? '...' : 'Fetch' }}
            </button>
          </div>
        </div>

        <!-- Title -->
        <div class="c-modal__field">
          <label>Title <span class="c-modal__hint">(optional)</span></label>
          <input v-model="title" type="text" :placeholder="type === 'bookmark' ? 'Auto-filled by OGP if blank' : 'Note title'" />
        </div>

        <!-- Content -->
        <div class="c-modal__field">
          <label>{{ type === 'bookmark' ? 'Description' : 'Content' }}</label>
          <textarea v-model="content" :rows="type === 'memo' ? 5 : 2" :placeholder="type === 'memo' ? 'Write your note...' : 'Additional context...'"></textarea>
        </div>

        <!-- Target View selector -->
        <div class="c-modal__field">
          <label>Add to View</label>
          <select v-model="selectedViewId">
            <option v-for="v in views" :key="v.id" :value="v.id">
              {{ v.name }}
            </option>
          </select>
        </div>

        <p v-if="error" class="c-modal__error">{{ error }}</p>

        <div class="c-modal__actions">
          <button type="button" @click="close" class="btn-secondary">Cancel</button>
          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? 'Adding...' : 'Add Item' }}
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
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 50px rgba(0,0,0,0.3);
}

.c-modal__title {
  margin-top: 0;
  margin-bottom: 24px;
  font-size: 1.4rem;
  font-weight: 700;
}

.c-modal__tabs, .c-modal__type-selector {
  display: flex;
  margin-bottom: 24px;
  background: #f1f3f4;
  padding: 4px;
  border-radius: 10px;
}

.c-modal__tabs button, .c-modal__type-btn {
  flex: 1;
  padding: 10px;
  border: none;
  background: none;
  cursor: pointer;
  font-weight: 600;
  color: #666;
  border-radius: 8px;
  transition: all 0.2s;
}

.c-modal__tabs button.active, .c-modal__type-btn.is-active {
  background: white;
  color: #007bff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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

.c-modal__field input, .c-modal__field textarea {
  width: 100%;
  padding: 12px;
  border: 1.5px solid #eee;
  border-radius: 10px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.c-modal__field input:focus, .c-modal__field textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.c-modal__field textarea {
  min-height: 120px;
  resize: vertical;
}

.c-modal__error {
  color: #dc3545;
  font-size: 0.85rem;
  margin-bottom: 15px;
}

.c-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.btn-primary {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-secondary:hover {
  background: #f5f5f5;
}

.c-modal__input-group {
  display: flex;
  gap: 8px;
}

.c-modal__input-group input {
  flex: 1;
}

.btn-fetch {
  background: #e8f0fe;
  color: #1a73e8;
  border: 1.5px solid #1a73e8;
  padding: 0 16px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-fetch:hover:not(:disabled) {
  background: #1a73e8;
  color: white;
}

.btn-fetch:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: #ccc;
  color: #666;
  background: #f5f5f5;
}
</style>

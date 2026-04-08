<script setup lang="ts">
import { ref, watch } from 'vue';
import pb from '../../lib/pocketbase';
import type { ItemsRecord } from '../../lib/pocketbase-types';
import BaseModal from '../ui/BaseModal.vue';
import BaseButton from '../ui/BaseButton.vue';

interface ViewItem {
  id: string;
  itemId: string;
  type: 'bookmark' | 'memo';
  title: string;
  content: string;
  url?: string;
  og_image_url?: string;
  favicon_url?: string;
}

const props = defineProps<{
  show: boolean;
  item: ViewItem | null;
}>();

const emit = defineEmits(['close', 'success']);

const title = ref('');
const content = ref('');
const url = ref('');
const faviconUrl = ref('');
const loading = ref(false);
const fetchingTitle = ref(false);
const error = ref('');

async function fetchTitle() {
  if (!url.value) return;
  fetchingTitle.value = true;
  error.value = '';
  console.log('[EditItemModal] Starting fetchTitle for:', url.value);
  try {
    const res = await fetch(`${pb.baseUrl}/ogp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url.value }),
    });

    console.log('[EditItemModal] Fetch response status:', res.status);

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('[EditItemModal] Fetch failed:', errorData);
        throw new Error(errorData.error || 'Failed to fetch title');
    }

    const data = await res.json();
    console.log('[EditItemModal] Received OGP data:', data);

    if (data.title) {
        console.log('[EditItemModal] Setting title:', data.title);
        title.value = data.title;
    }
    if (data.description && !content.value) {
        console.log('[EditItemModal] Setting description:', data.description);
        content.value = data.description;
    }
    if (data.favicon) {
        console.log('[EditItemModal] Setting favicon:', data.favicon);
        faviconUrl.value = data.favicon;
    }
  } catch (err: any) {
    console.error('[EditItemModal] Fetch title exception:', err);
    error.value = `Fetch error: ${err.message || 'Check console for details'}`;
  } finally {
    fetchingTitle.value = false;
  }
}

watch(() => props.item, (newItem) => {
  if (newItem) {
    title.value = newItem.title;
    content.value = newItem.content;
    url.value = newItem.url || '';
    faviconUrl.value = newItem.favicon_url || '';
  }
}, { immediate: true });

async function handleSubmit() {
  if (!props.item) return;
  loading.value = true;
  error.value = '';
  try {
    const itemData: Partial<ItemsRecord> = {
      title: title.value,
      description: props.item.type === 'bookmark' ? content.value : undefined,
      memo: props.item.type === 'memo' ? content.value : undefined,
      url: props.item.type === 'bookmark' ? url.value : undefined,
      favicon_url: faviconUrl.value,
    };
    
    await pb.collection('items').update(props.item.itemId, itemData);

    emit('success');
    close();
  } catch (err: any) {
    console.error('Failed to update item:', err);
    error.value = err.message || 'Failed to update item';
  } finally {
    loading.value = false;
  }
}

function close() {
  emit('close');
}
</script>

<template>
  <BaseModal :show="show && !!item" :title="item?.type === 'bookmark' ? $t('modal.editBookmark') : $t('modal.editMemo')" maxWidth="600px" @close="close">
      <form v-if="item" @submit.prevent="handleSubmit" class="c-modal__form">
        <div v-if="item.type === 'bookmark'" class="c-modal__field">
          <label>{{ $t('modal.url') }}</label>
          <div class="c-modal__input-group">
            <input v-model="url" type="url" :placeholder="$t('modal.urlPlaceholder')" required />
            <button 
              type="button" 
              class="btn-fetch" 
              @click="fetchTitle" 
              :disabled="!url || fetchingTitle"
            >
              {{ fetchingTitle ? $t('modal.fetching') : $t('modal.fetch') }}
            </button>
          </div>
        </div>

        <div class="c-modal__field">
          <label>{{ $t('modal.title') }} <span class="c-modal__hint">{{ $t('modal.optional') }}</span></label>
          <input v-model="title" type="text" :placeholder="item.type === 'bookmark' ? $t('modal.titlePlaceholderBookmark') : $t('modal.titlePlaceholderMemo')" />
        </div>

        <div class="c-modal__field">
          <label>{{ item.type === 'bookmark' ? $t('modal.description') : $t('modal.content') }}</label>
          <textarea v-model="content" rows="5" :placeholder="$t('modal.contentPlaceholder')"></textarea>
        </div>

        <p v-if="error" class="c-modal__error">{{ error }}</p>

        <div class="c-modal__actions">
          <BaseButton variant="secondary" @click="close">{{ $t('modal.cancel') }}</BaseButton>
          <BaseButton type="submit" variant="primary" :loading="loading" @click="handleSubmit">
            {{ loading ? $t('modal.saving') : $t('modal.saveChanges') }}
          </BaseButton>
        </div>
      </form>
  </BaseModal>
</template>

<style scoped>
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
  min-height: 250px; /* Taller for memo expansion */
  resize: vertical;
}

.c-modal__error {
  color: #dc3545;
  font-size: 0.85rem;
}

.c-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
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

<script setup lang="ts">
import { ref } from 'vue';
import pb from '../lib/pocketbase';
import type { ItemsRecord, PlacementsRecord } from '../lib/pocketbase-types';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits(['close', 'success']);

const type = ref<'bookmark' | 'memo'>('bookmark');
const url = ref('');
const title = ref('');
const content = ref('');
const loading = ref(false);
const error = ref('');

async function handleSubmit() {
  loading.value = true;
  error.value = '';
  try {
    // 1. Ensure a "Default" view exists for the user
    let view = await pb.collection('views').getFirstListItem(`user = "${pb.authStore.model?.id}"`).catch(() => null);
    
    if (!view) {
      view = await pb.collection('views').create({
        user: pb.authStore.model?.id || '',
        name: 'INBOX',
        cols: 8,
        cell_size: 'medium',
        is_inbox: true,
      });
    }

    // 2. Create the Item record
    const itemData: Partial<ItemsRecord> = {
      user: pb.authStore.model?.id || '',
      type: type.value,
      title: title.value || (type.value === 'bookmark' ? url.value : 'New Note'),
      description: type.value === 'bookmark' ? content.value : '',
      memo: type.value === 'memo' ? content.value : '',
      ogp_fetched: false,
    };
    
    // Only add URL if it's a bookmark type
    if (type.value === 'bookmark') {
      itemData.url = url.value;
    }
    
    const createdItem = await pb.collection('items').create(itemData);

    // 3. Create the Placement record
    const placementData: Partial<PlacementsRecord> = {
      user: pb.authStore.model?.id || '',
      view: view!.id,
      item: createdItem.id,
      col: 0,
      row: 0,
      width: type.value === 'bookmark' ? 2 : 2,
      height: type.value === 'bookmark' ? 1 : 1,
    };
    await pb.collection('placements').create(placementData);

    emit('success');
    resetForm();
  } catch (err: any) {
    console.error('Failed to add item:', err);
    console.error('FULL ERROR DETAILS:', JSON.stringify(err.data, null, 2));
    error.value = err.message || 'Failed to add item';
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  url.value = '';
  title.value = '';
  content.value = '';
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
      <h3 class="c-modal__title">Add New Item</h3>
      
      <div class="c-modal__tabs">
        <button :class="{ active: type === 'bookmark' }" @click="type = 'bookmark'">Bookmark</button>
        <button :class="{ active: type === 'memo' }" @click="type = 'memo'">Memo</button>
      </div>

      <form @submit.prevent="handleSubmit" class="c-modal__form">
        <div v-if="type === 'bookmark'" class="c-modal__field">
          <label>URL</label>
          <input v-model="url" type="url" placeholder="https://..." required />
        </div>

        <div class="c-modal__field">
          <label>Title</label>
          <input v-model="title" type="text" placeholder="Display Name" />
        </div>

        <div class="c-modal__field">
          <label>{{ type === 'bookmark' ? 'Description' : 'Content' }}</label>
          <textarea v-model="content" rows="3" placeholder="Additional notes..."></textarea>
        </div>

        <p v-if="error" class="c-modal__error">{{ error }}</p>

        <div class="c-modal__actions">
          <button type="button" @click="close" class="btn-secondary">Cancel</button>
          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? 'Adding...' : 'Add to Grid' }}
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.c-modal {
  background: white;
  padding: 25px;
  border-radius: 12px;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 15px 30px rgba(0,0,0,0.2);
}

.c-modal__title {
  margin-top: 0;
  margin-bottom: 20px;
}

.c-modal__tabs {
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.c-modal__tabs button {
  flex: 1;
  padding: 10px;
  border: none;
  background: none;
  cursor: pointer;
  font-weight: bold;
  color: #999;
}

.c-modal__tabs button.active {
  color: #007bff;
  border-bottom: 2px solid #007bff;
}

.c-modal__field {
  margin-bottom: 15px;
}

.c-modal__field label {
  display: block;
  font-size: 0.8rem;
  margin-bottom: 5px;
  color: #666;
}

.c-modal__field input, .c-modal__field textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
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

.btn-primary {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-secondary {
  background: #eee;
  border: none;
  padding: 8px 20px;
  border-radius: 4px;
  cursor: pointer;
}
</style>

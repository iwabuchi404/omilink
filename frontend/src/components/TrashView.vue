<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import pb from '../lib/pocketbase';
import ItemListView, { type ListItem } from './ItemListView.vue';

const props = defineProps<{
  searchQuery?: string;
}>();

const { t } = useI18n();

const items = ref<ListItem[]>([]);
const loading = ref(true);

async function fetchTrashItems() {
  loading.value = true;
  try {
    const records = await pb.collection('items').getFullList<ListItem>({
      filter: 'is_deleted = true',
      sort: '-deleted_at,-updated'
    });
    
    // Fetch all placements to extract the views the items belonged to
    const placements = await pb.collection('placements').getFullList({
      expand: 'view'
    });

    records.forEach(item => {
      const itemPlacements = placements.filter((p: any) => p.item === item.id);
      const views = itemPlacements.map((p: any) => p.expand?.view?.name).filter(Boolean);
      item.original_views = [...new Set(views)];
    });

    items.value = records;
  } catch (err) {
    console.error('Failed to fetch trash items:', err);
  } finally {
    loading.value = false;
  }
}

async function emptyTrash() {
  if (items.value.length === 0) return;
  if (!confirm(t('trash.emptyConfirm'))) return;

  loading.value = true;
  try {
    // Delete all items permanently
    const promises = items.value.map(item => pb.collection('items').delete(item.id));
    await Promise.all(promises);
    items.value = [];
  } catch (err) {
    console.error('Failed to empty trash:', err);
  } finally {
    loading.value = false;
  }
}

async function restoreItem(item: ListItem) {
  try {
    // Bring it back from the dead
    await pb.collection('items').update(item.id, { is_deleted: false, deleted_at: null });
    // Remove it from the local trash list instantly
    items.value = items.value.filter(i => i.id !== item.id);
  } catch (err) {
    console.error('Failed to restore item:', err);
  }
}

async function deletePermanently(item: ListItem) {
  if (!confirm(t('trash.deleteConfirm', { title: item.title }))) return;
  try {
    await pb.collection('items').delete(item.id);
    items.value = items.value.filter(i => i.id !== item.id);
  } catch (err) {
    console.error('Failed to permanently delete item:', err);
  }
}

onMounted(() => {
  fetchTrashItems();
});
</script>

<template>
  <div class="c-trash-view">
    <div class="c-trash-view__header">
      <h2 class="c-trash-view__title">🗑️ {{ $t('trash.title') || 'Trash' }}</h2>
      <button 
        class="c-btn c-btn--danger" 
        :disabled="items.length === 0 || loading" 
        @click="emptyTrash"
      >
        ✕ {{ $t('trash.emptyBtn') }}
      </button>
    </div>

    <div v-if="loading" class="c-trash-view__loading">Loading...</div>
    <ItemListView 
      v-else
      :items="items"
      :search-query="searchQuery"
      @restore="restoreItem"
      @delete-permanently="deletePermanently"
    />
  </div>
</template>

<style scoped>
.c-trash-view {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  position: relative;
  border-radius: 12px;
  background: var(--color-bg-page);
}

.c-trash-view__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-surface);
  position: sticky;
  top: 0;
  z-index: 10;
}

.c-trash-view__title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
}

.c-trash-view__loading {
  padding: 40px;
  text-align: center;
  color: var(--color-text-muted);
}

.c-btn {
  padding: 8px 16px;
  font-size: 0.9rem;
  font-weight: 700;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid var(--color-border);
  background: var(--color-bg-surface);
  color: var(--color-text-main);
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
}

.c-btn[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}

.c-btn--danger {
  background: var(--color-danger);
  color: white;
  border-color: var(--color-danger);
}

.c-btn--danger:hover:not([disabled]) {
  background: #bb2d3b;
  box-shadow: var(--shadow-md);
}
</style>

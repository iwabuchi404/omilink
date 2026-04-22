<script setup lang="ts">
import { computed } from 'vue';
import type { ItemType } from './grid/useGridInteract';

export interface ListItem {
  id: string; // The ID of the item record
  itemId: string; 
  title: string;
  content: string;
  url?: string;
  type: ItemType;
  og_image_url?: string;
  favicon_url?: string;
  deleted_at?: string;
  original_views?: string[]; // Array of view names this item belongs to
}

const props = defineProps<{
  items: ListItem[];
  searchQuery?: string;
}>();

const emit = defineEmits<{
  (e: 'restore', item: ListItem): void;
  (e: 'delete-permanently', item: ListItem): void;
}>();

const filteredItems = computed(() => {
  if (!props.searchQuery) return props.items;
  const q = props.searchQuery.toLowerCase();
  return props.items.filter(i => 
    i.title.toLowerCase().includes(q) || 
    (i.content && i.content.toLowerCase().includes(q)) ||
    (i.url && i.url.toLowerCase().includes(q))
  );
});

// Helper for display title
const getDisplayTitle = (item: ListItem) => {
  if (item.title && item.title !== 'Untitled') return item.title;
  if (item.type === 'memo' && item.content) {
    return item.content.split('\n')[0];
  }
  return item.url || 'Untitled';
};
</script>

<template>
  <div class="c-item-list">
    <div v-if="filteredItems.length === 0" class="c-item-list__empty">
      {{ $t('common.noItemsFound') || 'No items found.' }}
    </div>
    
    <div v-for="item in filteredItems" :key="item.id" class="c-item-list__item-wrapper">
      
      <div class="c-item-list__content">
        <div class="c-item-list__header">
          <img 
            v-if="item.type === 'bookmark'" 
            :src="item.favicon_url || `https://www.google.com/s2/favicons?domain=${item.url}&sz=32`" 
            class="c-item-list__favicon" 
            alt="" 
          />
          <span v-else class="c-item-list__favicon">📝</span>
          
          <h4 class="c-item-list__title">
            {{ getDisplayTitle(item) }}
          </h4>
        </div>
        
        <div class="c-item-list__body">
          <a v-if="item.type === 'bookmark' && item.url" :href="item.url" target="_blank" rel="noopener" class="c-item-list__url">
            {{ item.url }}
          </a>
          <p v-else-if="item.type === 'memo' && item.content" class="c-item-list__text">
            {{ item.content }}
          </p>
        </div>
      </div>
      
      <div class="c-item-list__actions-wrapper">
        <div class="c-item-list__badges">
          <span v-if="item.original_views && item.original_views.length > 0" v-for="view in item.original_views" :key="view" class="c-item-list__badge">
            📁 {{ view }}
          </span>
        </div>
        
        <div class="c-item-list__actions">
          <button class="c-btn c-btn--outline" @click="$emit('restore', item)">
            ↺ {{ $t('trash.restore') || 'Restore' }}
          </button>
          <button class="c-btn c-btn--outline is-danger" @click="$emit('delete-permanently', item)">
            ✕ {{ $t('trash.deletePermanent') || 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.c-item-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  padding: 16px;
  width: 100%;
}

.c-item-list__empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  color: var(--color-text-muted);
  font-size: 1.1rem;
}

.c-item-list__item-wrapper {
  background: var(--color-bg-surface);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
  transition: all 0.2s ease;
}

.c-item-list__item-wrapper:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.c-item-list__content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.c-item-list__header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.c-item-list__favicon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border-radius: 4px;
}

.c-item-list__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.c-item-list__body {
  margin-top: 4px;
}

.c-item-list__url {
  font-size: 0.8rem;
  color: var(--color-primary);
  text-decoration: none;
  word-break: break-all;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.c-item-list__url:hover {
  text-decoration: underline;
}

.c-item-list__text {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: pre-wrap;
}

.c-item-list__actions-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--color-border);
  padding-top: 12px;
  gap: 12px;
}

.c-item-list__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.c-item-list__badge {
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 6px;
  background-color: var(--color-bg-page);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
  white-space: nowrap;
}

.c-item-list__actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.c-btn {
  padding: 6px 12px;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-main);
  transition: all 0.2s;
}

.c-btn:hover {
  background: var(--color-bg-page);
}

.c-btn.is-danger {
  color: var(--color-danger);
  border-color: rgba(220, 53, 69, 0.3);
}

.c-btn.is-danger:hover {
  background: rgba(220, 53, 69, 0.1);
  border-color: var(--color-danger);
}
</style>

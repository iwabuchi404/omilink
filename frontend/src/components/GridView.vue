<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted, toRef } from 'vue';
import pb from '../lib/pocketbase';
import GridCard from './grid/GridCard.vue';
import EditItemModal from './modals/EditItemModal.vue';
import AddToViewModal from './modals/AddToViewModal.vue';
import MemoViewModal from './modals/MemoViewModal.vue';
import { useGridInteract, type ViewItem, type ItemType } from './grid/useGridInteract';
import type { PlacementsResponse, ItemsResponse, ViewsResponse } from '../lib/pocketbase-types';

type ExpandedViewItem = PlacementsResponse<{ item: ItemsResponse }>;

const emit = defineEmits<{
  (e: 'move-success'): void;
  (e: 'scroll', scrollTop: number): void;
}>();

const props = defineProps<{
  isEditMode: boolean;
  currentView: ViewsResponse;
  views: ViewsResponse[];
  searchQuery: string;
}>();

const items = ref<ViewItem[]>([]);
const loading = ref(true);
const editingItem = ref<ViewItem | null>(null);
const viewingMemo = ref<ViewItem | null>(null);
const addingItem = ref<ViewItem | null>(null);
const showEditModal = ref(false);
const showMemoModal = ref(false);
const showAddToViewModal = ref(false);

function openEditModal(item: ViewItem) {
  editingItem.value = item;
  showEditModal.value = true;
}

function openMemoView(item: ViewItem) {
  viewingMemo.value = item;
  showMemoModal.value = true;
}

function openAddToViewModal(item: ViewItem) {
  addingItem.value = item;
  showAddToViewModal.value = true;
}

const onScroll = (e: Event) => {
  const target = e.target as HTMLElement;
  emit('scroll', target.scrollTop);
};

const filteredItems = computed(() => {
  if (!props.searchQuery) return items.value;
  const query = props.searchQuery.toLowerCase();
  return items.value.map(item => ({
    ...item,
    isFiltered: !(
      item.title.toLowerCase().includes(query) ||
      item.content.toLowerCase().includes(query) ||
      (item.url && item.url.toLowerCase().includes(query))
    )
  }));
});


// Fetch data from PocketBase
async function fetchItems() {
  loading.value = true;
  try {
    // Get placements for the current view with expanded item data
    const records = await pb.collection('placements').getFullList<ExpandedViewItem>({
      filter: `view = "${props.currentView.id}" && item.is_deleted = false`,
      expand: 'item',
    });

    items.value = records.map(record => {
      const item = record.expand?.item;
      const type = (item?.type || 'bookmark') as ItemType;
      
      // Provide safe fallbacks for position and size
      return {
        id: record.id,
        itemId: record.item,
        type,
        title: item?.title || 'Untitled',
        content: (type === 'memo' ? item?.memo : item?.description) || '',
        url: item?.url,
        og_image_url: item?.og_image_url,
        favicon_url: item?.favicon_url,
        x: record.col ?? 0,
        y: record.row ?? 0,
        w: record.width || (type === 'memo' ? 2 : 2), // Default to 2x1 for both for now
        h: record.height || 1,
        color: '#ffffff',
      };
    });
  } catch (err: any) {
    console.error('Failed to fetch items:', err);
  } finally {
    loading.value = false;
  }
}

watch(() => props.currentView, () => {
  fetchItems();
});

// Update position/size in PocketBase
async function persistChange(item: ViewItem) {
  try {
    await pb.collection('placements').update(item.id, {
      col: item.x,
      row: item.y,
      width: item.w,
      height: item.h,
    });
  } catch (err) {
    console.error('Failed to persist change:', err);
  }
}

// Remove placement only (item remains in DB)
async function removeItem(item: ViewItem) {
  try {
    await pb.collection('placements').delete(item.id);
    items.value = items.value.filter(i => i.id !== item.id);
  } catch (err) {
    console.error('Failed to remove item:', err);
  }
}

// Soft-delete: mark item as is_deleted, remove all its placements from view
async function deleteItem(item: ViewItem) {
  if (!confirm(`Move "${item.title}" to Trash?`)) return;

  try {
    // Soft-delete the item
    await pb.collection('items').update(item.itemId, {
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    });
    // Remove from local list immediately
    items.value = items.value.filter(i => i.id !== item.id);
  } catch (err) {
    console.error('Failed to move to trash:', err);
  }
}

const gridHeight = computed(() => {
  const maxY = items.value.reduce((max, item) => Math.max(max, item.y + item.h), props.currentView?.rows || 6);
  return maxY * (gridSize || 100);
});

const gridWidth = computed(() => {
  const cols = props.currentView?.cols || 8;
  return cols * (gridSize || 100);
});

// Use Grid Interact composable
const { dragPreview, gridSize, gap, setupInteract, teardownInteract } = useGridInteract(
  items,
  toRef(props, 'currentView'),
  toRef(props, 'isEditMode'),
  persistChange
);

// Export fetchItems for parent access
defineExpose({ fetchItems });

onMounted(() => {
  fetchItems();
  setupInteract();
});

onUnmounted(() => {
  teardownInteract();
});
</script>

<template>
  <div class="c-grid-container p-grid" :class="{ 'is-edit-mode': isEditMode }" @scroll.passive="onScroll">
    <div v-if="loading" class="p-grid__loading">{{ $t('grid.loading') }}</div>
    <div v-else class="p-grid__container" 
         :class="{ 'is-drag-invalid': dragPreview && !dragPreview.isValid }"
         :style="{ 
      width: `${gridWidth}px`,
      minWidth: `${gridWidth}px`,
      maxWidth: `${gridWidth}px`,
      height: `${gridHeight}px`,
      '--grid-size': `${gridSize}px`,
      '--grid-gap': `${gap}px`,
      outline: dragPreview ? (isEditMode ? '2px solid var(--color-primary)' : '2px dashed var(--color-primary)') : 'none',
      outlineOffset: '-2px',
      display: 'block'
    }">
      <div 
        v-for="item in (filteredItems as any)" 
        :key="item.id"
        class="c-card-wrapper"
        :class="{ 'is-filtered-out': item.isFiltered }"
        :style="{
          width: `${item.w * gridSize - gap}px`,
          height: `${item.h * gridSize - gap}px`,
          transform: `translate(${item.x * gridSize}px, ${item.y * gridSize}px)`,
          margin: `${gap / 2}px`
        }"
        :data-id="item.id"
        :data-x="item.x * gridSize"
        :data-y="item.y * gridSize"
      >
        <GridCard 
          :item="item" 
          :is-edit-mode="isEditMode" 
          :is-filtered="item.isFiltered"
          @remove="removeItem(item)" 
          @delete="deleteItem(item)"
          @add-to-view="openAddToViewModal(item)"
          @edit="openEditModal(item)"
          @view-memo="openMemoView(item)"
        />
      </div>
      
      <div v-if="items.length === 0 && !dragPreview" class="p-grid__empty">
        {{ $t('grid.empty') }}
      </div>

      <!-- Drag Preview Ghost -->
      <div 
        v-if="dragPreview" 
        class="c-card-ghost"
        :class="{ 'is-invalid': !dragPreview.isValid }"
        :style="{
          width: `${dragPreview.w * gridSize - gap}px`,
          height: `${dragPreview.h * gridSize - gap}px`,
          transform: `translate(${dragPreview.col * gridSize}px, ${dragPreview.row * gridSize}px)`,
          margin: `${gap / 2}px`
        }"
      >
        <div class="c-card-ghost__inner">
          <span class="c-card-ghost__title">{{ dragPreview.title }}</span>
        </div>
      </div>
    </div>

    <!-- Edit Item Modal -->
    <EditItemModal 
      :show="showEditModal" 
      :item="editingItem"
      @close="showEditModal = false"
      @success="fetchItems"
    />

    <!-- Memo View Modal (now an Editor) -->
    <MemoViewModal
      :show="showMemoModal"
      :item="viewingMemo"
      @close="showMemoModal = false"
      @success="fetchItems"
    />

    <!-- Add To View Modal -->
    <AddToViewModal
      :show="showAddToViewModal"
      :item="addingItem"
      :views="views"
      :current-view-id="currentView.id"
      @close="showAddToViewModal = false"
      @success="fetchItems"
    />
  </div>
</template>

<style scoped>
.p-grid__loading, .p-grid__empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: var(--color-text-muted);
  font-style: italic;
  width: 100%;
}

.c-grid-container {
  overflow: auto;
  position: relative;
  height: 100%;
  width: 100%;
  padding: 24px;
  -webkit-overflow-scrolling: touch;
  background-color: var(--color-bg-page);
  transition: background-color 0.3s ease;
  user-select: none;
  touch-action: none;
}

.p-grid__container {
  position: relative;
  background-color: var(--color-bg-surface);
  background-image: 
    linear-gradient(to right, var(--color-border) 1px, transparent 1px),
    linear-gradient(to bottom, var(--color-border) 1px, transparent 1px);
  background-size: var(--grid-size, 100px) var(--grid-size, 100px);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
}

.is-edit-mode .p-grid__container {
  outline: 2px solid var(--color-primary);
  outline-offset: 4px;
}

.p-grid__container.is-drag-invalid {
  background-color: rgba(220, 53, 69, 0.05) !important;
  outline-color: var(--color-danger) !important;
}

/* Wrapper for GridCard */
.c-card-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 12px;
  transition: opacity 0.3s ease, filter 0.3s ease;
}

.c-grid-container.is-edit-mode .c-card-wrapper {
  z-index: 10;
}

.c-card-wrapper.is-filtered-out {
  opacity: 0.15;
  filter: grayscale(1) blur(1px);
  pointer-events: none;
  z-index: 1;
}

/* Prevent clicks during panning */
.p-grid.is-panning .c-card-wrapper {
  pointer-events: none;
}

/* Resize handle style improvement */
.c-grid-container.is-edit-mode .c-card-wrapper::after {
  content: '';
  position: absolute;
  right: 4px;
  bottom: 4px;
  width: 12px;
  height: 12px;
  background: var(--color-primary);
  clip-path: polygon(100% 0, 100% 100%, 0 100%);
  cursor: nwse-resize;
  border-radius: 0 0 4px 0;
  opacity: 0.6;
  transition: opacity 0.2s;
  z-index: 20;
}

.c-grid-container.is-edit-mode .c-card-wrapper:hover::after {
  opacity: 1;
}

/* Ghost Preview */
.c-card-ghost {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1000;
  transition: transform 0.05s ease-out;
}

.c-card-ghost.is-invalid .c-card-ghost__inner {
  background-color: rgba(220, 53, 69, 0.1);
  border-color: var(--color-danger);
  box-shadow: 0 0 20px rgba(220, 53, 69, 0.2);
}

.c-card-ghost.is-invalid .c-card-ghost__title {
  color: var(--color-danger);
}

.c-card-ghost__inner {
  width: 100%;
  height: 100%;
  background-color: rgba(26, 115, 232, 0.1);
  border: 2px dashed var(--color-primary);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  box-shadow: 0 0 20px rgba(26, 115, 232, 0.15);
  transition: all 0.2s ease;
}

.c-card-ghost__title {
  color: var(--color-primary);
  font-weight: 700;
  font-size: 0.9rem;
  text-align: center;
  opacity: 0.8;
}
</style>

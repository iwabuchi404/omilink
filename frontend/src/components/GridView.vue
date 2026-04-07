<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted } from 'vue';
import interact from 'interactjs';
import pb from '../lib/pocketbase';
import GridCard from './grid/GridCard.vue';
import EditItemModal from './modals/EditItemModal.vue';
import AddToViewModal from './modals/AddToViewModal.vue';
import type { PlacementsResponse, ItemsResponse, ViewsResponse } from '../lib/pocketbase-types';

type ExpandedViewItem = PlacementsResponse<{ item: ItemsResponse }>;

type ItemType = 'bookmark' | 'memo';

interface ViewItem {
  id: string; // placements record id
  itemId: string;
  type: ItemType;
  title: string;
  content: string;
  url?: string;
  og_image_url?: string;
  favicon_url?: string;
  x: number; // col
  y: number; // row
  w: number; // width
  h: number; // height
  color: string;
}

const emit = defineEmits<{
  (e: 'move-success'): void;
}>();

const props = defineProps<{
  isEditMode: boolean;
  currentView: ViewsResponse;
  views: ViewsResponse[];
  searchQuery: string;
}>();

const gridSize = 100;
const gap = 10;
const items = ref<ViewItem[]>([]);
const loading = ref(true);
const dragPreview = ref<{ col: number, row: number, w: number, h: number, title: string, isValid: boolean } | null>(null);
const editingItem = ref<ViewItem | null>(null);
const addingItem = ref<ViewItem | null>(null);
const showEditModal = ref(false);
const showAddToViewModal = ref(false);

function openEditModal(item: ViewItem) {
  editingItem.value = item;
  showEditModal.value = true;
}

function openAddToViewModal(item: ViewItem) {
  addingItem.value = item;
  showAddToViewModal.value = true;
}

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

// Constraints
const constraints = {
  bookmark: { minW: 1, minH: 1, maxW: 4, maxH: 4 },
  memo: { minW: 2, minH: 1, maxW: 4, maxH: 4 },
};

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
      return {
        id: record.id,
        itemId: record.item,
        type: (item?.type || 'bookmark') as ItemType,
        title: item?.title || '',
        content: item?.description || item?.memo || '',
        url: item?.url,
        og_image_url: item?.og_image_url,
        favicon_url: item?.favicon_url,
        x: record.col ?? 0,
        y: record.row ?? 0,
        w: record.width,
        h: record.height,
        color: '#ffffff', // Deprecated in V2 placements
      };
    });
  } catch (err: any) {
    console.error('Failed to fetch items:', err);
    console.error('Error details:', err.data); // This shows field validation errors
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
    console.log('Position persisted:', item.id);
  } catch (err) {
    console.error('Failed to persist change:', err);
    // Optional: Revert UI if needed
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
  const maxY = items.value.reduce((max, item) => Math.max(max, item.y + item.h), 10);
  return maxY * gridSize;
});

const gridWidth = computed(() => {
  return props.currentView.cols * gridSize;
});

const isOverlapping = (r1: {x:number, y:number, w:number, h:number}, r2: {x:number, y:number, w:number, h:number}) => {
  return !(r1.x + r1.w <= r2.x || 
           r2.x + r2.w <= r1.x || 
           r1.y + r1.h <= r2.y || 
           r2.y + r2.h <= r1.y);
};

const isValidPosition = (targetId: string, x: number, y: number, w: number, h: number) => {
  if (x < 0 || y < 0) return false;
  // Enforce column boundaries
  if (x + w > props.currentView.cols) return false;
  
  return !items.value.some(item => {
    if (item.id === targetId) return false;
    return isOverlapping({ x, y, w, h }, { x: item.x, y: item.y, w: item.w, h: item.h });
  });
};

// Export fetchItems for parent access
defineExpose({ fetchItems });

// Removed INBOX related functions (moveItemFromInbox, removeFromView)

// Helper to calculate col/row from client coordinates
function calculateGridPosition(clientX: number, clientY: number, container: HTMLElement, w: number = 1, h: number = 1) {
  const containerRect = container.getBoundingClientRect();

  // Calculate raw offset within the container (already accounts for scroll via getBoundingClientRect)
  const offsetX = clientX - containerRect.left;
  const offsetY = clientY - containerRect.top;

  // To center the card on the mouse, we subtract half the card size
  const snappedX = offsetX - (w * gridSize / 2);
  const snappedY = offsetY - (h * gridSize / 2);

  const col = Math.min(props.currentView.cols - w, Math.max(0, Math.round(snappedX / gridSize)));
  const row = Math.max(0, Math.round(snappedY / gridSize));
  return { col, row };
}

// ドラッグ中のメタ情報（リアクティブ不要）
let currentDragMeta: { type: ItemType, title: string, w: number, h: number } | null = null;

// pointermove でゴーストをグリッドスナップ更新する
function updateGhostFromPointer(e: PointerEvent) {
  const container = document.querySelector<HTMLElement>('.p-grid__container');
  if (!container || !currentDragMeta) return;

  const rect = container.getBoundingClientRect();
  const isOutOfBounds = e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom;

  const { w, h, title } = currentDragMeta;
  const { col, row } = calculateGridPosition(e.clientX, e.clientY, container, w, h);
  const isValid = !isOutOfBounds && isValidPosition('', col, row, w, h);

  // 変化があった場合のみ更新
  if (!dragPreview.value || dragPreview.value.col !== col || dragPreview.value.row !== row || dragPreview.value.isValid !== isValid) {
    dragPreview.value = { col, row, w, h, title, isValid };
  }
}

onMounted(() => {
  fetchItems();
  
  // Enable dynamic dropzone hit testing
  interact.dynamicDrop(true);

  let originalPos = { x: 0, y: 0, w: 0, h: 0 };

  interact('.p-grid').draggable({
    ignoreFrom: '.c-card-wrapper',
    cursorChecker: (_action, _interactable, _element, interacting) => interacting ? 'grabbing' : 'default',
    listeners: {
      move(event) {
        event.currentTarget.scrollLeft -= event.dx;
        event.currentTarget.scrollTop -= event.dy;
      }
    }
  });

  const cardInteractable = interact('.c-card-wrapper')
    .draggable({
      enabled: props.isEditMode,
      inertia: false,
      autoScroll: true,
      modifiers: [
        interact.modifiers.snap({
          targets: [interact.snappers.grid({ x: gridSize, y: gridSize })],
          range: Infinity,
          relativePoints: [{ x: 0, y: 0 }]
        })
      ],
      listeners: {
        start(event) {
          const target = event.target;
          target.classList.add('is-dragging');
          target.closest('.p-grid__container')?.classList.add('drop-active');
          const id = target.getAttribute('data-id');
          const item = items.value.find(i => i.id === id);
          if (item) {
            originalPos = { x: item.x, y: item.y, w: item.w, h: item.h };
            const x = parseFloat(target.getAttribute('data-x')) || 0;
            const y = parseFloat(target.getAttribute('data-y')) || 0;
            target.style.transform = `translate(${x + 15}px, ${y - 15}px)`;

            // Initialize ghost preview for internal move
            dragPreview.value = { 
              col: item.x, 
              row: item.y, 
              w: item.w, 
              h: item.h, 
              title: item.title, 
              isValid: true 
            };
          }
        },
        move(event) {
          const target = event.target;
          const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
          const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
          target.style.transform = `translate(${x + 15}px, ${y - 15}px)`;
          target.setAttribute('data-x', x);
          target.setAttribute('data-y', y);

          // Update ghost preview position
          const id = target.getAttribute('data-id');
          const item = items.value.find(i => i.id === id);
          const container = target.closest('.p-grid__container') as HTMLElement;
          if (container && item && dragPreview.value) {
            const { col, row } = calculateGridPosition(event.clientX, event.clientY, container, item.w, item.h);
            const rect = container.getBoundingClientRect();
            const isOutOfBounds = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
            const isValid = !isOutOfBounds && isValidPosition(item.id, col, row, item.w, item.h);
            
            if (dragPreview.value.col !== col || dragPreview.value.row !== row || dragPreview.value.isValid !== isValid) {
              dragPreview.value = { ...dragPreview.value, col, row, isValid };
            }
          }
        },
        end(event) {
          const target = event.target;
          target.classList.remove('is-dragging');
          target.closest('.p-grid__container')?.classList.remove('drop-active');
          
          const finalPreview = dragPreview.value;
          dragPreview.value = null; // Hide ghost
          
          const id = target.getAttribute('data-id');
          const item = items.value.find(i => i.id === id);
          if (!item) return;

          let snappedX = originalPos.x;
          let snappedY = originalPos.y;

          if (finalPreview && finalPreview.isValid) {
            snappedX = finalPreview.col;
            snappedY = finalPreview.row;
          }

          if (isValidPosition(id, snappedX, snappedY, item.w, item.h)) {
            item.x = snappedX;
            item.y = snappedY;
            // Only persist if position actually changed
            if (item.x !== originalPos.x || item.y !== originalPos.y) {
              persistChange(item); // Persist to DB
            }
          } else {
            item.x = originalPos.x;
            item.y = originalPos.y;
          }

          const finalX = item.x * gridSize;
          const finalY = item.y * gridSize;
          target.style.transform = `translate(${finalX}px, ${finalY}px)`;
          target.setAttribute('data-x', finalX);
          target.setAttribute('data-y', finalY);
        }
      }
    })
    .resizable({
      enabled: props.isEditMode,
      edges: { right: true, bottom: true },
      modifiers: [
        interact.modifiers.snapSize({
          targets: [interact.snappers.grid({ x: gridSize, y: gridSize })],
          range: Infinity,
        }),
      ],
      listeners: {
        start(event) {
          event.target.classList.add('is-resizing');
          const id = event.target.getAttribute('data-id');
          const item = items.value.find(i => i.id === id);
          if (item) {
            originalPos = { x: item.x, y: item.y, w: item.w, h: item.h };
          }
        },
        move(event) {
          const target = event.target;
          const id = target.getAttribute('data-id');
          const item = items.value.find(i => i.id === id);
          if (!item) return;

          const limit = constraints[item.type];
          const maxW = props.currentView.cols - item.x;
          let newW = Math.max(limit.minW * gridSize, Math.min(Math.min(limit.maxW, maxW) * gridSize, event.rect.width));
          let newH = Math.max(limit.minH * gridSize, Math.min(limit.maxH * gridSize, event.rect.height));

          target.style.width = newW + 'px';
          target.style.height = newH + 'px';
          
          const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.deltaRect.left;
          const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.deltaRect.top;
          target.style.transform = `translate(${x}px, ${y}px)`;
          target.setAttribute('data-x', x);
          target.setAttribute('data-y', y);
        },
        end(event) {
          const target = event.target;
          target.classList.remove('is-resizing');
          const id = target.getAttribute('data-id');
          const item = items.value.find(i => i.id === id);
          if (!item) return;

          const limit = constraints[item.type];
          const maxW = props.currentView.cols - item.x;
          const snappedW = Math.max(limit.minW, Math.min(Math.min(limit.maxW, maxW), Math.round(event.rect.width / gridSize)));
          const snappedH = Math.max(limit.minH, Math.min(limit.maxH, Math.round(event.rect.height / gridSize)));
          
          if (isValidPosition(id, item.x, item.y, snappedW, snappedH)) {
            item.w = snappedW;
            item.h = snappedH;
            persistChange(item); // Persist to DB
          } else {
            item.w = originalPos.w;
            item.h = originalPos.h;
          }
          target.style.width = (item.w * gridSize - gap) + 'px';
          target.style.height = (item.h * gridSize - gap) + 'px';
        }
      }
    });

  watch(() => props.isEditMode, (newMode) => {
    cardInteractable.draggable({ enabled: newMode });
    cardInteractable.resizable({ enabled: newMode });
  });

});

onUnmounted(() => {
  document.removeEventListener('pointermove', updateGhostFromPointer);
});
</script>

<template>
  <div class="c-grid-container" :class="{ 'is-edit-mode': isEditMode }">
    <div v-if="loading" class="p-grid__loading">{{ $t('grid.loading') }}</div>
    <div v-else class="p-grid__container" 
         :class="{ 'is-drag-invalid': dragPreview && !dragPreview.isValid }"
         :style="{ 
      width: `${gridWidth}px`,
      minWidth: `${gridWidth}px`,
      maxWidth: `${gridWidth}px`,
      height: `${gridHeight}px`,
      outline: dragPreview ? (isEditMode ? '2px solid #1a73e8' : '2px dashed #1a73e8') : 'none',
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
  color: #666;
  font-style: italic;
  width: 100%;
}

.c-grid-container {
  overflow: auto;
  position: relative;
  height: 100%;
  width: 100%;
  padding: 40px; /* Increased padding to make the bounds clearer */
  -webkit-overflow-scrolling: touch;
  background-color: #f4f5f7; /* Very light gray for the outer area */
}

.p-grid__container {
  position: relative;
  background-color: #ffffff; /* Solid white background for the valid grid */
  background-image: 
    linear-gradient(to right, #e5e7eb 1px, transparent 1px),
    linear-gradient(to bottom, #e5e7eb 1px, transparent 1px);
  background-size: 100px 100px; /* gridSize */
  border-right: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  border-radius: 8px; /* Slightly rounded corners */
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01);
  transition: background-color 0.3s, outline 0.3s;
}

.p-grid__container.drop-active {
  background-color: rgba(26, 115, 232, 0.05);
}

.p-grid__container.drop-target {
  background-color: rgba(26, 115, 232, 0.1);
}

.p-grid__container.is-drag-invalid {
  background-color: rgba(220, 53, 69, 0.05) !important;
  outline-color: #dc3545 !important;
}

/* Wrapper for GridCard to handle interact.js positioning securely */
.c-card-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 8px; /* Match inner card */
}

.c-grid-container.is-edit-mode .c-card-wrapper {
  outline: 1px dashed #007bff55;
  z-index: 10;
}

.c-card-wrapper.is-filtered-out {
  opacity: 0.3;
  filter: grayscale(1);
  pointer-events: none;
  z-index: 1;
}

.c-grid-container.is-edit-mode .c-card-wrapper::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: 0;
  width: 15px;
  height: 15px;
  background: linear-gradient(135deg, transparent 50%, #007bff 50%);
  cursor: nwse-resize;
  border-radius: 0 0 8px 0;
  z-index: 20;
}

/* Ghost Preview */
.c-card-ghost {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1000;
  transition: transform 0.05s ease-out; /* Super snappy */
}

.c-card-ghost.is-invalid .c-card-ghost__inner {
  background-color: rgba(220, 53, 69, 0.15);
  border-color: #dc3545;
  box-shadow: 0 0 15px rgba(220, 53, 69, 0.2);
}

.c-card-ghost.is-invalid .c-card-ghost__title {
  color: #dc3545;
}

.c-card-ghost__inner {
  width: 100%;
  height: 100%;
  background-color: rgba(26, 115, 232, 0.15);
  border: 2px dashed #1a73e8;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  box-shadow: 0 0 15px rgba(26, 115, 232, 0.2);
  transition: background-color 0.2s, border-color 0.2s;
}

.c-card-ghost__title {
  color: #1a73e8;
  font-weight: 600;
  font-size: 0.85rem;
  text-align: center;
  opacity: 0.6;
}
</style>

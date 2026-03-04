<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import interact from 'interactjs';
import pb from '../lib/pocketbase';
import type { PlacementsResponse, ItemsResponse } from '../lib/pocketbase-types';

type ExpandedViewItem = PlacementsResponse<{ item: ItemsResponse }>;

type ItemType = 'bookmark' | 'memo';

interface ViewItem {
  id: string; // placements record id
  itemId: string;
  type: ItemType;
  title: string;
  content: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string;
}

const props = defineProps<{
  isEditMode: boolean;
}>();

const gridSize = 100;
const gap = 10;
const items = ref<ViewItem[]>([]);
const loading = ref(true);

// Constraints
const constraints = {
  bookmark: { minW: 1, minH: 1, maxW: 4, maxH: 4 },
  memo: { minW: 2, minH: 1, maxW: 4, maxH: 4 },
};

// Fetch data from PocketBase
async function fetchItems() {
  loading.value = true;
  try {
    // Get placements with expanded item data
    const records = await pb.collection('placements').getFullList<ExpandedViewItem>({
      expand: 'item',
    });

    items.value = records.map(record => {
      const item = record.expand?.item;
      return {
        id: record.id,
        itemId: record.item,
        type: (item?.type || 'bookmark') as ItemType,
        title: item?.title || 'Untitled',
        content: item?.description || item?.memo || item?.url || '',
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

const gridHeight = computed(() => {
  const maxY = items.value.reduce((max, item) => Math.max(max, item.y + item.h), 10);
  return maxY * gridSize;
});

const gridWidth = computed(() => {
  const maxX = items.value.reduce((max, item) => Math.max(max, item.x + item.w), 15);
  return maxX * gridSize;
});

const isOverlapping = (r1: {x:number, y:number, w:number, h:number}, r2: {x:number, y:number, w:number, h:number}) => {
  return !(r1.x + r1.w <= r2.x || 
           r2.x + r2.w <= r1.x || 
           r1.y + r1.h <= r2.y || 
           r2.y + r2.h <= r1.y);
};

const isValidPosition = (targetId: string, x: number, y: number, w: number, h: number) => {
  if (x < 0 || y < 0) return false;
  return !items.value.some(item => {
    if (item.id === targetId) return false;
    return isOverlapping({ x, y, w, h }, { x: item.x, y: item.y, w: item.w, h: item.h });
  });
};

// Export fetchItems for parent access
defineExpose({ fetchItems });

onMounted(() => {
  fetchItems();

  let originalPos = { x: 0, y: 0, w: 0, h: 0 };

  interact('.p-grid').draggable({
    ignoreFrom: '.c-card',
    cursorChecker: (_action, _interactable, _element, interacting) => interacting ? 'grabbing' : 'default',
    listeners: {
      move(event) {
        event.currentTarget.scrollLeft -= event.dx;
        event.currentTarget.scrollTop -= event.dy;
      }
    }
  });

  const cardInteractable = interact('.c-card')
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
          const id = target.getAttribute('data-id');
          const item = items.value.find(i => i.id === id);
          if (item) {
            originalPos = { x: item.x, y: item.y, w: item.w, h: item.h };
            const x = parseFloat(target.getAttribute('data-x')) || 0;
            const y = parseFloat(target.getAttribute('data-y')) || 0;
            target.style.transform = `translate(${x + 15}px, ${y - 15}px)`;
          }
        },
        move(event) {
          const target = event.target;
          const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
          const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
          target.style.transform = `translate(${x + 15}px, ${y - 15}px)`;
          target.setAttribute('data-x', x);
          target.setAttribute('data-y', y);
        },
        end(event) {
          const target = event.target;
          target.classList.remove('is-dragging');
          const id = target.getAttribute('data-id');
          const item = items.value.find(i => i.id === id);
          if (!item) return;

          const rawX = parseFloat(target.getAttribute('data-x')) || 0;
          const rawY = parseFloat(target.getAttribute('data-y')) || 0;
          const snappedX = Math.round(rawX / gridSize);
          const snappedY = Math.round(rawY / gridSize);

          if (isValidPosition(id, snappedX, snappedY, item.w, item.h)) {
            item.x = snappedX;
            item.y = snappedY;
            persistChange(item); // Persist to DB
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
          let newW = Math.max(limit.minW * gridSize, Math.min(limit.maxW * gridSize, event.rect.width));
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
          const snappedW = Math.max(limit.minW, Math.min(limit.maxW, Math.round(event.rect.width / gridSize)));
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
</script>

<template>
  <div class="p-grid" :class="{ 'is-edit-mode': isEditMode }">
    <div v-if="loading" class="p-grid__loading">Loading your bookmarks...</div>
    <div v-else class="p-grid__container" :style="{ width: `${gridWidth}px`, height: `${gridHeight}px` }">
      <div 
        v-for="item in items" 
        :key="item.id"
        class="c-card"
        :class="[`is-${item.type}`]"
        :style="{
          width: `${item.w * gridSize - gap}px`,
          height: `${item.h * gridSize - gap}px`,
          transform: `translate(${item.x * gridSize}px, ${item.y * gridSize}px)`,
          backgroundColor: item.color || (item.type === 'memo' ? '#fffef0' : '#fff'),
          margin: `${gap / 2}px`
        }"
        :data-id="item.id"
        :data-x="item.x * gridSize"
        :data-y="item.y * gridSize"
      >
        <div class="c-card__title">
          <span v-if="item.type === 'bookmark'">🔗</span>
          <span v-else>📝</span>
          {{ item.title }}
        </div>
        <div class="c-card__content">{{ item.content }}</div>
        <div class="c-card__footer">#{{ item.type }}</div>
      </div>
      
      <div v-if="items.length === 0" class="p-grid__empty">
        No items yet. Click "+ Add" to create your first bookmark!
      </div>
    </div>
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

.p-grid.is-edit-mode .c-card {
  outline: 1px dashed #007bff55;
}

.p-grid.is-edit-mode .c-card::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: 0;
  width: 15px;
  height: 15px;
  background: linear-gradient(135deg, transparent 50%, #007bff 50%);
  cursor: nwse-resize;
  border-radius: 0 0 8px 0;
}
</style>

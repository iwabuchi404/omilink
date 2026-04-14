<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import interact from 'interactjs';
import type { ViewsResponse } from '../../lib/pocketbase-types';

const props = defineProps<{
  views: ViewsResponse[];
  currentViewId: string | null;
  isEditMode: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:currentViewId', id: string): void;
  (e: 'addView'): void;
  (e: 'editView', view: ViewsResponse): void;
  (e: 'reorder', views: ViewsResponse[]): void;
}>();

const draggedIndex = ref<number | null>(null);
let interactables: any[] = [];

const setupInteract = () => {
  if (interactables.length) return;

  const tabs = interact('.c-view-tabs__tab').draggable({
    enabled: props.isEditMode,
    allowFrom: '.c-view-tabs__handle',
    listeners: {
      start(event) {
        const id = event.target.getAttribute('data-id');
        draggedIndex.value = props.views.findIndex(v => v.id === id);
        event.target.classList.add('is-dragging');
      },
      move(event) {
        const index = draggedIndex.value;
        if (index === null) return;
        
        const target = event.target;
        const centerX = event.clientX;
        
        // Find if we should swap with left or right neighbor
        const neighborLeft = target.previousElementSibling as HTMLElement;
        const neighborRight = target.nextElementSibling as HTMLElement;
        
        if (neighborLeft && neighborLeft.classList.contains('c-view-tabs__tab')) {
          const leftRect = neighborLeft.getBoundingClientRect();
          if (centerX < leftRect.right - leftRect.width / 4) { // Sensitivity adjustment
            const neighborId = neighborLeft.getAttribute('data-id');
            const targetIndex = props.views.findIndex(v => v.id === neighborId);
            if (targetIndex !== -1) swap(index, targetIndex);
            return;
          }
        }
        
        if (neighborRight && neighborRight.classList.contains('c-view-tabs__tab')) {
          const rightRect = neighborRight.getBoundingClientRect();
          if (centerX > rightRect.left + rightRect.width / 4) { // Sensitivity adjustment
            const neighborId = neighborRight.getAttribute('data-id');
            const targetIndex = props.views.findIndex(v => v.id === neighborId);
            if (targetIndex !== -1) swap(index, targetIndex);
            return;
          }
        }
      },
      end(event) {
        draggedIndex.value = null;
        event.target.classList.remove('is-dragging');
      }
    }
  });

  interactables.push(tabs);
};

const swap = (from: number, to: number) => {
  if (to < 0 || to >= props.views.length) return;
  
  const newViews = [...props.views];
  const item = newViews.splice(from, 1)[0];
  if (!item) return;
  newViews.splice(to, 0, item);
  
  draggedIndex.value = to;
  emit('reorder', newViews);
};

onMounted(() => {
  setupInteract();
});

onUnmounted(() => {
  interactables.forEach(i => i.unset());
});

watch(() => props.isEditMode, (newVal) => {
  interact('.c-view-tabs__tab').draggable({ enabled: newVal });
});
</script>

<template>
  <div class="l-sub-header" :class="{ 'is-bottom': $attrs.class === 'is-bottom' }">
    <div class="c-view-tabs">
      <TransitionGroup name="tab-list" tag="div" class="c-view-tabs__inner">
        <button 
          v-for="(v, index) in views" 
          :key="v.id" 
          class="c-view-tabs__tab"
          :class="{ 
            'is-active': v.id === currentViewId,
            'is-dragging': draggedIndex === index,
            'is-sortable': isEditMode
          }"
          :data-id="v.id"
          @click="$emit('update:currentViewId', v.id)"
        >
          <span v-if="isEditMode" class="c-view-tabs__handle">⠿</span>
          <span class="c-view-tabs__tab-name">{{ v.name }}</span>
          <button 
            v-if="isEditMode" 
            class="c-view-tabs__settings-btn"
            @click.stop="$emit('editView', v)"
            :title="$t('modal.viewSettings')"
          >
            ⚙️
          </button>
        </button>
      </TransitionGroup>

      <button class="c-view-tabs__add-btn" @click="$emit('addView')" :title="$t('modal.newView')">
        <span>＋</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.l-sub-header {
  flex-shrink: 0;
  background-color: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-border);
  padding: 0 24px;
  transition: all 0.3s ease;
  z-index: 100;
}

.l-sub-header.is-bottom {
  border-bottom: none;
  border-top: 1px solid var(--color-border);
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  padding-bottom: calc(env(safe-area-inset-bottom, 0) + 12px); /* Add extra safety padding */
}

.c-view-tabs {
  display: flex;
  align-items: center;
  height: 48px;
}

.c-view-tabs__inner {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
  align-items: center;
  height: 100%;
}

.c-view-tabs__inner::-webkit-scrollbar {
  display: none;
}

.c-view-tabs__tab {
  background: none;
  border: none;
  padding: 0 16px;
  height: 100%;
  cursor: pointer;
  color: var(--color-text-muted);
  font-weight: 600;
  font-size: 0.9rem;
  border-bottom: 3px solid transparent;
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: -0.01em;
  user-select: none;
}

.c-view-tabs__tab.is-sortable {
  cursor: grab;
  padding-left: 10px;
  touch-action: pan-x; /* Allow horizontal scrolling on the tab itself */
}

.l-sub-header.is-bottom .c-view-tabs__tab {
  border-bottom: none;
  border-top: 3px solid transparent;
}

.c-view-tabs__tab:hover {
  color: var(--color-text-main);
  background-color: var(--color-bg-page);
}

.c-view-tabs__tab.is-active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.l-sub-header.is-bottom .c-view-tabs__tab.is-active {
  border-top-color: var(--color-primary);
}

.c-view-tabs__handle {
  font-size: 1.25rem;
  opacity: 0.4;
  margin-right: -4px;
  margin-left: -10px;
  padding: 8px 12px;
  transition: opacity 0.2s;
  touch-action: none; /* Critical for mobile drag */
}

.c-view-tabs__tab:hover .c-view-tabs__handle {
  opacity: 0.7;
}

.c-view-tabs__tab.is-dragging {
  opacity: 0.2;
  background-color: var(--color-bg-page);
  cursor: grabbing;
}

.c-view-tabs__settings-btn {
  background: none;
  border: none;
  padding: 6px;
  margin-left: 6px;
  cursor: pointer;
  font-size: 1.1rem;
  opacity: 0.6;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.c-view-tabs__settings-btn:hover {
  opacity: 1;
  background-color: rgba(0,0,0,0.05);
}

[data-theme="dark"] .c-view-tabs__settings-btn:hover {
  background-color: rgba(255,255,255,0.1);
}

/* Transition Group Animations */
.tab-list-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.c-view-tabs__add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-left: 12px;
  background: var(--color-bg-page);
  border: 1px dashed var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  color: var(--color-text-muted);
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.c-view-tabs__add-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background-color: var(--color-bg-surface);
  box-shadow: var(--shadow-sm);
}
</style>

<script setup lang="ts">
import { ref } from 'vue';
import type { ViewsResponse } from '../../lib/pocketbase-types';

const props = defineProps<{
  views: ViewsResponse[];
  currentViewId: string | null;
  isEditMode: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:currentViewId', id: string): void;
  (e: 'addView'): void;
  (e: 'reorder', views: ViewsResponse[]): void;
}>();

const draggedIndex = ref<number | null>(null);

const onDragStart = (e: DragEvent, index: number) => {
  draggedIndex.value = index;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.dropEffect = 'move';
  }
};

const onDragOver = (e: DragEvent, index: number) => {
  e.preventDefault();
  if (draggedIndex.value === null || draggedIndex.value === index) return;
  
  const newViews = [...props.views];
  const draggedTab = newViews.splice(draggedIndex.value, 1)[0];
  if (!draggedTab) return;
  
  newViews.splice(index, 0, draggedTab);
  
  draggedIndex.value = index;
  emit('reorder', newViews);
};

const onDragEnd = () => {
  draggedIndex.value = null;
};
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
          :draggable="isEditMode"
          @click="$emit('update:currentViewId', v.id)"
          @dragstart="onDragStart($event, index)"
          @dragover="onDragOver($event, index)"
          @dragend="onDragEnd"
        >
          <span v-if="isEditMode" class="c-view-tabs__handle">⠿</span>
          <span class="c-view-tabs__tab-name">{{ v.name }}</span>
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
  padding-bottom: env(safe-area-inset-bottom, 0);
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
  font-size: 1.1rem;
  opacity: 0.3;
  margin-right: -4px;
  transition: opacity 0.2s;
}

.c-view-tabs__tab:hover .c-view-tabs__handle {
  opacity: 0.7;
}

.c-view-tabs__tab.is-dragging {
  opacity: 0.2;
  background-color: var(--color-bg-page);
  cursor: grabbing;
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

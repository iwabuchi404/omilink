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

        <button
          key="trash"
          class="c-view-tabs__tab is-system-tab"
          :class="{ 
            'is-active': currentViewId === 'trash'
          }"
          data-id="trash"
          @click="$emit('update:currentViewId', 'trash')"
        >
          <span class="c-view-tabs__tab-name">🗑️ {{ $t('trash.title') || 'Trash' }}</span>
        </button>
      </TransitionGroup>

      <div class="c-view-tabs__spacer"></div>

      <button 
        v-if="isEditMode"
        class="c-view-tabs__add-btn" 
        @click="$emit('addView')" 
        :title="$t('modal.newView')"
      >
        <span>＋</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.l-sub-header {
  position: relative; /* For absolute divider */
  flex-shrink: 0;
  background-color: var(--color-bg-tabs);
  padding: 0 24px;
  transition: all 0.3s ease;
  z-index: 100;
  box-shadow: inset 0 2px 6px rgba(122, 80, 64, 0.05); /* Tray inset shadow */
}

/* Common tab area divider */
.l-sub-header::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background-color: var(--color-border);
  z-index: 1;
}

.l-sub-header.is-bottom {
  border-bottom: none;
  padding-bottom: calc(env(safe-area-inset-bottom, 0) + 0px);
}

.l-sub-header.is-bottom::after {
  bottom: auto;
  top: 0;
}

.c-view-tabs {
  display: flex;
  align-items: flex-end; /* Align tabs to bottom for folder look */
  height: 52px;
}

.c-view-tabs__inner {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
  align-items: flex-end; /* Align to bottom for folder look */
  height: 100%;
}

.c-view-tabs__inner::-webkit-scrollbar {
  display: none;
}

.c-view-tabs__tab {
  background: var(--color-bg-tabs);
  border: 1px solid rgb(229 217 217 / 30%);
  border-bottom: none;
  padding: 0 18px;
  height: 38px;
  cursor: pointer;
  color: var(--color-text-muted);
  font-weight: 600;
  font-size: 0.85rem;
  border-radius: 8px 8px 0 0; /* Folder Tab Shape */
  box-shadow: var(--neu-tab-inactive);
  transition: all 0.25s ease;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: -0.01em;
  user-select: none;
  position: relative;
  margin: 0 1px;
  z-index: 0;
}

.c-view-tabs__tab.is-sortable {
  padding-left: 8px;
  padding-right: 4px;
  cursor: grab;
  touch-action: pan-x; /* Allow horizontal scrolling on the tab itself */
}

.l-sub-header.is-bottom .c-view-tabs__tab {
  border-bottom: none;
  border-top: 3px solid transparent;
}

.c-view-tabs__tab:hover {
  color: var(--color-text-main);
  background-color: var(--color-bg-surface);
}

.c-view-tabs__tab.is-active {
  color: var(--color-accent);
  height: 44px; /* Sticks out more */
  background: var(--color-bg-surface); /* Matches content area below */
  box-shadow: var(--neu-tab-active);
  border: 1px solid var(--color-card-border);
  border-bottom: 4px solid var(--color-accent); /* Prominent accent border */
  margin-bottom: -1px;
  z-index: 5;
}

[data-theme="dark"] .c-view-tabs__tab.is-active {
  background: var(--color-bg-surface);
  border-bottom: 4px solid var(--color-accent);
}

/* Ensure Trash (system tab) also has the same behavior */
.c-view-tabs__tab.is-system-tab {
  opacity: 1; /* Match others */
  margin-left: 8px;
}

.c-view-tabs__tab.is-system-tab.is-active {
  background: var(--color-bg-surface);
  box-shadow: var(--neu-tab-active);
  border-bottom: 4px solid var(--color-accent);
  margin-bottom: -1px;
}

.c-view-tabs__tab.is-active::after {
  display: none;
}

.l-sub-header.is-bottom .c-view-tabs__tab.is-active::after {
  display: none;
}

.c-view-tabs__tab.is-system-tab {
  opacity: 1;
  margin-left: 12px;
}
.c-view-tabs__tab.is-system-tab:hover {
  opacity: 1;
}

.c-view-tabs__spacer {
  flex: 1;
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
  width: 38px;
  height: 38px;
  margin-left: 12px;
  background-color: var(--color-bg-tabs);
  border: 1px dashed var(--color-border);
  border-bottom: none;
  border-radius: 8px 8px 0 0; /* Folder shape */
  cursor: pointer;
  color: var(--color-text-muted);
  font-size: 1.2rem;
  font-weight: 300;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  box-shadow: var(--neu-tab-inactive);
  margin-bottom: 0;
  align-self: flex-end; /* Align with other tabs */
}

.c-view-tabs__add-btn:hover {
  background-color: var(--color-bg-surface);
  color: var(--color-accent);
  border-style: solid;
  border-color: var(--color-card-border);
  border-bottom: 4px solid var(--color-accent);
  height: 44px; /* Matches active tab height */
  box-shadow: var(--neu-tab-active);
}
</style>

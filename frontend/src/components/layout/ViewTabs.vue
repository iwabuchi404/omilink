<script setup lang="ts">
import type { ViewsResponse } from '../../lib/pocketbase-types';

defineProps<{
  views: ViewsResponse[];
  currentViewId: string | null;
}>();

defineEmits<{
  (e: 'update:currentViewId', id: string): void;
  (e: 'addView'): void;
}>();
</script>

<template>
  <div class="l-sub-header">
    <div class="c-view-tabs">
      <button 
        v-for="v in views" 
        :key="v.id" 
        class="c-view-tabs__tab"
        :class="{ 'is-active': v.id === currentViewId }"
        @click="$emit('update:currentViewId', v.id)"
      >
        {{ v.name }}
      </button>

      <button class="c-view-tabs__add-btn" @click="$emit('addView')" title="Add new view">
        <span>＋</span> New View
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
  transition: background-color 0.3s ease;
}

.c-view-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  align-items: center;
  height: 48px;
}

.c-view-tabs::-webkit-scrollbar {
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
  transition: all 0.2s ease;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: -0.01em;
}

.c-view-tabs__tab:hover {
  color: var(--color-text-main);
  background-color: var(--color-bg-page);
}

.c-view-tabs__tab.is-active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.c-view-tabs__add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
  padding: 6px 14px;
  background: var(--color-bg-page);
  border: 1px dashed var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.c-view-tabs__add-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background-color: var(--color-bg-surface);
  box-shadow: var(--shadow-sm);
}
</style>

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
  background-color: #fff;
  border-bottom: 1px solid #e8eaed;
  padding: 0 20px;
}

.c-view-tabs {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
  align-items: stretch;
}

.c-view-tabs::-webkit-scrollbar {
  display: none;
}

.c-view-tabs__tab {
  background: none;
  border: none;
  padding: 10px 14px;
  cursor: pointer;
  color: #666;
  font-weight: 500;
  font-size: 0.875rem;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
}

.c-view-tabs__tab:hover {
  color: #333;
  background-color: #f5f5f5;
  border-radius: 6px 6px 0 0;
}

.c-view-tabs__tab.is-active {
  color: #1a73e8;
  border-bottom-color: #1a73e8;
  font-weight: 600;
}

.c-view-tabs__icon {
  font-size: 0.9rem;
}

.c-view-tabs__add-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 6px;
  padding: 6px 12px;
  align-self: center;
  background: none;
  border: 1px dashed #ccc;
  border-radius: 6px;
  cursor: pointer;
  color: #999;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}

.c-view-tabs__add-btn:hover {
  border-color: #1a73e8;
  color: #1a73e8;
  background-color: #e8f0fe;
}
</style>

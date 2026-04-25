<script setup lang="ts">
import { computed } from 'vue';


type ItemType = 'bookmark' | 'memo';

interface ViewItem {
  id: string;
  itemId: string;
  type: ItemType;
  title: string;
  content: string;
  url?: string;
  og_image_url?: string;
  favicon_url?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

const props = defineProps<{
  item: ViewItem;
  isEditMode: boolean;
  isFiltered?: boolean;
}>();

defineEmits<{
  (e: 'delete'): void;
  (e: 'addToView'): void;
  (e: 'moveToView'): void;
  (e: 'edit'): void;
  (e: 'view-memo'): void;
}>();

// Popover ID must be unique per card
const popoverId = `card-menu-${props.item.id}`;
// Anchor name must also be unique
const anchorName = `--anchor-${props.item.id}`;

const displayTitle = computed(() => {
  if (props.item.title && props.item.title !== 'Untitled') return props.item.title;
  if (props.item.type === 'memo' && props.item.content) {
    return props.item.content.split('\n')[0];
  }
  return props.item.url || 'Untitled';
});
</script>

<template>
  <div class="c-card" :class="[`is-${item.type}`]">
    <!-- Clickable content (link or memo) -->
    <component 
      :is="!isEditMode && item.type === 'bookmark' && item.url ? 'a' : 'div'"
      :href="!isEditMode && item.type === 'bookmark' ? item.url : undefined"
      :target="!isEditMode && item.type === 'bookmark' ? '_blank' : undefined"
      :rel="!isEditMode && item.type === 'bookmark' ? 'noopener noreferrer' : undefined"
      class="c-card__content-wrapper"
      :class="{ 
        'is-clickable': !isEditMode && item.type === 'memo',
        'is-tiny': item.w === 1 && item.h === 1,
        'is-tall': item.h > item.w && item.w === 1 && item.h >= 2,
        'is-wide': item.w > item.h && item.h === 1 && item.w >= 2,
        'is-small': (item.w * item.h === 2) && !(item.w === 1 || item.h === 1), // unlikely but for safety
        'is-medium': item.w * item.h > 2 && item.w * item.h <= 4 && !(item.w === 1 || item.h === 1),
        'is-large': item.w * item.h > 4
      }"
      :title="`${displayTitle}${item.url && item.type === 'bookmark' ? '\n' + item.url : ''}${item.content ? '\n\n' + item.content : ''}`"
      @mousedown.stop="(!isEditMode && item.type === 'bookmark') ? null : $event.preventDefault()"
      @click="!isEditMode && item.type === 'memo' ? $emit('view-memo') : null"
    >
      <!-- OGP Image (bookmark only, 4 slots or more) -->
      <div 
        v-if="item.type === 'bookmark' && item.og_image_url && item.w * item.h >= 4" 
        class="c-card__og-image" 
        :style="{ backgroundImage: `url('${item.og_image_url}')` }"
      ></div>
      
      <div class="c-card__inner">
        <div class="c-card__header">
          <img 
            v-if="item.type === 'bookmark'" 
            :src="item.favicon_url || `https://www.google.com/s2/favicons?domain=${item.url}&sz=32`" 
            class="c-card__favicon" 
            alt="" 
          />
          <span v-else class="c-card__favicon">📝</span>
          
          <h4 class="c-card__title">
            {{ displayTitle }}
          </h4>
        </div>
        
        <!-- Large card content -->
        <div v-if="item.w * item.h >= 4" class="c-card__body">
          <p v-if="item.content" class="c-card__content">{{ item.content }}</p>
          <p v-else-if="item.url && item.title && item.title !== 'Untitled'" class="c-card__content-url">{{ item.url }}</p>
        </div>
      </div>
    </component>

    <!-- Edit Mode: ⋯ button + Popover menu -->
    <div v-if="isEditMode" class="c-card__edit-overlay">
      <button
        class="c-card__menu-btn"
        :popovertarget="popoverId"
        :style="{ 'anchor-name': anchorName }"
        :title="$t('grid.cardOptions')"
      >
        ⋯
      </button>

      <!-- popover="auto": renders in browser top layer -->
      <div
        :id="popoverId"
        popover="auto"
        class="c-card-popover"
        :style="{ 'position-anchor': anchorName }"
      >
        <button
          class="c-card-popover__item"
          :popovertarget="popoverId"
          popovertargetaction="hide"
          @click="$emit('edit')"
        >
          <span>✏️</span> {{ $t('grid.editDetails') }}
        </button>
        <div class="c-card-popover__divider"></div>
        <button
          class="c-card-popover__item"
          :popovertarget="popoverId"
          popovertargetaction="hide"
          @click="$emit('addToView')"
        >
          <span>➕</span> {{ $t('grid.addToView') }}
        </button>
        <button
          class="c-card-popover__item"
          :popovertarget="popoverId"
          popovertargetaction="hide"
          @click="$emit('moveToView')"
        >
          <span>📦</span> {{ $t('grid.moveToView') }}
        </button>
        <div class="c-card-popover__divider"></div>
        <button
          class="c-card-popover__item is-danger"
          :popovertarget="popoverId"
          popovertargetaction="hide"
          @click="$emit('delete')"
        >
          <span>🗑️</span> {{ $t('grid.moveToTrash') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===================== Card Base ===================== */
.c-card {
  position: relative;
  border-radius: 9px;
  box-shadow: var(--neu-shadow-normal);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  background-color: var(--color-card-bg);
  width: 100%;
  height: 100%;
  border: var(--neu-border-normal);
}

.c-card:hover {
  border-color: var(--color-primary);
  /* The normal neumorphism shadow is already present, simply changing border color is enough */
}

.c-card.is-bookmark {
  border-color: var(--color-card-border);
}

.c-card.is-memo {
  background-color: var(--color-memo-bg);
  border-color: var(--color-memo-border);
}

/* ===================== Content Wrapper ===================== */
.c-card__content-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  text-decoration: none;
  color: var(--color-text-main);
  overflow: hidden;
  border-radius: 12px;
}

.is-bookmark .c-card__content-wrapper {
  cursor: pointer;
}

.is-bookmark .c-card__content-wrapper:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

[data-theme="dark"] .is-bookmark .c-card__content-wrapper:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.c-card__content-wrapper.is-clickable {
  cursor: pointer;
}

/* ===================== OGP Image ===================== */
.c-card__og-image {
  width: 100%;
  height: 50%;
  min-height: 80px;
  background-size: cover;
  background-position: center;
  background-color: var(--color-bg-page);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

/* ===================== Inner Content ===================== */
.c-card__inner {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 18px;
  gap: 8px;
}

.is-tiny .c-card__inner {
  padding: 0;
  justify-content: center;
  align-items: center;
}

.is-tall .c-card__inner {
  padding: 18px 8px;
  text-align: center;
  justify-content: center;
}

.is-tall .c-card__header {
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.is-tall .c-card__title {
  -webkit-line-clamp: 4;
  line-clamp: 4;
  font-size: 0.85rem;
}

.is-wide .c-card__inner {
  flex-direction: row;
  align-items: center;
  padding: 0 16px;
  gap: 16px;
}

.is-wide .c-card__header {
  flex: 1;
  gap: 12px;
}

.is-wide .c-card__body {
  margin-top: 0;
  flex: 2;
  border-left: 1px solid var(--color-border);
  padding-left: 16px;
  display: flex;
  align-items: center;
}

.c-card__header {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
}

.c-card__favicon {
  width: 24px;
  height: 24px;
  border-radius: 5px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  background-color: #e8e0d4; /* Color from reference */
}

[data-theme="dark"] .c-card__favicon {
  background-color: #131109; /* Color from reference */
}

.is-tall .c-card__favicon {
  width: 32px;
  height: 32px;
  font-size: 24px;
}

.is-wide .c-card__favicon {
  width: 24px;
  height: 24px;
  font-size: 20px;
}

.c-card__title {
  margin: 0;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--color-text-main);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
}

.is-wide .c-card__title {
  -webkit-line-clamp: 1;
  line-clamp: 1;
  font-size: 1rem;
}

.c-card__body {
  margin-top: 8px;
  flex: 1;
  overflow: hidden;
}

.is-memo .c-card__title {
  font-weight: 800;
  font-size: 1rem;
}

.c-card__content {
  margin: 0;
  font-size: 10px;
  color: var(--color-text-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.is-memo .c-card__content {
  color: var(--color-text-main);
  font-size: 0.85rem;
  -webkit-line-clamp: unset;
  line-clamp: none;
  display: block;
}

.is-tall.is-memo .c-card__content {
  -webkit-line-clamp: 5;
  line-clamp: 5;
  display: -webkit-box;
}

.c-card__content-url {
  margin: 0;
  font-size: 10px;
  color: var(--color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.8;
}

.is-small .c-card__title {
  font-size: 0.85rem;
}

/* 1x1 Tiny Card (App Icon Style) */
.is-tiny .c-card__header {
  height: 100%;
  width: 100%;
  justify-content: center;
  align-items: center;
}

.is-tiny .c-card__favicon {
  width: 40px;
  height: 40px;
  font-size: 32px;
  border-radius: 8px;
  background-color: var(--color-bg-surface);
  box-shadow: var(--shadow-sm);
}

/* ===================== Edit Overlay & Menu Button ===================== */
.c-card__edit-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
}

.c-card__menu-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-modal);
  backdrop-filter: blur(8px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: var(--color-text-main);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s;
  padding: 0;
}

.c-card__menu-btn:hover {
  background: var(--color-bg-page);
  transform: scale(1.1);
  box-shadow: var(--shadow-md);
}

.c-card-popover {
  background: var(--color-bg-modal);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 6px;
  box-shadow: var(--shadow-lg);
}

.c-card-popover__item {
  width: 100%;
  padding: 10px 14px;
  border: none;
  background: none;
  text-align: left;
  font-size: 0.9rem;
  color: var(--color-text-main);
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.c-card-popover__item:hover {
  background-color: var(--color-bg-page);
}

.c-card-popover__item.is-danger {
  color: var(--color-danger);
}

.c-card-popover__divider {
  height: 1px;
  background-color: var(--color-border);
  margin: 4px 6px;
}
</style>

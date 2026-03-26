<script setup lang="ts">


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
  (e: 'edit'): void;
}>();

// Popover ID must be unique per card
const popoverId = `card-menu-${props.item.id}`;
// Anchor name must also be unique
const anchorName = `--anchor-${props.item.id}`;
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
        'is-small': item.w * item.h <= 2 && !(item.w === 1 && item.h === 1),
        'is-large': item.w * item.h >= 4
      }"
      :title="`${item.title && item.title !== 'Untitled' ? item.title : (item.url || 'Untitled')}${item.url && item.type === 'bookmark' ? '\n' + item.url : ''}${item.content ? '\n\n' + item.content : ''}`"
      @mousedown.stop="(!isEditMode && item.type === 'bookmark') ? null : $event.preventDefault()"
      @click="!isEditMode && item.type === 'memo' ? $emit('edit') : null"
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
            {{ (item.title && item.title !== 'Untitled') ? item.title : (item.url || 'Untitled') }}
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
        title="Options"
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
          <span>✏️</span> Edit Details
        </button>
        <div class="c-card-popover__divider"></div>
        <button
          v-if="item.type === 'bookmark'"
          class="c-card-popover__item"
          :popovertarget="popoverId"
          popovertargetaction="hide"
          @click="$emit('addToView')"
        >
          <span>➕</span> Add to another view
        </button>
        <div class="c-card-popover__divider"></div>
        <button
          class="c-card-popover__item is-danger"
          :popovertarget="popoverId"
          popovertargetaction="hide"
          @click="$emit('delete')"
        >
          <span>🗑️</span> Move to Trash
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===================== Card Base ===================== */
.c-card {
  position: relative;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.1);
  transition: box-shadow 0.2s;
  background-color: #fff;
  width: 100%;
  height: 100%;
}

.c-card.is-bookmark {
  border: 1px solid #eaeaea;
}

.c-card.is-memo {
  background-color: #fef3c7;
  border: 1px solid #fde68a;
  box-shadow: 2px 4px 8px rgba(0,0,0,0.06);
}

/* ===================== Content Wrapper ===================== */
.c-card__content-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  text-decoration: none;
  color: inherit;
  overflow: hidden;
  border-radius: 8px;
}

.is-bookmark .c-card__content-wrapper {
  cursor: pointer;
}

.is-bookmark .c-card__content-wrapper:hover {
  background-color: #f9f9fc;
}

.c-card__content-wrapper.is-clickable {
  cursor: pointer;
}

.c-card__content-wrapper.is-clickable:hover {
  background-color: #fdf2f8; /* Subtle pink/yellow tint for memo hover */
}

/* ===================== OGP Image ===================== */
.c-card__og-image {
  width: 100%;
  height: 50%;
  min-height: 80px;
  background-size: cover;
  background-position: center;
  background-color: #f3f4f6;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

/* ===================== Inner Content ===================== */
.c-card__inner {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 8px;
}

.c-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}

.c-card__favicon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.c-card__title {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
}

.c-card__body {
  margin-top: 6px;
  flex: 1;
  overflow: hidden;
}

.is-memo .c-card__title {
  font-weight: bold;
  font-size: 0.9rem;
}

.c-card__content {
  margin: 0;
  font-size: 0.75rem;
  color: #666;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.is-memo .c-card__content {
  color: #4b5563;
  font-size: 0.8rem;
  -webkit-line-clamp: unset;
  line-clamp: none;
  display: block;
}

.c-card__content-url {
  margin: 0;
  font-size: 0.68rem;
  color: #0066cc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.is-small .c-card__title {
  font-size: 0.8rem;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.is-small .c-card__inner {
  justify-content: flex-start;
}

/* 1x1 Tiny Card (App Icon Style) */
.is-tiny .c-card__inner {
  padding: 0;
}

.is-tiny .c-card__header {
  height: 100%;
  width: 100%;
  justify-content: center;
  align-items: center;
}

.is-tiny .c-card__favicon {
  width: 32px;
  height: 32px;
  font-size: 28px;
  border-radius: 4px; /* Slight rounding for favicon */
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.is-tiny .c-card__title {
  display: none; /* Hide text completely to show only icon like an app */
}

/* ===================== Edit Overlay & Menu Button ===================== */
.c-card__edit-overlay {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 10;
}

.c-card__menu-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid rgba(0,0,0,0.15);
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(4px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  color: #444;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  transition: all 0.15s;
  padding: 0;
}

.c-card__menu-btn:hover {
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.15);
}
</style>

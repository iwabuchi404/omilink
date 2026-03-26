<script setup lang="ts">
import { ref } from 'vue';
import type { AuthModel } from 'pocketbase';
import type { ViewsResponse } from '../../lib/pocketbase-types';

defineProps<{
  isAuthenticated: boolean;
  currentUser: AuthModel | null;
  isEditMode: boolean;
  currentView: ViewsResponse | null;
  searchQuery: string;
}>();

const emit = defineEmits<{
  (e: 'toggleEditMode'): void;
  (e: 'showAddModal'): void;
  (e: 'logout'): void;
  (e: 'update:searchQuery', value: string): void;
}>();

const showUserMenu = ref(false);
const showMobileSearch = ref(false);
</script>

<template>
  <header class="l-header">
    <div class="l-header__logo">
      <span class="l-header__logo-icon">🔗</span>
      OmiLink
    </div>
    
    <div v-if="isAuthenticated" class="l-header__search" :class="{ 'is-mobile-visible': showMobileSearch }">
      <div class="c-search-bar">
        <span class="c-search-bar__icon">🔍</span>
        <input 
          type="text" 
          class="c-search-bar__input" 
          placeholder="Search items..." 
          :value="searchQuery"
          @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        />
        <button v-if="searchQuery" class="c-search-bar__clear" @click="emit('update:searchQuery', '')">✕</button>
      </div>
    </div>
    
    <div v-else style="flex-grow: 1;"></div>
    
    <div v-if="isAuthenticated" class="l-header__actions">
      <button 
        class="l-header__btn l-header__btn--search-toggle"
        @click="showMobileSearch = !showMobileSearch"
        :class="{ 'is-active': showMobileSearch }"
        title="Search"
      >
        <span class="l-header__btn-icon">🔍</span>
      </button>

      <button 
        class="l-header__btn"
        :class="{ 'is-active': isEditMode }"
        @click="$emit('toggleEditMode')"
        :title="isEditMode ? 'Finish Editing' : 'Edit Layout'"
      >
        <span class="l-header__btn-icon" v-if="isEditMode">✓</span>
        <span class="l-header__btn-icon" v-else>✎</span>
        <span class="l-header__btn-text">{{ isEditMode ? ' Done' : ' Edit' }}</span>
      </button>

      <button 
        class="l-header__btn l-header__btn--add"
        @click="$emit('showAddModal')" 
        :disabled="!currentView"
        title="Add Item"
      >
        <span class="l-header__btn-icon">+</span>
        <span class="l-header__btn-text"> Add</span>
      </button>

      <!-- User menu -->
      <div class="l-header__user-menu" @mouseenter="showUserMenu = true" @mouseleave="showUserMenu = false">
        <button class="l-header__user-btn">
          <span class="l-header__avatar">{{ (currentUser?.name || currentUser?.email || '?')[0].toUpperCase() }}</span>
          <span class="l-header__username">{{ currentUser?.name || currentUser?.email }}</span>
          <span class="l-header__chevron">▾</span>
        </button>
        
        <div v-if="showUserMenu" class="l-header__dropdown">
          <div class="l-header__dropdown-user">
            <span class="l-header__dropdown-name">{{ currentUser?.name || 'User' }}</span>
            <span class="l-header__dropdown-email">{{ currentUser?.email }}</span>
          </div>
          <div class="l-header__dropdown-divider"></div>
          <button class="l-header__dropdown-item" @click="$emit('logout')">
            <span>🔓</span> Logout
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.l-header {
  display: flex;
  align-items: center;
  padding: 0 20px;
  height: 56px;
  background-color: #fff;
  border-bottom: 1px solid #e8eaed;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  flex-shrink: 0;
  transition: height 0.3s;
}

@media (max-width: 768px) {
  .l-header {
    flex-wrap: wrap;
    height: auto;
    padding: 8px 16px;
    gap: 8px;
  }
}

.l-header__logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: 0.02em;
  color: #1a1a2e;
}

.l-header__logo-icon {
  font-size: 1.3rem;
}

.l-header__search {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  max-width: 600px;
  margin: 0 40px;
}

@media (max-width: 768px) {
  .l-header__search {
    display: none; /* Hidden by default on mobile */
    order: 3;
    width: 100%;
    margin: 4px 0 8px 0;
    max-width: none;
  }

  .l-header__search.is-mobile-visible {
    display: flex;
  }
}

.c-search-bar {
  display: flex;
  align-items: center;
  width: 100%;
  background-color: #f1f3f4;
  border-radius: 8px;
  padding: 0 12px;
  height: 40px;
  transition: background-color 0.2s, box-shadow 0.2s;
}

.c-search-bar:focus-within {
  background-color: #fff;
  box-shadow: 0 1px 1px 0 rgba(65,69,73,0.3), 0 1px 3px 1px rgba(65,69,73,0.15);
}

.c-search-bar__icon {
  font-size: 1rem;
  color: #5f6368;
  margin-right: 8px;
  pointer-events: none;
}

.c-search-bar__input {
  flex-grow: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 1rem;
  color: #3c4043;
  width: 100%;
}

.c-search-bar__clear {
  background: none;
  border: none;
  color: #5f6368;
  cursor: pointer;
  padding: 4px;
  font-size: 0.8rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.c-search-bar__clear:hover {
  background-color: rgba(0,0,0,0.05);
}

.l-header__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .l-header__actions {
    margin-left: auto;
    gap: 4px;
  }
}

.l-header__btn {
  padding: 7px 14px;
  cursor: pointer;
  background: transparent;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
  color: #555;
}

.l-header__btn:hover:not(:disabled) {
  background-color: #f5f5f5;
  border-color: #ccc;
}

.l-header__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.l-header__btn.is-active {
  background-color: #1a73e8;
  color: white;
  border-color: #1557b0;
}

.l-header__btn--add {
  background-color: #1a73e8;
  color: white;
  border-color: #1557b0;
}

.l-header__btn--add:hover:not(:disabled) {
  background-color: #1557b0;
  border-color: #1245a0;
}

@media (max-width: 768px) {
  .l-header__btn {
    padding: 6px 10px;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .l-header__btn--search-toggle {
    display: flex;
  }

  .l-header__username {
    display: none;
  }
}

.l-header__btn--search-toggle {
  display: none; /* Hidden on desktop */
}

/* User Menu */
.l-header__user-menu {
  position: relative;
}

.l-header__user-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.l-header__user-btn:hover {
  background-color: #f5f5f5;
  border-color: #e0e0e0;
}

.l-header__avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1a73e8, #6c35de);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
}

.l-header__username {
  font-size: 0.875rem;
  color: #333;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.l-header__chevron {
  font-size: 0.7rem;
  color: #999;
}

/* Dropdown */
.l-header__dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 14px rgba(0,0,0,0.12);
  min-width: 200px;
  z-index: 9999;
  overflow: hidden;
}

.l-header__dropdown-user {
  padding: 14px 16px;
  background-color: #fafafa;
}

.l-header__dropdown-name {
  display: block;
  font-weight: 600;
  font-size: 0.9rem;
  color: #222;
}

.l-header__dropdown-email {
  display: block;
  font-size: 0.78rem;
  color: #888;
  margin-top: 2px;
}

.l-header__dropdown-divider {
  height: 1px;
  background-color: #eee;
}

.l-header__dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.875rem;
  color: #333;
  text-align: left;
  transition: background 0.15s;
}

.l-header__dropdown-item:hover {
  background-color: #f0f0f0;
}
</style>

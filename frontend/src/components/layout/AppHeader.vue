<script setup lang="ts">
import { ref, computed, inject, watch, onMounted, onUnmounted, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { UsersResponse, ViewsResponse } from '../../lib/pocketbase-types';
import type { Theme } from '../../composables/useTheme';

defineProps<{
  isAuthenticated: boolean;
  currentUser: UsersResponse | null;
  isEditMode: boolean;
  currentView: ViewsResponse | null;
  searchQuery: string;
}>();

const emit = defineEmits<{
  (e: 'toggleEditMode'): void;
  (e: 'showAddModal'): void;
  (e: 'showToolsModal'): void;
  (e: 'logout'): void;
  (e: 'update:searchQuery', value: string): void;
  (e: 'update:isHidden', value: boolean): void;
}>();

const showUserMenu = ref(false);
const showMobileSearch = ref(false);

const closeUserMenu = () => {
  showUserMenu.value = false;
};

onMounted(() => {
  window.addEventListener('click', closeUserMenu);
});

onUnmounted(() => {
  window.removeEventListener('click', closeUserMenu);
});

const { t, locale } = useI18n();
const currentLanguage = computed(() => locale.value.toUpperCase());

const theme = inject('theme') as Ref<Theme>;
const toggleTheme = inject('toggleTheme') as () => void;
const tabPosition = inject('tabPosition') as Ref<'top' | 'bottom'>;
const toggleTabPosition = inject('toggleTabPosition') as () => void;

const isHidden = ref(false);
const lastScrollTop = ref(0);

watch(isHidden, (newVal) => {
  emit('update:isHidden', newVal);
});

const handleScroll = (scrollTop: number) => {
  if (window.innerWidth > 768) {
    isHidden.value = false;
    return;
  }
  
  const delta = scrollTop - lastScrollTop.value;
  
  // Ignore tiny movements to prevent jitter
  if (Math.abs(delta) < 5) return;

  if (scrollTop < 50) {
    // Always show when near the top
    isHidden.value = false;
  } else if (delta > 0 && scrollTop > 100) {
    // Scroll down: Hide header
    isHidden.value = true;
  } else if (delta < -15) {
    // Significant scroll up: Show header
    isHidden.value = false;
  }
  
  lastScrollTop.value = scrollTop;
};

// Expose handleScroll to parent (Dashboard)
defineExpose({ handleScroll });

const toggleLanguage = () => {
  const newLang = locale.value === 'en' ? 'ja' : 'en';
  locale.value = newLang;
  localStorage.setItem('app-language', newLang);
};

const themeIcon = computed(() => {
  if (theme.value === 'light') return '☀️';
  if (theme.value === 'dark') return '🌙';
  return '🌓';
});
</script>

<template>
  <header class="l-header" :class="{ 'is-edit-mode': isEditMode, 'is-hidden': isHidden }">
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
          :placeholder="$t('header.searchPlaceholder')" 
          :value="searchQuery"
          @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        />
        <button v-if="searchQuery" class="c-search-bar__clear" @click="emit('update:searchQuery', '')">✕</button>
      </div>
    </div>
    
    <div v-else class="l-header__actions" style="margin-left: auto;">
      <button 
        class="l-header__btn"
        @click="toggleLanguage"
        :title="$t('header.changeLanguage')"
      >
        <span class="l-header__btn-icon">🌐</span>
        <span class="l-header__btn-text"> {{ currentLanguage }}</span>
      </button>
    </div>
    
    <div v-if="isAuthenticated" class="l-header__actions">
      <button 
        class="l-header__btn l-header__btn--search-toggle"
        @click="showMobileSearch = !showMobileSearch"
        :class="{ 'is-active': showMobileSearch }"
        :title="$t('header.search')"
      >
        <span class="l-header__btn-icon">🔍</span>
      </button>


      <button 
        class="l-header__btn"
        :class="{ 'is-active': isEditMode }"
        @click="$emit('toggleEditMode')"
        :title="isEditMode ? $t('header.finishEditing') : $t('header.editLayout')"
      >
        <span class="l-header__btn-icon" v-if="isEditMode">✓</span>
        <span class="l-header__btn-icon" v-else>✎</span>
        <span class="l-header__btn-text">{{ isEditMode ? $t('header.btnDone') : $t('header.btnEdit') }}</span>
      </button>

      <button 
        class="l-header__btn l-header__btn--add"
        @click="$emit('showAddModal')" 
        :disabled="!currentView"
        :title="$t('header.addItemTitle')"
      >
        <span class="l-header__btn-icon">+</span>
        <span class="l-header__btn-text">{{ $t('header.btnAdd') }}</span>
      </button>

      <!-- User menu -->
      <div class="l-header__user-menu">
        <button class="l-header__user-btn" @click.stop="showUserMenu = !showUserMenu">
          <span class="l-header__avatar">{{ (currentUser?.name || currentUser?.email || '?').charAt(0).toUpperCase() }}</span>
          <span class="l-header__username">{{ currentUser?.name || currentUser?.email || $t('header.defaultUser') }}</span>
          <span class="l-header__chevron">▾</span>
        </button>
        
        <div v-if="showUserMenu" class="l-header__dropdown" @click.stop>
          <div class="l-header__dropdown-user">
            <span class="l-header__dropdown-name">{{ currentUser?.name || $t('header.defaultUser') }}</span>
            <span class="l-header__dropdown-email">{{ currentUser?.email }}</span>
          </div>
          <div class="l-header__dropdown-divider"></div>
          <button class="l-header__dropdown-item" @click="toggleTheme(); showUserMenu = false">
            <span>{{ themeIcon }}</span> {{ $t('header.theme') }}: {{ theme }}
          </button>
          <button class="l-header__dropdown-item" @click="toggleTabPosition(); showUserMenu = false">
            <span>{{ tabPosition === 'top' ? '⬇️' : '⬆️' }}</span> {{ t('header.tabPosition') }}: {{ t(`header.${tabPosition}`) }}
          </button>
          <button class="l-header__dropdown-item" @click="toggleLanguage(); showUserMenu = false">
            <span>🌐</span> {{ $t('header.language') }}: {{ currentLanguage }}
          </button>
          <div class="l-header__dropdown-divider"></div>
          <button class="l-header__dropdown-item" @click="$emit('showToolsModal'); showUserMenu = false">
            <span>📦</span> {{ $t('header.tools') }}
          </button>
          <div class="l-header__dropdown-divider"></div>
          <button class="l-header__dropdown-item" @click="$emit('logout'); showUserMenu = false">
            <span>🔓</span> {{ $t('header.logout') }}
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
  padding: 0 24px;
  height: 64px;
  max-height: 1000px; /* Sufficient for dropdown too */
  background-color: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
  transition: all 0.3s ease;
  z-index: 1000;
}

.l-header.is-hidden {
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  border-bottom-width: 0;
  opacity: 0;
  pointer-events: none;
  overflow: hidden;
}

.l-header.is-edit-mode {
  background-color: var(--color-bg-page);
  border-bottom-color: var(--color-primary);
}

@media (max-width: 768px) {
  .l-header {
    flex-wrap: wrap;
    height: auto;
    padding: 12px 16px;
    gap: 8px;
  }
}

.l-header__logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  font-size: 1.25rem;
  letter-spacing: -0.01em;
  color: var(--color-text-main);
}

.l-header__logo-icon {
  font-size: 1.5rem;
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
    display: none;
    order: 3;
    width: 100%;
    margin: 4px 0 4px 0;
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
  background-color: var(--color-bg-page);
  border-radius: 10px;
  padding: 0 16px;
  height: 44px;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.c-search-bar:focus-within {
  background-color: var(--color-bg-surface);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
}

.c-search-bar__icon {
  font-size: 1rem;
  color: var(--color-text-muted);
  margin-right: 10px;
  pointer-events: none;
}

.c-search-bar__input {
  flex-grow: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 1rem;
  color: var(--color-text-main);
  width: 100%;
}

.c-search-bar__clear {
  background: none;
  border: none;
  color: var(--color-text-muted);
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
  gap: 12px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .l-header__actions {
    margin-left: auto;
    gap: 6px;
  }
}

.l-header__btn {
  height: 40px;
  padding: 0 16px;
  cursor: pointer;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-main);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
}

.l-header__btn:hover:not(:disabled) {
  background-color: var(--color-bg-page);
  border-color: var(--color-text-muted);
}

.l-header__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.l-header__btn.is-active {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.l-header__btn--add {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.l-header__btn--add:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

.l-header__btn--theme {
  padding: 0;
  width: 40px;
}

@media (max-width: 768px) {
  .l-header__btn {
    padding: 0 14px;
    font-size: 0.85rem;
    height: 42px;
    min-width: 48px;
  }
  
  .l-header__btn--search-toggle {
    display: flex;
    padding: 0;
    width: 36px;
  }

  .l-header__btn--add .l-header__btn-text,
  .l-header__btn .l-header__btn-text {
    display: none;
  }

  .l-header__username {
    display: none;
  }
}

.l-header__btn--search-toggle {
  display: none;
}

/* User Menu */
.l-header__user-menu {
  position: relative;
}

.l-header__user-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.l-header__user-btn:hover {
  background-color: var(--color-bg-page);
  border-color: var(--color-border);
}

.l-header__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}


.l-header__username {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-main);
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.l-header__chevron {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* Dropdown */
.l-header__dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: var(--color-bg-modal);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  min-width: 240px;
  z-index: 1000;
  overflow: hidden;
}

[data-theme="dark"] .l-header__dropdown {
  background: var(--color-bg-modal);
}

.l-header__dropdown-user {
  padding: 16px;
  background-color: var(--color-bg-page);
  border-bottom: 1px solid var(--color-border);
}

.l-header__dropdown-name {
  display: block;
  font-weight: 700;
  font-size: 1rem;
  color: var(--color-text-main);
}

.l-header__dropdown-email {
  display: block;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin-top: 4px;
}

.l-header__dropdown-divider {
  height: 1px;
  background-color: var(--color-border);
}

.l-header__dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-main);
  text-align: left;
  transition: all 0.2s ease;
}

.l-header__dropdown-item:hover {
  background-color: var(--color-bg-page);
  color: var(--color-primary);
}

.l-header__dropdown-item.is-danger {
  color: var(--color-danger);
}

.l-header__dropdown-item.is-danger:hover {
  background-color: rgba(220, 53, 69, 0.05);
}
</style>

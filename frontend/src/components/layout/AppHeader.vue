<script setup lang="ts">
import { ref, computed, inject, watch, onMounted, onUnmounted, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { UsersResponse, ViewsResponse } from '../../lib/pocketbase-types';
import type { Theme } from '../../composables/useTheme';
import { usePWAInstall } from '../../composables/usePWAInstall';

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
  (e: 'showGuideModal'): void;
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

const { locale } = useI18n();
const currentLanguage = computed(() => locale.value.toUpperCase());

const theme = inject('theme') as Ref<Theme>;
const toggleTheme = inject('toggleTheme') as () => void;
const tabPosition = inject('tabPosition') as Ref<'top' | 'bottom'>;
const toggleTabPosition = inject('toggleTabPosition') as () => void;

const { isInstallable, isStandalone, isIOS, installApp } = usePWAInstall();

const isHidden = ref(false);
const lastScrollTop = ref(0);
const showIosInstallModal = ref(false);

watch(isHidden, (newVal) => {
  emit('update:isHidden', newVal);
});

const handleScroll = (data: { scrollTop: number, scrollHeight: number, clientHeight: number }) => {
  if (window.innerWidth > 768) {
    isHidden.value = false;
    return;
  }
  
  const { scrollTop, scrollHeight, clientHeight } = data;
  const maxScroll = scrollHeight - clientHeight;
  const delta = scrollTop - lastScrollTop.value;

  // Ignore tiny movements to prevent jitter
  if (Math.abs(delta) < 5) return;

  // Bounce detection (Overscroll)
  // If we are outside the normal scroll range, we are bouncing.
  // We ignore updates during bounce to prevent flickering.
  if (scrollTop < 0 || scrollTop > maxScroll) {
    lastScrollTop.value = scrollTop;
    return;
  }

  if (scrollTop < 50) {
    // Always show when near the top
    isHidden.value = false;
  } else if (delta > 0 && scrollTop > 100) {
    // Scroll down: Hide header
    // But don't hide if we are at the very bottom (to avoid jumping)
    if (scrollTop < maxScroll - 20) {
      isHidden.value = true;
    }
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
      <div class="l-header__logo-icon">
        <img src="/logo.svg" alt="OmiLink" />
      </div>
      <span class="l-header__logo-text">OmiLink</span>
    </div>
    
    <div v-if="isAuthenticated" class="l-header__search" :class="{ 'is-mobile-visible': showMobileSearch }">
      <div class="c-search-wrapper">
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
    </div>
    
    <div v-else class="l-header__actions" style="margin-left: auto;">
      <button 
        class="l-header__btn"
        @click="toggleLanguage"
        :title="$t('header.changeLanguage')"
      >
        <span class="l-header__btn-icon">🌐</span>
        <span class="l-header__btn-text">{{ currentLanguage }}</span>
      </button>
    </div>
    
    <div v-if="isAuthenticated" class="l-header__actions">
      <button 
        class="l-header__btn l-header__btn--search-toggle"
        @click="showMobileSearch = !showMobileSearch"
        :class="{ 'is-active': showMobileSearch }"
        :title="$t('header.search')"
      >
        <span>🔍</span>
      </button>

      <button 
        class="l-header__btn l-header__btn--add"
        @click="emit('showAddModal')"
        :title="$t('header.btnAdd')"
      >
        <span class="l-header__btn-icon">＋</span>
        <span class="l-header__btn-text">{{ $t('header.btnAdd') }}</span>
      </button>

      <button 
        class="l-header__btn"
        :class="{ 'is-active': isEditMode }"
        @click="emit('toggleEditMode')"
        :title="isEditMode ? $t('header.finishEditing') : $t('header.editLayout')"
      >
        <span class="l-header__btn-icon">{{ isEditMode ? '✓' : '✎' }}</span>
        <span class="l-header__btn-text">{{ isEditMode ? $t('header.btnDone') : $t('header.btnEdit') }}</span>
      </button>

      <div class="l-header__user-menu">
        <button class="l-header__user-btn" @click.stop="showUserMenu = !showUserMenu">
          <div class="l-header__avatar">
            {{ currentUser?.name?.charAt(0).toUpperCase() || currentUser?.username?.charAt(0).toUpperCase() || 'U' }}
          </div>
          <span class="l-header__username">{{ currentUser?.name || currentUser?.username }}</span>
          <span class="l-header__chevron">▼</span>
        </button>
        
        <Transition name="dropdown">
          <div v-if="showUserMenu" class="l-header__dropdown" @click.stop>
            <div class="l-header__dropdown-user">
              <span class="l-header__dropdown-name">{{ currentUser?.name || currentUser?.username }}</span>
              <span class="l-header__dropdown-email">{{ currentUser?.email }}</span>
            </div>
            
            <div class="l-header__dropdown-divider"></div>
            
            <button class="l-header__dropdown-item" @click="toggleTheme">
              <span>{{ themeIcon }}</span>
              <span>{{ $t('header.theme') }}: {{ theme === 'light' ? $t('header.lightMode') : $t('header.darkMode') }}</span>
            </button>

            <button class="l-header__dropdown-item" @click="toggleLanguage">
              <span>🌐</span>
              <span>{{ $t('header.language') }}: {{ currentLanguage === 'JA' ? 'English' : '日本語' }}</span>
            </button>

            <button class="l-header__dropdown-item" @click="toggleTabPosition">
              <span>↕️</span>
              <span>{{ $t('header.tabPosition') }}: {{ tabPosition === 'top' ? $t('header.bottom') : $t('header.top') }}</span>
            </button>

            <button v-if="isInstallable" class="l-header__dropdown-item pwa-install-btn" @click="installApp">
              <span>📲</span>
              <span>{{ $t('pwa.installBtn') }}</span>
            </button>

            <button v-if="isIOS && !isStandalone" class="l-header__dropdown-item pwa-install-btn" @click="showIosInstallModal = true">
              <span>📲</span>
              <span>{{ $t('pwa.installBtn') }}</span>
            </button>

            <button class="l-header__dropdown-item" @click="emit('showToolsModal')">
              <span>🛠️</span>
              <span>{{ $t('header.tools') }}</span>
            </button>

            <button class="l-header__dropdown-item" @click="emit('showGuideModal')">
              <span>📖</span>
              <span>{{ $t('header.guide') }}</span>
            </button>

            <div class="l-header__dropdown-divider"></div>
            
            <button class="l-header__dropdown-item is-danger" @click="emit('logout')">
              <span>🚪</span>
              <span>{{ $t('header.logout') }}</span>
            </button>
          </div>
        </Transition>
      </div>
    </div>
    
    <div v-if="showIosInstallModal" class="c-ios-modal-overlay" @click="showIosInstallModal = false">
      <div class="c-ios-modal" @click.stop>
        <div class="c-ios-modal__header">
          <h3>{{ $t('pwa.iosModalTitle') }}</h3>
          <button class="c-ios-modal__close" @click="showIosInstallModal = false">✕</button>
        </div>
        <div class="c-ios-modal__body">
          <p>{{ $t('pwa.iosInstructions') }}</p>
          <button class="c-ios-modal__btn" @click="showIosInstallModal = false">{{ $t('modal.cancel') }}</button>
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
  background-color: var(--color-bg-header);
  color: var(--color-text-header);
  /* Smoother layered shadow */
  box-shadow: 
    0 2px 4px rgba(0,0,0,0.12),
    0 4px 12px rgba(0,0,0,0.18);
  z-index: 1000;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  position: relative;
}

.l-header::after {
  content: "";
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(to right, transparent, rgba(176, 80, 64, 0.4), transparent);
}

.l-header.is-hidden {
  transform: translateY(-100%);
}

.l-header__logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--color-text-header);
  flex-shrink: 0;
}

.l-header__logo-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.l-header__logo-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.l-header__search {
  flex: 1;
  max-width: 600px;
  margin: 0 40px;
}

@media (max-width: 768px) {
  .l-header {
    flex-wrap: wrap;
    height: auto;
    padding: 12px 16px;
    gap: 8px;
  }
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

.c-search-wrapper {
  position: relative;
  width: 100%;
  padding: 1px;
  background: rgba(0,0,0,0.12);
  border-radius: 12px;
  /* Smoother inset shadow */
  box-shadow: 
    inset 2px 2px 5px rgba(0,0,0,0.25),
    inset -1px -1px 2px rgba(255,255,255,0.03);
}

.c-search-bar {
  display: flex;
  align-items: center;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.02);
  border-radius: 11px;
  padding: 0 16px;
  height: 38px;
  transition: all 0.25s ease;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.c-search-bar:focus-within {
  background-color: rgba(255, 255, 255, 0.07);
  border-color: var(--color-accent);
}

.c-search-bar__icon {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.4);
  margin-right: 10px;
  pointer-events: none;
}

.c-search-bar__input {
  flex-grow: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.95rem;
  color: #fdfaf5;
  width: 100%;
}

.c-search-bar__input::placeholder {
  color: rgba(255,255,255,0.3);
}

.c-search-bar__clear {
  background: rgba(255,255,255,0.1);
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  width: 20px;
  height: 20px;
  font-size: 0.7rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.c-search-bar__clear:hover {
  background-color: var(--color-danger);
  color: white;
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
    color: var(--color-text-header);
  }
}

.l-header__btn {
  height: 38px;
  padding: 0 16px;
  cursor: pointer;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.85rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
  /* Smoother elevation with a bright top-left rim highlight for visibility */
  box-shadow: 
    inset 1px 1.5px 0 rgba(255, 255, 255, 0.08),
    2px 4px 10px rgba(0,0,0,0.3),
    -1px -1px 2px rgba(255,255,255,0.02);
}

.l-header__btn:hover:not(:disabled) {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.05));
  color: white;
  transform: translateY(-2px);
  box-shadow: 
    inset 1px 1.5px 0 rgba(255, 255, 255, 0.12),
    4px 8px 18px rgba(0,0,0,0.4),
    -1px -1px 3px rgba(255,255,255,0.04);
}

.l-header__btn:active {
  transform: translateY(0.5px);
  background: rgba(0,0,0,0.15);
  box-shadow: 
    inset 2px 3px 6px rgba(0,0,0,0.45),
    inset -1px -1px 2px rgba(255,255,255,0.02);
  transition-duration: 0.1s;
}

.l-header__btn.is-active {
  background: linear-gradient(145deg, var(--color-accent), #8a3c30);
  color: white;
  border-color: rgba(255,255,255,0.18);
  box-shadow: 
    inset 1px 1.5px 0 rgba(255, 255, 255, 0.18),
    inset 2px 3px 6px rgba(0,0,0,0.3);
}

.l-header__btn--add {
  background: linear-gradient(135deg, #c05848, var(--color-accent));
  color: white;
  border: none;
  box-shadow: 
    inset 1px 1.5px 0 rgba(255, 255, 255, 0.22),
    0 4px 15px rgba(176, 80, 64, 0.35);
}

.l-header__btn--add:hover:not(:disabled) {
  filter: brightness(1.1);
  transform: translateY(-2.5px);
  box-shadow: 
    inset 1px 1.5px 0 rgba(255, 255, 255, 0.25),
    0 8px 25px rgba(176, 80, 64, 0.45);
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
  padding: 4px 12px;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01));
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  /* Tactile shadow with rim highlight */
  box-shadow: 
    inset 1px 1.5px 0 rgba(255, 255, 255, 0.08),
    2px 4px 8px rgba(0,0,0,0.25);
}

.l-header__user-btn:hover {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.03));
  border-color: rgba(255,255,255,0.2);
  transform: translateY(-1.5px);
  box-shadow: 
    inset 1px 1.5px 0 rgba(255, 255, 255, 0.12),
    4px 6px 12px rgba(0,0,0,0.35);
}

.l-header__user-btn:active {
  transform: translateY(0.5px);
  background: rgba(0,0,0,0.15);
  box-shadow: 
    inset 2px 3px 6px rgba(0,0,0,0.4),
    inset -1px -1px 2px rgba(255,255,255,0.02);
}

.l-header__avatar {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--color-accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.8rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}


.l-header__username {
  font-size: 0.85rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.l-header__chevron {
  font-size: 0.65rem;
  color: rgba(255,255,255,0.3);
}

/* Dropdown */
.l-header__dropdown {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  background: var(--color-bg-modal);
  border: 1px solid var(--color-card-border);
  border-radius: 12px;
  /* Premium smooth shadow for the floating menu */
  box-shadow: 
    0 10px 30px rgba(0,0,0,0.3),
    0 4px 8px rgba(0,0,0,0.2),
    inset 1px 1px 0 rgba(255,255,255,0.05);
  min-width: 240px;
  z-index: 1000;
  overflow: hidden;
  transform-origin: top right;
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

.l-header__dropdown-item.pwa-install-btn {
  color: var(--color-primary);
  font-weight: 700;
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

/* iOS Modal */
.c-ios-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(4px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.c-ios-modal {
  background: var(--color-bg-modal);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-lg);
  border-radius: 16px;
  width: 90%;
  max-width: 320px;
  overflow: hidden;
}
.c-ios-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
}
.c-ios-modal__header h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--color-text-main);
  font-weight: 700;
}
.c-ios-modal__close {
  background: none; border: none; cursor: pointer; color: var(--color-text-muted); font-size: 1.2rem;
}
.c-ios-modal__body {
  padding: 20px; text-align: center;
}
.c-ios-modal__body p {
  color: var(--color-text-main); font-size: 0.95rem; margin-bottom: 24px; line-height: 1.5;
}
.c-ios-modal__btn {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 10px 24px;
  color: var(--color-text-main);
  font-weight: 600;
  cursor: pointer;
}
</style>

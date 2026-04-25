<script setup lang="ts">
import { ref } from 'vue';
import BaseModal from '../ui/BaseModal.vue';
import BaseButton from '../ui/BaseButton.vue';
import { usePWAInstall } from '../../composables/usePWAInstall';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const currentTab = ref(1);
const { isInstallable, isStandalone, isIOS, installApp } = usePWAInstall();

const close = () => {
  emit('close');
};
</script>

<template>
  <BaseModal :show="show" :title="$t('guide.title') || 'OmiLink Guide'" maxWidth="600px" @close="close">
    <div class="c-guide">
      <div class="c-guide__tabs">
        <button class="c-guide__tab" :class="{ 'is-active': currentTab === 1 }" @click="currentTab = 1">
          📝 {{ $t('guide.tab1') || 'Basic Usage' }}
        </button>
        <button class="c-guide__tab" :class="{ 'is-active': currentTab === 2 }" @click="currentTab = 2">
          ➕ {{ $t('guide.tab2') || 'Add Items' }}
        </button>
        <button class="c-guide__tab" :class="{ 'is-active': currentTab === 3 }" @click="currentTab = 3">
          📱 {{ $t('guide.tab3') || 'App Install' }}
        </button>
      </div>

      <div class="c-guide__content">
        <!-- Tab 1: Basic Usage -->
        <div v-show="currentTab === 1" class="c-guide__section">
          <h3>{{ $t('guide.tab1Title') || 'Grid Layout & Organization' }}</h3>
          <p>{{ $t('guide.tab1Desc') || 'OmiLink allows you to freely arrange your bookmarks and memos.' }}</p>
          
          <ul class="c-guide__list">
            <li><strong>{{ $t('guide.tab1Li1Title') || 'Edit Mode:' }}</strong> {{ $t('guide.tab1Li1Desc') || 'Click the ✎ button in the top right header to enter Edit Mode. In Edit Mode, you can drag and drop items to arrange them.' }}</li>
            <li><strong>{{ $t('guide.tab1Li2Title') || 'Resize & Operations:' }}</strong> {{ $t('guide.tab1Li2Desc') || 'While in Edit Mode, click the ⋯ menu on any card to edit its details, change its size, or move it to the trash.' }}</li>
            <li><strong>{{ $t('guide.tab1Li3Title') || 'Views (Tabs):' }}</strong> {{ $t('guide.tab1Li3Desc') || 'Use the tab bar to create multiple screens. You can move items between tabs using the card menu.' }}</li>
          </ul>
        </div>

        <!-- Tab 2: Add Items -->
        <div v-show="currentTab === 2" class="c-guide__section">
          <h3>{{ $t('guide.tab2Title') || 'Saving content' }}</h3>
          <p>{{ $t('guide.tab2Desc') || 'There are several ways to save links and notes.' }}</p>

          <ul class="c-guide__list">
            <li><strong>{{ $t('guide.tab2Li1Title') || 'Manual Entry:' }}</strong> {{ $t('guide.tab2Li1Desc') || 'Click the ＋ button at the top right to paste a URL or write a new text memo.' }}</li>
            <li><strong>{{ $t('guide.tab2Li2Title') || 'PC Bookmarklet:' }}</strong> {{ $t('guide.tab2Li2Desc') || 'Open the "OmiLink Tools" from your user profile menu to get a bookmarklet. Click it on any website to save instantly!' }}</li>
            <li><strong>{{ $t('guide.tab2Li3Title') || 'Mobile Sharing:' }}</strong> {{ $t('guide.tab2Li3Desc') || 'On mobile, you can use the Share (📤) button in your browser and select OmiLink (if installed) to save directly.' }}</li>
          </ul>
        </div>

        <!-- Tab 3: App Install -->
        <div v-show="currentTab === 3" class="c-guide__section">
          <h3>{{ $t('guide.tab3Title') || 'Install as App' }}</h3>
          
          <div v-if="isStandalone" class="c-guide__success">
            ✅ {{ $t('guide.installed') || 'You are already using the installed App version!' }}
          </div>
          <div v-else>
            <p>{{ $t('guide.tab3Desc') || 'Install OmiLink on your device home screen for a full-screen app experience and easy native sharing.' }}</p>
            
            <div class="c-guide__install-box">
              <div v-if="isIOS" class="c-guide__ios-instructions">
                <span class="c-guide__icon-large">📤</span>
                <p v-html="$t('header.installIos') || 'To install on iPhone: Tap the Share button in Safari and select <strong>Add to Home Screen</strong>.'"></p>
              </div>
              <div v-else-if="isInstallable">
                <button class="c-guide__install-btn" @click="installApp">
                  📱 {{ $t('header.installApp') || 'Install App' }}
                </button>
              </div>
              <div v-else class="c-guide__browser-instructions">
                <p>{{ $t('guide.tab3BrowserInstall') || 'To install, look for the "Install App" or "Add to Home Screen" option in your browser menu.' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <BaseButton variant="primary" @click="close">{{ $t('modal.close') || 'Close' }}</BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.c-guide {
  display: flex;
  flex-direction: column;
}

.c-guide__tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 24px;
  background: var(--color-bg-page);
  padding: 6px;
  border-radius: 14px;
  box-shadow: inset 1px 1px 3px rgba(0,0,0,0.06);
}

.c-guide__tab {
  flex: 1;
  padding: 10px 12px;
  background: none;
  border: none;
  border-radius: 10px;
  color: var(--color-text-muted);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.85rem;
  letter-spacing: -0.01em;
}

.c-guide__tab:hover {
  color: var(--color-text-main);
  background-color: rgba(255,255,255,0.5);
}

.c-guide__tab.is-active {
  color: var(--color-accent);
  background: white;
  box-shadow: 2px 3px 8px rgba(80, 50, 30, 0.08);
}

[data-theme="dark"] .c-guide__tab.is-active {
  background: var(--color-bg-surface);
  color: #fff;
  box-shadow: 2px 3px 10px rgba(0,0,0,0.4);
}

.c-guide__content {
  min-height: 250px;
  padding: 4px;
}

.c-guide__section h3 {
  margin: 0 0 16px 0;
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--color-text-main);
}

.c-guide__section p {
  line-height: 1.7;
  color: var(--color-text-muted);
  margin-bottom: 20px;
  font-size: 0.95rem;
}

.c-guide__list {
  padding-left: 20px;
  line-height: 1.7;
  color: var(--color-text-main);
}

.c-guide__list li {
  margin-bottom: 14px;
}

.c-guide__install-box {
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 28px;
  text-align: center;
  margin-top: 24px;
  box-shadow: inset 2px 2px 5px rgba(0,0,0,0.04);
}

.c-guide__install-btn {
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--shadow-md);
  transition: all 0.2s;
}

.c-guide__install-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  background-color: var(--color-primary-hover);
}

.c-guide__ios-instructions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.c-guide__icon-large {
  font-size: 2rem;
}

.c-guide__success {
  padding: 16px;
  background-color: #d1e7dd;
  color: #0f5132;
  border-radius: 8px;
  text-align: center;
  font-weight: 600;
  border: 1px solid #badbcc;
}

.c-guide__browser-instructions p {
  margin: 0;
  color: var(--color-text-main);
  font-weight: 500;
}
</style>

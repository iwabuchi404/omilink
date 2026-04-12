<script setup lang="ts">
import { computed } from 'vue';
import BaseModal from '../ui/BaseModal.vue';
import BaseButton from '../ui/BaseButton.vue';

defineProps<{
  show: boolean;
}>();

const emit = defineEmits(['close']);

const baseUrl = computed(() => window.location.origin);

const bookmarkletCode = computed(() => {
  return `javascript:(function(){window.open('${baseUrl.value}/?url='+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title));})();`;
});
</script>

<template>
  <BaseModal :show="show" title="OmiLink Tools" maxWidth="500px" @close="emit('close')">
    <div class="c-tools-section">
      <h4>PC Browser Bookmarklet</h4>
      <p class="c-tools-desc">
        Drag the button below to your browser's bookmarks bar. 
        Clicking it on any website will instantly save that page to your OmiLink!
      </p>
      
      <div class="c-bookmarklet-container">
        <a :href="bookmarkletCode" class="c-bookmarklet-btn" @click.prevent>
          ➕ Save to OmiLink
        </a>
      </div>
      
      <p class="c-tools-hint">
        * Note: Make sure your bookmarks bar is visible (Ctrl+Shift+B or Cmd+Shift+B).<br>
        If dragging doesn't work, create a new bookmark manually and paste this code as the URL:
      </p>
      <textarea readonly :value="bookmarkletCode" class="c-code-box" @click="($event.target as HTMLTextAreaElement)?.select()"></textarea>
    </div>

    <template #footer>
      <BaseButton variant="primary" @click="emit('close')">Close</BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.c-tools-section h4 {
  margin: 0 0 12px 0;
  color: var(--color-primary);
  font-weight: 800;
  font-size: 1.1rem;
}

.c-tools-desc {
  font-size: 0.95rem;
  color: var(--color-text-muted);
  margin-bottom: 24px;
  line-height: 1.6;
}

.c-bookmarklet-container {
  display: flex;
  justify-content: center;
  padding: 32px;
  background: var(--color-bg-page);
  border-radius: 16px;
  margin-bottom: 24px;
  border: 2px dashed var(--color-border);
  transition: all 0.3s ease;
}

.c-bookmarklet-container:hover {
  border-color: var(--color-primary);
  background-color: var(--color-bg-surface);
}

.c-bookmarklet-btn {
  display: inline-block;
  background: var(--color-primary);
  color: white;
  text-decoration: none;
  padding: 12px 24px;
  border-radius: 30px;
  font-weight: 800;
  box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3);
  cursor: grab;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: -0.01em;
}

.c-bookmarklet-btn:hover {
  background: var(--color-primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(26, 115, 232, 0.4);
}

.c-bookmarklet-btn:active {
  cursor: grabbing;
  transform: translateY(0);
}

.c-tools-hint {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-bottom: 12px;
  line-height: 1.5;
}

.c-code-box {
  width: 100%;
  padding: 16px;
  background: #1e1e1e; /* Consistent dark code box */
  color: #9cdcfe;
  border: 1px solid #333;
  border-radius: 12px;
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 0.85rem;
  height: 80px;
  resize: none;
  outline: none;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
}

[data-theme="dark"] .c-code-box {
  background: #000;
  border-color: #222;
}
</style>

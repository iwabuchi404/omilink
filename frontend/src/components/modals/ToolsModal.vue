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
  margin: 0 0 10px 0;
  color: #1a73e8;
}

.c-tools-desc {
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 20px;
  line-height: 1.5;
}

.c-bookmarklet-container {
  display: flex;
  justify-content: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  margin-bottom: 20px;
  border: 2px dashed #ddd;
}

.c-bookmarklet-btn {
  display: inline-block;
  background: #1a73e8;
  color: white;
  text-decoration: none;
  padding: 10px 20px;
  border-radius: 20px;
  font-weight: bold;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  cursor: grab;
}

.c-bookmarklet-btn:active {
  cursor: grabbing;
}

.c-tools-hint {
  font-size: 0.8rem;
  color: #777;
  margin-bottom: 8px;
}

.c-code-box {
  width: 100%;
  padding: 10px;
  background: #2d2d2d;
  color: #aed581;
  border: none;
  border-radius: 6px;
  font-family: monospace;
  font-size: 0.8rem;
  height: 60px;
  resize: none;
  outline: none;
}
</style>

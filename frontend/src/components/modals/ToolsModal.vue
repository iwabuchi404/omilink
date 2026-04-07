<script setup lang="ts">
import { computed } from 'vue';

defineProps<{
  show: boolean;
}>();

const emit = defineEmits(['close']);

const baseUrl = computed(() => window.location.origin);

const bookmarkletCode = computed(() => {
  return `javascript:(function(){window.open('${baseUrl.value}/?url='+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title));})();`;
});

function close() {
  emit('close');
}
</script>

<template>
  <div v-if="show" class="c-modal-overlay" @click.self="close">
    <div class="c-modal">
      <h3 class="c-modal__title">OmiLink Tools</h3>
      
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

      <div class="c-modal__actions">
        <button type="button" @click="close" class="btn-primary">Close</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.c-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 20px;
}

.c-modal {
  background: white;
  padding: 30px;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.3);
}

.c-modal__title {
  margin-top: 0;
  margin-bottom: 24px;
  font-size: 1.4rem;
  font-weight: 700;
}

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

.c-modal__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn-primary {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}
</style>

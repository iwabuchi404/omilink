<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import pb from '../../lib/pocketbase';
import BaseModal from '../ui/BaseModal.vue';
import BaseButton from '../ui/BaseButton.vue';

const props = defineProps<{
  show: boolean;
  item: {
    id: string;      // Placement ID
    itemId: string;  // Actual Item ID
    title: string;
    content: string;
    color?: string;
  } | null;
}>();

const emit = defineEmits(['close', 'success']);

const localContent = ref('');
const isSaving = ref(false);
const lastSavedContent = ref('');
const textareaRef = ref<HTMLTextAreaElement | null>(null);

// Initialize local content when modal opens
watch(() => props.show, (newShow) => {
  if (newShow && props.item) {
    localContent.value = props.item.content;
    lastSavedContent.value = props.item.content;
  }
});

// Helper to safely extract title
const extractTitle = (content: string) => {
  if (!content) return 'Untitled';
  const lines = content.split('\n');
  return (lines[0] || '').trim() || 'Untitled';
};

// Extract title from first line
const derivedTitle = computed(() => extractTitle(localContent.value));

// Auto-save logic
let saveTimeout: any = null;

watch(localContent, (newContent) => {
  if (!props.item || newContent === lastSavedContent.value) return;

  if (saveTimeout) clearTimeout(saveTimeout);
  
  saveTimeout = setTimeout(async () => {
    if (!props.item) return;
    
    isSaving.value = true;
    try {
      const title = extractTitle(newContent);
      await pb.collection('items').update(props.item.itemId, {
        memo: newContent,
        title: title
      });
      lastSavedContent.value = newContent;
      emit('success'); // Refresh grid
    } catch (err) {
      console.error('Failed to auto-save memo:', err);
    } finally {
      isSaving.value = false;
    }
  }, 1000); // 1 second debounce
});

function handleUndo() {
  if (textareaRef.value) {
    textareaRef.value.focus();
    document.execCommand('undo');
  }
}

function handleClose() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    // Final save if needed
    if (props.item && localContent.value !== lastSavedContent.value) {
      saveMemo();
    }
  }
  emit('close');
}

async function saveMemo() {
  if (!props.item) return;
  isSaving.value = true;
  try {
    const title = extractTitle(localContent.value);
    await pb.collection('items').update(props.item.itemId, {
      memo: localContent.value,
      title: title
    });
    lastSavedContent.value = localContent.value;
    emit('success');
  } catch (err) {
    console.error('Failed to save memo:', err);
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <BaseModal :show="show" :title="derivedTitle" maxWidth="800px" @close="handleClose">
    <div class="c-memo-editor">
      <div class="c-memo-editor__toolbar">
        <div class="c-memo-status">
          <span v-if="isSaving" class="is-saving">Saving...</span>
          <span v-else class="is-saved">Saved</span>
        </div>
        <button class="c-memo-undo-btn" @click="handleUndo" title="Undo (Ctrl+Z)">
          ↩️ Undo
        </button>
      </div>

      <div class="c-memo-editor__body">
        <textarea
          ref="textareaRef"
          v-model="localContent"
          class="c-memo-textarea"
          placeholder="Start typing your memo here...&#10;The first line will be used as the title."
          spellcheck="false"
        ></textarea>
      </div>
    </div>
    
    <template #footer>
      <div class="c-memo-editor__footer">
        <div class="c-memo-hint">
          <kbd>Ctrl</kbd> + <kbd>Z</kbd> to undo
        </div>
        <div class="c-memo-actions">
          <BaseButton variant="primary" @click="handleClose">Done</BaseButton>
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.c-memo-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.c-memo-editor__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
}

.c-memo-status {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.is-saving {
  color: var(--color-primary);
  animation: pulse 1.5s infinite;
}

.is-saved {
  color: var(--color-text-muted);
  opacity: 0.7;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

.c-memo-undo-btn {
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 0.85rem;
  cursor: pointer;
  color: var(--color-text-main);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.c-memo-undo-btn:hover {
  background: var(--color-border);
}

.c-memo-editor__body {
  background-color: var(--color-memo-bg);
  border: 1px solid var(--color-memo-border);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
}

.c-memo-textarea {
  width: 100%;
  min-height: 400px;
  max-height: 60vh;
  padding: 24px;
  border: none;
  background: transparent;
  color: var(--color-text-main);
  font-family: inherit;
  font-size: 1.1rem;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  display: block;
}

.c-memo-textarea::placeholder {
  color: var(--color-text-muted);
  opacity: 0.5;
}

.c-memo-editor__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.c-memo-hint {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.c-memo-hint kbd {
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: 3px;
  padding: 1px 4px;
  font-size: 0.75rem;
  font-family: sans-serif;
}

[data-theme="dark"] .c-memo-editor__body {
  background-color: rgba(0, 0, 0, 0.2);
}

[data-theme="dark"] .c-memo-undo-btn {
  background: rgba(255, 255, 255, 0.05);
}
</style>

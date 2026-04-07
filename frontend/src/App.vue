<script setup lang="ts">
import { ref, onMounted } from 'vue'
import pb from './lib/pocketbase'
import AppHeader from './components/layout/AppHeader.vue'
import ViewTabs from './components/layout/ViewTabs.vue'
import GridView from './components/GridView.vue'
import Auth from './components/Auth.vue'
import AddItemModal from './components/modals/AddItemModal.vue'
import AddViewModal from './components/modals/AddViewModal.vue'
import ToolsModal from './components/modals/ToolsModal.vue'
import type { ViewsResponse } from './lib/pocketbase-types'
import { computed, watch } from 'vue'

const isEditMode = ref(false)
const isAuthenticated = ref(pb.authStore.isValid)
const currentUser = ref(pb.authStore.model)
const showAddModal = ref(false)
const showAddViewModal = ref(false)
const showToolsModal = ref(false)
const searchQuery = ref('')
const gridRef = ref<any>(null)

const sharedUrl = ref('')
const sharedTitle = ref('')

const views = ref<ViewsResponse[]>([])
const currentViewId = ref<string | null>(null)
const currentView = computed(() => views.value.find(v => v.id === currentViewId.value) || null)

const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value
}

const handleAuthSuccess = async () => {
  isAuthenticated.value = pb.authStore.isValid
  currentUser.value = pb.authStore.model
  await fetchViews()
  
  if (sharedUrl.value) {
    setTimeout(() => {
      showAddModal.value = true;
    }, 500);
  }
}

const logout = () => {
  pb.authStore.clear()
  isAuthenticated.value = false
  currentUser.value = null
  isEditMode.value = false
  views.value = []
  currentViewId.value = null
}

const handleAddSuccess = () => {
  showAddModal.value = false
  // Call the fetchItems method on GridView if available
  if (gridRef.value && gridRef.value.fetchItems) {
    gridRef.value.fetchItems()
  }
}

const handleViewCreated = (view: ViewsResponse) => {
  views.value.push(view);
  currentViewId.value = view.id;
  showAddViewModal.value = false;
}

async function fetchViews() {
  if (!isAuthenticated.value) return;
  try {
    let records = await pb.collection('views').getFullList<ViewsResponse>({ sort: 'created' });
    if (records.length === 0) {
      const home = await pb.collection('views').create<ViewsResponse>({
        user: currentUser.value?.id,
        name: '🏠 Home',
        cols: 8,
        cell_size: 'medium',
      });
      records = [home];
    }
    views.value = records;
    if (!currentViewId.value && records.length > 0) {
      const savedViewId = localStorage.getItem('omi_last_view');
      const foundView = savedViewId ? records.find(v => v.id === savedViewId) : null;
      currentViewId.value = foundView ? foundView.id : records[0]!.id;
    }
  } catch (e) {
    console.error('Failed to fetch views', e);
  }
}
// Watch for view changes to save to localStorage
watch(currentViewId, (newId) => {
  if (newId) {
    localStorage.setItem('omi_last_view', newId);
  }
});

// Watch for store changes and verify session on mount
onMounted(async () => {
  // Parse URL for shared data
  const params = new URLSearchParams(window.location.search);
  const pUrl = params.get('url') || params.get('text');
  const pTitle = params.get('title');

  if (pUrl) {
    let finalUrl = pUrl;
    // Android Share sometimes sends "Page Title https://url" in the text parameter
    if (pUrl.includes('http')) {
      const match = pUrl.match(/(https?:\/\/[^\s]+)/);
      if (match) finalUrl = match[1];
    }
    sharedUrl.value = finalUrl;
    if (pTitle) sharedTitle.value = pTitle as string;
    
    // Clean up URL so it doesn't trigger again on refresh
    window.history.replaceState({}, document.title, window.location.pathname);

    // If already authenticated, show modal immediately!
    if (pb.authStore.isValid) {
      showAddModal.value = true;
    }
  }

  // Sync state with store
  pb.authStore.onChange(() => {
    isAuthenticated.value = pb.authStore.isValid
    currentUser.value = pb.authStore.model
  }, true) // Call immediately to sync

  // Verify and refresh the session with the server
  if (pb.authStore.isValid) {
    try {
      await pb.collection('users').authRefresh();
      await fetchViews();
    } catch (err) {
      // If token is invalid/expired, clear it
      logout();
    }
  }
})
</script>

<template>
  <div class="l-app-container">
    <AppHeader 
      :is-authenticated="isAuthenticated"
      :current-user="currentUser"
      :is-edit-mode="isEditMode"
      :current-view="currentView"
      v-model:search-query="searchQuery"
      @toggle-edit-mode="toggleEditMode"
      @show-add-modal="showAddModal = true"
      @show-tools-modal="showToolsModal = true"
      @logout="logout"
    />

    <ViewTabs 
      v-if="isAuthenticated && currentView"
      :views="views"
      :current-view-id="currentViewId"
      @update:current-view-id="currentViewId = $event"
      @add-view="showAddViewModal = true"
    />

    <main class="l-main">
      <div v-if="!isAuthenticated" class="p-auth-page">
        <Auth @auth-success="handleAuthSuccess" />
      </div>
      <GridView 
        v-else-if="currentView" 
        ref="gridRef" 
        :is-edit-mode="isEditMode" 
        :current-view="currentView" 
        :views="views"
        :search-query="searchQuery"
      />
      
      <AddItemModal 
        v-if="currentView"
        :show="showAddModal" 
        :current-view="currentView"
        :views="views"
        :prefill-url="sharedUrl"
        :prefill-title="sharedTitle"
        @close="showAddModal = false; sharedUrl = ''; sharedTitle = '';" 
        @success="handleAddSuccess" 
      />
      
      <AddViewModal 
        v-if="showAddViewModal"
        @close="showAddViewModal = false"
        @view-created="handleViewCreated"
      />

      <ToolsModal
        :show="showToolsModal"
        @close="showToolsModal = false"
      />
    </main>
  </div>
</template>

<style scoped>
.l-app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.l-main {
  flex-grow: 1;
  position: relative;
  background-color: #f0f2f5;
  height: 100%; /* Ensure main takes up remaining space properly */
  overflow: hidden; /* Prevent scrolling on main, let children scroll */
}

.p-auth-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
</style>

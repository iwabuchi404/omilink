<script setup lang="ts">
import { ref, watch, onMounted, computed, provide } from 'vue'
import pb from '../lib/pocketbase'
import AppHeader from '../components/layout/AppHeader.vue'
import ViewTabs from '../components/layout/ViewTabs.vue'
import GridView from '../components/GridView.vue'
import AddItemModal from '../components/modals/AddItemModal.vue'
import AddViewModal from '../components/modals/AddViewModal.vue'
import ToolsModal from '../components/modals/ToolsModal.vue'
import type { ViewsResponse } from '../lib/pocketbase-types'
import { useAuth } from '../composables/useAuth'

const { isAuthenticated, currentUser, logout } = useAuth()

const isEditMode = ref(false)
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

// Provide View Info Globally
provide('views', views)
provide('fetchViews', fetchViews)

const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value
}

const handleAddSuccess = () => {
  showAddModal.value = false
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

watch(currentViewId, (newId) => {
  if (newId) localStorage.setItem('omi_last_view', newId);
});

onMounted(async () => {
  await fetchViews()

  const params = new URLSearchParams(window.location.search);
  const pUrl = params.get('url') || params.get('text');
  const pTitle = params.get('title');

  if (pUrl) {
    let finalUrl = pUrl;
    if (pUrl.includes('http')) {
      const match = pUrl.match(/(https?:\/\/[^\s]+)/);
      if (match && match[1]) finalUrl = match[1];
    }
    sharedUrl.value = finalUrl;
    if (pTitle) sharedTitle.value = pTitle as string;
    
    window.history.replaceState({}, document.title, window.location.pathname);
    showAddModal.value = true;
  }
})
</script>

<template>
  <AppHeader 
    :is-authenticated="true"
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
    v-if="currentView"
    :views="views"
    :current-view-id="currentViewId"
    @update:current-view-id="currentViewId = $event"
    @add-view="showAddViewModal = true"
  />

  <main class="l-main">
    <GridView 
      v-if="currentView" 
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
</template>

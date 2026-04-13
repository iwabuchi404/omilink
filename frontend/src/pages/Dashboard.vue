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
const headerRef = ref<any>(null)
const isHeaderHidden = ref(false)
const viewToEdit = ref<ViewsResponse | null>(null)

const sharedUrl = ref('')
const sharedTitle = ref('')

const views = ref<ViewsResponse[]>([])
const currentViewId = ref<string | null>(null)
const currentView = computed(() => views.value.find(v => v.id === currentViewId.value) || null)

// Tab Position Support
type TabPosition = 'top' | 'bottom';
const tabPosition = ref<TabPosition>((localStorage.getItem('omi_tab_position') as TabPosition) || 'top');

const toggleTabPosition = () => {
  tabPosition.value = tabPosition.value === 'top' ? 'bottom' : 'top';
  localStorage.setItem('omi_tab_position', tabPosition.value);
};

// Provide View Info Globally
provide('views', views)
provide('fetchViews', fetchViews)
provide('tabPosition', tabPosition)
provide('toggleTabPosition', toggleTabPosition)

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

const handleEditView = (view: ViewsResponse) => {
  viewToEdit.value = view;
  showAddViewModal.value = true;
}

const handleViewUpdated = (updatedView: ViewsResponse) => {
  const index = views.value.findIndex(v => v.id === updatedView.id);
  if (index !== -1) {
    views.value[index] = updatedView;
  }
}

const handleViewDeleted = (id: string) => {
  const index = views.value.findIndex(v => v.id === id);
  if (index !== -1) {
    views.value.splice(index, 1);
    // If we deleted the current view, switch to another one
    if (currentViewId.value === id) {
      currentViewId.value = views.value.length > 0 ? (views.value[0]?.id || null) : null;
    }
  }
}

const closeAddViewModal = () => {
  showAddViewModal.value = false;
  viewToEdit.value = null;
}

async function fetchViews() {
  if (!isAuthenticated.value) return;
  try {
    // Sort by sort_order first, then created date
    let records = await pb.collection('views').getFullList<ViewsResponse>({ 
      sort: 'sort_order,created' 
    });
    if (records.length === 0) {
      const home = await pb.collection('views').create<ViewsResponse>({
        user: currentUser.value?.id,
        name: '🏠 Home',
        cols: 6,
        rows: 6,
      });
      records = [home];
    }
    views.value = records;
    if (!currentViewId.value && records.length > 0) {
      const savedViewId = localStorage.getItem('omi_last_view');
      const foundView = savedViewId ? records.find(v => v.id === savedViewId) : null;
      currentViewId.value = foundView ? foundView.id : (records[0]?.id || null);
    }
  } catch (e) {
    console.error('Failed to fetch views', e);
  }
}

async function handleTabReorder(newViews: ViewsResponse[]) {
  // Update local state immediately for responsiveness
  views.value = [...newViews];
  
  try {
    // Update each view's sort_order in PocketBase
    const promises = newViews.map((view, index) => {
      // Only update if sort_order actually needs to change to save API calls
      // Assuming sort_order is a Number field. Index + 1 is our new order.
      return pb.collection('views').update(view.id, { sort_order: index + 1 });
    });
    await Promise.all(promises);
    console.log('Tab order saved successfully');
  } catch (err) {
    console.error('Failed to save tab order:', err);
    // Optionally rollback on failure
    fetchViews();
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
  <div class="l-dashboard" :class="{ 'is-header-hidden': isHeaderHidden }">
    <AppHeader 
      ref="headerRef"
      :is-authenticated="true"
      :current-user="currentUser"
      :is-edit-mode="isEditMode"
      :current-view="currentView"
      v-model:search-query="searchQuery"
      v-model:is-hidden="isHeaderHidden"
      @toggle-edit-mode="toggleEditMode"
      @show-add-modal="showAddModal = true"
      @show-tools-modal="showToolsModal = true"
      @logout="logout"
    />

  <ViewTabs 
    v-if="currentView && tabPosition === 'top'"
    :views="views"
    :current-view-id="currentViewId"
    :is-edit-mode="isEditMode"
    @update:current-view-id="currentViewId = $event"
    @add-view="showAddViewModal = true"
    @edit-view="handleEditView"
    @reorder="handleTabReorder"
  />

  <main class="l-main" :class="{ 'has-tabs-bottom': tabPosition === 'bottom' }">
    <GridView 
      v-if="currentView" 
      ref="gridRef" 
      :is-edit-mode="isEditMode" 
      :current-view="currentView" 
      :views="views"
      :search-query="searchQuery"
      @scroll="headerRef?.handleScroll($event)"
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
      :show="showAddViewModal"
      :view="viewToEdit"
      :can-delete="views.length > 1"
      @close="closeAddViewModal"
      @view-created="handleViewCreated"
      @view-updated="handleViewUpdated"
      @view-deleted="handleViewDeleted"
    />

    <ToolsModal
      :show="showToolsModal"
      @close="showToolsModal = false"
    />
  </main>

  <ViewTabs 
    v-if="currentView && tabPosition === 'bottom'"
    :views="views"
    :current-view-id="currentViewId"
    :is-edit-mode="isEditMode"
    @update:current-view-id="currentViewId = $event"
    @add-view="showAddViewModal = true"
    @edit-view="handleEditView"
    @reorder="handleTabReorder"
    class="is-bottom"
    />
  </div>
</template>

<style scoped>
.l-main {
  flex-grow: 1;
  position: relative;
  overflow: hidden;
  transition: padding 0.3s ease;
}

.l-main.has-tabs-bottom {
  padding-bottom: 0px; /* ViewTabs has its own height and safe areas */
}

/* Header hiding logic */
.l-dashboard {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

/* No more root translate, we collapse the header itself */
</style>

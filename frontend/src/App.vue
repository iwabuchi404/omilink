<script setup lang="ts">
import { ref, onMounted } from 'vue'
import pb from './lib/pocketbase'
import GridView from './components/GridView.vue'
import Auth from './components/Auth.vue'
import AddItemModal from './components/AddItemModal.vue'

const isEditMode = ref(false)
const isAuthenticated = ref(pb.authStore.isValid)
const currentUser = ref(pb.authStore.model)
const showAddModal = ref(false)
const gridRef = ref<any>(null)

const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value
}

const handleAuthSuccess = () => {
  isAuthenticated.value = pb.authStore.isValid
  currentUser.value = pb.authStore.model
}

const logout = () => {
  pb.authStore.clear()
  isAuthenticated.value = false
  currentUser.value = null
  isEditMode.value = false
}

const handleAddSuccess = () => {
  showAddModal.value = false
  // Call the fetchItems method on GridView if available
  if (gridRef.value && gridRef.value.fetchItems) {
    gridRef.value.fetchItems()
  }
}

// Watch for store changes and verify session on mount
onMounted(async () => {
  // Sync state with store
  pb.authStore.onChange(() => {
    isAuthenticated.value = pb.authStore.isValid
    currentUser.value = pb.authStore.model
  }, true) // Call immediately to sync

  // Verify and refresh the session with the server
  if (pb.authStore.isValid) {
    try {
      await pb.collection('users').authRefresh();
    } catch (err) {
      // If token is invalid/expired, clear it
      logout();
    }
  }
})
</script>

<template>
  <div class="l-app-container">
    <header class="l-header">
      <div class="l-header__logo">OMI LINK</div>
      <div style="flex-grow: 1;"></div>
      
      <div v-if="isAuthenticated" class="l-header__actions">
        <span class="l-header__user-info">{{ currentUser?.name || currentUser?.email }}</span>
        <button 
          :class="{ 'is-active': isEditMode }"
          @click="toggleEditMode"
        >
          {{ isEditMode ? 'Finish Editing' : 'Edit Layout' }}
        </button>
        <button @click="showAddModal = true">+ Add</button>
        <button>(3) Inbox</button>
        <button @click="logout" class="u-text-danger">Logout</button>
      </div>
    </header>

    <main class="l-main">
      <div v-if="!isAuthenticated" class="p-auth-page">
        <Auth @auth-success="handleAuthSuccess" />
      </div>
      <GridView v-else ref="gridRef" :is-edit-mode="isEditMode" />
      
      <AddItemModal 
        :show="showAddModal" 
        @close="showAddModal = false" 
        @success="handleAddSuccess" 
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

.l-header {
  flex-shrink: 0;
}

.l-main {
  flex-grow: 1;
  position: relative;
  background-color: #f0f2f5;
}

.p-auth-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.l-header__logo {
  font-weight: bold;
  font-size: 1.2rem;
  letter-spacing: 0.1em;
}

.l-header__user-info {
  font-size: 0.85rem;
  color: #666;
  margin-right: 15px;
}

.l-header__actions {
  display: flex;
  align-items: center;
}

.l-header__actions button {
  margin-left: 10px;
  padding: 5px 15px;
  cursor: pointer;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.l-header__actions button:hover {
  background-color: #f8f9fa;
}

.l-header__actions button.is-active {
  background-color: #007bff;
  color: white;
  border-color: #0056b3;
}

.u-text-danger {
  color: #dc3545 !important;
}

.u-text-danger:hover {
  background-color: #fff1f2 !important;
  border-color: #fecaca !important;
}
</style>

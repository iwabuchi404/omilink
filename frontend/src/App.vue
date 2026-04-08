<script setup lang="ts">
import { provide } from 'vue'
import { RouterView } from 'vue-router'
import { useAuth } from './composables/useAuth'

const { isAuthenticated, currentUser, checkSession } = useAuth()

// Provide global auth state
provide('isAuthenticated', isAuthenticated)
provide('currentUser', currentUser)

// Check session on mount
checkSession()
</script>

<template>
  <div class="l-app-container">
    <RouterView />
  </div>
</template>

<style>
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
  height: 100%;
  overflow: hidden;
}
</style>

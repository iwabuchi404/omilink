<script setup lang="ts">
import { provide } from 'vue'
import { RouterView } from 'vue-router'
import { useAuth } from './composables/useAuth'
import { useTheme } from './composables/useTheme'

const { isAuthenticated, currentUser, checkSession } = useAuth()
const { theme, toggleTheme } = useTheme()

// Provide global state
provide('isAuthenticated', isAuthenticated)
provide('currentUser', currentUser)
provide('theme', theme)
provide('toggleTheme', toggleTheme)

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
  background-color: var(--color-bg-page);
  color: var(--color-text-main);
}

.l-main {
  flex-grow: 1;
  position: relative;
  height: 100%;
  overflow: hidden;
  background-color: var(--color-bg-page);
}
</style>

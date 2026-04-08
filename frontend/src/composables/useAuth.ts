import { ref } from 'vue'
import pb from '../lib/pocketbase'
import type { UsersResponse } from '../lib/pocketbase-types'
import router from '../router'

// Global shared state for Auth
const isAuthenticated = ref(pb.authStore.isValid)
const currentUser = ref<UsersResponse | null>(pb.authStore.model as UsersResponse | null)

// Keep it synced with Pocketbase store
pb.authStore.onChange(() => {
  isAuthenticated.value = pb.authStore.isValid
  currentUser.value = pb.authStore.model as UsersResponse | null
})

export function useAuth() {
  async function checkSession() {
    if (pb.authStore.isValid) {
      try {
        await pb.collection('users').authRefresh()
      } catch (err) {
        pb.authStore.clear()
        router.push({ name: 'login' })
      }
    }
  }

  function logout() {
    pb.authStore.clear()
    router.push({ name: 'login' })
  }

  return {
    isAuthenticated,
    currentUser,
    checkSession,
    logout
  }
}

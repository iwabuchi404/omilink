import { createRouter, createWebHistory } from 'vue-router'
import pb from '../lib/pocketbase'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../pages/Login.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../pages/Dashboard.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

// Navigation Guard
router.beforeEach((to) => {
  const isAuthenticated = pb.authStore.isValid

  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: 'login' }
  } else if (to.meta.requiresGuest && isAuthenticated) {
    return { name: 'dashboard' }
  }
})

export default router

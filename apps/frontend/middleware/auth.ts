export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return
  const authStore = useAuthStore()
  if (!authStore.isLoggedIn) {
    return navigateTo("/giris")
  }
})

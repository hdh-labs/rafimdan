export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore()
  if (!authStore.isLoggedIn || !authStore.user?.is_admin) {
    return navigateTo("/")
  }
})

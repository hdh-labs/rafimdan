export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) {
    const token = useCookie("access_token")
    if (!token.value) return navigateTo("/giris")
    return
  }
  const authStore = useAuthStore()
  if (!authStore.isLoggedIn) {
    return navigateTo("/giris")
  }
})

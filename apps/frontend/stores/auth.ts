import { defineStore } from "pinia"
import type { UserProfile } from "@rafimdan/shared"

export const useAuthStore = defineStore("auth", () => {
  const user = ref<UserProfile | null>(null)
  const isLoggedIn = computed(() => user.value !== null)

  const accessToken = useCookie<string | null>("access_token", {
    maxAge: 60 * 15,
    sameSite: "lax",
    path: "/",
  })

  async function fetchMe() {
    if (!accessToken.value) {
      user.value = null
      return
    }
    try {
      const res = await $fetch<{ data: UserProfile; status: "ok" }>("/api/auth/me", {
        headers: { Authorization: `Bearer ${accessToken.value}` },
      })
      user.value = res.data
      const favoritesStore = useFavoritesStore()
      await favoritesStore.fetchFavorites()
    } catch {
      accessToken.value = null
      user.value = null
    }
  }

  async function tryRefresh() {
    try {
      const res = await $fetch<{ data: { user: UserProfile; access_token: string }; status: "ok" }>(
        "/api/auth/refresh",
        { method: "POST", credentials: "include" },
      )
      accessToken.value = res.data.access_token
      user.value = res.data.user
      const favoritesStore = useFavoritesStore()
      await favoritesStore.fetchFavorites()
    } catch {
      user.value = null
    }
  }

  async function init() {
    if (accessToken.value) {
      await fetchMe()
      if (user.value) return
      // fetchMe başarısız (token expire olmuş olabilir), refresh dene
      await tryRefresh()
      return
    }
    await tryRefresh()
  }

  async function login(token: string) {
    accessToken.value = token
    await fetchMe()
  }

  async function logout() {
    try {
      await $fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    } catch {
      // noop
    }
    accessToken.value = null
    user.value = null
    const favoritesStore = useFavoritesStore()
    favoritesStore.ids = new Set()
    await navigateTo("/")
  }

  return { user, isLoggedIn, accessToken, login, logout, fetchMe, init }
})

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
    } catch {
      accessToken.value = null
      user.value = null
    }
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
    await navigateTo("/")
  }

  return { user, isLoggedIn, accessToken, login, logout, fetchMe }
})

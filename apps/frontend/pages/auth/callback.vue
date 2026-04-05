<script setup lang="ts">
import type { UserProfile } from "@rafimdan/shared"

definePageMeta({ layout: false })

const authStore = useAuthStore()

onMounted(async () => {
  const params = new URLSearchParams(window.location.search)
  const error = params.get("error")

  if (error) {
    await navigateTo("/giris")
    return
  }

  try {
    const res = await $fetch<{ data: { user: UserProfile; access_token: string }; status: "ok" }>(
      "/api/auth/refresh",
      { method: "POST", credentials: "include" },
    )
    await authStore.login(res.data.access_token)
    await navigateTo("/")
  } catch {
    await navigateTo("/giris")
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="flex flex-col items-center gap-3">
      <svg
        class="size-8 animate-spin text-gray-400"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <p class="text-sm text-muted-foreground">Giriş yapılıyor...</p>
    </div>
  </div>
</template>

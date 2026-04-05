<script setup lang="ts">
definePageMeta({ layout: false })

const authStore = useAuthStore()

onMounted(async () => {
  const hash = window.location.hash.slice(1)
  const params = new URLSearchParams(hash)
  const token = params.get("access_token")

  if (!token) {
    await navigateTo("/giris")
    return
  }

  try {
    await authStore.login(token)
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

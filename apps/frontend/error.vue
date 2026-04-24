<script setup lang="ts">
import type { NuxtError } from "#app"

const props = defineProps<{ error: NuxtError }>()

const title = computed(() => {
  switch (props.error.statusCode) {
    case 401: return "Oturum Sona Erdi"
    case 403: return "Erişim Reddedildi"
    case 404: return "Sayfa Bulunamadı"
    case 429: return "Çok Fazla İstek"
    default:  return "Bir Hata Oluştu"
  }
})

const description = computed(() => {
  switch (props.error.statusCode) {
    case 401: return "Oturumunuz sona erdi. Lütfen tekrar giriş yapın."
    case 403: return "Bu sayfaya erişim yetkiniz yok."
    case 404: return "Aradığınız sayfa bulunamadı."
    case 429: return "Çok fazla istek gönderildi. Lütfen biraz bekleyin."
    default:  return "Beklenmedik bir hata oluştu. Lütfen daha sonra tekrar deneyin."
  }
})

useHead({ title: () => `${title.value} — Rafımdan` })

function handleError() {
  clearError({ redirect: "/" })
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-background">
    <AppHeader />
    <main class="flex-1 flex items-center justify-center px-4">
      <div class="text-center max-w-md">
        <p class="text-6xl font-bold text-brand mb-4">{{ error.statusCode }}</p>
        <h1 class="text-xl font-semibold text-foreground mb-2">{{ title }}</h1>
        <p class="text-sm text-muted-foreground mb-8">{{ description }}</p>
        <button
          type="button"
          class="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand/90 cursor-pointer transition-colors"
          @click="handleError"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    </main>
    <AppFooter />
  </div>
</template>

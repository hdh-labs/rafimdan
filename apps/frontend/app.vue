<script setup lang="ts">
import { toast } from "vue-sonner"

const { $pwa } = useNuxtApp()

watch(
  () => $pwa?.needRefresh,
  (val) => {
    if (!val) return
    toast.info("Yeni sürüm hazır.", {
      duration: Infinity,
      action: {
        label: "Güncelle",
        onClick: () => $pwa?.updateServiceWorker(),
      },
    })
  },
)
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <ClientOnly>
    <Toaster position="bottom-right" richColors />
  </ClientOnly>
</template>

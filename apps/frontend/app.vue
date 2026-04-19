<script setup lang="ts">
import { toast } from "vue-sonner"

const { $pwa } = useNuxtApp()

const siteUrl = useRuntimeConfig().public.siteUrl

useSeoMeta({
  ogType: "website",
  ogSiteName: "Rafımdan",
  ogTitle: "Rafımdan — Yerel İkinci El Pazar Yeri",
  ogDescription: "Yakınındaki ikinci el eşyaları bul, kargosuz yüz yüze al. Elektronik, mobilya, giyim ve daha fazlası — şehrinde, mahallesinde.",
  ogImage: `${siteUrl}/og-image.png`,
  ogImageWidth: "1200",
  ogImageHeight: "630",
  twitterCard: "summary_large_image",
  twitterTitle: "Rafımdan — Yerel İkinci El Pazar Yeri",
  twitterDescription: "Yakınındaki ikinci el eşyaları bul, kargosuz yüz yüze al. Elektronik, mobilya, giyim ve daha fazlası — şehrinde, mahallesinde.",
  twitterImage: `${siteUrl}/og-image.png`,
})

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

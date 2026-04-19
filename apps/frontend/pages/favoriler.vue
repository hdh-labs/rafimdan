<script setup lang="ts">
import { Heart } from "lucide-vue-next"
import { toast } from "vue-sonner"
import type { ListingListItem, FavoritesResponse } from "@rafimdan/shared"
import { apiFetch } from "~/utils/api"

definePageMeta({ middleware: ["auth"] })

useSeoMeta({ title: "Favorilerim — Rafımdan" })

const favoritesStore = useFavoritesStore()

const listings = ref<ListingListItem[]>([])
const loading = ref(true)

const cardItems = computed(() =>
  listings.value.map((item) => ({
    ...item,
    price: item.price ?? 0,
    cover_photo: item.cover_photo ?? undefined,
    district: item.district ?? undefined,
    seller: {
      ...item.seller,
      avatar_url: item.seller.avatar_url ?? undefined,
    },
  })),
)

onMounted(async () => {
  try {
    const res = await apiFetch<{ data: FavoritesResponse; status: "ok" }>("/api/favorites")
    listings.value = res.data.listings
    favoritesStore.ids = new Set(res.data.listings.map((l) => l.id))
  } catch {
    listings.value = []
    toast.error("Favoriler yüklenemedi.")
  } finally {
    loading.value = false
  }
})

watch(
  () => favoritesStore.ids,
  (ids) => {
    listings.value = listings.value.filter((l) => ids.has(l.id))
  },
)
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <div class="flex items-center gap-2 mb-6">
      <Heart class="size-5 fill-rose-500 text-rose-500" />
      <h1 class="text-xl font-bold">Favorilerim</h1>
    </div>

    <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      <div
        v-for="i in 4"
        :key="i"
        class="rounded-lg border border-border overflow-hidden animate-pulse"
      >
        <div class="aspect-[4/3] bg-muted" />
        <div class="p-3 space-y-2">
          <div class="h-3.5 bg-muted rounded w-3/4" />
          <div class="h-3 bg-muted rounded w-1/2" />
        </div>
      </div>
    </div>

    <div v-else-if="listings.length === 0" class="text-center py-20">
      <Heart class="size-12 mx-auto mb-3 text-muted-foreground/30" />
      <p class="text-muted-foreground">Henüz favori ilan eklemedin.</p>
      <NuxtLink
        to="/ilanlar"
        class="inline-block mt-4 text-sm underline underline-offset-2 cursor-pointer"
      >
        İlanlara göz at
      </NuxtLink>
    </div>

    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      <ListingCard
        v-for="item in cardItems"
        :key="item.id"
        v-bind="item"
      />
    </div>
  </div>
</template>

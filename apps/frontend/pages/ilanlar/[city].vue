<script setup lang="ts">
import type { ListingListItem, PaginatedResponse } from "@rafimdan/shared"

type ListingsResp = { data: PaginatedResponse<ListingListItem>; status: "ok" }

const route = useRoute()
const router = useRouter()
const city = computed(() => route.params.city as string)

const { data: listingsRes, pending } = await useFetch<ListingsResp>(
  () => {
    const p = new URLSearchParams({ city: city.value, limit: "20" })
    if (route.query.page) p.set("page", route.query.page as string)
    return `/api/listings?${p}`
  },
  { watch: [() => route.query.page] },
)

const listings = computed(() => listingsRes.value?.data.items ?? [])
const total = computed(() => listingsRes.value?.data.total ?? 0)
const currentPage = computed(() => Number(route.query.page) || 1)
const totalPages = computed(() => Math.ceil(total.value / 20))

function goToPage(p: number) {
  router.push({ query: { ...route.query, page: String(p) } })
}

useSeoMeta({
  title: () => `${city.value} İkinci El İlanları — Rafımdan`,
  description: () =>
    `${city.value}'deki ikinci el ilanlar. Kargosuz, komşunla yüz yüze alışveriş.`,
})
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8 space-y-6">
    <div>
      <nav class="text-xs text-muted-foreground mb-2 flex items-center gap-1">
        <NuxtLink to="/" class="hover:text-foreground cursor-pointer">Ana Sayfa</NuxtLink>
        <span>/</span>
        <NuxtLink to="/ilanlar" class="hover:text-foreground cursor-pointer">İlanlar</NuxtLink>
        <span>/</span>
        <span class="text-foreground">{{ city }}</span>
      </nav>
      <h1 class="text-2xl font-bold text-foreground">
        {{ city }} İkinci El İlanları
      </h1>
      <p v-if="!pending" class="text-sm text-muted-foreground mt-1">
        {{ total }} ilan
      </p>
    </div>

    <div v-if="pending" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      <div v-for="i in 8" :key="i" class="rounded-lg border border-border bg-muted animate-pulse aspect-[3/4]" />
    </div>

    <template v-else>
      <div v-if="listings.length === 0" class="py-16 text-center">
        <p class="text-muted-foreground text-sm">{{ city }}'de henüz ilan yok.</p>
        <NuxtLink
          to="/ilan-ver"
          class="mt-3 inline-block text-sm text-foreground underline underline-offset-2 cursor-pointer"
        >
          İlk ilanı sen ver
        </NuxtLink>
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <ListingCard
          v-for="listing in listings"
          :key="listing.id"
          :id="listing.id"
          :slug="listing.slug"
          :title="listing.title"
          :price="listing.price ?? 0"
          :price_type="listing.price_type"
          :condition="listing.condition"
          :status="listing.status"
          :cover_photo="listing.cover_photo ?? undefined"
          :city="listing.city"
          :district="listing.district ?? undefined"
          :seller="{
            id: listing.seller.id,
            name: listing.seller.display_name ?? listing.seller.name,
            avatar_url: listing.seller.avatar_url ?? undefined,
          }"
          :created_at="listing.created_at"
        />
      </div>

      <div v-if="totalPages > 1" class="flex items-center justify-center gap-3 pt-4">
        <button
          :disabled="currentPage <= 1"
          class="px-4 py-1.5 text-sm border border-border rounded-md cursor-pointer hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          @click="goToPage(currentPage - 1)"
        >
          Önceki
        </button>
        <span class="text-sm text-muted-foreground">{{ currentPage }} / {{ totalPages }}</span>
        <button
          :disabled="currentPage >= totalPages"
          class="px-4 py-1.5 text-sm border border-border rounded-md cursor-pointer hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          @click="goToPage(currentPage + 1)"
        >
          Sonraki
        </button>
      </div>
    </template>
  </div>
</template>

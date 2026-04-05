<script setup lang="ts">
import type { ListingListItem, CategoryTree, ApiResponse, PaginatedResponse } from "@rafimdan/shared"

type ListingsData = ApiResponse<PaginatedResponse<ListingListItem>>
type CategoriesData = ApiResponse<CategoryTree[]>

const { data: listingsRes } = await useFetch<ListingsData>("/api/listings?limit=12&page=1")
const { data: categoriesRes } = await useFetch<CategoriesData>("/api/categories")

const listings = computed(() => listingsRes.value?.data.items ?? [])
const categories = computed(() => categoriesRes.value?.data ?? [])

const FEATURED_CITIES = [
  "İstanbul",
  "Ankara",
  "İzmir",
  "Bursa",
  "Antalya",
  "Adana",
]
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8 space-y-10">
    <section class="text-center space-y-3">
      <h1 class="text-3xl font-bold text-foreground">
        Yakınındaki ikinci el ilanlar
      </h1>
      <p class="text-muted-foreground max-w-md mx-auto">
        Kargosuz, yüz yüze alışveriş. Gerçek insanlar, gerçek fiyatlar.
      </p>
      <div class="flex items-center justify-center gap-3">
        <NuxtLink
          to="/ilanlar"
          class="inline-block bg-foreground text-background px-5 py-2.5 rounded-md text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
        >
          Tüm İlanlar
        </NuxtLink>
        <NuxtLink
          to="/ilan-ver"
          class="inline-block border border-border bg-background text-foreground px-5 py-2.5 rounded-md text-sm font-medium cursor-pointer hover:bg-muted transition-colors"
        >
          İlan Ver
        </NuxtLink>
      </div>
    </section>

    <section v-if="categories.length > 0" class="space-y-3">
      <h2 class="text-lg font-semibold text-foreground">Kategoriler</h2>
      <CategoryGrid :categories="categories" />
    </section>

    <section v-if="listings.length > 0" class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-foreground">Son İlanlar</h2>
        <NuxtLink
          to="/ilanlar"
          class="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        >
          Tümünü gör
        </NuxtLink>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold text-foreground">Şehre Göre</h2>
      <div class="flex flex-wrap gap-2">
        <NuxtLink
          v-for="city in FEATURED_CITIES"
          :key="city"
          :to="`/ilanlar?city=${city}`"
          class="px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
        >
          {{ city }}
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

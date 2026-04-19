<script setup lang="ts">
import { ArrowRight, LayoutGrid, Clock } from "lucide-vue-next"
import type { ListingListItem, CategoryTree, ApiResponse, PaginatedResponse } from "@rafimdan/shared"

type ListingsData = ApiResponse<PaginatedResponse<ListingListItem>>
type CategoriesData = ApiResponse<CategoryTree[]>

const { data: listingsRes } = await useFetch<ListingsData>("/api/listings?limit=8&page=1")
const { data: categoriesRes } = await useFetch<CategoriesData>("/api/categories")
const listings = computed(() => listingsRes.value?.data.items ?? [])
const categories = computed(() => categoriesRes.value?.data ?? [])

useSeoMeta({
  title: "Rafımdan — Yerel İkinci El Pazar Yeri",
  description: "Yakınındaki ikinci el eşyaları bul, kargosuz yüz yüze al. Elektronik, mobilya, giyim ve daha fazlası — şehrinde, mahallesinde.",
  ogTitle: "Rafımdan — Yerel İkinci El Pazar Yeri",
  ogDescription: "Yakınındaki ikinci el eşyaları bul, kargosuz yüz yüze al. Elektronik, mobilya, giyim ve daha fazlası — şehrinde, mahallesinde.",
})

</script>

<template>
  <div class="max-w-5xl mx-auto px-4 space-y-14 pb-16">

    <!-- Hero -->
    <section class="text-center pt-14 pb-4 space-y-5">
      <div class="inline-flex items-center gap-2 text-xs font-medium text-brand bg-brand/5 border border-brand/20 px-3 py-1 rounded-full">
        Kargo yok · Yüz yüze buluşma · Gerçek fiyatlar
      </div>
      <h1 class="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-tight">
        Yakınındaki ikinci el<br class="hidden sm:block" /> ilanlar
      </h1>
      <p class="text-base text-muted-foreground max-w-sm mx-auto">
        Satıcıyla buluş, kargosuz al. Basit, yerel, güvenli.
      </p>
      <div class="flex items-center justify-center gap-3 pt-1">
        <NuxtLink
          to="/ilanlar"
          class="inline-flex items-center gap-2 bg-brand text-brand-foreground px-6 py-2.5 rounded-lg text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
        >
          Tüm İlanlar
        </NuxtLink>
        <NuxtLink
          to="/ilan-ver"
          class="inline-flex items-center gap-2 border border-border bg-background text-foreground px-6 py-2.5 rounded-lg text-sm font-medium cursor-pointer hover:bg-muted transition-colors"
        >
          İlan Ver
          <ArrowRight class="size-4" />
        </NuxtLink>
      </div>
    </section>

    <!-- Kategoriler -->
    <section v-if="categories.length > 0" class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <LayoutGrid class="size-5 text-brand" />
          <h2 class="text-xl font-bold text-foreground">Kategoriler</h2>
        </div>
      </div>
      <CategoryGrid :categories="categories" />
    </section>

    <!-- Son İlanlar -->
    <section v-if="listings.length === 0" class="text-center py-12 space-y-3">
      <p class="text-muted-foreground text-sm">Henüz ilan yok. İlk ilanı sen ver!</p>
      <NuxtLink
        to="/ilan-ver"
        class="inline-flex items-center gap-1.5 px-4 py-2 bg-brand text-brand-foreground rounded-lg text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
      >
        İlan Ver
      </NuxtLink>
    </section>

    <section v-else class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Clock class="size-5 text-brand" />
          <h2 class="text-xl font-bold text-foreground">Son İlanlar</h2>
        </div>
        <NuxtLink
          to="/ilanlar"
          class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        >
          Tümünü gör
          <ArrowRight class="size-3.5" />
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
          :favorites_count="listing.favorites_count"
        />
      </div>
    </section>


  </div>
</template>

<script setup lang="ts">
import { ArrowRight, HandHeart } from "lucide-vue-next"
import type { ListingListItem, CategoryTree, ApiResponse, PaginatedResponse } from "@rafimdan/shared"

type ListingsData = ApiResponse<PaginatedResponse<ListingListItem>>
type CategoriesData = ApiResponse<CategoryTree[]>

const { data: listingsRes } = await useFetch<ListingsData>("/api/listings?limit=8&page=1")
const { data: categoriesRes } = await useFetch<CategoriesData>("/api/categories")
const { data: communityRes } = await useFetch<ListingsData>("/api/listings?direction=request&limit=4&page=1")

const listings = computed(() => listingsRes.value?.data.items ?? [])
const categories = computed(() => categoriesRes.value?.data ?? [])
const communityListings = computed(() => communityRes.value?.data.items ?? [])

const FEATURED_CITIES = ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Adana"]
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 space-y-14 pb-16">

    <!-- Hero -->
    <section class="text-center pt-14 pb-4 space-y-5">
      <div class="inline-flex items-center gap-2 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
        Kargo yok · Yüz yüze buluşma · Gerçek fiyatlar
      </div>
      <h1 class="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-tight">
        Yakınındaki ikinci el<br class="hidden sm:block" /> ilanlar
      </h1>
      <p class="text-base text-muted-foreground max-w-sm mx-auto">
        Aynı semtte satıcıyla buluş, kargosuz al. Basit, güvenli, yerel.
      </p>
      <div class="flex items-center justify-center gap-3 pt-1">
        <NuxtLink
          to="/ilanlar"
          class="inline-flex items-center gap-2 bg-foreground text-background px-6 py-2.5 rounded-lg text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
        >
          Tüm İlanlar
        </NuxtLink>
        <NuxtLink
          to="/ilan-ver"
          class="inline-flex items-center gap-2 border border-border bg-white text-foreground px-6 py-2.5 rounded-lg text-sm font-medium cursor-pointer hover:bg-muted transition-colors"
        >
          İlan Ver
          <ArrowRight class="size-4" />
        </NuxtLink>
      </div>
    </section>

    <!-- Kategoriler -->
    <section v-if="categories.length > 0" class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold text-foreground">Kategoriler</h2>
      </div>
      <CategoryGrid :categories="categories" />
    </section>

    <!-- Son İlanlar -->
    <section v-if="listings.length > 0" class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold text-foreground">Son İlanlar</h2>
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
        />
      </div>
    </section>

    <!-- Bir El At -->
    <section v-if="communityListings.length > 0" class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <HandHeart class="size-5 text-amber-600" />
          <h2 class="text-xl font-bold text-foreground">Bir El At</h2>
        </div>
        <NuxtLink
          to="/ilanlar?direction=request"
          class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        >
          Tümünü gör
          <ArrowRight class="size-3.5" />
        </NuxtLink>
      </div>
      <p class="text-sm text-muted-foreground -mt-2">Komşuların yardımına koş — ihtiyacını yaz, destek gelsin.</p>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <ListingCard
          v-for="item in communityListings"
          :key="item.id"
          :id="item.id"
          :slug="item.slug"
          :title="item.title"
          :price="item.price ?? 0"
          :price_type="item.price_type"
          :condition="item.condition"
          :status="item.status"
          :direction="item.direction"
          :cover_photo="item.cover_photo ?? undefined"
          :city="item.city"
          :district="item.district ?? undefined"
          :seller="{
            id: item.seller.id,
            name: item.seller.display_name ?? item.seller.name,
            avatar_url: item.seller.avatar_url ?? undefined,
          }"
          :created_at="item.created_at"
        />
      </div>
    </section>

    <!-- Şehre Göre -->
    <section class="space-y-4">
      <h2 class="text-xl font-bold text-foreground">Şehre Göre</h2>
      <div class="flex flex-wrap gap-2">
        <NuxtLink
          v-for="city in FEATURED_CITIES"
          :key="city"
          :to="`/ilanlar?city=${city}`"
          class="px-4 py-2 rounded-full border border-border bg-white text-sm font-medium text-foreground hover:border-foreground hover:shadow-sm cursor-pointer transition-all"
        >
          {{ city }}
        </NuxtLink>
      </div>
    </section>

  </div>
</template>

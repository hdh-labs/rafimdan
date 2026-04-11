<script setup lang="ts">
import { HandHeart, ArrowRight, Plus } from "lucide-vue-next"
import type { ApiResponse, PaginatedResponse, ListingListItem } from "@rafimdan/shared"

type ListingsData = ApiResponse<PaginatedResponse<ListingListItem>>

const page = ref(1)
const LIMIT = 20

const { data: listingsRes, refresh } = await useFetch<ListingsData>(
  () => `/api/listings?direction=request&limit=${LIMIT}&page=${page.value}`,
)

const listings = computed(() => listingsRes.value?.data.items ?? [])
const total = computed(() => listingsRes.value?.data.total ?? 0)
const hasMore = computed(() => page.value * LIMIT < total.value)

function loadMore() {
  page.value++
  refresh()
}

useSeoMeta({
  title: "Arıyorum — Rafımdan",
  description: "Bir el at. Yakınındaki ihtiyaç ilanları.",
})
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 pb-16 space-y-10">

    <!-- Hero -->
    <section class="text-center pt-12 pb-2 space-y-4">
      <div class="inline-flex items-center gap-2 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
        <HandHeart class="size-3.5" />
        Destek İlanları
      </div>
      <h1 class="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
        Bir el at
      </h1>
      <p class="text-sm text-muted-foreground max-w-xs mx-auto">
        İhtiyacını yaz, topluluğun bir el atsın.
      </p>
      <NuxtLink
        to="/ilan-ver"
        class="inline-flex items-center gap-2 border border-border bg-white text-foreground px-5 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-muted transition-colors"
      >
        <Plus class="size-4" />
        Ben de arıyorum
      </NuxtLink>
    </section>

    <!-- Liste -->
    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-semibold text-foreground">
          {{ total > 0 ? `${total} destek ilanı` : 'İlan bulunamadı' }}
        </h2>
      </div>

      <div v-if="listings.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <NuxtLink
          v-for="listing in listings"
          :key="listing.id"
          :to="`/ilan/${listing.slug}`"
          class="group flex gap-3 rounded-xl border border-amber-200 bg-amber-50/40 p-4 hover:bg-amber-50 hover:shadow-sm transition-all duration-150 cursor-pointer"
        >
          <div class="shrink-0 size-16 rounded-lg overflow-hidden bg-muted">
            <img
              v-if="listing.cover_photo"
              :src="listing.cover_photo"
              :alt="listing.title"
              class="size-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div v-else class="size-full flex items-center justify-center">
              <HandHeart class="size-6 text-amber-400" />
            </div>
          </div>
          <div class="min-w-0 flex-1 space-y-1">
            <p class="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
              {{ listing.title }}
            </p>
            <p class="text-xs text-muted-foreground">
              {{ listing.district ? `${listing.district}, ${listing.city}` : listing.city }}
            </p>
            <div class="flex items-center justify-between pt-1">
              <span class="text-xs font-medium text-amber-700">Destek Arıyor</span>
              <span
                v-if="listing.seller.is_ahali"
                class="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
              >
                Ahali
              </span>
            </div>
          </div>
        </NuxtLink>
      </div>

      <div
        v-else
        class="flex flex-col items-center justify-center py-20 gap-3 text-center"
      >
        <HandHeart class="size-10 text-muted-foreground/30" />
        <p class="text-sm text-muted-foreground">Henüz destek ilanı yok.</p>
        <NuxtLink
          to="/ilan-ver"
          class="text-sm font-medium text-foreground underline underline-offset-4 cursor-pointer"
        >
          İlk ilanı sen ver
        </NuxtLink>
      </div>

      <div v-if="hasMore" class="flex justify-center pt-2">
        <button
          type="button"
          class="inline-flex items-center gap-2 border border-border px-5 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted cursor-pointer transition-colors"
          @click="loadMore"
        >
          Daha Fazla
          <ArrowRight class="size-4" />
        </button>
      </div>
    </section>

  </div>
</template>

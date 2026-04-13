<script setup lang="ts">
import { HandHeart, ArrowRight, Plus } from "lucide-vue-next"
import type { ApiResponse, PaginatedResponse, ListingListItem } from "@rafimdan/shared"

type ListingsData = ApiResponse<PaginatedResponse<ListingListItem>>

const LIMIT = 20
const page = ref(1)
const allListings = ref<ListingListItem[]>([])

const { data: listingsRes } = await useFetch<ListingsData>(
  () => `/api/listings?direction=request,support&limit=${LIMIT}&page=${page.value}`,
)

watch(listingsRes, (res) => {
  if (!res?.data.items) return
  if (page.value === 1) {
    allListings.value = res.data.items
  } else {
    allListings.value.push(...res.data.items)
  }
}, { immediate: true })

const total = computed(() => listingsRes.value?.data.total ?? 0)
const hasMore = computed(() => allListings.value.length < total.value)

function loadMore() {
  page.value++
}

useSeoMeta({
  title: "Arıyorum — Rafımdan",
  description: "Ahaliye destek ol. İhtiyaç ve destek ilanları.",
})
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 pb-16 space-y-10">

    <!-- Hero -->
    <section class="text-center pt-12 pb-2 space-y-4">
      <div class="inline-flex items-center gap-2 text-xs font-medium text-brand bg-brand/10 border border-brand/20 px-3 py-1 rounded-full">
        <HandHeart class="size-3.5" />
        Destek İlanları
      </div>
      <h1 class="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
        Ahaliye Destek Ol
      </h1>
      <p class="text-sm text-muted-foreground max-w-xs mx-auto">
        İlanı aç, WhatsApp'tan ulaş. Kargo yok, formalite yok.
      </p>
      <NuxtLink
        to="/ilan-ver?direction=request"
        class="inline-flex items-center gap-2 border border-border bg-background text-foreground px-5 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-muted transition-colors"
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

      <div v-if="allListings.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <NuxtLink
          v-for="listing in allListings"
          :key="listing.id"
          :to="`/ilan/${listing.slug}`"
          :class="[
            'group flex gap-3 rounded-xl border p-4 hover:shadow-sm transition-all duration-150 cursor-pointer',
            listing.direction === 'support' ? 'border-brand/20 bg-brand/5 hover:bg-brand/10' : 'border-brand/40 bg-brand/10 hover:bg-brand/15'
          ]"
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
              <HandHeart class="size-6 text-brand/40" />
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
              <span
                class="text-xs font-medium text-brand"
              >
                {{ listing.direction === 'support' ? 'Destek Sunuyor' : 'Destek Arıyor' }}
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
          to="/ilan-ver?direction=request"
          class="text-sm font-medium text-foreground underline underline-offset-4 cursor-pointer"
        >
          İlk ihtiyacı sen paylaş
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

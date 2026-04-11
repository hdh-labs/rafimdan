<script setup lang="ts">
import { Users, ArrowRight, ShoppingBag, CheckCircle } from "lucide-vue-next"
import type { ApiResponse, PaginatedResponse, ListingListItem } from "@rafimdan/shared"

type StatsData = ApiResponse<{ member_count: number; listing_count: number }>
type ListingsData = ApiResponse<PaginatedResponse<ListingListItem>>

const route = useRoute()
const authStore = useAuthStore()
const joinedNow = ref(false)

const { data: statsRes } = await useFetch<StatsData>("/api/ahali/stats")
const { data: listingsRes } = await useFetch<ListingsData>("/api/listings?ahali=true&limit=20&page=1")

const stats = computed(() => statsRes.value?.data ?? { member_count: 0, listing_count: 0 })
const listings = computed(() => listingsRes.value?.data.items ?? [])

onMounted(() => {
  const davet = route.query.davet as string | undefined
  if (!davet) return
  localStorage.setItem("ahali_invite", davet)
  if (authStore.isLoggedIn) {
    authStore.fetchMe().then(() => { joinedNow.value = true })
  }
})

useSeoMeta({
  title: "Ahali Pazaryeri — Rafımdan",
  description: "Güvenilir çevreden ikinci el ilanlar. Ahali üyelerinin ilanlarını keşfet.",
})
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 pb-16 space-y-12">

    <!-- Hero -->
    <section class="text-center pt-14 pb-2 space-y-5">
      <div class="inline-flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
        <Users class="size-3.5" />
        Ahali Pazaryeri
      </div>
      <h1 class="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-tight">
        Tanıdık çevreden<br class="hidden sm:block" /> güvenilir ilanlar
      </h1>
      <p class="text-base text-muted-foreground max-w-sm mx-auto">
        Rafımdan ahali üyelerinin ilanları burada. Yüz yüze buluş, kargosuz al.
      </p>
      <div class="flex items-center justify-center gap-3 pt-1">
        <NuxtLink
          to="/ilan-ver"
          class="inline-flex items-center gap-2 bg-foreground text-background px-6 py-2.5 rounded-lg text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
        >
          İlan Ver
          <ArrowRight class="size-4" />
        </NuxtLink>
        <NuxtLink
          to="/ilanlar"
          class="inline-flex items-center gap-2 border border-border bg-white text-foreground px-6 py-2.5 rounded-lg text-sm font-medium cursor-pointer hover:bg-muted transition-colors"
        >
          Tüm İlanlar
        </NuxtLink>
      </div>
    </section>

    <!-- Davet bildirimi -->
    <div
      v-if="joinedNow"
      class="flex items-center gap-2 max-w-sm mx-auto bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700"
    >
      <CheckCircle class="size-4 shrink-0" />
      Ahali grubuna katıldın.
    </div>

    <div
      v-else-if="route.query.davet && !authStore.isLoggedIn"
      class="max-w-sm mx-auto bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 text-center space-y-2"
    >
      <p class="font-medium">Ahali grubuna davet edildin.</p>
      <NuxtLink
        to="/giris"
        class="inline-flex items-center gap-1.5 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
      >
        Giriş Yap ve Katıl
        <ArrowRight class="size-3.5" />
      </NuxtLink>
    </div>

    <!-- Stats -->
    <section class="grid grid-cols-2 gap-4 max-w-sm mx-auto">
      <div class="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
        <p class="text-3xl font-bold text-emerald-700">{{ stats.member_count }}</p>
        <p class="text-xs text-emerald-600 mt-1">Ahali Üye</p>
      </div>
      <div class="rounded-xl border border-border bg-white p-4 text-center">
        <p class="text-3xl font-bold text-foreground">{{ stats.listing_count }}</p>
        <p class="text-xs text-muted-foreground mt-1">Aktif İlan</p>
      </div>
    </section>

    <!-- İlanlar -->
    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold text-foreground">Ahali İlanları</h2>
        <NuxtLink
          to="/ilanlar"
          class="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1"
        >
          Tümünü Gör <ArrowRight class="size-3.5" />
        </NuxtLink>
      </div>

      <div v-if="listings.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <ListingCard
          v-for="listing in listings"
          :key="listing.id"
          v-bind="listing"
        />
      </div>

      <div
        v-else
        class="flex flex-col items-center justify-center py-20 gap-3 text-center"
      >
        <ShoppingBag class="size-10 text-muted-foreground/30" />
        <p class="text-sm text-muted-foreground">Henüz ahali ilanı yok.</p>
        <NuxtLink
          to="/ilan-ver"
          class="text-sm font-medium text-foreground underline underline-offset-4 cursor-pointer"
        >
          İlk ilanı sen ver
        </NuxtLink>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { X } from "lucide-vue-next"
import type { ListingListItem, PaginatedResponse, CategoryTree } from "@rafimdan/shared"
import { getIlceler } from "~/utils/turkey-locations"
import { PRICE_TYPE_LABELS } from "~/utils/listing-constants"

type ListingsResp = { data: PaginatedResponse<ListingListItem>; status: "ok" }
type CategoriesResp = { data: CategoryTree[]; status: "ok" }

const route = useRoute()
const router = useRouter()
const city = computed(() => route.params.city as string)

const { data: categoriesRes } = await useFetch<CategoriesResp>("/api/categories")
const categories = computed(() => categoriesRes.value?.data ?? [])

const draft = reactive({
  district: (route.query.district as string) || "",
  category: (route.query.category as string) || "",
  price_type: (route.query.price_type as string) || "",
  sort: (route.query.sort as string) || "recent",
})

const ilceler = computed(() => getIlceler(city.value))

const { data: listingsRes, pending } = await useFetch<ListingsResp>(
  () => {
    const p = new URLSearchParams({ city: city.value, limit: "20" })
    if (route.query.district) p.set("district", route.query.district as string)
    if (route.query.category) p.set("category", route.query.category as string)
    if (route.query.price_type) p.set("price_type", route.query.price_type as string)
    if (route.query.sort && route.query.sort !== "recent") p.set("sort", route.query.sort as string)
    if (route.query.page) p.set("page", route.query.page as string)
    return `/api/listings?${p}`
  },
  { watch: [() => route.query] },
)

const listings = computed(() => listingsRes.value?.data.items ?? [])
const total = computed(() => listingsRes.value?.data.total ?? 0)
const currentPage = computed(() => Number(route.query.page) || 1)
const totalPages = computed(() => Math.ceil(total.value / 20))

const hasFilters = computed(
  () => draft.district || draft.category || draft.price_type || draft.sort !== "recent",
)

watch(() => route.query, (q) => {
  draft.district = (q.district as string) || ""
  draft.category = (q.category as string) || ""
  draft.price_type = (q.price_type as string) || ""
  draft.sort = (q.sort as string) || "recent"
})

function applyFilters() {
  const query: Record<string, string> = {}
  if (draft.district) query.district = draft.district
  if (draft.category) query.category = draft.category
  if (draft.price_type) query.price_type = draft.price_type
  if (draft.sort !== "recent") query.sort = draft.sort
  router.push({ params: { city: city.value }, query })
}

function clearFilters() {
  Object.assign(draft, { district: "", category: "", price_type: "", sort: "recent" })
  router.push({ query: {} })
}

function setSort(val: "recent" | "popular") {
  draft.sort = val
  applyFilters()
}

function goToPage(p: number) {
  router.push({ query: { ...route.query, page: String(p) } })
}

useSeoMeta({
  title: () => `${city.value} İkinci El İlanları — Rafımdan`,
  description: () =>
    `${city.value}'deki ikinci el ilanlar. Kargosuz, ahali ile yüz yüze alışveriş.`,
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
      <h1 class="text-2xl font-bold text-foreground">{{ city }} İkinci El İlanları</h1>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <select
        v-model="draft.district"
        class="px-3 py-1.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
        @change="applyFilters"
      >
        <option value="">Tüm İlçeler</option>
        <option v-for="ilce in ilceler" :key="ilce" :value="ilce">{{ ilce }}</option>
      </select>

      <select
        v-model="draft.category"
        class="px-3 py-1.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
        @change="applyFilters"
      >
        <option value="">Tüm Kategoriler</option>
        <template v-for="cat in categories" :key="cat.id">
          <option :value="cat.slug">{{ cat.name }}</option>
          <option v-for="child in cat.children" :key="child.id" :value="child.slug">
            &nbsp;&nbsp;{{ child.name }}
          </option>
        </template>
      </select>

      <select
        v-model="draft.price_type"
        class="px-3 py-1.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
        @change="applyFilters"
      >
        <option value="">Tüm Fiyatlar</option>
        <option v-for="(label, val) in PRICE_TYPE_LABELS" :key="val" :value="val">
          {{ label }}
        </option>
      </select>

      <button
        v-if="hasFilters"
        class="flex items-center gap-1 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md transition-colors cursor-pointer"
        @click="clearFilters"
      >
        <X class="size-3" />
        Temizle
      </button>

      <div class="flex items-center rounded-md border border-border overflow-hidden ml-auto">
        <button
          class="px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
          :class="draft.sort === 'recent' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'"
          @click="setSort('recent')"
        >
          En Yeni
        </button>
        <button
          class="px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer border-l border-border"
          :class="draft.sort === 'popular' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'"
          @click="setSort('popular')"
        >
          En Popüler
        </button>
      </div>
    </div>

    <p v-if="!pending" class="text-sm text-muted-foreground -mt-2">{{ total }} ilan</p>

    <div v-if="pending" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      <div v-for="i in 8" :key="i" class="rounded-lg border border-border overflow-hidden animate-pulse">
        <div class="aspect-[4/3] bg-muted" />
        <div class="p-3 space-y-2">
          <div class="h-3.5 bg-muted rounded w-3/4" />
          <div class="h-3 bg-muted rounded w-1/2" />
        </div>
      </div>
    </div>

    <template v-else>
      <div v-if="listings.length === 0" class="py-16 text-center">
        <p class="text-muted-foreground text-sm">{{ city }} için sonuç bulunamadı.</p>
        <button
          v-if="hasFilters"
          class="mt-3 text-sm text-foreground underline underline-offset-2 cursor-pointer"
          @click="clearFilters"
        >
          Filtreleri temizle
        </button>
        <NuxtLink
          v-else
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
          :favorites_count="listing.favorites_count"
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

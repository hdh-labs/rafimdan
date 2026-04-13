<script setup lang="ts">
import { SlidersHorizontal, X, Search, ListFilter } from "lucide-vue-next"
import type { ListingListItem, CategoryTree, PaginatedResponse } from "@rafimdan/shared"
import { getIlceler } from "~/utils/turkey-locations"
import { CONDITION_LABELS, PRICE_TYPE_LABELS } from "~/utils/listing-constants"

type ListingsResp = { data: PaginatedResponse<ListingListItem>; status: "ok" }
type CategoriesResp = { data: CategoryTree[]; status: "ok" }

const route = useRoute()
const router = useRouter()

const { data: categoriesRes } = await useFetch<CategoriesResp>("/api/categories")
const categories = computed(() => categoriesRes.value?.data ?? [])

const { data: listingsRes, pending } = await useFetch<ListingsResp>(
  () => {
    const p = new URLSearchParams()
    const q = route.query
    if (q.city) p.set("city", q.city as string)
    if (q.district) p.set("district", q.district as string)
    if (q.category) p.set("category", q.category as string)
    if (q.price_type) p.set("price_type", q.price_type as string)
    if (q.condition) p.set("condition", q.condition as string)
    if (q.q) p.set("q", q.q as string)
    if (q.sort && q.sort !== "recent") p.set("sort", q.sort as string)
    if (q.page) p.set("page", q.page as string)
    p.set("limit", "20")
    return `/api/listings?${p}`
  },
  { watch: [() => route.query] },
)

const listings = computed(() => listingsRes.value?.data.items ?? [])
const total = computed(() => listingsRes.value?.data.total ?? 0)
const currentPage = computed(() => Number(route.query.page) || 1)
const totalPages = computed(() => Math.ceil(total.value / 20))

const draft = reactive({
  city: (route.query.city as string) || "",
  district: (route.query.district as string) || "",
  category: (route.query.category as string) || "",
  price_type: (route.query.price_type as string) || "",
  condition: (route.query.condition as string) || "",
  q: (route.query.q as string) || "",
  sort: (route.query.sort as string) || "recent",
})

const ilceler = computed(() => getIlceler(draft.city))

let _isRouteUpdate = false

watch(() => draft.city, () => {
  if (_isRouteUpdate) return
  if (!getIlceler(draft.city).includes(draft.district)) draft.district = ""
  applyFilters()
})

watch(() => draft.district, () => {
  if (_isRouteUpdate) return
  applyFilters()
})

// back/forward navigasyonunda draft'ı URL ile senkronize tut
watch(() => route.query, (q) => {
  _isRouteUpdate = true
  draft.city = (q.city as string) || ""
  draft.district = (q.district as string) || ""
  draft.category = (q.category as string) || ""
  draft.price_type = (q.price_type as string) || ""
  draft.condition = (q.condition as string) || ""
  draft.q = (q.q as string) || ""
  draft.sort = (q.sort as string) || "recent"
  nextTick(() => { _isRouteUpdate = false })
})

// sayfa değişince listeye scroll
watch(currentPage, () => {
  if (import.meta.client) window.scrollTo({ top: 0, behavior: "smooth" })
})

function applyFilters() {
  const query: Record<string, string> = {}
  if (draft.city) query.city = draft.city
  if (draft.district) query.district = draft.district
  if (draft.category) query.category = draft.category
  if (draft.price_type) query.price_type = draft.price_type
  if (draft.condition) query.condition = draft.condition
  if (draft.q) query.q = draft.q
  if (draft.sort !== "recent") query.sort = draft.sort
  router.push({ query })
}

function clearFilters() {
  Object.assign(draft, { city: "", district: "", category: "", price_type: "", condition: "", q: "", sort: "recent" })
  router.push({ query: {} })
}

function setSort(val: "recent" | "popular") {
  draft.sort = val
  applyFilters()
}

function goToPage(p: number) {
  router.push({ query: { ...route.query, page: String(p) } })
}

const hasFilters = computed(
  () => draft.city || draft.district || draft.category || draft.price_type || draft.condition || draft.q,
)

const activeFilterCount = computed(() =>
  [draft.city, draft.district, draft.category, draft.price_type, draft.condition, draft.q]
    .filter(Boolean).length,
)

const drawerOpen = ref(false)

watch(drawerOpen, (open) => {
  if (!import.meta.client) return
  document.body.style.overflow = open ? "hidden" : ""
})

function applyAndClose() {
  applyFilters()
  drawerOpen.value = false
}


useSeoMeta({
  title: "İlanlar — Rafımdan",
  description: "Yakınındaki ikinci el ilanlar. Kargosuz, yüz yüze alışveriş.",
})
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <div class="flex flex-col md:flex-row gap-6">
      <aside class="hidden md:block md:w-56 shrink-0 space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium flex items-center gap-1.5">
            <SlidersHorizontal class="size-4" />
            Filtreler
          </span>
          <button
            v-if="hasFilters"
            class="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer transition-colors"
            @click="clearFilters"
          >
            <X class="size-3" />
            Temizle
          </button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="text-xs font-medium text-muted-foreground mb-1 block">Arama</label>
            <div class="relative">
              <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                v-model="draft.q"
                type="text"
                placeholder="İlan ara..."
                class="w-full pl-8 pr-3 py-1.5 text-sm border border-border rounded-md bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                @keydown.enter="applyFilters"
              />
            </div>
          </div>

          <div>
            <label class="text-xs font-medium text-muted-foreground mb-1 block">Şehir</label>
            <CityAutocomplete v-model="draft.city" />
          </div>

          <div>
            <label class="text-xs font-medium text-muted-foreground mb-1 block">İlçe</label>
            <DistrictAutocomplete
              v-model="draft.district"
              :options="ilceler"
              :disabled="!draft.city"
            />
          </div>

          <div>
            <label class="text-xs font-medium text-muted-foreground mb-1 block">Kategori</label>
            <select
              v-model="draft.category"
              class="w-full px-3 py-1.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            >
              <option value="">Tümü</option>
              <template v-for="cat in categories" :key="cat.id">
                <option :value="cat.slug">{{ cat.name }}</option>
                <option
                  v-for="child in cat.children"
                  :key="child.id"
                  :value="child.slug"
                >
                  &nbsp;&nbsp;{{ child.name }}
                </option>
              </template>
            </select>
          </div>

          <div>
            <label class="text-xs font-medium text-muted-foreground mb-1 block">Fiyat Tipi</label>
            <select
              v-model="draft.price_type"
              class="w-full px-3 py-1.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            >
              <option value="">Tümü</option>
              <option v-for="(label, val) in PRICE_TYPE_LABELS" :key="val" :value="val">
                {{ label }}
              </option>
            </select>
          </div>

          <div>
            <label class="text-xs font-medium text-muted-foreground mb-1 block">Durum</label>
            <select
              v-model="draft.condition"
              class="w-full px-3 py-1.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            >
              <option value="">Tümü</option>
              <option v-for="(label, val) in CONDITION_LABELS" :key="val" :value="val">
                {{ label }}
              </option>
            </select>
          </div>

          <Button class="w-full" @click="applyFilters">
            Uygula
          </Button>
        </div>
      </aside>

      <div class="flex-1 min-w-0 space-y-4">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <button
              class="md:hidden flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted transition-colors cursor-pointer relative"
              @click="drawerOpen = true"
            >
              <ListFilter class="size-4" />
              Filtrele
              <span
                v-if="activeFilterCount > 0"
                class="absolute -top-1.5 -right-1.5 flex items-center justify-center size-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold"
              >
                {{ activeFilterCount }}
              </span>
            </button>
            <p class="text-sm text-muted-foreground">
              <template v-if="!pending">{{ total }} ilan</template>
            </p>
          </div>
          <div class="flex items-center rounded-md border border-border overflow-hidden shrink-0">
            <button
              class="px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
              :class="draft.sort === 'recent' ? 'bg-brand text-brand-foreground' : 'text-muted-foreground hover:text-foreground'"
              @click="setSort('recent')"
            >
              En Yeni
            </button>
            <button
              class="px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer border-l border-border"
              :class="draft.sort === 'popular' ? 'bg-brand text-brand-foreground' : 'text-muted-foreground hover:text-foreground'"
              @click="setSort('popular')"
            >
              En Popüler
            </button>
          </div>
        </div>

        <div v-if="pending" class="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div
            v-for="i in 6"
            :key="i"
            class="rounded-lg border border-border bg-muted animate-pulse aspect-[3/4]"
          />
        </div>

        <template v-else>
          <div v-if="listings.length === 0" class="py-16 text-center">
            <p class="text-muted-foreground text-sm">Sonuç bulunamadı.</p>
            <button
              v-if="hasFilters"
              class="mt-3 text-sm text-foreground underline underline-offset-2 cursor-pointer"
              @click="clearFilters"
            >
              Filtreleri temizle
            </button>
          </div>

          <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-4">
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

          <div
            v-if="totalPages > 1"
            class="flex items-center justify-center gap-3 pt-4"
          >
            <button
              :disabled="currentPage <= 1"
              class="px-4 py-1.5 text-sm border border-border rounded-md cursor-pointer hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              @click="goToPage(currentPage - 1)"
            >
              Önceki
            </button>
            <span class="text-sm text-muted-foreground">
              {{ currentPage }} / {{ totalPages }}
            </span>
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
    </div>
  </div>

  <!-- Mobile Filtre Drawer -->
  <Teleport to="body">
    <Transition name="drawer">
      <div
        v-if="drawerOpen"
        class="md:hidden fixed inset-0 z-50 flex flex-col justify-end"
        @click.self="drawerOpen = false"
      >
        <div class="absolute inset-0 bg-black/40" @click="drawerOpen = false" />
        <div class="relative bg-background rounded-t-2xl shadow-xl max-h-[85dvh] flex flex-col">
          <div class="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
            <span class="text-sm font-semibold">Filtreler</span>
            <button class="text-muted-foreground hover:text-foreground cursor-pointer" @click="drawerOpen = false">
              <X class="size-5" />
            </button>
          </div>

          <div class="overflow-y-auto px-4 py-4 space-y-4 flex-1">
            <div>
              <label class="text-xs font-medium text-muted-foreground mb-1 block">Arama</label>
              <div class="relative">
                <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <input
                  v-model="draft.q"
                  type="text"
                  placeholder="İlan ara..."
                  class="w-full pl-8 pr-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
            <div>
              <label class="text-xs font-medium text-muted-foreground mb-1 block">Şehir</label>
              <CityAutocomplete v-model="draft.city" />
            </div>
            <div>
              <label class="text-xs font-medium text-muted-foreground mb-1 block">İlçe</label>
              <DistrictAutocomplete v-model="draft.district" :options="ilceler" :disabled="!draft.city" />
            </div>
            <div>
              <label class="text-xs font-medium text-muted-foreground mb-1 block">Kategori</label>
              <select
                v-model="draft.category"
                class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="">Tümü</option>
                <template v-for="cat in categories" :key="cat.id">
                  <option :value="cat.slug">{{ cat.name }}</option>
                  <option v-for="child in cat.children" :key="child.id" :value="child.slug">
                    &nbsp;&nbsp;{{ child.name }}
                  </option>
                </template>
              </select>
            </div>
            <div>
              <label class="text-xs font-medium text-muted-foreground mb-1 block">Fiyat Tipi</label>
              <select
                v-model="draft.price_type"
                class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="">Tümü</option>
                <option v-for="(label, val) in PRICE_TYPE_LABELS" :key="val" :value="val">{{ label }}</option>
              </select>
            </div>
            <div>
              <label class="text-xs font-medium text-muted-foreground mb-1 block">Durum</label>
              <select
                v-model="draft.condition"
                class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="">Tümü</option>
                <option v-for="(label, val) in CONDITION_LABELS" :key="val" :value="val">{{ label }}</option>
              </select>
            </div>
          </div>

          <div class="px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-border flex gap-3">
            <button
              v-if="hasFilters"
              class="flex-1 py-2.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors cursor-pointer"
              @click="() => { clearFilters(); drawerOpen = false }"
            >
              Temizle
            </button>
            <Button class="flex-1" @click="applyAndClose">Uygula</Button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 200ms ease;
}
.drawer-enter-active .relative,
.drawer-leave-active .relative {
  transition: transform 250ms ease;
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}
.drawer-enter-from .relative,
.drawer-leave-to .relative {
  transform: translateY(100%);
}
</style>

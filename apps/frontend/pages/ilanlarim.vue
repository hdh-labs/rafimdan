<script setup lang="ts">
import { ClipboardList, ImageOff, Pencil, Trash2, ChevronDown, RefreshCw, AlertCircle, Check, X } from "lucide-vue-next"
import { toast } from "vue-sonner"
import type { ListingListItem, ListingStatus } from "@rafimdan/shared"
import { apiFetch, ApiError } from "~/utils/api"
import { STATUS_LABELS, STATUS_COLORS } from "~/utils/listing-constants"

definePageMeta({ middleware: ["auth"] })
useSeoMeta({ title: "İlanlarım — Rafımdan" })

type Tab = ListingStatus | "all"

const listings = ref<ListingListItem[]>([])
const loading = ref(true)
const activeTab = ref<Tab>("all")
const pendingSlug = ref<string | null>(null)
const openMenuSlug = ref<string | null>(null)
const deleteConfirmSlug = ref<string | null>(null)
const editingPriceSlug = ref<string | null>(null)
const priceInputValue = ref("")
const priceInputRef = ref<HTMLInputElement | null>(null)
const lightboxUrl = ref<string | null>(null)


const TABS: { key: Tab; label: string }[] = [
  { key: "all",      label: "Tümü" },
  { key: "active",   label: "Aktif" },
  { key: "pending",  label: "Bekliyor" },
  { key: "rejected", label: "Reddedildi" },
  { key: "sold",     label: "Satıldı" },
]

const STATUSES: ListingStatus[] = ["active", "sold"]

const rejectedCount = computed(() => listings.value.filter(l => l.status === "rejected").length)
const pendingCount = computed(() => listings.value.filter(l => l.status === "pending").length)

const filtered = computed(() => {
  if (activeTab.value === "all") return listings.value
  return listings.value.filter((l) => l.status === activeTab.value)
})

function tabCount(key: Tab): number {
  if (key === "all") return listings.value.length
  return listings.value.filter((l) => l.status === key).length
}

onMounted(async () => {
  try {
    const res = await apiFetch<{ data: ListingListItem[]; status: "ok" }>("/api/listings/mine")
    listings.value = res.data
  } catch {
    toast.error("İlanlar yüklenemedi.")
  } finally {
    loading.value = false
  }
})

function toggleMenu(slug: string) {
  openMenuSlug.value = openMenuSlug.value === slug ? null : slug
}

function closeMenus() {
  openMenuSlug.value = null
}

function startPriceEdit(slug: string, currentPrice: number | null) {
  editingPriceSlug.value = slug
  priceInputValue.value = currentPrice ? String(currentPrice) : ""
  nextTick(() => priceInputRef.value?.select())
}

function cancelPriceEdit() {
  editingPriceSlug.value = null
  priceInputValue.value = ""
}

async function savePriceEdit(slug: string) {
  const parsed = parseInt(priceInputValue.value, 10)
  if (!parsed || parsed <= 0 || parsed > 9_999_999) { cancelPriceEdit(); return }

  const item = listings.value.find((l) => l.slug === slug)
  if (!item || item.price === parsed) { cancelPriceEdit(); return }

  const prev = item.price
  item.price = parsed
  editingPriceSlug.value = null
  pendingSlug.value = slug

  try {
    await apiFetch(`/api/listings/${slug}`, {
      method: "PATCH",
      body: JSON.stringify({ price: parsed }),
    })
    toast.success("Fiyat güncellendi.")
  } catch {
    item.price = prev
    toast.error("Fiyat güncellenemedi.")
  } finally {
    pendingSlug.value = null
  }
}

async function changeStatus(slug: string, status: ListingStatus) {
  closeMenus()
  const item = listings.value.find((l) => l.slug === slug)
  if (!item || item.status === status) return

  const prev = item.status
  item.status = status
  pendingSlug.value = slug

  try {
    await apiFetch(`/api/listings/${slug}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    })
    clearNuxtData(`listing-${slug}`)
    clearNuxtData()
    toast.success(`"${item.title}" artık ${STATUS_LABELS[status].toLowerCase()} olarak işaretlendi.`)
  } catch {
    item.status = prev
    toast.error("Durum güncellenemedi, tekrar dene.")
  } finally {
    pendingSlug.value = null
  }
}

function daysAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
}

const filteredWithAge = computed(() =>
  filtered.value.map((l) => ({ ...l, age: daysAgo(l.updated_at) }))
)

async function refreshListing(slug: string) {
  pendingSlug.value = slug
  try {
    await apiFetch(`/api/listings/${slug}/refresh`, { method: "POST" })
    const item = listings.value.find((l) => l.slug === slug)
    if (item) item.updated_at = new Date().toISOString()
    toast.success("İlan yenilendi — artık listenin üstünde görünecek.")
  } catch (err) {
    toast.error(err instanceof ApiError ? err.message : "Yenileme başarısız, tekrar dene.")
  } finally {
    pendingSlug.value = null
  }
}

async function deleteListing(slug: string, title: string) {
  pendingSlug.value = slug
  try {
    await apiFetch(`/api/listings/${slug}`, { method: "DELETE" })
    listings.value = listings.value.filter((l) => l.slug !== slug)
    toast.success(`"${title}" silindi.`)
  } catch {
    toast.error("İlan silinemedi, tekrar dene.")
  } finally {
    pendingSlug.value = null
    deleteConfirmSlug.value = null
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-8" @click="closeMenus">
    <div class="flex items-center gap-2 mb-6">
      <ClipboardList class="size-5 text-foreground" />
      <h1 class="text-xl font-bold">İlanlarım</h1>
    </div>

    <!-- Banners -->
    <button
      v-if="rejectedCount > 0 && !loading"
      type="button"
      class="mb-4 w-full flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive text-left cursor-pointer hover:bg-destructive/15 transition-colors"
      @click="activeTab = 'rejected'"
    >
      <AlertCircle class="size-4 shrink-0 mt-0.5" />
      <span>{{ rejectedCount }} ilanınız reddedildi. Gerekçeyi okuyup düzenleyebilirsiniz.</span>
    </button>
    <div
      v-else-if="pendingCount > 0 && !loading"
      class="mb-4 flex items-start gap-2 p-3 rounded-lg bg-muted border border-border text-sm text-muted-foreground"
    >
      <AlertCircle class="size-4 shrink-0 mt-0.5" />
      <span>{{ pendingCount }} ilanınız inceleniyor.</span>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 mb-6 border-b border-border overflow-x-auto">
      <button
        v-for="tab in TABS"
        :key="tab.key"
        class="px-3 py-2 text-sm font-medium cursor-pointer transition-colors -mb-px border-b-2 whitespace-nowrap"
        :class="activeTab === tab.key
          ? 'border-brand text-brand'
          : 'border-transparent text-muted-foreground hover:text-foreground'"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span class="ml-1 text-xs opacity-60">({{ tabCount(tab.key) }})</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="h-24 rounded-lg bg-muted animate-pulse" />
    </div>

    <!-- Empty — no listings at all -->
    <div v-else-if="listings.length === 0" class="py-20 text-center">
      <ClipboardList class="size-12 mx-auto mb-3 text-muted-foreground/30" />
      <p class="text-muted-foreground mb-4">Henüz ilan vermedin.</p>
      <NuxtLink
        to="/ilan-ver"
        class="inline-block text-sm bg-brand text-brand-foreground px-4 py-2 rounded-md cursor-pointer hover:opacity-90 transition-opacity"
      >
        İlan Ver
      </NuxtLink>
    </div>

    <!-- Empty tab -->
    <div v-else-if="filtered.length === 0" class="py-12 text-center space-y-3">
      <p class="text-sm text-muted-foreground">Bu sekmede ilan yok.</p>
      <button
        type="button"
        class="text-sm text-brand underline underline-offset-2 cursor-pointer"
        @click="activeTab = 'all'"
      >
        Tüm ilanlarına bak
      </button>
    </div>

    <!-- Listing cards -->
    <div v-else class="space-y-3">
      <div
        v-for="listing in filteredWithAge"
        :key="listing.id"
        class="flex flex-col rounded-lg border border-border bg-background transition-opacity"
        :class="pendingSlug === listing.slug ? 'opacity-50 pointer-events-none' : ''"
      >
        <div class="flex items-center gap-3 p-3">
        <!-- Thumbnail -->
        <div class="shrink-0 size-16 rounded-md bg-muted overflow-hidden">
          <img
            v-if="listing.cover_photo"
            :src="listing.cover_photo"
            :alt="listing.title"
            class="size-full object-cover cursor-zoom-in hover:opacity-90 transition-opacity"
            loading="lazy"
            @click.stop="lightboxUrl = listing.cover_photo"
          />
          <div v-else class="size-full flex items-center justify-center" aria-hidden="true">
            <ImageOff class="size-5 text-muted-foreground/30" />
          </div>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <NuxtLink
            :to="listing.status === 'pending' || listing.status === 'rejected' ? `/ilan/${listing.slug}/duzenle` : `/ilan/${listing.slug}`"
            class="text-sm font-semibold text-foreground line-clamp-1 hover:underline cursor-pointer"
          >
            {{ listing.title }}
          </NuxtLink>
          <p class="text-xs text-muted-foreground mt-0.5 truncate">
            {{ listing.district ? `${listing.district}, ${listing.city}` : listing.city }}
            <span class="mx-1">·</span>
            <span :class="listing.age > 14 ? 'text-brand' : ''">
              {{ listing.age === 0 ? 'Bugün' : `${listing.age} gün önce` }}
            </span>
          </p>
          <div class="mt-1.5 flex items-center gap-1.5 flex-wrap">
            <span
              class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors"
              :class="STATUS_COLORS[listing.status]"
            >
              {{ STATUS_LABELS[listing.status] }}
            </span>

            <!-- Inline fiyat edit -->
            <template v-if="listing.price_type === 'fixed' && listing.status === 'active'">
              <div v-if="editingPriceSlug === listing.slug" class="flex items-center gap-1" @click.stop>
                <input
                  :ref="el => { if (editingPriceSlug === listing.slug) priceInputRef = el as HTMLInputElement | null }"
                  v-model="priceInputValue"
                  type="number"
                  min="1"
                  max="9999999"
                  class="w-20 px-1.5 py-0.5 text-xs border border-ring rounded focus:outline-none"
                  @keydown.enter="savePriceEdit(listing.slug)"
                  @keydown.esc="cancelPriceEdit"
                  @blur="cancelPriceEdit"
                />
                <button class="text-brand hover:opacity-80 cursor-pointer" @mousedown.prevent="savePriceEdit(listing.slug)" @touchstart.prevent="savePriceEdit(listing.slug)">
                  <Check class="size-3.5" />
                </button>
                <button class="text-muted-foreground hover:text-foreground cursor-pointer" @mousedown.prevent="cancelPriceEdit" @touchstart.prevent="cancelPriceEdit">
                  <X class="size-3.5" />
                </button>
              </div>
              <button
                v-else
                class="flex items-center gap-1 text-xs text-foreground font-medium cursor-pointer group"
                @click.stop="startPriceEdit(listing.slug, listing.price)"
              >
                {{ listing.price ?? '?' }} ₺
                <Pencil class="size-3 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            </template>
            <span v-else-if="listing.price_type === 'free'" class="text-xs text-brand font-medium">Ücretsiz</span>
            <span v-else-if="listing.price_type === 'negotiable'" class="text-xs text-muted-foreground">
              {{ listing.price ?? '?' }} ₺
            </span>
            <span v-else class="text-xs text-muted-foreground">
              {{ listing.price ?? '?' }} ₺
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="shrink-0 flex items-center gap-1.5" @click.stop>

          <!-- Status dropdown (only for active/sold) -->
          <div v-if="listing.status === 'active' || listing.status === 'sold'" class="relative">
            <button
              type="button"
              class="flex items-center gap-1 text-xs border border-border rounded px-2 py-1.5 bg-background cursor-pointer hover:bg-muted transition-colors"
              :class="STATUS_COLORS[listing.status]"
              @click="toggleMenu(listing.slug)"
            >
              {{ STATUS_LABELS[listing.status] }}
              <ChevronDown class="size-3 shrink-0" />
            </button>

            <Transition
              enter-active-class="transition duration-100 ease-out"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition duration-75 ease-in"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div
                v-if="openMenuSlug === listing.slug"
                class="absolute right-0 top-full mt-1 z-20 min-w-[110px] rounded-md border border-border bg-background shadow-lg py-1"
              >
                <button
                  v-for="s in STATUSES"
                  :key="s"
                  type="button"
                  class="w-full text-left px-3 py-1.5 text-xs cursor-pointer hover:bg-muted transition-colors flex items-center gap-2"
                  :class="listing.status === s ? 'font-semibold text-foreground' : 'text-muted-foreground'"
                  @click="changeStatus(listing.slug, s)"
                >
                  <span
                    class="inline-block size-1.5 rounded-full shrink-0"
                    :class="{
                      'bg-brand': s === 'active',
                      'bg-muted-foreground': s === 'sold',
                    }"
                  />
                  {{ STATUS_LABELS[s] }}
                </button>
              </div>
            </Transition>
          </div>

          <!-- Refresh -->
          <Button
            v-if="listing.status === 'active'"
            type="button"
            variant="outline"
            size="sm"
            :title="`${listing.age} gün önce yenilendi`"
            :class="listing.age > 7 ? 'border-brand/40 text-brand hover:bg-brand/5' : ''"
            @click="refreshListing(listing.slug)"
          >
            <RefreshCw class="size-3" />
            <span class="hidden sm:inline">Yenile</span>
          </Button>

          <!-- Edit -->
          <NuxtLink
            :to="`/ilan/${listing.slug}/duzenle`"
            class="inline-flex items-center justify-center gap-2 h-8 px-3 text-sm rounded-md font-medium border border-border bg-background hover:bg-muted text-foreground transition-opacity cursor-pointer"
          >
            <Pencil class="size-3" />
            <span class="hidden sm:inline">Düzenle</span>
          </NuxtLink>

          <!-- Delete -->
          <Button
            type="button"
            variant="outline"
            size="sm"
            class="text-destructive border-destructive/30 hover:bg-destructive/5"
            @click.stop="deleteConfirmSlug = listing.slug"
          >
            <Trash2 class="size-3" />
            <span class="hidden sm:inline">Sil</span>
          </Button>
        </div>
        </div>
        <div v-if="listing.status === 'rejected'" class="px-3 pb-3">
          <div class="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
            <AlertCircle class="size-3.5 shrink-0 mt-0.5 text-destructive" />
            <p class="text-xs text-destructive leading-relaxed">
              <span class="font-medium">Gerekçe: </span>{{ listing.rejection_reason ?? 'Gerekçe belirtilmemiş' }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <ImageLightbox
    :images="lightboxUrl ? [lightboxUrl] : []"
    :model-value="lightboxUrl !== null ? 0 : null"
    @update:model-value="(v) => { if (v === null) lightboxUrl = null }"
  />

  <!-- Delete confirm modal -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="deleteConfirmSlug"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40"
        @click.self="deleteConfirmSlug = null"
        @keydown.esc.window="deleteConfirmSlug = null"
      >
        <div class="w-full sm:max-w-sm bg-background rounded-2xl sm:rounded-xl border border-border shadow-2xl p-6 space-y-4">
          <div>
            <p class="font-semibold text-sm text-foreground">İlanı sil</p>
            <p class="text-sm text-muted-foreground mt-1">
              "{{ listings.find(l => l.slug === deleteConfirmSlug)?.title }}" kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </p>
          </div>
          <div class="flex gap-2">
            <Button
              type="button"
              variant="outline"
              class="flex-1"
              @click="deleteConfirmSlug = null"
            >
              Vazgeç
            </Button>
            <Button
              type="button"
              variant="destructive"
              class="flex-1"
              :loading="pendingSlug === deleteConfirmSlug"
              @click="deleteListing(deleteConfirmSlug, listings.find(l => l.slug === deleteConfirmSlug)?.title ?? '')"
            >
              Sil
            </Button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

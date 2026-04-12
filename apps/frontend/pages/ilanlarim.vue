<script setup lang="ts">
import { ClipboardList, ImageOff, Pencil, Trash2, ChevronDown, RefreshCw, AlertCircle } from "lucide-vue-next"
import { toast } from "vue-sonner"
import type { ListingListItem, ListingStatus } from "@rafimdan/shared"
import { apiFetch } from "~/utils/api"
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
  } catch {
    toast.error("Yenileme başarısız, tekrar dene.")
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
    <div
      v-if="rejectedCount > 0 && !loading"
      class="mb-4 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
    >
      <AlertCircle class="size-4 shrink-0 mt-0.5" />
      <span>{{ rejectedCount }} ilanınız reddedildi. Gerekçeyi okuyup düzenleyebilirsiniz.</span>
    </div>
    <div
      v-else-if="pendingCount > 0 && !loading"
      class="mb-4 flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700"
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
          ? 'border-foreground text-foreground'
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
        class="inline-block text-sm bg-foreground text-background px-4 py-2 rounded-md cursor-pointer hover:opacity-90 transition-opacity"
      >
        İlan Ver
      </NuxtLink>
    </div>

    <!-- Empty tab -->
    <div v-else-if="filtered.length === 0" class="py-12 text-center">
      <p class="text-sm text-muted-foreground">Bu sekmede ilan yok.</p>
    </div>

    <!-- Listing cards -->
    <div v-else class="space-y-3">
      <div
        v-for="listing in filteredWithAge"
        :key="listing.id"
        class="flex items-center gap-3 p-3 rounded-lg border border-border bg-white transition-opacity"
        :class="pendingSlug === listing.slug ? 'opacity-50 pointer-events-none' : ''"
      >
        <!-- Thumbnail -->
        <div class="shrink-0 size-16 rounded-md bg-muted overflow-hidden">
          <img
            v-if="listing.cover_photo"
            :src="listing.cover_photo"
            :alt="listing.title"
            class="size-full object-cover"
            loading="lazy"
          />
          <div v-else class="size-full flex items-center justify-center" aria-hidden="true">
            <ImageOff class="size-5 text-muted-foreground/30" />
          </div>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <NuxtLink
            :to="`/ilan/${listing.slug}`"
            class="text-sm font-semibold text-foreground line-clamp-1 hover:underline cursor-pointer"
          >
            {{ listing.title }}
          </NuxtLink>
          <p class="text-xs text-muted-foreground mt-0.5">
            {{ listing.district ? `${listing.district}, ${listing.city}` : listing.city }}
          </p>
          <div class="mt-1.5 flex items-center gap-1.5 flex-wrap">
            <span
              class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors"
              :class="STATUS_COLORS[listing.status]"
            >
              {{ STATUS_LABELS[listing.status] }}
            </span>
            <span
              class="text-xs"
              :class="listing.age > 14 ? 'text-amber-600' : 'text-muted-foreground'"
            >
              {{ listing.age === 0 ? 'Bugün' : `${listing.age} gün önce` }}
            </span>
          </div>
          <template v-if="listing.status === 'rejected'">
            <p class="text-xs text-red-600 mt-1">
              <span class="font-medium">Gerekçe:</span>
              {{ listing.rejection_reason ?? 'Belirtilmemiş' }}
            </p>
            <NuxtLink
              :to="`/ilan/${listing.slug}/duzenle`"
              class="text-xs text-foreground underline mt-0.5 inline-block"
            >
              Düzenle ve tekrar gönder
            </NuxtLink>
          </template>
          <p v-if="listing.status === 'pending'" class="text-xs text-amber-600 mt-1">
            Yönetici onayı bekleniyor.
          </p>
        </div>

        <!-- Actions -->
        <div class="shrink-0 flex items-center gap-1.5" @click.stop>

          <!-- Status dropdown (only for active/sold) -->
          <div v-if="listing.status === 'active' || listing.status === 'sold'" class="relative">
            <button
              type="button"
              class="flex items-center gap-1 text-xs border border-border rounded px-2 py-1.5 bg-white cursor-pointer hover:bg-muted transition-colors"
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
                class="absolute right-0 top-full mt-1 z-20 min-w-[110px] rounded-md border border-border bg-white shadow-lg py-1"
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
                      'bg-green-500': s === 'active',
                      'bg-gray-400': s === 'sold',
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
            :class="listing.age > 7 ? 'border-amber-300 text-amber-700 hover:bg-amber-50' : ''"
            @click="refreshListing(listing.slug)"
          >
            <RefreshCw class="size-3" />
            <span class="hidden sm:inline">Yenile</span>
          </Button>

          <!-- Edit -->
          <NuxtLink
            :to="`/ilan/${listing.slug}/duzenle`"
            class="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded border border-border cursor-pointer transition-colors"
          >
            <Pencil class="size-3" />
            <span class="hidden sm:inline">Düzenle</span>
          </NuxtLink>

          <!-- Delete -->
          <template v-if="deleteConfirmSlug === listing.slug">
            <span class="text-xs text-muted-foreground hidden sm:inline">Emin misin?</span>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              :loading="pendingSlug === listing.slug"
              @click="deleteListing(listing.slug, listing.title)"
            >
              Evet
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              @click="deleteConfirmSlug = null"
            >
              Hayır
            </Button>
          </template>
          <Button
            v-else
            type="button"
            variant="outline"
            size="sm"
            class="text-destructive border-destructive/30 hover:bg-destructive/5"
            @click="deleteConfirmSlug = listing.slug"
          >
            <Trash2 class="size-3" />
            <span class="hidden sm:inline">Sil</span>
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

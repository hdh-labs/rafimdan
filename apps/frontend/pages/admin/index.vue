<script setup lang="ts">
import { Trash2, ShieldOff, Shield, Loader2, ExternalLink, Users } from "lucide-vue-next"
import { toast } from "vue-sonner"
import type { ListingDetail, UserProfile } from "@rafimdan/shared"
import { apiFetch } from "~/utils/api"

definePageMeta({ middleware: ["auth", "admin"], ssr: false })
useSeoMeta({ title: "Admin — Rafımdan" })

type Tab = "listings" | "users" | "reports"

const activeTab = ref<Tab>("listings")

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

type AdminListingsResponse = {
  items: ListingDetail[]
  total: number
  page: number
  limit: number
}

const listings = ref<ListingDetail[]>([])
const listingsTotal = ref(0)
const listingsPage = ref(1)
const listingsStatus = ref<string>("")
const listingsLoading = ref(false)
const deletingSlug = ref<string | null>(null)

const STATUS_OPTIONS = [
  { value: "", label: "Tümü" },
  { value: "active", label: "Aktif" },
  { value: "reserved", label: "Rezerve" },
  { value: "sold", label: "Satıldı" },
]

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-50 text-green-700 border-green-200",
  reserved: "bg-amber-50 text-amber-700 border-amber-200",
  sold: "bg-gray-100 text-gray-500 border-gray-200",
}

async function fetchListings() {
  listingsLoading.value = true
  try {
    const params = new URLSearchParams({ page: String(listingsPage.value), limit: "30" })
    if (listingsStatus.value) params.set("status", listingsStatus.value)
    const res = await apiFetch<{ data: AdminListingsResponse; status: "ok" }>(`/api/admin/listings?${params}`)
    listings.value = res.data.items
    listingsTotal.value = res.data.total
  } catch {
    toast.error("İlanlar yüklenemedi.")
  } finally {
    listingsLoading.value = false
  }
}

async function deleteListing(slug: string, title: string) {
  if (!confirm(`"${title}" ilanını silmek istiyor musunuz?`)) return
  deletingSlug.value = slug
  try {
    await apiFetch(`/api/admin/listings/${slug}`, { method: "DELETE" })
    listings.value = listings.value.filter(l => l.slug !== slug)
    listingsTotal.value = Math.max(0, listingsTotal.value - 1)
    toast.success("İlan silindi.")
  } catch {
    toast.error("İlan silinemedi.")
  } finally {
    deletingSlug.value = null
  }
}

watch([listingsStatus, listingsPage], fetchListings, { immediate: false })

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

const users = ref<UserProfile[]>([])
const usersLoading = ref(false)
const patchingUserId = ref<string | null>(null)

async function fetchUsers() {
  usersLoading.value = true
  try {
    const res = await apiFetch<{ data: UserProfile[]; status: "ok" }>("/api/admin/users")
    users.value = res.data
  } catch {
    toast.error("Kullanıcılar yüklenemedi.")
  } finally {
    usersLoading.value = false
  }
}

async function toggleBan(user: UserProfile) {
  const is_active = user.is_active === 0 ? 1 : 0
  patchingUserId.value = user.id
  try {
    await apiFetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active }),
    })
    await fetchUsers()
    toast.success(is_active === 0 ? "Kullanıcı banlandı." : "Ban kaldırıldı.")
  } catch {
    toast.error("İşlem başarısız.")
  } finally {
    patchingUserId.value = null
  }
}

async function toggleAdmin(user: UserProfile) {
  const is_admin = user.is_admin ? 0 : 1
  patchingUserId.value = user.id
  try {
    await apiFetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_admin }),
    })
    await fetchUsers()
    toast.success(is_admin ? "Admin yetkisi verildi." : "Admin yetkisi alındı.")
  } catch {
    toast.error("İşlem başarısız.")
  } finally {
    patchingUserId.value = null
  }
}

async function toggleAhali(user: UserProfile) {
  const is_ahali = user.is_ahali ? 0 : 1
  patchingUserId.value = user.id
  try {
    await apiFetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_ahali }),
    })
    await fetchUsers()
    toast.success(is_ahali ? "Ahali rozeti verildi." : "Ahali rozeti alındı.")
  } catch {
    toast.error("İşlem başarısız.")
  } finally {
    patchingUserId.value = null
  }
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

type Report = {
  id: string
  listing_id: string
  listing_slug: string
  listing_title: string
  reporter_name: string
  reason: string
  created_at: string
}

const REASON_LABELS: Record<string, string> = {
  spam: "Spam / Reklam",
  fraud: "Dolandırıcılık",
  inappropriate: "Uygunsuz İçerik",
  wrong_category: "Yanlış Kategori",
  other: "Diğer",
}

const reports = ref<Report[]>([])
const reportsLoading = ref(false)

async function fetchReports() {
  reportsLoading.value = true
  try {
    const res = await apiFetch<{ data: Report[]; status: "ok" }>("/api/admin/reports")
    reports.value = res.data
  } catch {
    toast.error("Raporlar yüklenemedi.")
  } finally {
    reportsLoading.value = false
  }
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

onMounted(() => {
  fetchListings()
  fetchUsers()
  fetchReports()
})

function switchTab(tab: Tab) {
  activeTab.value = tab
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <div class="flex items-center gap-2 mb-6">
      <Shield class="size-5 text-foreground" />
      <h1 class="text-xl font-bold">Admin Paneli</h1>
      <span class="ml-auto text-xs text-muted-foreground">
        {{ listingsTotal }} ilan · {{ users.length }} kullanıcı
      </span>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 mb-6 border-b border-border">
      <button
        v-for="tab in ([{ key: 'listings', label: 'İlanlar' }, { key: 'users', label: 'Kullanıcılar' }, { key: 'reports', label: `Raporlar ${reports.length ? '(' + reports.length + ')' : ''}` }] as const)"
        :key="tab.key"
        class="px-4 py-2 text-sm font-medium cursor-pointer transition-colors -mb-px border-b-2"
        :class="activeTab === tab.key
          ? 'border-foreground text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground'"
        @click="switchTab(tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- ------------------------------------------------------------------ -->
    <!-- LISTINGS TAB                                                        -->
    <!-- ------------------------------------------------------------------ -->
    <div v-if="activeTab === 'listings'">
      <!-- Status filter -->
      <div class="flex items-center gap-2 mb-4">
        <span class="text-xs text-muted-foreground">Filtre:</span>
        <div class="flex gap-1">
          <button
            v-for="opt in STATUS_OPTIONS"
            :key="opt.value"
            class="px-3 py-1 text-xs rounded-full border cursor-pointer transition-colors"
            :class="listingsStatus === opt.value
              ? 'bg-foreground text-background border-foreground'
              : 'border-border text-muted-foreground hover:bg-muted'"
            @click="listingsStatus = opt.value; listingsPage = 1"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="listingsLoading" class="space-y-2">
        <div v-for="i in 5" :key="i" class="h-12 rounded-lg bg-muted animate-pulse" />
      </div>

      <!-- Table -->
      <div v-else class="border border-border rounded-lg overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-muted/50 border-b border-border">
            <tr>
              <th class="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Başlık</th>
              <th class="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden sm:table-cell">Satıcı</th>
              <th class="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Durum</th>
              <th class="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden md:table-cell">Tarih</th>
              <th class="w-12" />
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr
              v-for="listing in listings"
              :key="listing.id"
              class="hover:bg-muted/30 transition-colors"
              :class="deletingSlug === listing.slug ? 'opacity-40 pointer-events-none' : ''"
            >
              <td class="px-3 py-2">
                <NuxtLink
                  :to="`/ilan/${listing.slug}`"
                  target="_blank"
                  class="font-medium hover:underline cursor-pointer line-clamp-1"
                >
                  {{ listing.title }}
                </NuxtLink>
                <p class="text-xs text-muted-foreground">{{ listing.city }}</p>
              </td>
              <td class="px-3 py-2 hidden sm:table-cell text-muted-foreground">
                {{ listing.seller.display_name || listing.seller.name }}
              </td>
              <td class="px-3 py-2">
                <span
                  class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
                  :class="STATUS_COLORS[listing.status] ?? 'bg-muted text-muted-foreground border-border'"
                >
                  {{ listing.status }}
                </span>
              </td>
              <td class="px-3 py-2 hidden md:table-cell text-xs text-muted-foreground">
                {{ formatDate(listing.created_at) }}
              </td>
              <td class="px-3 py-2">
                <button
                  type="button"
                  class="flex items-center justify-center size-7 rounded text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                  @click="deleteListing(listing.slug, listing.title)"
                >
                  <Loader2 v-if="deletingSlug === listing.slug" class="size-3.5 animate-spin" />
                  <Trash2 v-else class="size-3.5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="listings.length === 0" class="py-12 text-center text-sm text-muted-foreground">
          İlan bulunamadı.
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="listingsTotal > 30" class="flex items-center justify-between mt-4 text-sm">
        <span class="text-muted-foreground">Toplam {{ listingsTotal }} ilan</span>
        <div class="flex gap-2">
          <button
            :disabled="listingsPage === 1"
            class="px-3 py-1 border border-border rounded cursor-pointer hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            @click="listingsPage--"
          >
            Önceki
          </button>
          <button
            :disabled="listingsPage * 30 >= listingsTotal"
            class="px-3 py-1 border border-border rounded cursor-pointer hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            @click="listingsPage++"
          >
            Sonraki
          </button>
        </div>
      </div>
    </div>

    <!-- ------------------------------------------------------------------ -->
    <!-- USERS TAB                                                           -->
    <!-- ------------------------------------------------------------------ -->
    <div v-if="activeTab === 'users'">
      <div v-if="usersLoading" class="space-y-2">
        <div v-for="i in 5" :key="i" class="h-12 rounded-lg bg-muted animate-pulse" />
      </div>

      <div v-else class="border border-border rounded-lg overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-muted/50 border-b border-border">
            <tr>
              <th class="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Kullanıcı</th>
              <th class="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden md:table-cell">Kayıt</th>
              <th class="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Durum</th>
              <th class="w-28" />
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr
              v-for="user in users"
              :key="user.id"
              class="hover:bg-muted/30 transition-colors"
              :class="patchingUserId === user.id ? 'opacity-40 pointer-events-none' : ''"
            >
              <td class="px-3 py-2">
                <div class="flex items-center gap-2">
                  <img
                    v-if="user.avatar_url"
                    :src="user.avatar_url"
                    :alt="user.name"
                    referrerpolicy="no-referrer"
                    class="size-7 rounded-full object-cover shrink-0"
                  />
                  <div>
                    <p class="font-medium line-clamp-1">{{ user.display_name || user.name }}</p>
                    <p v-if="user.slug" class="text-xs text-muted-foreground">@{{ user.slug }}</p>
                  </div>
                </div>
              </td>
              <td class="px-3 py-2 hidden md:table-cell text-xs text-muted-foreground">
                {{ formatDate(user.created_at) }}
              </td>
              <td class="px-3 py-2">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span
                    v-if="user.is_ahali"
                    class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 border-emerald-200"
                  >
                    Ahali
                  </span>
                  <span
                    v-if="user.is_admin"
                    class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium bg-purple-50 text-purple-700 border-purple-200"
                  >
                    Admin
                  </span>
                </div>
              </td>
              <td class="px-3 py-2">
                <div class="flex items-center gap-1 justify-end">
                  <button
                    type="button"
                    :title="user.is_ahali ? 'Ahali rozetini kaldır' : 'Ahali yap'"
                    class="flex items-center justify-center size-7 rounded cursor-pointer transition-colors"
                    :class="user.is_ahali
                      ? 'text-emerald-600 hover:bg-emerald-50'
                      : 'text-muted-foreground hover:bg-muted'"
                    @click="toggleAhali(user)"
                  >
                    <Users class="size-3.5" />
                  </button>
                  <button
                    type="button"
                    :title="user.is_admin ? 'Admin yetkisini kaldır' : 'Admin yap'"
                    class="flex items-center justify-center size-7 rounded cursor-pointer transition-colors"
                    :class="user.is_admin
                      ? 'text-purple-600 hover:bg-purple-50'
                      : 'text-muted-foreground hover:bg-muted'"
                    @click="toggleAdmin(user)"
                  >
                    <Shield class="size-3.5" />
                  </button>
                  <button
                    type="button"
                    :title="'Banla / Banı kaldır'"
                    class="flex items-center justify-center size-7 rounded text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                    @click="toggleBan(user)"
                  >
                    <ShieldOff class="size-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="users.length === 0" class="py-12 text-center text-sm text-muted-foreground">
          Kullanıcı bulunamadı.
        </div>
      </div>
    </div>

    <!-- ------------------------------------------------------------------ -->
    <!-- REPORTS TAB                                                         -->
    <!-- ------------------------------------------------------------------ -->
    <div v-if="activeTab === 'reports'">
      <div v-if="reportsLoading" class="space-y-2">
        <div v-for="i in 3" :key="i" class="h-16 rounded-lg bg-muted animate-pulse" />
      </div>

      <div v-else-if="reports.length === 0" class="py-12 text-center text-sm text-muted-foreground">
        Henüz rapor yok.
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="r in reports"
          :key="r.id"
          class="border border-border rounded-lg p-4"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <NuxtLink
                :to="`/ilan/${r.listing_slug}`"
                target="_blank"
                class="inline-flex items-center gap-1 font-medium text-sm text-foreground hover:underline cursor-pointer"
              >
                {{ r.listing_title }}
                <ExternalLink class="size-3 shrink-0" />
              </NuxtLink>
              <p class="text-xs text-muted-foreground mt-0.5">
                {{ r.reporter_name }} · {{ formatDate(r.created_at) }}
              </p>
            </div>
            <span class="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
              {{ REASON_LABELS[r.reason] ?? r.reason }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

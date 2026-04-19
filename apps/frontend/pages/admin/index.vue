<script setup lang="ts">
import { Trash2, ShieldOff, Shield, Loader2, ExternalLink, Check, X, RotateCcw, ChevronRight, Users, Clock, CheckCircle, ShoppingBag, Flag } from "lucide-vue-next"
import { toast } from "vue-sonner"
import type { ListingDetail, AdminUserProfile, AdminStats, AdminLog, Report, ReportStatus } from "@rafimdan/shared"
import { apiFetch, ApiError } from "~/utils/api"
import { STATUS_LABELS, STATUS_COLORS, CONDITION_LABELS, PRICE_TYPE_LABELS } from "~/utils/listing-constants"

const ADMIN_ERRORS: Record<string, string> = {
  LAST_ADMIN: "Sistemdeki tek adminin durumu değiştirilemez",
  SELF_MODIFY: "Bu işlemi kendi hesabınız üzerinde yapamazsınız",
  NOT_FOUND: "Kayıt bulunamadı, sayfayı yenile",
  INVALID_STATUS: "Geçersiz işlem",
}

function adminToastError(err: unknown, fallback: string) {
  if (err instanceof ApiError) {
    toast.error(ADMIN_ERRORS[err.code] ?? fallback)
    return
  }
  toast.error(fallback)
}

definePageMeta({ middleware: ["auth", "admin"], ssr: false })
useSeoMeta({ title: "Admin — Rafımdan" })

type Tab = "listings" | "users" | "reports" | "logs"

const activeTab = ref<Tab>("listings")

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

const stats = ref<AdminStats | null>(null)
const headerPendingCount = useState<number>("admin-pending-count", () => 0)

watch(() => stats.value?.pending_listings, (v) => {
  if (v !== undefined) headerPendingCount.value = v
})

async function fetchStats() {
  try {
    const res = await apiFetch<{ data: AdminStats; status: "ok" }>("/api/admin/stats")
    stats.value = res.data
  } catch {
    // sessiz hata — stats kritik değil
  }
}

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
const listingsStatus = ref<string>("pending")
const listingsLoading = ref(false)
const deletingSlug = ref<string | null>(null)
const moderatingSlug = ref<string | null>(null)

const selectedListing = ref<ListingDetail | null>(null)
const panelRejectMode = ref(false)
const panelRejectReason = ref("")
const lightboxUrl = ref<string | null>(null)

function openPanel(listing: ListingDetail) {
  selectedListing.value = listing
  panelRejectMode.value = false
  panelRejectReason.value = ""
}

function closePanel() {
  selectedListing.value = null
  panelRejectMode.value = false
  panelRejectReason.value = ""
  deleteConfirmSlug.value = null
}

const panelPriceDisplay = computed(() => {
  const l = selectedListing.value
  if (!l) return ""
  if (l.direction === "request") return "Destek Arıyor"
  if (l.price_type === "free") return "Ücretsiz"
  const formatted = (l.price ?? 0).toLocaleString("tr-TR") + " ₺"
  return l.price_type === "negotiable" ? `${formatted} · Pazarlığa açık` : formatted
})

const STATUS_OPTIONS = [
  { value: "", label: "Tümü", countKey: "total_listings" as const },
  { value: "pending", label: "Bekleyen", countKey: "pending_listings" as const },
  { value: "active", label: "Aktif", countKey: "active_listings" as const },
  { value: "rejected", label: "Reddedilen", countKey: "rejected_listings" as const },
  { value: "sold", label: "Satıldı", countKey: "sold_listings" as const },
]


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

const deleteConfirmSlug = ref<string | null>(null)

async function deleteListing(slug: string) {
  deleteConfirmSlug.value = null
  deletingSlug.value = slug
  try {
    const deleted = listings.value.find(l => l.slug === slug)
    await apiFetch(`/api/admin/listings/${slug}`, { method: "DELETE" })
    listings.value = listings.value.filter(l => l.slug !== slug)
    listingsTotal.value = Math.max(0, listingsTotal.value - 1)
    if (deleted && stats.value) {
      const key = STATUS_COUNT_KEY[deleted.status]
      if (key) (stats.value[key] as number)--
      ;(stats.value.total_listings as number)--
    }
    fetchStats()
    fetchLogs()
    toast.success("İlan silindi.")
  } catch {
    toast.error("İlan silinemedi.")
  } finally {
    deletingSlug.value = null
  }
}

const MODERATE_MSG: Record<string, string> = {
  active:   "İlan onaylandı.",
  pending:  "Moderasyona alındı.",
  rejected: "İlan reddedildi.",
}

const STATUS_COUNT_KEY: Record<string, keyof AdminStats> = {
  active:   "active_listings",
  pending:  "pending_listings",
  rejected: "rejected_listings",
  sold:     "sold_listings",
}

async function moderateListing(slug: string, status: "active" | "pending" | "rejected", reason = "") {
  moderatingSlug.value = slug
  try {
    await apiFetch(`/api/admin/listings/${slug}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, reason: reason || undefined }),
    })
    const item = listings.value.find(l => l.slug === slug)
    if (item) {
      if (stats.value) {
        const fromKey = STATUS_COUNT_KEY[item.status]
        const toKey = STATUS_COUNT_KEY[status]
        if (fromKey) (stats.value[fromKey] as number)--
        if (toKey)   (stats.value[toKey] as number)++
      }
      if (listingsStatus.value && listingsStatus.value !== status) {
        listings.value = listings.value.filter(l => l.slug !== slug)
        listingsTotal.value = Math.max(0, listingsTotal.value - 1)
      } else {
        item.status = status
        item.rejection_reason = status === "rejected" ? (reason || null) : null
      }
    }
    fetchStats()
    fetchLogs()
    toast.success(MODERATE_MSG[status] ?? "İşlem tamamlandı.")
  } catch (err) {
    adminToastError(err, "İlan durumu güncellenemedi, tekrar dene")
  } finally {
    moderatingSlug.value = null
  }
}

async function panelModerate(status: "active" | "pending" | "rejected") {
  if (!selectedListing.value) return
  await moderateListing(selectedListing.value.slug, status, status === "rejected" ? panelRejectReason.value : "")
  if (status === "rejected") panelRejectMode.value = false
  closePanel()
}

async function panelDelete() {
  if (!selectedListing.value) return
  const slug = selectedListing.value.slug
  await deleteListing(slug)
  if (!listings.value.find(l => l.slug === slug)) closePanel()
}

watch([listingsStatus, listingsPage], fetchListings, { immediate: false })

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

const users = ref<AdminUserProfile[]>([])
const usersLoading = ref(false)
const patchingUserId = ref<string | null>(null)
const userSearch = ref("")
const confirmAdminUser = ref<AdminUserProfile | null>(null)
const pendingBanUser = ref<AdminUserProfile | null>(null)

const filteredUsers = computed(() => {
  const q = userSearch.value.trim().toLowerCase()
  if (!q) return users.value
  return users.value.filter(u =>
    u.name.toLowerCase().includes(q) ||
    (u.display_name ?? "").toLowerCase().includes(q),
  )
})

async function fetchUsers() {
  usersLoading.value = true
  try {
    const res = await apiFetch<{ data: AdminUserProfile[]; status: "ok" }>("/api/admin/users")
    users.value = res.data
  } catch {
    toast.error("Kullanıcılar yüklenemedi.")
  } finally {
    usersLoading.value = false
  }
}

function requestToggleBan(user: AdminUserProfile) {
  pendingBanUser.value = user
}

async function executeBan(user: AdminUserProfile, reason: string) {
  pendingBanUser.value = null
  const is_active = user.is_active === 0 ? 1 : 0
  patchingUserId.value = user.id
  try {
    await apiFetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active, ...(is_active === 0 && reason ? { ban_reason: reason } : {}) }),
    })
    await fetchUsers()
    fetchLogs()
    toast.success(is_active === 0 ? "Kullanıcı banlandı." : "Ban kaldırıldı.")
  } catch (err) {
    adminToastError(err, "Kullanıcı durumu güncellenemedi, tekrar dene")
  } finally {
    patchingUserId.value = null
  }
}

function requestToggleAdmin(user: AdminUserProfile) {
  confirmAdminUser.value = user
}

async function executeToggleAdmin() {
  const user = confirmAdminUser.value
  if (!user) return
  confirmAdminUser.value = null
  const is_admin = user.is_admin ? 0 : 1
  patchingUserId.value = user.id
  try {
    await apiFetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_admin }),
    })
    await fetchUsers()
    fetchLogs()
    toast.success(is_admin ? "Admin yetkisi verildi." : "Admin yetkisi alındı.")
  } catch (err) {
    adminToastError(err, "Yetki değiştirilemedi, tekrar dene")
  } finally {
    patchingUserId.value = null
  }
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

const REASON_LABELS: Record<string, string> = {
  spam: "Spam / Reklam",
  fraud: "Dolandırıcılık",
  inappropriate: "Uygunsuz İçerik",
  wrong_category: "Yanlış Kategori",
  other: "Diğer",
}

const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  open: "Açık",
  resolved: "Çözüldü",
  dismissed: "Reddedildi",
}

const REPORT_STATUS_COLORS: Record<ReportStatus, string> = {
  open: "bg-amber-50 text-amber-700 border-amber-200",
  resolved: "bg-green-50 text-green-700 border-green-200",
  dismissed: "bg-gray-100 text-gray-500 border-gray-200",
}

const reports = ref<Report[]>([])
const reportsLoading = ref(false)
const reportsStatusFilter = ref<ReportStatus | "all">("open")
const resolvingReportId = ref<string | null>(null)

async function fetchReports() {
  reportsLoading.value = true
  try {
    const res = await apiFetch<{ data: Report[]; status: "ok" }>(
      `/api/admin/reports?status=${reportsStatusFilter.value}`,
    )
    reports.value = res.data
  } catch {
    toast.error("Raporlar yüklenemedi.")
  } finally {
    reportsLoading.value = false
  }
}

async function resolveReport(id: string, status: "resolved" | "dismissed") {
  resolvingReportId.value = id
  try {
    await apiFetch(`/api/admin/reports/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    })
    reports.value = reports.value.filter((r) => r.id !== id)
    toast.success(status === "resolved" ? "Rapor çözüldü olarak işaretlendi." : "Rapor reddedildi.")
  } catch (err) {
    adminToastError(err, "Rapor güncellenemedi, tekrar dene")
  } finally {
    resolvingReportId.value = null
  }
}

watch(reportsStatusFilter, () => fetchReports())

// ---------------------------------------------------------------------------
// Logs
// ---------------------------------------------------------------------------

const logs = ref<AdminLog[]>([])
const logsLoading = ref(false)
const logsTotal = ref(0)
const logsOffset = ref(0)
const LOGS_PAGE_SIZE = 50

async function fetchLogs(append = false) {
  logsLoading.value = true
  try {
    const res = await apiFetch<{
      data: { logs: AdminLog[]; total: number; limit: number; offset: number }
      status: "ok"
    }>(`/api/admin/logs?limit=${LOGS_PAGE_SIZE}&offset=${logsOffset.value}`)
    logs.value = append ? [...logs.value, ...res.data.logs] : res.data.logs
    logsTotal.value = res.data.total
  } catch {
    // sessiz hata
  } finally {
    logsLoading.value = false
  }
}

async function loadMoreLogs() {
  logsOffset.value += LOGS_PAGE_SIZE
  await fetchLogs(true)
}

const hasMoreLogs = computed(() => logs.value.length < logsTotal.value)

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

onMounted(() => {
  fetchStats()
  fetchListings()
  fetchUsers()
  fetchReports()
  fetchLogs()
})

function switchTab(tab: Tab) {
  activeTab.value = tab
}

function navigateToStat(tab: Tab, status?: string) {
  activeTab.value = tab
  if (tab === "listings" && status !== undefined) {
    listingsStatus.value = status
    listingsPage.value = 1
  }
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
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      <div
        class="border border-border rounded-lg p-3 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
        @click="navigateToStat('users')"
      >
        <Users class="size-4 text-brand mb-1.5" />
        <p class="text-2xl font-bold">{{ stats?.total_users ?? '—' }}</p>
        <p class="text-xs text-muted-foreground mt-0.5">Kullanıcılar</p>
      </div>
      <div
        class="rounded-lg p-3 border cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
        :class="(stats?.pending_listings ?? 0) > 0
          ? 'border-amber-300 bg-amber-50'
          : 'border-border'"
        @click="navigateToStat('listings', 'pending')"
      >
        <Clock class="size-4 mb-1.5" :class="(stats?.pending_listings ?? 0) > 0 ? 'text-amber-600' : 'text-brand'" />
        <p class="text-2xl font-bold" :class="(stats?.pending_listings ?? 0) > 0 ? 'text-amber-700' : ''">{{ stats?.pending_listings ?? '—' }}</p>
        <p class="text-xs mt-0.5" :class="(stats?.pending_listings ?? 0) > 0 ? 'text-amber-700' : 'text-muted-foreground'">Bekleyen</p>
      </div>
      <div
        class="border border-border rounded-lg p-3 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
        @click="navigateToStat('listings', '')"
      >
        <CheckCircle class="size-4 text-brand mb-1.5" />
        <p class="text-2xl font-bold">{{ stats?.active_listings ?? '—' }}</p>
        <p class="text-xs text-muted-foreground mt-0.5">Aktif İlanlar</p>
      </div>
      <div
        class="border border-border rounded-lg p-3 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
        @click="navigateToStat('listings', 'sold')"
      >
        <ShoppingBag class="size-4 text-brand mb-1.5" />
        <p class="text-2xl font-bold">{{ stats?.sold_listings ?? '—' }}</p>
        <p class="text-xs text-muted-foreground mt-0.5">Satılan İlanlar</p>
      </div>
      <div
        class="border border-border rounded-lg p-3 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
        @click="navigateToStat('reports')"
      >
        <Flag class="size-4 text-brand mb-1.5" />
        <p class="text-2xl font-bold">{{ stats?.total_reports ?? '—' }}</p>
        <p class="text-xs text-muted-foreground mt-0.5">Raporlar</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 mb-6 border-b border-border">
      <button
        v-for="tab in ([{ key: 'listings', label: 'İlanlar' }, { key: 'users', label: 'Kullanıcılar' }, { key: 'reports', label: `Raporlar ${reports.length ? '(' + reports.length + ')' : ''}` }, { key: 'logs', label: 'Log' }] as const)"
        :key="tab.key"
        class="px-4 py-2 text-sm font-medium cursor-pointer transition-colors -mb-px border-b-2"
        :class="activeTab === tab.key
          ? 'border-brand text-brand'
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
      <div class="flex items-center gap-2 mb-4 min-w-0">
        <span class="text-xs text-muted-foreground shrink-0">Filtre:</span>
        <div class="flex gap-1 overflow-x-auto scrollbar-hide">
          <button
            v-for="opt in STATUS_OPTIONS"
            :key="opt.value"
            class="px-3 py-1 text-xs rounded-full border cursor-pointer transition-colors shrink-0"
            :class="listingsStatus === opt.value
              ? 'bg-brand text-brand-foreground border-brand'
              : 'border-border text-muted-foreground hover:bg-muted'"
            @click="listingsStatus = opt.value; listingsPage = 1"
          >
            {{ opt.label }}
            <span v-if="stats && stats[opt.countKey] > 0" class="ml-0.5 opacity-70">
              ({{ stats[opt.countKey] }})
            </span>
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
              <th class="w-8" />
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr
              v-for="listing in listings"
              :key="listing.id"
              class="hover:bg-muted/30 transition-colors cursor-pointer"
              :class="[
                deletingSlug === listing.slug || moderatingSlug === listing.slug ? 'opacity-40 pointer-events-none' : '',
                selectedListing?.id === listing.id ? 'bg-muted/40' : '',
              ]"
              @click="openPanel(listing)"
            >
              <td class="px-3 py-2.5">
                <p class="font-medium line-clamp-1">{{ listing.title }}</p>
                <p class="text-xs text-muted-foreground">{{ listing.city }}</p>
              </td>
              <td class="px-3 py-2.5 hidden sm:table-cell text-sm text-muted-foreground">
                {{ listing.seller.display_name || listing.seller.name }}
              </td>
              <td class="px-3 py-2.5">
                <span
                  class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
                  :class="STATUS_COLORS[listing.status] ?? 'bg-muted text-muted-foreground border-border'"
                >
                  {{ STATUS_LABELS[listing.status] ?? listing.status }}
                </span>
              </td>
              <td class="px-3 py-2.5 hidden md:table-cell text-xs text-muted-foreground">
                {{ formatDate(listing.created_at) }}
              </td>
              <td class="px-3 py-2.5 text-muted-foreground">
                <ChevronRight class="size-4" />
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
      <div class="mb-4">
        <input
          v-model="userSearch"
          type="search"
          placeholder="İsim veya kullanıcı adı ara..."
          class="w-full sm:w-72 text-sm border border-border rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-foreground"
        />
      </div>

      <div v-if="usersLoading" class="space-y-2">
        <div v-for="i in 5" :key="i" class="h-12 rounded-lg bg-muted animate-pulse" />
      </div>

      <div v-else class="border border-border rounded-lg overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-muted/50 border-b border-border">
            <tr>
              <th class="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Kullanıcı</th>
              <th class="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden sm:table-cell">İlan</th>
              <th class="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden md:table-cell">Kayıt</th>
              <th class="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Durum</th>
              <th class="w-28" />
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr
              v-for="user in filteredUsers"
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
                  <NuxtLink
                    v-if="user.slug"
                    :to="`/profil/${user.slug}`"
                    target="_blank"
                    class="hover:underline"
                  >
                    <p class="font-medium line-clamp-1">{{ user.display_name || user.name }}</p>
                    <p class="text-xs text-muted-foreground">@{{ user.slug }}</p>
                  </NuxtLink>
                  <div v-else>
                    <p class="font-medium line-clamp-1">{{ user.display_name || user.name }}</p>
                  </div>
                </div>
              </td>
              <td class="px-3 py-2 hidden sm:table-cell text-sm tabular-nums">
                {{ user.listing_count }}
              </td>
              <td class="px-3 py-2 hidden md:table-cell text-xs text-muted-foreground">
                {{ formatDate(user.created_at) }}
              </td>
              <td class="px-3 py-2">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span
                    v-if="!user.is_active"
                    class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-red-50 text-red-700 border-red-200"
                  >
                    Banlı
                  </span>
                  <span
                    v-if="user.is_admin"
                    class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium bg-brand/10 text-brand border-brand/30"
                  >
                    Admin
                  </span>
                </div>
              </td>
              <td class="px-3 py-2">
                <div class="flex items-center gap-1 justify-end">
                  <button
                    type="button"
                    :title="user.is_admin ? 'Admin yetkisini kaldır' : 'Admin yap'"
                    class="flex items-center justify-center size-7 rounded cursor-pointer transition-colors"
                    :class="user.is_admin
                      ? 'text-brand hover:bg-brand/10'
                      : 'text-muted-foreground hover:bg-muted'"
                    @click="requestToggleAdmin(user)"
                  >
                    <Shield class="size-3.5" />
                  </button>
                  <button
                    type="button"
                    :title="'Banla / Banı kaldır'"
                    class="flex items-center justify-center size-7 rounded text-destructive hover:bg-destructive/5 cursor-pointer transition-colors"
                    @click="requestToggleBan(user)"
                  >
                    <ShieldOff class="size-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="filteredUsers.length === 0" class="py-12 text-center text-sm text-muted-foreground">
          Kullanıcı bulunamadı.
        </div>
      </div>
    </div>

    <!-- ------------------------------------------------------------------ -->
    <!-- REPORTS TAB                                                         -->
    <!-- ------------------------------------------------------------------ -->
    <div v-if="activeTab === 'reports'">
      <!-- Status filter -->
      <div class="flex gap-1 mb-4 border-b border-border overflow-x-auto">
        <button
          v-for="opt in ([
            { key: 'open', label: 'Açık' },
            { key: 'resolved', label: 'Çözüldü' },
            { key: 'dismissed', label: 'Reddedildi' },
            { key: 'all', label: 'Tümü' },
          ] as const)"
          :key="opt.key"
          type="button"
          class="px-3 py-2 text-sm font-medium cursor-pointer transition-colors -mb-px border-b-2 whitespace-nowrap"
          :class="reportsStatusFilter === opt.key
            ? 'border-brand text-brand'
            : 'border-transparent text-muted-foreground hover:text-foreground'"
          @click="reportsStatusFilter = opt.key"
        >
          {{ opt.label }}
        </button>
      </div>

      <div v-if="reportsLoading" class="space-y-2">
        <div v-for="i in 3" :key="i" class="h-20 rounded-lg bg-muted animate-pulse" />
      </div>

      <div v-else-if="reports.length === 0" class="py-12 text-center text-sm text-muted-foreground">
        Bu kategoride rapor yok.
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="r in reports"
          :key="r.id"
          class="border border-border rounded-lg p-4 space-y-3"
        >
          <!-- Başlık + durum -->
          <div class="flex items-start justify-between gap-3">
            <NuxtLink
              :to="`/ilan/${r.listing_slug}`"
              target="_blank"
              class="inline-flex items-center gap-1.5 font-medium text-sm text-foreground hover:underline cursor-pointer min-w-0"
            >
              <span class="truncate">{{ r.listing_title }}</span>
              <ExternalLink class="size-3 shrink-0" />
            </NuxtLink>
            <span
              class="shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
              :class="REPORT_STATUS_COLORS[r.status]"
            >
              {{ REPORT_STATUS_LABELS[r.status] }}
            </span>
          </div>

          <!-- Meta -->
          <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span>{{ r.reporter_name }}</span>
            <span class="text-border">·</span>
            <span>{{ formatDate(r.created_at) }}</span>
            <span class="text-border">·</span>
            <span class="font-medium text-foreground">{{ REASON_LABELS[r.reason] ?? r.reason }}</span>
          </div>

          <!-- Açıklama -->
          <p v-if="r.description" class="text-xs text-foreground bg-muted/50 rounded-md px-3 py-2 leading-relaxed">
            {{ r.description }}
          </p>

          <!-- Aksiyonlar -->
          <div v-if="r.status === 'open'" class="flex gap-2 pt-1">
            <button
              type="button"
              :disabled="resolvingReportId === r.id"
              class="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md border border-green-600/30 text-green-700 hover:bg-green-50 cursor-pointer transition-colors disabled:opacity-50"
              @click="resolveReport(r.id, 'resolved')"
            >
              <Check class="size-3.5" />
              Çözüldü
            </button>
            <button
              type="button"
              :disabled="resolvingReportId === r.id"
              class="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md border border-border text-muted-foreground hover:bg-muted cursor-pointer transition-colors disabled:opacity-50"
              @click="resolveReport(r.id, 'dismissed')"
            >
              <X class="size-3.5" />
              Reddet
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ------------------------------------------------------------------ -->
    <!-- LOGS TAB                                                             -->
    <!-- ------------------------------------------------------------------ -->
    <div v-if="activeTab === 'logs'">
      <AdminLogsTab :logs="logs" :loading="logsLoading" />
      <div v-if="!logsLoading && hasMoreLogs" class="mt-4 text-center">
        <button
          type="button"
          class="text-sm text-muted-foreground hover:text-foreground border border-border rounded-md px-4 py-2 cursor-pointer hover:bg-muted transition-colors"
          @click="loadMoreLogs"
        >
          Daha fazla göster ({{ logsTotal - logs.length }} kaldı)
        </button>
      </div>
      <p v-if="!logsLoading && logs.length > 0" class="mt-3 text-xs text-center text-muted-foreground">
        {{ logs.length }} / {{ logsTotal }} log gösteriliyor
      </p>
    </div>
  </div>

  <!-- Listing Detail Panel -->
  <Teleport to="body">
    <Transition name="panel">
      <div v-if="selectedListing" class="fixed inset-0 z-50 flex justify-end">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40" @click="closePanel" />

        <!-- Panel -->
        <div
          role="dialog"
          aria-modal="true"
          class="panel-drawer relative z-10 flex flex-col w-full max-w-md bg-background border-l border-border shadow-2xl"
          @keydown.esc="closePanel"
        >
          <!-- Header -->
          <div class="flex items-start gap-3 px-5 py-4 border-b border-border shrink-0">
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-sm line-clamp-2">{{ selectedListing.title }}</p>
              <p class="text-xs text-muted-foreground mt-0.5">{{ formatDate(selectedListing.created_at) }}</p>
            </div>
            <button
              type="button"
              class="shrink-0 flex items-center justify-center size-7 rounded hover:bg-muted cursor-pointer transition-colors"
              @click="closePanel"
            >
              <X class="size-4" />
            </button>
          </div>

          <!-- Scrollable body -->
          <div class="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            <!-- Photos -->
            <div v-if="selectedListing.photos.length" class="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              <img
                v-for="(photo, i) in selectedListing.photos"
                :key="i"
                :src="photo"
                :alt="`Fotoğraf ${i + 1}`"
                class="h-32 w-32 shrink-0 rounded-lg object-cover border border-border cursor-zoom-in hover:opacity-90 transition-opacity"
                @click="lightboxUrl = photo"
              />
            </div>
            <div
              v-else
              class="h-24 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground"
            >
              Fotoğraf yok
            </div>

            <!-- Status + external link -->
            <div class="flex items-center justify-between">
              <span
                class="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium"
                :class="STATUS_COLORS[selectedListing.status]"
              >
                {{ STATUS_LABELS[selectedListing.status] }}
              </span>
              <NuxtLink
                v-if="selectedListing.status === 'active' || selectedListing.status === 'sold'"
                :to="`/ilan/${selectedListing.slug}`"
                target="_blank"
                class="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <ExternalLink class="size-3.5" />
                Sayfaya git
              </NuxtLink>
            </div>

            <!-- Rejection reason -->
            <div
              v-if="selectedListing.rejection_reason"
              class="text-xs text-muted-foreground bg-muted/60 rounded-md px-3 py-2"
            >
              <span class="font-medium text-foreground">Red gerekçesi:</span> {{ selectedListing.rejection_reason }}
            </div>

            <!-- Details grid -->
            <div class="space-y-2 text-sm">
              <div class="flex justify-between gap-4">
                <span class="text-muted-foreground shrink-0">Kategori</span>
                <span class="text-right">{{ selectedListing.category.name }}</span>
              </div>
              <div class="flex justify-between gap-4">
                <span class="text-muted-foreground shrink-0">Konum</span>
                <span class="text-right">{{ selectedListing.district ? `${selectedListing.district}, ${selectedListing.city}` : selectedListing.city }}</span>
              </div>
              <div class="flex justify-between gap-4">
                <span class="text-muted-foreground shrink-0">Ürün durumu</span>
                <span class="text-right">{{ selectedListing.condition ? CONDITION_LABELS[selectedListing.condition] : '—' }}</span>
              </div>
              <div class="flex justify-between gap-4">
                <span class="text-muted-foreground shrink-0">Fiyat</span>
                <span class="text-right font-medium">{{ panelPriceDisplay }}</span>
              </div>
            </div>

            <!-- Description -->
            <div v-if="selectedListing.description">
              <p class="text-xs text-muted-foreground mb-1.5">Açıklama</p>
              <p class="text-sm leading-relaxed whitespace-pre-line">{{ selectedListing.description }}</p>
            </div>

            <!-- Seller -->
            <div class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <img
                v-if="selectedListing.seller.avatar_url"
                :src="selectedListing.seller.avatar_url"
                :alt="selectedListing.seller.display_name || selectedListing.seller.name"
                referrerpolicy="no-referrer"
                class="size-9 rounded-full object-cover shrink-0"
              />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ selectedListing.seller.display_name || selectedListing.seller.name }}</p>
                <p v-if="selectedListing.seller.slug" class="text-xs text-muted-foreground">@{{ selectedListing.seller.slug }}</p>
              </div>
              <NuxtLink
                v-if="selectedListing.seller.slug"
                :to="`/profil/${selectedListing.seller.slug}`"
                target="_blank"
                class="shrink-0 flex items-center justify-center size-7 rounded hover:bg-muted cursor-pointer transition-colors text-muted-foreground"
              >
                <ExternalLink class="size-3.5" />
              </NuxtLink>
            </div>

            <!-- Reject reason textarea -->
            <div v-if="panelRejectMode" class="space-y-2">
              <p class="text-xs font-medium text-muted-foreground">
                Red gerekçesi <span class="font-normal">(isteğe bağlı — kullanıcıya gösterilir)</span>
              </p>
              <textarea
                v-model="panelRejectReason"
                placeholder="Gerekçe yazın..."
                rows="3"
                class="w-full text-sm border border-border rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-foreground"
              />
            </div>
          </div>

          <!-- Actions footer -->
          <div class="shrink-0 border-t border-border px-5 py-4 space-y-2">
            <div
              v-if="moderatingSlug === selectedListing.slug || deletingSlug === selectedListing.slug"
              class="flex justify-center py-3"
            >
              <Loader2 class="size-5 animate-spin text-muted-foreground" />
            </div>

            <template v-else-if="panelRejectMode">
              <button
                type="button"
                class="w-full py-2.5 text-sm bg-destructive text-white rounded-lg cursor-pointer hover:bg-destructive/90 transition-colors font-medium"
                @click="panelModerate('rejected')"
              >
                Reddet
              </button>
              <button
                type="button"
                class="w-full py-2.5 text-sm border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                @click="panelRejectMode = false"
              >
                İptal
              </button>
            </template>

            <template v-else>
              <!-- pending -->
              <template v-if="selectedListing.status === 'pending'">
                <button
                  type="button"
                  class="w-full py-2.5 text-sm bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                  @click="panelModerate('active')"
                >
                  <Check class="size-4" />
                  Onayla
                </button>
                <button
                  type="button"
                  class="w-full py-2.5 text-sm border border-destructive/30 text-destructive rounded-lg cursor-pointer hover:bg-destructive/5 transition-colors"
                  @click="panelRejectMode = true"
                >
                  Reddet
                </button>
              </template>

              <!-- active -->
              <template v-else-if="selectedListing.status === 'active'">
                <button
                  type="button"
                  class="w-full py-2.5 text-sm border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors flex items-center justify-center gap-2"
                  @click="panelModerate('pending')"
                >
                  <RotateCcw class="size-4" />
                  Moderasyona Al
                </button>
                <button
                  type="button"
                  class="w-full py-2.5 text-sm border border-destructive/30 text-destructive rounded-lg cursor-pointer hover:bg-destructive/5 transition-colors"
                  @click="panelRejectMode = true"
                >
                  Reddet
                </button>
              </template>

              <!-- rejected -->
              <template v-else-if="selectedListing.status === 'rejected'">
                <button
                  type="button"
                  class="w-full py-2.5 text-sm bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                  @click="panelModerate('active')"
                >
                  <Check class="size-4" />
                  Aktifleştir
                </button>
              </template>

              <template v-if="deleteConfirmSlug === selectedListing.slug">
                <p class="text-xs text-center text-muted-foreground">Bu işlem geri alınamaz.</p>
                <div class="flex gap-2">
                  <button
                    type="button"
                    class="flex-1 py-2.5 text-sm border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                    @click="deleteConfirmSlug = null"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    class="flex-1 py-2.5 text-sm bg-destructive text-white rounded-lg cursor-pointer hover:bg-destructive/90 transition-colors font-medium"
                    @click="panelDelete()"
                  >
                    Sil
                  </button>
                </div>
              </template>
              <button
                v-else
                type="button"
                class="w-full py-2.5 text-sm border border-destructive/30 text-destructive rounded-lg cursor-pointer hover:bg-destructive/5 transition-colors flex items-center justify-center gap-2"
                @click="deleteConfirmSlug = selectedListing.slug"
              >
                <Trash2 class="size-4" />
                İlanı Sil
              </button>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <ImageLightbox
    :images="lightboxUrl ? [lightboxUrl] : []"
    :model-value="lightboxUrl !== null ? 0 : null"
    @update:model-value="(v) => { if (v === null) lightboxUrl = null }"
  />

  <AdminConfirmModal
    :open="!!confirmAdminUser"
    :title="confirmAdminUser?.is_admin ? 'Admin yetkisini kaldır' : 'Admin yap'"
    :description="confirmAdminUser?.is_admin
      ? `${confirmAdminUser.name} kullanıcısının admin yetkisi kaldırılacak.`
      : `${confirmAdminUser?.name} kullanıcısı admin yapılacak.`"
    :confirm-label="confirmAdminUser?.is_admin ? 'Yetkiyi Kaldır' : 'Admin Yap'"
    @confirm="executeToggleAdmin"
    @cancel="confirmAdminUser = null"
  />

  <AdminBanModal
    :open="!!pendingBanUser"
    :user="pendingBanUser"
    @confirm="(reason) => executeBan(pendingBanUser!, reason)"
    @cancel="pendingBanUser = null"
  />
</template>

<style scoped>
.panel-enter-active,
.panel-leave-active {
  transition: opacity 0.2s ease;
}
.panel-enter-active :deep(.panel-drawer),
.panel-leave-active :deep(.panel-drawer) {
  transition: transform 0.25s ease;
}
.panel-enter-from,
.panel-leave-to {
  opacity: 0;
}
.panel-enter-from :deep(.panel-drawer),
.panel-leave-to :deep(.panel-drawer) {
  transform: translateX(100%);
}
</style>

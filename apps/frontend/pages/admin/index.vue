<script setup lang="ts">
import { Trash2, ShieldOff, Shield, Loader2, ExternalLink, Check, X, RotateCcw } from "lucide-vue-next"
import { toast } from "vue-sonner"
import type { ListingDetail, AdminUserProfile, AdminStats, AdminLog, Report, ReportStatus } from "@rafimdan/shared"
import { apiFetch } from "~/utils/api"
import { STATUS_LABELS, STATUS_COLORS } from "~/utils/listing-constants"

definePageMeta({ middleware: ["auth", "admin"], ssr: false })
useSeoMeta({ title: "Admin — Rafımdan" })

type Tab = "listings" | "users" | "reports" | "logs"

const activeTab = ref<Tab>("listings")

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

const stats = ref<AdminStats | null>(null)

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
const rejectModal = ref({ open: false, slug: "", title: "", reason: "" })

const STATUS_OPTIONS = [
  { value: "", label: "Tümü" },
  { value: "pending", label: "Bekleyen" },
  { value: "active", label: "Aktif" },
  { value: "rejected", label: "Reddedilen" },
  { value: "sold", label: "Satıldı" },
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

async function deleteListing(slug: string, title: string) {
  if (!confirm(`"${title}" silinecek. Emin misin?`)) return
  deletingSlug.value = slug
  try {
    await apiFetch(`/api/admin/listings/${slug}`, { method: "DELETE" })
    listings.value = listings.value.filter(l => l.slug !== slug)
    listingsTotal.value = Math.max(0, listingsTotal.value - 1)
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

async function moderateListing(slug: string, status: "active" | "pending" | "rejected", reason = "") {
  moderatingSlug.value = slug
  try {
    await apiFetch(`/api/admin/listings/${slug}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, reason: reason || undefined }),
    })
    const item = listings.value.find(l => l.slug === slug)
    if (item) {
      item.status = status
      item.rejection_reason = status === "rejected" ? (reason || null) : null
    }
    fetchStats()
    fetchLogs()
    toast.success(MODERATE_MSG[status] ?? "İşlem tamamlandı.")
  } catch {
    toast.error("İşlem başarısız.")
  } finally {
    moderatingSlug.value = null
  }
}

const rejectModalRef = ref<HTMLDivElement | null>(null)
const rejectTriggerRef = ref<HTMLElement | null>(null)

function openRejectModal(slug: string, title: string, trigger?: HTMLElement) {
  rejectTriggerRef.value = trigger ?? null
  rejectModal.value = { open: true, slug, title, reason: "" }
  nextTick(() => {
    rejectModalRef.value?.querySelector<HTMLElement>("textarea")?.focus()
  })
}

function closeRejectModal() {
  rejectModal.value.open = false
  rejectTriggerRef.value?.focus()
}

function onRejectKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") { closeRejectModal(); return }
  if (e.key !== "Tab" || !rejectModalRef.value) return
  const focusable = Array.from(
    rejectModalRef.value.querySelectorAll<HTMLElement>("button, textarea"),
  ).filter((el) => !el.hasAttribute("disabled"))
  if (focusable.length === 0) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault(); last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault(); first.focus()
  }
}

async function confirmReject() {
  const { slug, reason } = rejectModal.value
  closeRejectModal()
  await moderateListing(slug, "rejected", reason)
}

watch([listingsStatus, listingsPage], fetchListings, { immediate: false })

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

const users = ref<AdminUserProfile[]>([])
const usersLoading = ref(false)
const patchingUserId = ref<string | null>(null)
const userSearch = ref("")

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

async function toggleBan(user: AdminUserProfile) {
  const is_active = user.is_active === 0 ? 1 : 0
  patchingUserId.value = user.id
  try {
    await apiFetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active }),
    })
    await fetchUsers()
    fetchLogs()
    toast.success(is_active === 0 ? "Kullanıcı banlandı." : "Ban kaldırıldı.")
  } catch {
    toast.error("İşlem başarısız.")
  } finally {
    patchingUserId.value = null
  }
}

async function toggleAdmin(user: AdminUserProfile) {
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
  } catch {
    toast.error("İşlem başarısız.")
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
  } catch {
    toast.error("İşlem başarısız.")
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
      <div class="border border-border rounded-lg p-3">
        <p class="text-xs text-muted-foreground">Kullanıcılar</p>
        <p class="text-2xl font-bold mt-0.5">{{ stats?.total_users ?? '—' }}</p>
      </div>
      <div
        class="rounded-lg p-3 border"
        :class="(stats?.pending_listings ?? 0) > 0
          ? 'border-amber-300 bg-amber-50'
          : 'border-border'"
      >
        <p class="text-xs" :class="(stats?.pending_listings ?? 0) > 0 ? 'text-amber-700' : 'text-muted-foreground'">Bekleyen</p>
        <p class="text-2xl font-bold mt-0.5" :class="(stats?.pending_listings ?? 0) > 0 ? 'text-amber-700' : ''">{{ stats?.pending_listings ?? '—' }}</p>
      </div>
      <div class="border border-border rounded-lg p-3">
        <p class="text-xs text-muted-foreground">Aktif İlanlar</p>
        <p class="text-2xl font-bold mt-0.5">{{ stats?.active_listings ?? '—' }}</p>
      </div>
      <div class="border border-border rounded-lg p-3">
        <p class="text-xs text-muted-foreground">Satılan İlanlar</p>
        <p class="text-2xl font-bold mt-0.5">{{ stats?.sold_listings ?? '—' }}</p>
      </div>
      <div class="border border-border rounded-lg p-3">
        <p class="text-xs text-muted-foreground">Raporlar</p>
        <p class="text-2xl font-bold mt-0.5">{{ stats?.total_reports ?? '—' }}</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 mb-6 border-b border-border">
      <button
        v-for="tab in ([{ key: 'listings', label: 'İlanlar' }, { key: 'users', label: 'Kullanıcılar' }, { key: 'reports', label: `Raporlar ${reports.length ? '(' + reports.length + ')' : ''}` }, { key: 'logs', label: 'Log' }] as const)"
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
                  {{ STATUS_LABELS[listing.status] ?? listing.status }}
                </span>
              </td>
              <td class="px-3 py-2 hidden md:table-cell text-xs text-muted-foreground">
                {{ formatDate(listing.created_at) }}
              </td>
              <td class="px-3 py-2">
                <div
                  class="flex items-center gap-1"
                  :class="moderatingSlug === listing.slug ? 'opacity-40 pointer-events-none' : ''"
                >
                  <!-- pending: onayla + reddet -->
                  <template v-if="listing.status === 'pending'">
                    <button
                      type="button"
                      title="Onayla"
                      class="flex items-center justify-center size-7 rounded text-green-600 hover:bg-green-50 cursor-pointer transition-colors"
                      @click="moderateListing(listing.slug, 'active')"
                    >
                      <Loader2 v-if="moderatingSlug === listing.slug" class="size-3.5 animate-spin" />
                      <Check v-else class="size-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Reddet"
                      class="flex items-center justify-center size-7 rounded text-amber-600 hover:bg-amber-50 cursor-pointer transition-colors"
                      @click="openRejectModal(listing.slug, listing.title, $event.currentTarget as HTMLElement)"
                    >
                      <X class="size-3.5" />
                    </button>
                  </template>
                  <!-- active: moderasyona al + reddet -->
                  <template v-else-if="listing.status === 'active'">
                    <button
                      type="button"
                      title="Moderasyona Al"
                      class="flex items-center justify-center size-7 rounded text-amber-600 hover:bg-amber-50 cursor-pointer transition-colors"
                      @click="moderateListing(listing.slug, 'pending')"
                    >
                      <Loader2 v-if="moderatingSlug === listing.slug" class="size-3.5 animate-spin" />
                      <RotateCcw v-else class="size-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Reddet"
                      class="flex items-center justify-center size-7 rounded text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                      @click="openRejectModal(listing.slug, listing.title, $event.currentTarget as HTMLElement)"
                    >
                      <X class="size-3.5" />
                    </button>
                  </template>
                  <!-- rejected: aktifleştir -->
                  <template v-else-if="listing.status === 'rejected'">
                    <button
                      type="button"
                      title="Aktifleştir"
                      class="flex items-center justify-center size-7 rounded text-green-600 hover:bg-green-50 cursor-pointer transition-colors"
                      @click="moderateListing(listing.slug, 'active')"
                    >
                      <Loader2 v-if="moderatingSlug === listing.slug" class="size-3.5 animate-spin" />
                      <Check v-else class="size-3.5" />
                    </button>
                  </template>
                  <button
                    type="button"
                    title="Sil"
                    class="flex items-center justify-center size-7 rounded text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                    @click="deleteListing(listing.slug, listing.title)"
                  >
                    <Loader2 v-if="deletingSlug === listing.slug" class="size-3.5 animate-spin" />
                    <Trash2 v-else class="size-3.5" />
                  </button>
                </div>
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
            ? 'border-foreground text-foreground'
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

      <div v-else class="space-y-2">
        <div
          v-for="r in reports"
          :key="r.id"
          class="border border-border rounded-lg p-4"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <NuxtLink
                  :to="`/ilan/${r.listing_slug}`"
                  target="_blank"
                  class="inline-flex items-center gap-1 font-medium text-sm text-foreground hover:underline cursor-pointer"
                >
                  {{ r.listing_title }}
                  <ExternalLink class="size-3 shrink-0" />
                </NuxtLink>
                <span
                  class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
                  :class="REPORT_STATUS_COLORS[r.status]"
                >
                  {{ REPORT_STATUS_LABELS[r.status] }}
                </span>
              </div>
              <p class="text-xs text-muted-foreground mt-0.5">
                {{ r.reporter_name }} · {{ formatDate(r.created_at) }}
                · <span class="font-medium">{{ REASON_LABELS[r.reason] ?? r.reason }}</span>
              </p>
              <p v-if="r.description" class="text-xs text-foreground mt-1 bg-muted/50 rounded px-2 py-1">
                {{ r.description }}
              </p>
            </div>
            <div v-if="r.status === 'open'" class="shrink-0 flex items-center gap-1.5">
              <button
                type="button"
                :disabled="resolvingReportId === r.id"
                class="flex items-center gap-1 text-xs px-2 py-1.5 rounded border border-green-300 text-green-700 hover:bg-green-50 cursor-pointer transition-colors disabled:opacity-50"
                @click="resolveReport(r.id, 'resolved')"
              >
                <Check class="size-3" />
                Çözüldü
              </button>
              <button
                type="button"
                :disabled="resolvingReportId === r.id"
                class="flex items-center gap-1 text-xs px-2 py-1.5 rounded border border-border text-muted-foreground hover:bg-muted cursor-pointer transition-colors disabled:opacity-50"
                @click="resolveReport(r.id, 'dismissed')"
              >
                <X class="size-3" />
                Reddet
              </button>
            </div>
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

  <!-- Reject Modal -->
  <Teleport to="body">
    <div
      v-if="rejectModal.open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="closeRejectModal"
      @keydown="onRejectKeydown"
    >
      <div
        ref="rejectModalRef"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-modal-title"
        class="bg-white rounded-lg shadow-xl p-5 w-full max-w-sm mx-4"
      >
        <h3 id="reject-modal-title" class="text-sm font-semibold mb-1">İlanı Reddet</h3>
        <p class="text-xs text-muted-foreground mb-3 line-clamp-1">{{ rejectModal.title }}</p>
        <textarea
          v-model="rejectModal.reason"
          placeholder="Red gerekçesi (isteğe bağlı) — kullanıcıya gösterilecek"
          class="w-full text-sm border border-border rounded-md p-2 h-24 resize-none focus:outline-none focus:ring-1 focus:ring-foreground"
        />
        <div class="flex justify-end gap-2 mt-3">
          <button
            type="button"
            class="px-3 py-1.5 text-sm border border-border rounded cursor-pointer hover:bg-muted transition-colors"
            @click="closeRejectModal"
          >
            İptal
          </button>
          <button
            type="button"
            class="px-3 py-1.5 text-sm bg-red-600 text-white rounded cursor-pointer hover:bg-red-700 transition-colors"
            @click="confirmReject"
          >
            Reddet
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

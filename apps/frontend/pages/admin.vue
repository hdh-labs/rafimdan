<script setup lang="ts">
import { Shield, ExternalLink, Trash2 } from "lucide-vue-next"
import { apiFetch, ApiError } from "~/utils/api"

definePageMeta({ ssr: false })

type Report = {
  id: string
  listing_id: string
  listing_slug: string
  listing_title: string
  reporter_email: string
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

const apiKey = ref("")
const reports = ref<Report[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const authenticated = ref(false)

async function fetchReports() {
  if (!apiKey.value.trim()) return
  loading.value = true
  error.value = null
  try {
    const res = await apiFetch<{ data: Report[]; status: "ok" }>("/api/admin/reports", {
      headers: { "x-admin-key": apiKey.value },
    })
    reports.value = res.data
    authenticated.value = true
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : "Bir hata oluştu."
  } finally {
    loading.value = false
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-10">
    <div class="flex items-center gap-2 mb-8">
      <Shield class="size-5 text-foreground" />
      <h1 class="text-lg font-semibold text-foreground">Admin — Raporlar</h1>
    </div>

    <div v-if="!authenticated" class="max-w-sm space-y-3">
      <input
        v-model="apiKey"
        type="password"
        placeholder="Admin API Key"
        class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-foreground"
        @keydown.enter="fetchReports"
      />
      <p v-if="error" class="text-xs text-destructive">{{ error }}</p>
      <button
        type="button"
        :disabled="loading"
        class="w-full py-2 text-sm bg-foreground text-background rounded-md hover:opacity-90 cursor-pointer transition-opacity disabled:opacity-50"
        @click="fetchReports"
      >
        {{ loading ? "Yükleniyor..." : "Giriş" }}
      </button>
    </div>

    <template v-else>
      <p class="text-sm text-muted-foreground mb-4">{{ reports.length }} rapor</p>

      <div v-if="reports.length === 0" class="text-sm text-muted-foreground">
        Henüz rapor yok.
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="r in reports"
          :key="r.id"
          class="border border-border rounded-lg p-4 space-y-2"
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
                {{ r.reporter_email }} · {{ formatDate(r.created_at) }}
              </p>
            </div>
            <span class="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
              {{ REASON_LABELS[r.reason] ?? r.reason }}
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

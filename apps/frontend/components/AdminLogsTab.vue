<script setup lang="ts">
import {
  CheckCircle2,
  XCircle,
  Trash2,
  ShieldOff,
  ShieldCheck,
  ArrowUpCircle,
  ArrowDownCircle,
  EyeOff,
} from "lucide-vue-next"
import type { AdminLog } from "@rafimdan/shared"

const props = defineProps<{ logs: AdminLog[]; loading: boolean }>()

type MetaParsed = {
  title?: string
  slug?: string
  from_status?: string
  to_status?: string
  reason?: string
  name?: string
}

type LogWithMeta = AdminLog & { meta_parsed: MetaParsed | null }

const logsWithMeta = computed<LogWithMeta[]>(() =>
  props.logs.map((log) => ({ ...log, meta_parsed: parseMeta(log.meta) })),
)

const ACTION_LABELS: Record<string, string> = {
  listing_approve:    "İlan Onaylandı",
  listing_reject:     "İlan Reddedildi",
  listing_deactivate: "Moderasyona Alındı",
  listing_delete:     "İlan Silindi",
  user_ban:           "Kullanıcı Banlandı",
  user_unban:         "Ban Kaldırıldı",
  user_promote:       "Admin Yapıldı",
  user_demote:        "Admin Kaldırıldı",
}

const ACTION_COLORS: Record<string, string> = {
  listing_approve:    "bg-green-50 text-green-700 border-green-200",
  listing_reject:     "bg-red-50 text-red-700 border-red-200",
  listing_deactivate: "bg-amber-50 text-amber-700 border-amber-200",
  listing_delete:     "bg-red-100 text-red-800 border-red-300",
  user_ban:           "bg-red-50 text-red-700 border-red-200",
  user_unban:         "bg-green-50 text-green-700 border-green-200",
  user_promote:       "bg-blue-50 text-blue-700 border-blue-200",
  user_demote:        "bg-gray-100 text-gray-600 border-gray-200",
}

type IconComponent = typeof CheckCircle2

const ACTION_ICONS: Record<string, IconComponent> = {
  listing_approve:    CheckCircle2,
  listing_reject:     XCircle,
  listing_deactivate: EyeOff,
  listing_delete:     Trash2,
  user_ban:           ShieldOff,
  user_unban:         ShieldCheck,
  user_promote:       ArrowUpCircle,
  user_demote:        ArrowDownCircle,
}

function parseMeta(raw: string | null): MetaParsed | null {
  if (!raw) return null
  try { return JSON.parse(raw) as MetaParsed } catch { return null }
}

function formatAbsolute(iso: string): string {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function parseUTC(dateStr: string): Date {
  if (dateStr.endsWith("Z") || dateStr.includes("+")) return new Date(dateStr)
  return new Date(dateStr.replace(" ", "T") + "Z")
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - parseUTC(iso).getTime()
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 60) return "Az önce"
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} dk önce`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} saat önce`
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} gün önce`
  return formatAbsolute(iso)
}
</script>

<template>
  <div>
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 6" :key="i" class="h-10 rounded-lg bg-muted animate-pulse" />
    </div>

    <template v-else-if="logs.length === 0">
      <div class="py-12 text-center text-sm text-muted-foreground">
        Henüz log kaydı yok.
      </div>
    </template>

    <template v-else>
      <!-- Desktop table: md ve üzeri -->
      <div class="hidden md:block border border-border rounded-lg overflow-x-auto">
        <table class="w-full text-sm min-w-[640px]">
          <thead class="bg-muted/50 border-b border-border">
            <tr>
              <th class="text-left px-3 py-2 text-xs font-medium text-muted-foreground whitespace-nowrap">Tarih</th>
              <th class="text-left px-3 py-2 text-xs font-medium text-muted-foreground whitespace-nowrap">Admin</th>
              <th class="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Aksiyon</th>
              <th class="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Detay</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr
              v-for="log in logsWithMeta"
              :key="log.id"
              class="hover:bg-muted/30 transition-colors"
            >
              <td class="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                <span :title="formatAbsolute(log.created_at)" class="cursor-default">
                  {{ formatRelative(log.created_at) }}
                </span>
              </td>
              <td class="px-3 py-2 text-xs font-medium whitespace-nowrap">{{ log.admin_name }}</td>
              <td class="px-3 py-2">
                <span
                  class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap"
                  :class="ACTION_COLORS[log.action] ?? 'bg-muted text-muted-foreground border-border'"
                >
                  <component :is="ACTION_ICONS[log.action]" v-if="ACTION_ICONS[log.action]" class="size-3 shrink-0" />
                  {{ ACTION_LABELS[log.action] ?? log.action }}
                </span>
              </td>
              <td class="px-3 py-2 text-xs text-muted-foreground">
                <template v-if="log.target_type === 'listing'">
                  <NuxtLink
                    v-if="log.meta_parsed?.slug"
                    :to="`/ilan/${log.meta_parsed.slug}`"
                    class="font-medium text-foreground hover:underline truncate max-w-[220px] block"
                  >
                    {{ log.meta_parsed.title ?? log.target_id }}
                  </NuxtLink>
                  <span v-else class="truncate max-w-[220px] block">
                    {{ log.meta_parsed?.title ?? log.target_id }}
                  </span>
                  <span
                    v-if="log.meta_parsed?.from_status && log.meta_parsed?.to_status"
                    class="text-muted-foreground/70 whitespace-nowrap"
                  >
                    {{ log.meta_parsed.from_status }}
                    <span class="mx-0.5">→</span>
                    {{ log.meta_parsed.to_status }}
                  </span>
                  <span
                    v-if="log.meta_parsed?.reason"
                    class="block text-red-600 italic truncate max-w-[220px]"
                  >
                    "{{ log.meta_parsed.reason }}"
                  </span>
                </template>
                <template v-else>
                  <span class="font-medium text-foreground truncate max-w-[220px] block">
                    {{ log.meta_parsed?.name ?? log.target_id }}
                  </span>
                  <span
                    v-if="log.meta_parsed?.reason"
                    class="block text-red-600 italic truncate max-w-[220px]"
                  >
                    "{{ log.meta_parsed.reason }}"
                  </span>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile card list: md altı -->
      <ul class="md:hidden space-y-2">
        <li
          v-for="log in logsWithMeta"
          :key="log.id"
          class="rounded-lg border border-border bg-background p-3 space-y-1.5"
        >
          <!-- Üst satır: badge + zaman -->
          <div class="flex items-center justify-between gap-2">
            <span
              class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium shrink-0"
              :class="ACTION_COLORS[log.action] ?? 'bg-muted text-muted-foreground border-border'"
            >
              <component :is="ACTION_ICONS[log.action]" v-if="ACTION_ICONS[log.action]" class="size-3 shrink-0" />
              {{ ACTION_LABELS[log.action] ?? log.action }}
            </span>
            <span
              class="text-xs text-muted-foreground whitespace-nowrap shrink-0"
              :title="formatAbsolute(log.created_at)"
            >
              {{ formatRelative(log.created_at) }}
            </span>
          </div>

          <!-- Orta satır: hedef -->
          <div class="text-sm">
            <template v-if="log.target_type === 'listing'">
              <NuxtLink
                v-if="log.meta_parsed?.slug"
                :to="`/ilan/${log.meta_parsed.slug}`"
                class="font-medium text-foreground hover:underline line-clamp-1"
              >
                {{ log.meta_parsed.title ?? log.target_id }}
              </NuxtLink>
              <span v-else class="font-medium text-foreground line-clamp-1">
                {{ log.meta_parsed?.title ?? log.target_id }}
              </span>
              <span
                v-if="log.meta_parsed?.from_status && log.meta_parsed?.to_status"
                class="block text-xs text-muted-foreground/70 mt-0.5"
              >
                {{ log.meta_parsed.from_status }} → {{ log.meta_parsed.to_status }}
              </span>
            </template>
            <template v-else>
              <span class="font-medium text-foreground line-clamp-1">
                {{ log.meta_parsed?.name ?? log.target_id }}
              </span>
            </template>
          </div>

          <!-- Alt satır: admin + reason -->
          <div class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span class="text-xs text-muted-foreground">
              Admin: <span class="font-medium text-foreground">{{ log.admin_name }}</span>
            </span>
            <span
              v-if="log.meta_parsed?.reason"
              class="text-xs text-red-600 italic line-clamp-1"
            >
              "{{ log.meta_parsed.reason }}"
            </span>
          </div>
        </li>
      </ul>
    </template>
  </div>
</template>

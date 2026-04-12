<script setup lang="ts">
import type { AdminLog } from "@rafimdan/shared"

defineProps<{ logs: AdminLog[]; loading: boolean }>()

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function parseMeta(raw: string | null): Record<string, string> | null {
  if (!raw) return null
  try { return JSON.parse(raw) as Record<string, string> } catch { return null }
}
</script>

<template>
  <div>
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 6" :key="i" class="h-10 rounded-lg bg-muted animate-pulse" />
    </div>

    <div v-else class="border border-border rounded-lg overflow-x-auto">
      <table class="w-full text-sm min-w-[600px]">
        <thead class="bg-muted/50 border-b border-border">
          <tr>
            <th class="text-left px-3 py-2 text-xs font-medium text-muted-foreground whitespace-nowrap">Tarih</th>
            <th class="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Admin</th>
            <th class="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Aksiyon</th>
            <th class="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden md:table-cell">Detay</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr
            v-for="log in logs"
            :key="log.id"
            class="hover:bg-muted/30 transition-colors"
          >
            <td class="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
              {{ formatDate(log.created_at) }}
            </td>
            <td class="px-3 py-2 text-xs font-medium">{{ log.admin_name }}</td>
            <td class="px-3 py-2">
              <span
                class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
                :class="ACTION_COLORS[log.action] ?? 'bg-muted text-muted-foreground border-border'"
              >
                {{ ACTION_LABELS[log.action] ?? log.action }}
              </span>
            </td>
            <td class="px-3 py-2 hidden md:table-cell text-xs text-muted-foreground">
              <span v-if="parseMeta(log.meta)?.title" class="truncate max-w-[200px] block">
                {{ parseMeta(log.meta)?.title }}
              </span>
              <span v-else class="font-mono">{{ log.target_id }}</span>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="logs.length === 0" class="py-12 text-center text-sm text-muted-foreground">
        Henüz log kaydı yok.
      </div>
    </div>
  </div>
</template>

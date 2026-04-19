<script setup lang="ts">
import { Heart, CheckCircle, XCircle, Bell } from "lucide-vue-next"
import type { AppNotification, NotificationType } from "@rafimdan/shared"
import type { Component } from "vue"

const props = defineProps<{
  open: boolean
  notifications: AppNotification[]
  unreadCount: number
}>()

const emit = defineEmits<{ close: []; markAllRead: [] }>()

const ICONS: Record<NotificationType, Component> = {
  listing_favorited: Heart,
  listing_approved: CheckCircle,
  listing_rejected: XCircle,
}

const ICON_COLORS: Record<NotificationType, string> = {
  listing_favorited: "text-brand",
  listing_approved: "text-green-600",
  listing_rejected: "text-destructive",
}

const MESSAGES: Record<NotificationType, string> = {
  listing_favorited: "ilanın favorilere eklendi",
  listing_approved: "ilanın yayında!",
  listing_rejected: "ilanın reddedildi",
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "az önce"
  if (minutes < 60) return `${minutes} dk önce`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} sa önce`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} gün önce`
  return `${Math.floor(days / 7)} hafta önce`
}

async function onNotifClick(notif: AppNotification) {
  emit("markAllRead")
  emit("close")
  await navigateTo(`/ilan/${notif.entity_slug}`)
}
</script>

<template>
  <Transition name="notif">
    <div
      v-if="open"
      role="dialog"
      aria-label="Bildirimler"
      class="absolute right-0 top-full mt-1.5 w-[min(320px,calc(100vw-1rem))] bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-border">
        <span class="text-sm font-semibold text-foreground">Bildirimler</span>
        <button
          v-if="unreadCount > 0"
          type="button"
          class="text-xs text-brand hover:underline cursor-pointer"
          @click="emit('markAllRead')"
        >
          Tümünü okundu işaretle
        </button>
      </div>

      <!-- List -->
      <ul class="max-h-80 overflow-y-auto divide-y divide-border">
        <li
          v-for="notif in notifications"
          :key="notif.id"
          class="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted"
          :class="!notif.read_at ? 'bg-brand/5' : ''"
          @click="onNotifClick(notif)"
        >
          <span
            class="mt-0.5 shrink-0 inline-flex items-center justify-center size-7 rounded-full bg-muted"
          >
            <component
              :is="ICONS[notif.type]"
              class="size-3.5"
              :class="ICON_COLORS[notif.type]"
            />
          </span>
          <div class="flex-1 min-w-0 space-y-0.5">
            <p class="text-sm text-foreground leading-snug">
              <span class="font-medium truncate block">{{ notif.entity_title }}</span>
              <span class="text-muted-foreground">{{ MESSAGES[notif.type] }}</span>
            </p>
            <p class="text-xs text-muted-foreground">{{ timeAgo(notif.created_at) }}</p>
          </div>
          <span
            v-if="!notif.read_at"
            class="mt-1.5 shrink-0 size-2 rounded-full bg-brand"
          />
        </li>

        <!-- Empty state -->
        <li v-if="notifications.length === 0" class="flex flex-col items-center gap-2 py-10 text-center">
          <Bell class="size-8 text-muted-foreground/40" />
          <p class="text-sm text-muted-foreground">Henüz bildirim yok</p>
        </li>
      </ul>
    </div>
  </Transition>
</template>

<style scoped>
.notif-enter-active,
.notif-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.notif-enter-from,
.notif-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>

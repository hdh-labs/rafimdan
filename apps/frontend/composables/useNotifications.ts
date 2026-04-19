import { useIntervalFn } from "@vueuse/core"
import type { AppNotification } from "@rafimdan/shared"
import { apiFetch } from "~/utils/api"

type NotifResponse = { data: { items: AppNotification[]; unread_count: number }; status: "ok" }

export function useNotifications() {
  const authStore = useAuthStore()
  const notifications = ref<AppNotification[]>([])
  const unreadCount = ref(0)

  async function fetchNotifications() {
    if (!authStore.isLoggedIn) return
    try {
      const res = await apiFetch<NotifResponse>("/api/notifications")
      notifications.value = res.data.items
      unreadCount.value = res.data.unread_count
    } catch {
      // polling hatası sessizce geçilir
    }
  }

  async function markAllRead() {
    if (unreadCount.value === 0) return
    try {
      await apiFetch("/api/notifications/read", { method: "PATCH" })
      unreadCount.value = 0
      notifications.value = notifications.value.map((n) => ({
        ...n,
        read_at: new Date().toISOString(),
      }))
    } catch {
      // ignore
    }
  }

  onMounted(() => {
    void fetchNotifications()
  })

  useIntervalFn(fetchNotifications, 45_000)

  return { notifications, unreadCount, fetchNotifications, markAllRead }
}

import { defineStore } from "pinia"
import { apiFetch } from "~/utils/api"
import type { FavoritesResponse } from "@rafimdan/shared"

export const useFavoritesStore = defineStore("favorites", () => {
  const authStore = useAuthStore()
  const ids = ref<Set<string>>(new Set())
  const pending = ref<Set<string>>(new Set())

  function isFavorited(listingId: string): boolean {
    return ids.value.has(listingId)
  }

  function isPending(listingId: string): boolean {
    return pending.value.has(listingId)
  }

  async function fetchFavorites(): Promise<void> {
    if (!authStore.isLoggedIn) {
      ids.value = new Set()
      return
    }
    try {
      const res = await apiFetch<{ data: FavoritesResponse; status: "ok" }>("/api/favorites")
      ids.value = new Set(res.data.listings.map((l) => l.id))
    } catch {
      ids.value = new Set()
    }
  }

  async function toggle(listingId: string): Promise<void> {
    if (!authStore.isLoggedIn) {
      await navigateTo("/giris")
      return
    }

    if (pending.value.has(listingId)) return

    pending.value = new Set([...pending.value, listingId])
    const wasFavorited = ids.value.has(listingId)

    if (wasFavorited) {
      ids.value.delete(listingId)
      ids.value = new Set(ids.value)
      try {
        await apiFetch(`/api/favorites/${listingId}`, { method: "DELETE" })
      } catch {
        ids.value.add(listingId)
        ids.value = new Set(ids.value)
      }
    } else {
      ids.value.add(listingId)
      ids.value = new Set(ids.value)
      try {
        await apiFetch("/api/favorites", {
          method: "POST",
          body: JSON.stringify({ listing_id: listingId }),
        })
      } catch {
        ids.value.delete(listingId)
        ids.value = new Set(ids.value)
      }
    }

    pending.value.delete(listingId)
    pending.value = new Set(pending.value)
  }

  return { ids, isFavorited, isPending, fetchFavorites, toggle }
})

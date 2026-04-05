import { defineStore } from "pinia"
import type { ListingListItem, ListingsQueryParams } from "@rafimdan/shared"
import { apiFetch } from "~/utils/api"

type ListingsResult = {
  items: ListingListItem[]
  total: number
  page: number
  limit: number
}

export const useListingsStore = defineStore("listings", () => {
  const items = ref<ListingListItem[]>([])
  const total = ref(0)
  const page = ref(1)
  const loading = ref(false)

  async function fetchListings(filters: ListingsQueryParams = {}) {
    loading.value = true
    try {
      const params = new URLSearchParams()
      for (const [key, val] of Object.entries(filters)) {
        if (val !== undefined && val !== null && val !== "") {
          params.set(key, String(val))
        }
      }
      const qs = params.toString()
      const res = await apiFetch<{ data: ListingsResult; status: "ok" }>(
        `/api/listings${qs ? `?${qs}` : ""}`,
      )
      items.value = res.data.items
      total.value = res.data.total
      page.value = res.data.page
    } finally {
      loading.value = false
    }
  }

  return { items, total, page, loading, fetchListings }
})

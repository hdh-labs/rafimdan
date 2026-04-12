import type { ListingCondition, ListingPriceType, ListingStatus } from "@rafimdan/shared"

export const CONDITION_LABELS: Record<ListingCondition, string> = {
  new: "Yeni",
  like_new: "Az Kullanılmış",
  good: "İyi",
  fair: "Orta",
}

export const CONDITION_COLORS: Record<ListingCondition, string> = {
  new: "bg-green-50 text-green-700",
  like_new: "bg-blue-50 text-blue-700",
  good: "bg-amber-50 text-amber-700",
  fair: "bg-gray-100 text-gray-600",
}

export const PRICE_TYPE_LABELS: Record<ListingPriceType, string> = {
  fixed: "Sabit Fiyat",
  negotiable: "Pazarlığa Açık",
  free: "Ücretsiz",
}

export const STATUS_LABELS: Record<ListingStatus, string> = {
  active:   "Aktif",
  sold:     "Satıldı",
  pending:  "İnceleniyor",
  rejected: "Reddedildi",
}

export const STATUS_COLORS: Record<ListingStatus, string> = {
  active:   "bg-green-50 text-green-700 border-green-200",
  sold:     "bg-gray-100 text-gray-500 border-gray-200",
  pending:  "bg-amber-50 text-amber-700 border-amber-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

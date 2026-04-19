import type { ListingCondition, ListingPriceType, ListingStatus, ListingType } from "@rafimdan/shared"

export const CONDITION_LABELS: Record<ListingCondition, string> = {
  new: "Yeni",
  like_new: "Az Kullanılmış",
  good: "İyi",
  fair: "Orta",
}

export const CONDITION_COLORS: Record<ListingCondition, string> = {
  new: "bg-brand/10 text-brand",
  like_new: "bg-brand/10 text-brand",
  good: "bg-muted text-muted-foreground",
  fair: "bg-muted text-muted-foreground",
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
  active:   "bg-brand/10 text-brand border-brand/20",
  sold:     "bg-muted text-muted-foreground border-border",
  pending:  "bg-muted text-muted-foreground border-border",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
}

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  item: "Eşya",
  service: "Hizmet",
}

export const DIRECTION_LABELS: Record<"offer" | "request", string> = {
  offer: "Sunuyorum",
  request: "Arıyorum",
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

export type NotificationType =
  | "listing_favorited"
  | "listing_approved"
  | "listing_rejected"

export interface AppNotification {
  id: string
  type: NotificationType
  entity_id: string
  entity_slug: string
  entity_title: string
  read_at: string | null
  created_at: string
}

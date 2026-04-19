import type { D1Database } from "@cloudflare/workers-types"
import type { AppNotification } from "@rafimdan/shared"

interface CreateInput {
  id: string
  user_id: string
  type: string
  entity_id: string
  entity_slug: string
  entity_title: string
}

export const notificationRepository = {
  async create(db: D1Database, data: CreateInput): Promise<void> {
    await db
      .prepare(
        "INSERT INTO notifications (id, user_id, type, entity_id, entity_slug, entity_title) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .bind(data.id, data.user_id, data.type, data.entity_id, data.entity_slug, data.entity_title)
      .run()
  },

  async findByUserId(db: D1Database, userId: string, limit = 20): Promise<AppNotification[]> {
    const { results } = await db
      .prepare(
        "SELECT id, type, entity_id, entity_slug, entity_title, read_at, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
      )
      .bind(userId, limit)
      .all<AppNotification>()
    return results
  },

  async countUnread(db: D1Database, userId: string): Promise<number> {
    const row = await db
      .prepare("SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read_at IS NULL")
      .bind(userId)
      .first<{ count: number }>()
    return row?.count ?? 0
  },

  async markAllRead(db: D1Database, userId: string): Promise<void> {
    await db
      .prepare("UPDATE notifications SET read_at = datetime('now') WHERE user_id = ? AND read_at IS NULL")
      .bind(userId)
      .run()
  },
} as const

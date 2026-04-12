import type { AdminLog, AdminLogAction } from "@rafimdan/shared";

type InsertAdminLogInput = {
  id: string;
  admin_id: string;
  action: AdminLogAction;
  target_type: "listing" | "user";
  target_id: string;
  meta?: Record<string, string | number | null | undefined> | null;
};

type AdminLogRow = AdminLog;

export const adminLogRepository = {
  async insert(db: D1Database, input: InsertAdminLogInput): Promise<void> {
    await db
      .prepare(
        `INSERT INTO admin_logs (id, admin_id, action, target_type, target_id, meta)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        input.id,
        input.admin_id,
        input.action,
        input.target_type,
        input.target_id,
        input.meta ? JSON.stringify(input.meta) : null,
      )
      .run();
  },

  async findRecent(db: D1Database, limit = 100): Promise<AdminLog[]> {
    const rows = await db
      .prepare(
        `SELECT al.*, u.name AS admin_name
         FROM admin_logs al
         JOIN users u ON u.id = al.admin_id
         ORDER BY al.created_at DESC
         LIMIT ?`,
      )
      .bind(limit)
      .all<AdminLogRow>();
    return rows.results ?? [];
  },
} as const;

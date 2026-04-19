import type { AdminLog, AdminLogAction } from "@rafimdan/shared";

type InsertAdminLogInput = {
  id: string;
  admin_id: string;
  action: AdminLogAction;
  target_type: "listing" | "user" | "report";
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

  async findRecent(
    db: D1Database,
    limit = 50,
    offset = 0,
  ): Promise<{ logs: AdminLog[]; total: number }> {
    const [rows, countRow] = await Promise.all([
      db
        .prepare(
          `SELECT al.*, u.name AS admin_name
           FROM admin_logs al
           JOIN users u ON u.id = al.admin_id
           ORDER BY al.created_at DESC
           LIMIT ? OFFSET ?`,
        )
        .bind(limit, offset)
        .all<AdminLogRow>(),
      db.prepare("SELECT COUNT(*) AS total FROM admin_logs").first<{ total: number }>(),
    ]);
    return {
      logs: rows.results ?? [],
      total: countRow?.total ?? 0,
    };
  },
} as const;

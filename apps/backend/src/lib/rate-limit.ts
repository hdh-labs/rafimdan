import { AppError } from "../errors";

type RateLimitTable = "auth_rate_limit" | "feedback_rate_limit" | "listing_rate_limit";

interface RateLimitOptions {
  table: RateLimitTable;
  key: string;
  limit: number;
  windowMs: number;
  message: string;
}

export async function checkRateLimit(db: D1Database, opts: RateLimitOptions): Promise<void> {
  const { table, key, limit, windowMs, message } = opts;
  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  const result = await db
    .prepare(
      `INSERT INTO ${table} (key, count, window_start) VALUES (?, 1, ?)
       ON CONFLICT(key) DO UPDATE SET
         count = CASE
           WHEN ? - CAST((julianday(window_start) - 2440587.5) * 86400000 AS INTEGER) >= ?
           THEN 1
           ELSE count + 1
         END,
         window_start = CASE
           WHEN ? - CAST((julianday(window_start) - 2440587.5) * 86400000 AS INTEGER) >= ?
           THEN ?
           ELSE window_start
         END
       RETURNING count`,
    )
    .bind(key, nowIso, now, windowMs, now, windowMs, nowIso)
    .first<{ count: number }>();

  if (result && result.count > limit) {
    throw new AppError(message, 429, "RATE_LIMIT");
  }
}

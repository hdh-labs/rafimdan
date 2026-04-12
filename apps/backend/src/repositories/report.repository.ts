import type { D1Database } from "@cloudflare/workers-types";

export type ReportStatus = "open" | "resolved" | "dismissed";

export type ReportRow = {
  id: string;
  listing_id: string;
  reporter_id: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  created_at: string;
};

export type ReportWithDetails = ReportRow & {
  listing_slug: string;
  listing_title: string;
  reporter_name: string;
};

async function create(
  db: D1Database,
  listingId: string,
  reporterId: string,
  reason: string,
  description?: string | null,
): Promise<void> {
  const id = crypto.randomUUID();
  await db
    .prepare(
      "INSERT INTO reports (id, listing_id, reporter_id, reason, description) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(id, listingId, reporterId, reason, description ?? null)
    .run();
}

async function existsByListingAndReporter(
  db: D1Database,
  listingId: string,
  reporterId: string,
): Promise<boolean> {
  const row = await db
    .prepare("SELECT 1 FROM reports WHERE listing_id = ? AND reporter_id = ?")
    .bind(listingId, reporterId)
    .first();
  return row !== null;
}

async function findAll(
  db: D1Database,
  statusFilter?: ReportStatus | "all",
): Promise<ReportWithDetails[]> {
  const where =
    !statusFilter || statusFilter === "all" ? "" : "WHERE r.status = ?";
  const stmt = db.prepare(
    `SELECT r.id, r.listing_id, r.reporter_id, r.reason, r.description, r.status, r.created_at,
            l.slug AS listing_slug, l.title AS listing_title,
            u.name AS reporter_name
     FROM reports r
     JOIN listings l ON l.id = r.listing_id
     JOIN users u ON u.id = r.reporter_id
     ${where}
     ORDER BY r.created_at DESC`,
  );
  const rows = await (where
    ? stmt.bind(statusFilter).all<ReportWithDetails>()
    : stmt.all<ReportWithDetails>());
  return rows.results;
}

async function updateStatus(
  db: D1Database,
  reportId: string,
  status: ReportStatus,
): Promise<void> {
  await db
    .prepare("UPDATE reports SET status = ? WHERE id = ?")
    .bind(status, reportId)
    .run();
}

export const reportRepository = {
  create,
  existsByListingAndReporter,
  findAll,
  updateStatus,
};

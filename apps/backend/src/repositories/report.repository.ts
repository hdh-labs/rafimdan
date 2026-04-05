import type { D1Database } from "@cloudflare/workers-types";

export type ReportRow = {
  id: string;
  listing_id: string;
  reporter_id: string;
  reason: string;
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
): Promise<void> {
  const id = crypto.randomUUID();
  await db
    .prepare(
      "INSERT INTO reports (id, listing_id, reporter_id, reason) VALUES (?, ?, ?, ?)",
    )
    .bind(id, listingId, reporterId, reason)
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

async function findAll(db: D1Database): Promise<ReportWithDetails[]> {
  const rows = await db
    .prepare(
      `SELECT r.id, r.listing_id, r.reporter_id, r.reason, r.created_at,
              l.slug AS listing_slug, l.title AS listing_title,
              u.name AS reporter_name
       FROM reports r
       JOIN listings l ON l.id = r.listing_id
       JOIN users u ON u.id = r.reporter_id
       ORDER BY r.created_at DESC`,
    )
    .all<ReportWithDetails>();
  return rows.results;
}

export const reportRepository = { create, existsByListingAndReporter, findAll };

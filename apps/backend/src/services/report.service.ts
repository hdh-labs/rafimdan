import type { D1Database } from "@cloudflare/workers-types";
import { reportRepository, type ReportStatus } from "../repositories/report.repository";
import { listingRepository } from "../repositories/listing.repository";
import { AppError, ListingNotFoundError } from "../errors";

const VALID_REASONS = ["spam", "fraud", "inappropriate", "wrong_category", "other"] as const;
type ReportReason = (typeof VALID_REASONS)[number];

function isValidReason(r: string): r is ReportReason {
  return (VALID_REASONS as readonly string[]).includes(r);
}

async function report(
  db: D1Database,
  reporterId: string,
  slug: string,
  reason: string,
  description?: string | null,
): Promise<void> {
  if (!isValidReason(reason)) {
    throw new AppError("Geçersiz bildirim sebebi", 400, "INVALID_REASON");
  }

  const listing = await listingRepository.findBySlug(db, slug);
  if (!listing) throw new ListingNotFoundError();

  if (listing.seller.id === reporterId) {
    throw new AppError("Kendi ilanınızı bildiremezsiniz", 400, "SELF_REPORT");
  }

  const already = await reportRepository.existsByListingAndReporter(db, listing.id, reporterId);
  if (already) {
    throw new AppError("Bu ilanı zaten bildirdiniz", 409, "ALREADY_REPORTED");
  }

  await reportRepository.create(db, listing.id, reporterId, reason, description);
}

async function getAll(db: D1Database, statusFilter?: ReportStatus | "all") {
  return reportRepository.findAll(db, statusFilter);
}

async function resolve(
  db: D1Database,
  reportId: string,
  status: ReportStatus,
): Promise<void> {
  if (status === "open") {
    throw new AppError("Geçersiz durum", 400, "INVALID_STATUS");
  }
  await reportRepository.updateStatus(db, reportId, status);
}

export const reportService = { report, getAll, resolve };

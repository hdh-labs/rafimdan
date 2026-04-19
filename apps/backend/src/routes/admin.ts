import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import type { HonoEnv } from "../types/env";
import type { AdminStats } from "@rafimdan/shared";
import { reportService } from "../services/report.service";
import { listingRepository } from "../repositories/listing.repository";
import { userRepository } from "../repositories/user.repository";
import { refreshTokenRepository } from "../repositories/refresh-token.repository";
import { adminLogRepository } from "../repositories/admin-log.repository";
import { notificationRepository } from "../repositories/notification.repository";
import { AppError } from "../errors";
import { extractStorageKey } from "../lib/storage";

const adminAuthMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized", status: "error", code: "MISSING_TOKEN" }, 401);
  }
  const { verifyAccessToken } = await import("../lib/jwt");
  let sub: string;
  try {
    const payload = await verifyAccessToken(authHeader.slice(7), c.env.JWT_SECRET);
    sub = payload.sub;
    c.set("user", payload);
  } catch {
    return c.json({ error: "Unauthorized", status: "error", code: "INVALID_TOKEN" }, 401);
  }
  const user = await userRepository.findById(c.env.DB, sub);
  if (!user || !user.is_active) {
    return c.json({ error: "Unauthorized", status: "error", code: "ACCOUNT_DISABLED" }, 401);
  }
  if (!user.is_admin) {
    return c.json({ error: "Forbidden", status: "error", code: "FORBIDDEN" }, 403);
  }
  return next();
};

const admin = new Hono<HonoEnv>();
admin.use("/*", adminAuthMiddleware);

function handleError(c: Parameters<MiddlewareHandler<HonoEnv>>[0], err: unknown) {
  if (err instanceof AppError) {
    return c.json({ error: err.message, status: "error", code: err.code }, err.statusCode as 400);
  }
  return c.json({ error: "Sunucu hatası", status: "error", code: "INTERNAL_ERROR" }, 500);
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

admin.get("/stats", async (c) => {
  try {
    const row = await c.env.DB.prepare(
      `SELECT
        (SELECT COUNT(*) FROM users)                               AS total_users,
        (SELECT COUNT(*) FROM listings)                            AS total_listings,
        (SELECT COUNT(*) FROM listings WHERE status = 'active')    AS active_listings,
        (SELECT COUNT(*) FROM listings WHERE status = 'sold')      AS sold_listings,
        (SELECT COUNT(*) FROM listings WHERE status = 'pending')   AS pending_listings,
        (SELECT COUNT(*) FROM listings WHERE status = 'rejected')  AS rejected_listings,
        (SELECT COUNT(*) FROM reports)                             AS total_reports`,
    ).first<AdminStats>();
    return c.json({ data: row, status: "ok" });
  } catch (err) {
    return handleError(c, err);
  }
});

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

admin.get("/reports", async (c) => {
  try {
    const statusFilter = (c.req.query("status") ?? "all") as "open" | "resolved" | "dismissed" | "all";
    const reports = await reportService.getAll(c.env.DB, statusFilter);
    return c.json({ data: reports, status: "ok" });
  } catch (err) {
    return handleError(c, err);
  }
});

admin.patch("/reports/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json<{ status?: string }>();
    const ALLOWED = ["resolved", "dismissed"] as const;
    type ResolveStatus = typeof ALLOWED[number];
    if (!ALLOWED.includes(body.status as ResolveStatus)) {
      return c.json({ error: "Geçersiz durum", status: "error", code: "INVALID_STATUS" }, 400);
    }
    await reportService.resolve(c.env.DB, id, body.status as ResolveStatus);
    await adminLogRepository.insert(c.env.DB, {
      id: crypto.randomUUID(),
      admin_id: c.get("user").sub,
      action: body.status === "resolved" ? "report_resolve" : "report_dismiss",
      target_type: "report",
      target_id: id,
      meta: {},
    });
    return c.json({ data: null, status: "ok" });
  } catch (err) {
    return handleError(c, err);
  }
});

// ---------------------------------------------------------------------------
// Admin: Listings
// ---------------------------------------------------------------------------

admin.get("/listings", async (c) => {
  try {
    const status = c.req.query("status");
    const page = Math.max(1, Number(c.req.query("page") ?? 1));
    const limit = Math.min(100, Math.max(1, Number(c.req.query("limit") ?? 30)));
    const result = await listingRepository.findAllAdmin(c.env.DB, { status, page, limit });
    return c.json({ data: result, status: "ok" });
  } catch (err) {
    return handleError(c, err);
  }
});

admin.patch("/listings/:slug/status", async (c) => {
  try {
    const slug = c.req.param("slug");
    const body = await c.req.json<{ status?: string; reason?: string }>();
    const ALLOWED = ["active", "pending", "rejected"] as const;
    type ModerationStatus = typeof ALLOWED[number];
    if (!ALLOWED.includes(body.status as ModerationStatus)) {
      return c.json({ error: "Geçersiz durum", status: "error", code: "INVALID_STATUS" }, 400);
    }
    const status = body.status as ModerationStatus;
    const listing = await listingRepository.findBySlug(c.env.DB, slug);
    if (!listing) return c.json({ error: "Bulunamadı", status: "error", code: "NOT_FOUND" }, 404);
    const reason = status === "rejected" ? (body.reason ?? null) : null;
    const updated = await listingRepository.moderate(c.env.DB, listing.id, status, reason);
    const adminId = c.get("user").sub;
    const action = status === "active" ? "listing_approve"
      : status === "rejected" ? "listing_reject"
      : "listing_deactivate";
    await adminLogRepository.insert(c.env.DB, {
      id: crypto.randomUUID(),
      admin_id: adminId,
      action,
      target_type: "listing",
      target_id: listing.id,
      meta: {
        slug: listing.slug,
        title: listing.title,
        from_status: listing.status,
        to_status: status,
        reason: reason ?? undefined,
      },
    });
    if (updated && (status === "active" || status === "rejected") && updated.seller.id !== adminId) {
      try {
        await notificationRepository.create(c.env.DB, {
          id: crypto.randomUUID(),
          user_id: updated.seller.id,
          type: status === "active" ? "listing_approved" : "listing_rejected",
          entity_id: updated.id,
          entity_slug: updated.slug,
          entity_title: updated.title,
        })
      } catch { /* bildirim hatası moderasyonu etkilemez */ }
    }
    return c.json({ data: updated, status: "ok" });
  } catch (err) {
    return handleError(c, err);
  }
});

admin.delete("/listings/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");
    const listing = await listingRepository.findBySlug(c.env.DB, slug);
    if (!listing) return c.json({ error: "Bulunamadı", status: "error", code: "NOT_FOUND" }, 404);
    const bucketBase = c.env.STORAGE_PUBLIC_URL || "/api/storage";
    await Promise.allSettled(
      listing.photos.map(url => c.env.STORAGE.delete(extractStorageKey(url, bucketBase))),
    );
    await listingRepository.delete(c.env.DB, listing.id);
    await adminLogRepository.insert(c.env.DB, {
      id: crypto.randomUUID(),
      admin_id: c.get("user").sub,
      action: "listing_delete",
      target_type: "listing",
      target_id: listing.id,
      meta: { slug, title: listing.title },
    });
    return c.json({ data: null, status: "ok" });
  } catch (err) {
    return handleError(c, err);
  }
});

// ---------------------------------------------------------------------------
// Admin: Users
// ---------------------------------------------------------------------------

admin.get("/users", async (c) => {
  try {
    const users = await userRepository.findAllWithStats(c.env.DB);
    const profiles = users.map(u => userRepository.toAdminProfile(u));
    return c.json({ data: profiles, status: "ok" });
  } catch (err) {
    return handleError(c, err);
  }
});

admin.patch("/users/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const adminId = c.get("user").sub;
    if (id === adminId) {
      return c.json({ error: "Kendi hesabınızı değiştiremezsiniz", status: "error", code: "SELF_MODIFY" }, 403);
    }
    const body = await c.req.json<{ is_active?: number; is_admin?: number; ban_reason?: string }>();

    if (body.is_admin === 0 || body.is_active === 0) {
      const target = await userRepository.findById(c.env.DB, id);
      if (target?.is_admin === 1) {
        const adminCount = await userRepository.countActiveAdmins(c.env.DB);
        if (adminCount <= 1) {
          return c.json({ error: "Sistemdeki son admin kaldırılamaz veya banlanamaz", status: "error", code: "LAST_ADMIN" }, 403);
        }
      }
    }

    const allowed: { is_active?: number; is_admin?: number } = {};
    if (typeof body.is_active === "number") allowed.is_active = body.is_active;
    if (typeof body.is_admin === "number") allowed.is_admin = body.is_admin;
    if (Object.keys(allowed).length === 0) {
      return c.json({ error: "Güncellenecek alan yok", status: "error", code: "NO_FIELDS" }, 400);
    }
    const updated = await userRepository.update(c.env.DB, id, allowed);
    if (!updated) return c.json({ error: "Kullanıcı bulunamadı", status: "error", code: "NOT_FOUND" }, 404);
    if (body.is_active === 0) {
      await refreshTokenRepository.deleteAllByUserId(c.env.DB, id);
    }
    if (typeof body.is_active === "number") {
      await adminLogRepository.insert(c.env.DB, {
        id: crypto.randomUUID(),
        admin_id: adminId,
        action: body.is_active === 0 ? "user_ban" : "user_unban",
        target_type: "user",
        target_id: id,
        meta: { name: updated.name, ...(body.is_active === 0 && body.ban_reason ? { reason: body.ban_reason } : {}) },
      });
    }
    if (typeof body.is_admin === "number") {
      await adminLogRepository.insert(c.env.DB, {
        id: crypto.randomUUID(),
        admin_id: adminId,
        action: body.is_admin === 1 ? "user_promote" : "user_demote",
        target_type: "user",
        target_id: id,
        meta: { name: updated.name },
      });
    }
    return c.json({ data: userRepository.toProfile(updated), status: "ok" });
  } catch (err) {
    return handleError(c, err);
  }
});

// ---------------------------------------------------------------------------
// Admin: Logs
// ---------------------------------------------------------------------------

admin.get("/logs", async (c) => {
  try {
    const limit = Math.min(Number(c.req.query("limit") ?? 50), 100);
    const offset = Number(c.req.query("offset") ?? 0);
    const { logs, total } = await adminLogRepository.findRecent(c.env.DB, limit, offset);
    return c.json({ data: { logs, total, limit, offset }, status: "ok" });
  } catch (err) {
    return handleError(c, err);
  }
});

export default admin;

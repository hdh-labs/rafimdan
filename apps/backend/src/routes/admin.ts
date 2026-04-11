import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import type { HonoEnv } from "../types/env";
import { reportService } from "../services/report.service";
import { listingRepository } from "../repositories/listing.repository";
import { userRepository } from "../repositories/user.repository";
import { authMiddleware } from "../middleware/auth";
import { AppError } from "../errors";

const admin = new Hono<HonoEnv>();

function handleError(c: Parameters<MiddlewareHandler<HonoEnv>>[0], err: unknown) {
  if (err instanceof AppError) {
    return c.json({ error: err.message, status: "error", code: err.code }, err.statusCode as 400);
  }
  throw err;
}

const apiKeyMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const key = c.req.header("x-admin-key");
  if (!key || key !== c.env.ADMIN_API_KEY) {
    return c.json({ error: "Unauthorized", status: "error", code: "UNAUTHORIZED" }, 401);
  }
  return next();
};

const adminAuthMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
  await authMiddleware(c, async () => {});
  const userPayload = c.get("user");
  if (!userPayload) return;

  const user = await userRepository.findById(c.env.DB, userPayload.sub);
  if (!user || !user.is_admin) {
    return c.json({ error: "Forbidden", status: "error", code: "FORBIDDEN" }, 403);
  }
  return next();
};

// ---------------------------------------------------------------------------
// Reports (API key korumalı — geriye dönük uyumluluk)
// ---------------------------------------------------------------------------

admin.get("/reports", adminAuthMiddleware, async (c) => {
  try {
    const reports = await reportService.getAll(c.env.DB);
    return c.json({ data: reports, status: "ok" });
  } catch (err) {
    return handleError(c, err);
  }
});

// ---------------------------------------------------------------------------
// Admin: Listings
// ---------------------------------------------------------------------------

admin.get("/listings", adminAuthMiddleware, async (c) => {
  try {
    const status = c.req.query("status");
    const page = Number(c.req.query("page") ?? 1);
    const limit = Number(c.req.query("limit") ?? 30);
    const result = await listingRepository.findAllAdmin(c.env.DB, { status, page, limit });
    return c.json({ data: result, status: "ok" });
  } catch (err) {
    return handleError(c, err);
  }
});

admin.delete("/listings/:slug", adminAuthMiddleware, async (c) => {
  try {
    const slug = c.req.param("slug");
    const listing = await listingRepository.findBySlug(c.env.DB, slug);
    if (!listing) return c.json({ error: "Bulunamadı", status: "error", code: "NOT_FOUND" }, 404);
    await listingRepository.delete(c.env.DB, listing.id);
    return c.json({ data: null, status: "ok" });
  } catch (err) {
    return handleError(c, err);
  }
});

// ---------------------------------------------------------------------------
// Admin: Users
// ---------------------------------------------------------------------------

admin.get("/users", adminAuthMiddleware, async (c) => {
  try {
    const users = await userRepository.findAll(c.env.DB);
    const profiles = users.map(u => userRepository.toProfile(u));
    return c.json({ data: profiles, status: "ok" });
  } catch (err) {
    return handleError(c, err);
  }
});

admin.patch("/users/:id", adminAuthMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json<{ is_active?: number; is_admin?: number; is_ahali?: number }>();
    const allowed: { is_active?: number; is_admin?: number; is_ahali?: number } = {};
    if (typeof body.is_active === "number") allowed.is_active = body.is_active;
    if (typeof body.is_admin === "number") allowed.is_admin = body.is_admin;
    if (typeof body.is_ahali === "number") allowed.is_ahali = body.is_ahali;
    if (Object.keys(allowed).length === 0) {
      return c.json({ error: "Güncellenecek alan yok", status: "error", code: "NO_FIELDS" }, 400);
    }
    const updated = await userRepository.update(c.env.DB, id, allowed);
    if (!updated) return c.json({ error: "Kullanıcı bulunamadı", status: "error", code: "NOT_FOUND" }, 404);
    return c.json({ data: userRepository.toProfile(updated), status: "ok" });
  } catch (err) {
    return handleError(c, err);
  }
});

export default admin;

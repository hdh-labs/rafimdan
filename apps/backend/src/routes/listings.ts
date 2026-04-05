import { Hono } from "hono";
import type { Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { HonoEnv } from "../types/env";
import { authMiddleware } from "../middleware/auth";
import { listingService } from "../services/listing.service";
import { reportService } from "../services/report.service";
import { AppError } from "../errors";
import {
  createListingSchema,
  updateListingSchema,
  listingStatusSchema,
  listingsQuerySchema,
} from "../schemas/listing.schemas";

const listings = new Hono<HonoEnv>();

function handleError(c: Context<HonoEnv>, err: unknown) {
  if (err instanceof AppError) {
    return c.json({ error: err.message, status: "error", code: err.code }, err.statusCode as 400);
  }
  throw err;
}

// ---------------------------------------------------------------------------
// GET / — liste
// ---------------------------------------------------------------------------

listings.get("/", zValidator("query", listingsQuerySchema), async (c) => {
  try {
    const params = c.req.valid("query");
    const result = await listingService.getAll(c.env.DB, params);
    return c.json({ data: result, status: "ok" });
  } catch (err) {
    return handleError(c, err);
  }
});

// ---------------------------------------------------------------------------
// POST / — oluştur
// ---------------------------------------------------------------------------

listings.post("/", authMiddleware, zValidator("json", createListingSchema), async (c) => {
  try {
    const { sub } = c.get("user");
    const body = c.req.valid("json");
    const listing = await listingService.create(c.env.DB, sub, body);
    return c.json({ data: listing, status: "ok" }, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

// ---------------------------------------------------------------------------
// GET /:slug — detay
// ---------------------------------------------------------------------------

listings.get("/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");
    const listing = await listingService.getBySlug(c.env.DB, slug);
    return c.json({ data: listing, status: "ok" });
  } catch (err) {
    return handleError(c, err);
  }
});

// ---------------------------------------------------------------------------
// PATCH /:slug — güncelle
// ---------------------------------------------------------------------------

listings.patch(
  "/:slug",
  authMiddleware,
  zValidator("json", updateListingSchema),
  async (c) => {
    try {
      const { sub } = c.get("user");
      const slug = c.req.param("slug");
      const body = c.req.valid("json");
      const listing = await listingService.update(c.env.DB, sub, slug, body);
      return c.json({ data: listing, status: "ok" });
    } catch (err) {
      return handleError(c, err);
    }
  },
);

// ---------------------------------------------------------------------------
// PATCH /:slug/status — durum güncelle
// ---------------------------------------------------------------------------

listings.patch(
  "/:slug/status",
  authMiddleware,
  zValidator("json", listingStatusSchema),
  async (c) => {
    try {
      const { sub } = c.get("user");
      const slug = c.req.param("slug");
      const { status } = c.req.valid("json");
      const listing = await listingService.updateStatus(c.env.DB, sub, slug, status);
      return c.json({ data: listing, status: "ok" });
    } catch (err) {
      return handleError(c, err);
    }
  },
);

// ---------------------------------------------------------------------------
// DELETE /:slug
// ---------------------------------------------------------------------------

listings.delete("/:slug", authMiddleware, async (c) => {
  try {
    const { sub } = c.get("user");
    const slug = c.req.param("slug");
    await listingService.delete(c.env.DB, c.env, sub, slug);
    return c.json({ data: null, status: "ok" });
  } catch (err) {
    return handleError(c, err);
  }
});

// ---------------------------------------------------------------------------
// POST /:slug/photos — fotoğraf yükle
// ---------------------------------------------------------------------------

listings.post("/:slug/photos", authMiddleware, async (c) => {
  try {
    const { sub } = c.get("user");
    const slug = c.req.param("slug");

    const contentType = c.req.header("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return c.json(
        { error: "Content-Type must be multipart/form-data", status: "error", code: "INVALID_CONTENT_TYPE" },
        400,
      );
    }

    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return c.json({ error: "Dosya gerekli", status: "error", code: "MISSING_FILE" }, 400);
    }

    const listing = await listingService.uploadPhoto(c.env.DB, c.env, sub, slug, file);
    return c.json({ data: listing, status: "ok" });
  } catch (err) {
    return handleError(c, err);
  }
});

// ---------------------------------------------------------------------------
// DELETE /:slug/photos/:index — fotoğraf sil
// ---------------------------------------------------------------------------

listings.delete("/:slug/photos/:index", authMiddleware, async (c) => {
  try {
    const { sub } = c.get("user");
    const slug = c.req.param("slug");
    const index = Number(c.req.param("index"));
    if (!Number.isInteger(index) || index < 0) {
      return c.json({ error: "Geçersiz index", status: "error", code: "INVALID_INDEX" }, 400);
    }
    const listing = await listingService.deletePhoto(c.env.DB, c.env, sub, slug, index);
    return c.json({ data: listing, status: "ok" });
  } catch (err) {
    return handleError(c, err);
  }
});

// ---------------------------------------------------------------------------
// POST /:slug/report — bildir
// ---------------------------------------------------------------------------

listings.post("/:slug/report", authMiddleware, async (c) => {
  try {
    const { sub } = c.get("user");
    const slug = c.req.param("slug");
    const body = await c.req.json<{ reason?: string }>();
    const reason = body?.reason ?? "other";
    await reportService.report(c.env.DB, sub, slug, reason);
    return c.json({ data: null, status: "ok" }, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

export default listings;

import { Hono } from "hono";
import type { Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { HonoEnv } from "../types/env";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth";
import { listingService } from "../services/listing.service";
import { reportService } from "../services/report.service";
import { AppError } from "../errors";
import {
  createListingSchema,
  updateListingSchema,
  listingStatusSchema,
  listingsQuerySchema,
} from "../schemas/listing.schemas";
import { validateImageMagicBytes, getImageExtension } from "../lib/image-validation";
import { handleError } from "../lib/handle-error";

const listings = new Hono<HonoEnv>();

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
    const { temp_photo_keys, ...body } = c.req.valid("json");
    const listing = await listingService.create(c.env.DB, c.env, sub, body, temp_photo_keys);
    return c.json({ data: listing, status: "ok" }, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

// ---------------------------------------------------------------------------
// POST /photos/temp — geçici fotoğraf yükle (ilan oluşturulmadan önce eager upload)
// ---------------------------------------------------------------------------

listings.post("/photos/temp", authMiddleware, async (c) => {
  try {
    const { sub } = c.get("user");

    const contentType = c.req.header("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return c.json(
        { error: "Dosya yükleme formatı hatalı", status: "error", code: "INVALID_CONTENT_TYPE" },
        400,
      );
    }

    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return c.json({ error: "Dosya gerekli", status: "error", code: "MISSING_FILE" }, 400);
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
    if (file.size > MAX_FILE_SIZE) {
      return c.json({ error: "Dosya 10 MB'dan küçük olmalı", status: "error", code: "FILE_TOO_LARGE" }, 400);
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return c.json({ error: "Yalnızca JPEG, PNG veya WebP formatı desteklenir", status: "error", code: "INVALID_FILE_TYPE" }, 400);
    }

    if (!(await validateImageMagicBytes(file))) {
      return c.json({ error: "Yalnızca JPEG, PNG veya WebP formatı desteklenir", status: "error", code: "INVALID_FILE_TYPE" }, 400);
    }

    const ext = getImageExtension(file.type);
    const key = `temp/${sub}/${crypto.randomUUID()}.${ext}`;
    await c.env.STORAGE.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
    });

    return c.json({ data: { key }, status: "ok" }, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

// ---------------------------------------------------------------------------
// DELETE /photos/temp — rotate sırasında orphan kalan temp fotoğrafı sil
// ---------------------------------------------------------------------------

listings.delete("/photos/temp", authMiddleware, async (c) => {
  try {
    const { sub } = c.get("user");
    const body = await c.req.json<{ key: string }>();
    const key = body?.key;

    if (!key || typeof key !== "string") {
      return c.json({ error: "key gerekli", status: "error", code: "MISSING_KEY" }, 400);
    }

    const EXPECTED_PREFIX = `temp/${sub}/`;
    if (!key.startsWith(EXPECTED_PREFIX)) {
      return c.json({ error: "Yetkisiz işlem", status: "error", code: "FORBIDDEN" }, 403);
    }

    await c.env.STORAGE.delete(key);
    return c.json({ status: "ok" });
  } catch (err) {
    return handleError(c, err);
  }
});

// ---------------------------------------------------------------------------
// GET /mine — kullanıcının kendi ilanları
// ---------------------------------------------------------------------------

listings.get("/mine", authMiddleware, async (c) => {
  try {
    const { sub } = c.get("user");
    const items = await listingService.getMine(c.env.DB, sub);
    return c.json({ data: items, status: "ok" });
  } catch (err) {
    return handleError(c, err);
  }
});

// ---------------------------------------------------------------------------
// GET /:slug — detay
// ---------------------------------------------------------------------------

listings.get("/:slug", optionalAuthMiddleware, async (c) => {
  try {
    const slug = c.req.param("slug");
    const viewerId = c.get("user")?.sub;
    const listing = await listingService.getBySlug(c.env.DB, slug, viewerId);
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
// POST /:slug/refresh — updated_at'i güncelle (feed'de yukarı taşı)
// ---------------------------------------------------------------------------

listings.post("/:slug/refresh", authMiddleware, async (c) => {
  try {
    const { sub } = c.get("user");
    const slug = c.req.param("slug");
    await listingService.refresh(c.env.DB, sub, slug);
    return c.json({ data: null, status: "ok" });
  } catch (err) {
    return handleError(c, err);
  }
});

// ---------------------------------------------------------------------------
// PATCH /:slug/photos — fotoğraf sırala
// ---------------------------------------------------------------------------

listings.patch("/:slug/photos", authMiddleware, async (c) => {
  try {
    const { sub } = c.get("user");
    const slug = c.req.param("slug");
    const body = await c.req.json<{ photos?: unknown }>();
    if (!Array.isArray(body.photos) || !body.photos.every(p => typeof p === "string")) {
      return c.json({ error: "Fotoğraf verisi hatalı", status: "error", code: "INVALID_INPUT" }, 400);
    }
    const listing = await listingService.reorderPhotos(c.env.DB, sub, slug, body.photos);
    return c.json({ data: listing, status: "ok" });
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
        { error: "Dosya yükleme formatı hatalı", status: "error", code: "INVALID_CONTENT_TYPE" },
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
    const body = await c.req.json<{ reason?: string; description?: string }>();
    const reason = body?.reason ?? "other";
    const description = typeof body?.description === "string"
      ? body.description.slice(0, 1000)
      : null;
    await reportService.report(c.env.DB, sub, slug, reason, description);
    return c.json({ data: null, status: "ok" }, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

export default listings;

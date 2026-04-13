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
    c.header("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
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
        { error: "Content-Type must be multipart/form-data", status: "error", code: "INVALID_CONTENT_TYPE" },
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
      return c.json({ error: "File must be smaller than 10MB", status: "error", code: "FILE_TOO_LARGE" }, 400);
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return c.json({ error: "Only JPEG, PNG and WebP images are allowed", status: "error", code: "INVALID_FILE_TYPE" }, 400);
    }

    const buffer = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isWebp = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46
      && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    if (!isJpeg && !isPng && !isWebp) {
      return c.json({ error: "Only JPEG, PNG and WebP images are allowed", status: "error", code: "INVALID_FILE_TYPE" }, 400);
    }

    const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
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
      return c.json({ error: "photos must be string[]", status: "error", code: "INVALID_INPUT" }, 400);
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

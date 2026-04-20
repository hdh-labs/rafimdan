import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { HonoEnv } from "../types/env";
import { authMiddleware } from "../middleware/auth";
import { favoriteService } from "../services/favorite.service";
import { listingRepository } from "../repositories/listing.repository";
import { notificationRepository } from "../repositories/notification.repository";
import { favoriteAddSchema } from "../schemas/favorite.schemas";
import { handleError } from "../lib/handle-error";

const favorites = new Hono<HonoEnv>();

// ---------------------------------------------------------------------------
// GET / — kullanıcının favori ilan ID'leri
// ---------------------------------------------------------------------------

favorites.get("/", authMiddleware, async (c) => {
  try {
    const { sub } = c.get("user");
    const listings = await favoriteService.getListings(c.env.DB, sub);
    return c.json({ data: { listings }, status: "ok" });
  } catch (err) {
    return handleError(c, err);
  }
});

// ---------------------------------------------------------------------------
// POST / — favoriye ekle
// ---------------------------------------------------------------------------

favorites.post("/", authMiddleware, zValidator("json", favoriteAddSchema), async (c) => {
  try {
    const { sub } = c.get("user");
    const { listing_id } = c.req.valid("json");
    await favoriteService.add(c.env.DB, sub, listing_id);
    const listing = await listingRepository.findById(c.env.DB, listing_id)
    if (listing && listing.seller.id !== sub) {
      try {
        await notificationRepository.create(c.env.DB, {
          id: crypto.randomUUID(),
          user_id: listing.seller.id,
          type: "listing_favorited",
          entity_id: listing.id,
          entity_slug: listing.slug,
          entity_title: listing.title,
        })
      } catch { /* bildirim hatası ana işlemi etkilemez */ }
    }
    return c.json({ data: null, status: "ok" }, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

// ---------------------------------------------------------------------------
// DELETE /:listingId — favoriden çıkar
// ---------------------------------------------------------------------------

favorites.delete("/:listingId", authMiddleware, async (c) => {
  try {
    const { sub } = c.get("user");
    const listingId = c.req.param("listingId");
    await favoriteService.remove(c.env.DB, sub, listingId);
    return c.json({ data: null, status: "ok" });
  } catch (err) {
    return handleError(c, err);
  }
});

export default favorites;

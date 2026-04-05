import { Hono } from "hono";
import type { Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { HonoEnv } from "../types/env";
import { authMiddleware } from "../middleware/auth";
import { favoriteService } from "../services/favorite.service";
import { AppError } from "../errors";
import { favoriteAddSchema } from "../schemas/favorite.schemas";

const favorites = new Hono<HonoEnv>();

function handleError(c: Context<HonoEnv>, err: unknown) {
  if (err instanceof AppError) {
    return c.json({ error: err.message, status: "error", code: err.code }, err.statusCode as 400);
  }
  throw err;
}

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

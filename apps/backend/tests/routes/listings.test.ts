import { env, SELF } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import { applySchema } from "../helpers/schema";
import {
  makeToken,
  createUser,
  createAdminUser,
  createCategory,
  createListing,
} from "../helpers/fixtures";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function post(path: string, body: unknown, token: string) {
  return SELF.fetch(`http://localhost${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function patch(path: string, body: unknown, token: string) {
  return SELF.fetch(`http://localhost${path}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function del(path: string, body: unknown, token: string) {
  return SELF.fetch(`http://localhost${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

const BASE_LISTING = {
  title: "Test ilan",
  category_id: "cat_test",
  city: "istanbul",
};

describe("listings", () => {
  const db = (env as unknown as { DB: D1Database }).DB;
  let sellerToken: string;
  let adminToken: string;
  let otherToken: string;

  beforeAll(async () => {
    await applySchema(db);

    await createUser(db, "seller", { whatsapp: "5551112233", city: "istanbul" });
    await createUser(db, "other", { whatsapp: "5559998877" });
    await createAdminUser(db, "admin");
    await createCategory(db, "cat_test");

    sellerToken = await makeToken("seller");
    adminToken = await makeToken("admin");
    otherToken = await makeToken("other");
  });

  // -------------------------------------------------------------------------
  // POST /api/listings — create happy paths
  // -------------------------------------------------------------------------

  describe("POST /api/listings — happy paths", () => {
    it("item + offer + fixed + condition → 201", async () => {
      const res = await post(
        "/api/listings",
        { ...BASE_LISTING, listing_type: "item", direction: "offer", price_type: "fixed", price: 100, condition: "good" },
        sellerToken,
      );
      expect(res.status).toBe(201);
      const body = await res.json<{ data: { status: string } }>();
      expect(body.data.status).toBe("pending");
    });

    it("item + offer + negotiable + condition + meeting_type:from_seller → 201", async () => {
      const res = await post(
        "/api/listings",
        { ...BASE_LISTING, listing_type: "item", direction: "offer", price_type: "negotiable", price: 150, condition: "like_new", meeting_type: "from_seller" },
        sellerToken,
      );
      expect(res.status).toBe(201);
    });

    it("item + offer + free + condition + meeting_type:to_buyer → 201", async () => {
      const res = await post(
        "/api/listings",
        { ...BASE_LISTING, listing_type: "item", direction: "offer", price_type: "free", condition: "fair", meeting_type: "to_buyer" },
        sellerToken,
      );
      expect(res.status).toBe(201);
    });

    it("item + offer + trade + condition (no price) → 201", async () => {
      const res = await post(
        "/api/listings",
        { ...BASE_LISTING, listing_type: "item", direction: "offer", price_type: "trade", condition: "new" },
        sellerToken,
      );
      expect(res.status).toBe(201);
    });

    it("service + offer + fixed (no condition) → 201", async () => {
      const res = await post(
        "/api/listings",
        { ...BASE_LISTING, listing_type: "service", direction: "offer", price_type: "fixed", price: 200, meeting_type: "public" },
        sellerToken,
      );
      expect(res.status).toBe(201);
    });

    it("service + offer + negotiable (no condition) → 201", async () => {
      const res = await post(
        "/api/listings",
        { ...BASE_LISTING, listing_type: "service", direction: "offer", price_type: "negotiable", price: 300 },
        sellerToken,
      );
      expect(res.status).toBe(201);
    });

    it("service + offer + free (no condition, no price) → 201", async () => {
      const res = await post(
        "/api/listings",
        { ...BASE_LISTING, listing_type: "service", direction: "offer", price_type: "free", meeting_type: "from_seller" },
        sellerToken,
      );
      expect(res.status).toBe(201);
    });

    it("item + offer + fixed + all meeting_type:public → 201", async () => {
      const res = await post(
        "/api/listings",
        { ...BASE_LISTING, listing_type: "item", direction: "offer", price_type: "fixed", price: 50, condition: "good", meeting_type: "public" },
        sellerToken,
      );
      expect(res.status).toBe(201);
    });
  });

  // -------------------------------------------------------------------------
  // POST /api/listings — validation errors
  // -------------------------------------------------------------------------

  describe("POST /api/listings — validation errors", () => {
    it("item + offer + fixed, condition eksik → 400", async () => {
      const res = await post(
        "/api/listings",
        { ...BASE_LISTING, listing_type: "item", direction: "offer", price_type: "fixed", price: 100 },
        sellerToken,
      );
      expect(res.status).toBe(400);
    });

    it("item + offer + fixed, price eksik → 400", async () => {
      const res = await post(
        "/api/listings",
        { ...BASE_LISTING, listing_type: "item", direction: "offer", price_type: "fixed", condition: "good" },
        sellerToken,
      );
      expect(res.status).toBe(400);
    });

    it("item + offer + trade + condition eksik → 400", async () => {
      const res = await post(
        "/api/listings",
        { ...BASE_LISTING, listing_type: "item", direction: "offer", price_type: "trade" },
        sellerToken,
      );
      expect(res.status).toBe(400);
    });

    it("401 without token", async () => {
      const res = await SELF.fetch("http://localhost/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...BASE_LISTING, price_type: "fixed", price: 100, condition: "good" }),
      });
      expect(res.status).toBe(401);
    });
  });

  // -------------------------------------------------------------------------
  // PATCH /api/listings/:slug — update validation (free/trade + price)
  // -------------------------------------------------------------------------

  describe("PATCH /api/listings/:slug — update validation", () => {
    let createdSlug: string;

    beforeAll(async () => {
      const res = await post(
        "/api/listings",
        { ...BASE_LISTING, listing_type: "item", direction: "offer", price_type: "fixed", price: 200, condition: "good" },
        sellerToken,
      );
      const body = await res.json<{ data: { slug: string } }>();
      createdSlug = body.data.slug;
    });

    it("trade price_type ile price gönderilirse → 400", async () => {
      const res = await patch(
        `/api/listings/${createdSlug}`,
        { price_type: "trade", price: 100 },
        sellerToken,
      );
      expect(res.status).toBe(400);
    });

    it("free price_type ile price gönderilirse → 400", async () => {
      const res = await patch(
        `/api/listings/${createdSlug}`,
        { price_type: "free", price: 100 },
        sellerToken,
      );
      expect(res.status).toBe(400);
    });

    it("geçerli güncelleme → 200", async () => {
      const res = await patch(
        `/api/listings/${createdSlug}`,
        { price: 250 },
        sellerToken,
      );
      expect(res.status).toBe(200);
    });
  });

  // -------------------------------------------------------------------------
  // DELETE /api/listings/photos/temp — yeni endpoint
  // -------------------------------------------------------------------------

  describe("DELETE /api/listings/photos/temp", () => {
    it("geçerli temp key → 200", async () => {
      const res = await del(
        "/api/listings/photos/temp",
        { key: "temp/seller/photo.jpg" },
        sellerToken,
      );
      expect(res.status).toBe(200);
    });

    it("key eksik → 400", async () => {
      const res = await del("/api/listings/photos/temp", {}, sellerToken);
      expect(res.status).toBe(400);
      const body = await res.json<{ code: string }>();
      expect(body.code).toBe("MISSING_KEY");
    });

    it("başka user prefix'i → 403", async () => {
      const res = await del(
        "/api/listings/photos/temp",
        { key: "temp/seller/photo.jpg" },
        otherToken,
      );
      expect(res.status).toBe(403);
      const body = await res.json<{ code: string }>();
      expect(body.code).toBe("FORBIDDEN");
    });

    it("401 without token", async () => {
      const res = await SELF.fetch("http://localhost/api/listings/photos/temp", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "temp/seller/photo.jpg" }),
      });
      expect(res.status).toBe(401);
    });
  });

  // -------------------------------------------------------------------------
  // Admin moderation — PATCH /api/admin/listings/:slug/status
  // -------------------------------------------------------------------------

  describe("admin moderation", () => {
    const SLUG = "slug-mod-listing";

    beforeAll(async () => {
      await createListing(db, "mod-listing", "seller", "cat_test", {
        status: "pending",
      });
    });

    it("admin approve → active", async () => {
      const res = await patch(
        `/api/admin/listings/${SLUG}/status`,
        { status: "active" },
        adminToken,
      );
      expect(res.status).toBe(200);
      const body = await res.json<{ data: { status: string } }>();
      expect(body.data.status).toBe("active");
    });

    it("admin reject + reason → rejected", async () => {
      const res = await patch(
        `/api/admin/listings/${SLUG}/status`,
        { status: "rejected", reason: "Kural ihlali" },
        adminToken,
      );
      expect(res.status).toBe(200);
      const body = await res.json<{ data: { status: string; rejection_reason: string } }>();
      expect(body.data.status).toBe("rejected");
      expect(body.data.rejection_reason).toBe("Kural ihlali");
    });

    it("non-admin → 403", async () => {
      const res = await patch(
        `/api/admin/listings/${SLUG}/status`,
        { status: "active" },
        sellerToken,
      );
      expect(res.status).toBe(403);
    });

    it("401 without token", async () => {
      const res = await SELF.fetch(`http://localhost/api/admin/listings/${SLUG}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      expect(res.status).toBe(401);
    });
  });

  // -------------------------------------------------------------------------
  // handleError — bilinmeyen hata → structured 500 JSON
  // -------------------------------------------------------------------------

  describe("handleError", () => {
    it("geçersiz slug → 404 ile structured error JSON döner", async () => {
      const res = await SELF.fetch("http://localhost/api/listings/yoktur-bu-slug");
      expect(res.status).toBe(404);
      const body = await res.json<{ status: string; code: string }>();
      expect(body.status).toBe("error");
      expect(typeof body.code).toBe("string");
    });
  });
});

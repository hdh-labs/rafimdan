import { env, SELF } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import { applySchema } from "../helpers/schema";
import { makeToken, createUser, createCategory, createListing } from "../helpers/fixtures";

describe("favorites", () => {
  const db = (env as unknown as { DB: D1Database }).DB;

  beforeAll(async () => {
    await applySchema(db);
    await createUser(db, "user1");
    await createUser(db, "user2");
    const catId = await createCategory(db);
    await createListing(db, "listing1", "user1", catId);
    await createListing(db, "listing2", "user1", catId);
  });

  describe("GET /api/favorites", () => {
    it("returns empty list when user has no favorites", async () => {
      const token = await makeToken("user1");
      const res = await SELF.fetch("http://localhost/api/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body = await res.json<{ data: { listings: unknown[] }; status: string }>();
      expect(body.status).toBe("ok");
      expect(body.data.listings).toEqual([]);
    });

    it("returns 401 without token", async () => {
      const res = await SELF.fetch("http://localhost/api/favorites");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/favorites", () => {
    it("adds a listing to favorites", async () => {
      const token = await makeToken("user2");
      const res = await SELF.fetch("http://localhost/api/favorites", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: "listing1" }),
      });
      expect(res.status).toBe(201);

      const listRes = await SELF.fetch("http://localhost/api/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await listRes.json<{ data: { listings: Array<{ id: string }> } }>();
      expect(body.data.listings.map((l) => l.id)).toContain("listing1");
    });

    it("returns 409 if already favorited", async () => {
      const token = await makeToken("user2");

      await SELF.fetch("http://localhost/api/favorites", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: "listing1" }),
      });

      const res = await SELF.fetch("http://localhost/api/favorites", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: "listing1" }),
      });
      expect(res.status).toBe(409);
      const body = await res.json<{ code: string }>();
      expect(body.code).toBe("FAVORITE_ALREADY_EXISTS");
    });

    it("returns 404 for non-existent listing", async () => {
      const token = await makeToken("user2");
      const res = await SELF.fetch("http://localhost/api/favorites", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: "nonexistent" }),
      });
      expect(res.status).toBe(404);
    });

    it("returns 401 without token", async () => {
      const res = await SELF.fetch("http://localhost/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: "listing1" }),
      });
      expect(res.status).toBe(401);
    });
  });

  describe("DELETE /api/favorites/:listingId", () => {
    it("removes a listing from favorites", async () => {
      const token = await makeToken("user2");

      await SELF.fetch("http://localhost/api/favorites", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: "listing2" }),
      });

      const delRes = await SELF.fetch("http://localhost/api/favorites/listing2", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(delRes.status).toBe(200);

      const listRes = await SELF.fetch("http://localhost/api/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await listRes.json<{ data: { listings: Array<{ id: string }> } }>();
      expect(body.data.listings.map((l) => l.id)).not.toContain("listing2");
    });

    it("returns 200 even if listing was not favorited (idempotent)", async () => {
      const token = await makeToken("user2");
      const res = await SELF.fetch("http://localhost/api/favorites/nonexistent", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
    });

    it("returns 401 without token", async () => {
      const res = await SELF.fetch("http://localhost/api/favorites/listing1", {
        method: "DELETE",
      });
      expect(res.status).toBe(401);
    });
  });
});

import { env, SELF } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import { signAccessToken } from "../../src/lib/jwt";

const JWT_SECRET = "test-secret-32-characters-long!!";

// ---------------------------------------------------------------------------
// Schema setup
// ---------------------------------------------------------------------------

async function applySchema(db: D1Database): Promise<void> {
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id           TEXT PRIMARY KEY,
      google_id    TEXT UNIQUE NOT NULL,
      name         TEXT NOT NULL,
      display_name TEXT,
      avatar_url   TEXT,
      whatsapp     TEXT,
      city         TEXT,
      district     TEXT,
      slug         TEXT UNIQUE,
      is_active    INTEGER NOT NULL DEFAULT 1,
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS categories (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      slug       TEXT UNIQUE NOT NULL,
      parent_id  TEXT REFERENCES categories(id),
      sort_order INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS listings (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id),
      title       TEXT NOT NULL,
      description TEXT,
      category_id TEXT NOT NULL REFERENCES categories(id),
      condition   TEXT NOT NULL,
      price_type  TEXT NOT NULL,
      price       INTEGER,
      city        TEXT NOT NULL,
      district    TEXT,
      photos      TEXT NOT NULL DEFAULT '[]',
      status      TEXT NOT NULL DEFAULT 'active',
      slug        TEXT UNIQUE NOT NULL,
      view_count  INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS favorites (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, listing_id)
    )`,
  ];

  await db.batch(statements.map((sql) => db.prepare(sql)));
}

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------

async function createUser(
  db: D1Database,
  id: string,
  overrides: Partial<{ slug: string; email: string }> = {},
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO users (id, google_id, name, slug)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(id, `google_${id}`, `User ${id}`, overrides.slug ?? id)
    .run();
}

async function createCategory(db: D1Database): Promise<string> {
  const id = "cat_test";
  await db
    .prepare("INSERT OR IGNORE INTO categories (id, name, slug) VALUES (?, ?, ?)")
    .bind(id, "Test", "test")
    .run();
  return id;
}

async function createListing(
  db: D1Database,
  id: string,
  userId: string,
  categoryId: string,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO listings (id, user_id, title, category_id, condition, price_type, price, city, slug)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, userId, `Listing ${id}`, categoryId, "good", "fixed", 100, "istanbul", `slug-${id}`)
    .run();
}

async function makeToken(userId: string): Promise<string> {
  return signAccessToken({ sub: userId, email: `${userId}@test.com` }, JWT_SECRET);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

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
      const body = await res.json<{ data: { listing_ids: string[] }; status: string }>();
      expect(body.status).toBe("ok");
      expect(body.data.listing_ids).toEqual([]);
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
      const body = await listRes.json<{ data: { listing_ids: string[] } }>();
      expect(body.data.listing_ids).toContain("listing1");
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
      const body = await listRes.json<{ data: { listing_ids: string[] } }>();
      expect(body.data.listing_ids).not.toContain("listing2");
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

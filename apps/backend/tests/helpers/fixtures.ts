import type { D1Database } from "@cloudflare/workers-types";
import { signAccessToken } from "../../src/lib/jwt";

const JWT_SECRET = "test-secret-32-characters-long!!";

export async function makeToken(userId: string): Promise<string> {
  return signAccessToken({ sub: userId, email: `${userId}@test.com` }, JWT_SECRET);
}

export async function createUser(
  db: D1Database,
  id: string,
  overrides: Partial<{
    slug: string;
    whatsapp: string;
    city: string;
    is_admin: number;
    is_active: number;
  }> = {},
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO users (id, google_id, name, slug, whatsapp, city, is_admin, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      `google_${id}`,
      `User ${id}`,
      overrides.slug ?? id,
      overrides.whatsapp ?? "5551234567",
      overrides.city ?? "istanbul",
      overrides.is_admin ?? 0,
      overrides.is_active ?? 1,
    )
    .run();
}

export async function createAdminUser(db: D1Database, id: string): Promise<void> {
  return createUser(db, id, { slug: `admin-${id}`, is_admin: 1 });
}

export async function createCategory(db: D1Database, id = "cat_test"): Promise<string> {
  await db
    .prepare("INSERT OR IGNORE INTO categories (id, name, slug) VALUES (?, ?, ?)")
    .bind(id, "Elektronik", "elektronik")
    .run();
  return id;
}

export type CreateListingInput = {
  listing_type?: "item" | "service";
  direction?: "offer" | "request";
  condition?: "new" | "like_new" | "good" | "fair" | null;
  price_type?: "fixed" | "negotiable" | "free" | "trade";
  price?: number | null;
  city?: string;
  status?: "active" | "pending" | "rejected" | "sold";
  meeting_type?: "public" | "from_seller" | "to_buyer" | null;
  rejection_reason?: string | null;
  photos?: string;
};

export async function createListing(
  db: D1Database,
  id: string,
  userId: string,
  categoryId: string,
  overrides: CreateListingInput = {},
): Promise<void> {
  const {
    listing_type = "item",
    direction = "offer",
    condition = "good",
    price_type = "fixed",
    price = 100,
    city = "istanbul",
    status = "active",
    meeting_type = null,
    rejection_reason = null,
    photos = "[]",
  } = overrides;

  await db
    .prepare(
      `INSERT INTO listings
         (id, user_id, title, category_id, listing_type, direction, condition,
          price_type, price, city, status, meeting_type, rejection_reason, photos, slug)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      userId,
      `Test ilan ${id}`,
      categoryId,
      listing_type,
      direction,
      condition,
      price_type,
      price,
      city,
      status,
      meeting_type,
      rejection_reason,
      photos,
      `slug-${id}`,
    )
    .run();
}

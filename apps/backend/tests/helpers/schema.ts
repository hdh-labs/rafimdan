import type { D1Database } from "@cloudflare/workers-types";

export async function applySchema(db: D1Database): Promise<void> {
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
      bio          TEXT,
      slug         TEXT UNIQUE,
      is_active    INTEGER NOT NULL DEFAULT 1,
      is_admin     INTEGER NOT NULL DEFAULT 0,
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
      id               TEXT PRIMARY KEY,
      user_id          TEXT NOT NULL REFERENCES users(id),
      title            TEXT NOT NULL,
      description      TEXT,
      category_id      TEXT NOT NULL REFERENCES categories(id),
      listing_type     TEXT NOT NULL DEFAULT 'item'
                         CHECK(listing_type IN ('item','service')),
      direction        TEXT NOT NULL DEFAULT 'offer'
                         CHECK(direction IN ('offer','request')),
      condition        TEXT CHECK(condition IN ('new','like_new','good','fair')),
      price_type       TEXT NOT NULL
                         CHECK(price_type IN ('fixed','negotiable','free','trade')),
      price            INTEGER,
      city             TEXT NOT NULL,
      district         TEXT,
      photos           TEXT NOT NULL DEFAULT '[]',
      status           TEXT NOT NULL DEFAULT 'pending'
                         CHECK(status IN ('active','sold','pending','rejected')),
      rejection_reason TEXT,
      meeting_type     TEXT CHECK(meeting_type IN ('public','from_seller','to_buyer')),
      slug             TEXT UNIQUE NOT NULL,
      view_count       INTEGER NOT NULL DEFAULT 0,
      bumped_at        TEXT,
      created_at       TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS favorites (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, listing_id)
    )`,
    `CREATE TABLE IF NOT EXISTS admin_logs (
      id          TEXT PRIMARY KEY,
      admin_id    TEXT NOT NULL REFERENCES users(id),
      action      TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id   TEXT NOT NULL,
      meta        TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id           TEXT PRIMARY KEY,
      user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type         TEXT NOT NULL,
      entity_id    TEXT NOT NULL,
      entity_slug  TEXT NOT NULL,
      entity_title TEXT NOT NULL,
      read_at      TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS reports (
      id          TEXT PRIMARY KEY,
      listing_id  TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reason      TEXT NOT NULL,
      detail      TEXT,
      status      TEXT NOT NULL DEFAULT 'pending'
                    CHECK(status IN ('pending','resolved','dismissed')),
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(listing_id, reporter_id)
    )`,
    `CREATE TABLE IF NOT EXISTS listing_rate_limit (
      key          TEXT PRIMARY KEY,
      count        INTEGER NOT NULL DEFAULT 1,
      window_start TEXT    NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS auth_rate_limit (
      key          TEXT PRIMARY KEY,
      count        INTEGER NOT NULL DEFAULT 1,
      window_start TEXT    NOT NULL
    )`,
  ];

  await db.batch(statements.map((sql) => db.prepare(sql)));
}

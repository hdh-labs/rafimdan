-- Migration 0027: Add 'trade' to price_type, add meeting_type column
-- NOTE: SQLite auto-updates FK refs on RENAME, so favorites/reports are fixed in 0028.

PRAGMA foreign_keys=OFF;

ALTER TABLE listings RENAME TO listings_old;

CREATE TABLE listings (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL REFERENCES users(id),
  title            TEXT NOT NULL,
  description      TEXT,
  category_id      TEXT NOT NULL REFERENCES categories(id),
  listing_type     TEXT NOT NULL DEFAULT 'item'
                     CHECK(listing_type IN ('item','service')),
  condition        TEXT CHECK(condition IN ('new','like_new','good','fair')),
  price_type       TEXT NOT NULL CHECK(price_type IN ('fixed','negotiable','free','trade')),
  price            INTEGER,
  city             TEXT NOT NULL,
  district         TEXT,
  photos           TEXT NOT NULL DEFAULT '[]',
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK(status IN ('active','sold','pending','rejected')),
  direction        TEXT NOT NULL DEFAULT 'offer'
                     CHECK(direction IN ('offer','request')),
  rejection_reason TEXT,
  slug             TEXT UNIQUE NOT NULL,
  view_count       INTEGER NOT NULL DEFAULT 0,
  meeting_type     TEXT CHECK(meeting_type IN ('public','from_seller','to_buyer')),
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO listings
  (id, user_id, title, description, category_id, listing_type, condition,
   price_type, price, city, district, photos, status, direction,
   rejection_reason, slug, view_count, meeting_type, created_at, updated_at)
SELECT
  id, user_id, title, description, category_id, listing_type, condition,
  price_type, price, city, district, photos, status, direction,
  rejection_reason, slug, view_count, NULL, created_at, updated_at
FROM listings_old;

DROP TABLE listings_old;

CREATE INDEX idx_listings_user_id      ON listings(user_id);
CREATE INDEX idx_listings_category_id  ON listings(category_id);
CREATE INDEX idx_listings_location     ON listings(city, district);
CREATE INDEX idx_listings_status_date  ON listings(status, created_at DESC);
CREATE INDEX idx_listings_slug         ON listings(slug);
CREATE INDEX idx_listings_direction    ON listings(direction);
CREATE INDEX idx_listings_listing_type ON listings(listing_type);

PRAGMA foreign_keys=ON;

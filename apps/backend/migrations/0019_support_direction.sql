-- Migration 0019: Add 'support' to direction CHECK constraint

ALTER TABLE listings RENAME TO listings_old;

CREATE TABLE listings (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL REFERENCES users(id),
  title            TEXT NOT NULL,
  description      TEXT,
  category_id      TEXT NOT NULL REFERENCES categories(id),
  condition        TEXT NOT NULL CHECK(condition IN ('new','like_new','good','fair')),
  price_type       TEXT NOT NULL CHECK(price_type IN ('fixed','negotiable','free')),
  price            INTEGER,
  city             TEXT NOT NULL,
  district         TEXT,
  photos           TEXT NOT NULL DEFAULT '[]',
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK(status IN ('active','sold','pending','rejected')),
  direction        TEXT NOT NULL DEFAULT 'offer'
                     CHECK(direction IN ('offer','request','support')),
  rejection_reason TEXT,
  slug             TEXT UNIQUE NOT NULL,
  view_count       INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO listings
  (id, user_id, title, description, category_id, condition, price_type, price,
   city, district, photos, status, direction, rejection_reason, slug, view_count, created_at, updated_at)
SELECT
  id, user_id, title, description, category_id, condition, price_type, price,
  city, district, photos, status, direction, rejection_reason, slug, view_count, created_at, updated_at
FROM listings_old;

DROP TABLE listings_old;

CREATE INDEX idx_listings_user_id     ON listings(user_id);
CREATE INDEX idx_listings_category_id ON listings(category_id);
CREATE INDEX idx_listings_location    ON listings(city, district);
CREATE INDEX idx_listings_status_date ON listings(status, created_at DESC);
CREATE INDEX idx_listings_slug        ON listings(slug);
CREATE INDEX idx_listings_direction   ON listings(direction);

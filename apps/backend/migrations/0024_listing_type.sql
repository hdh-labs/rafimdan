-- Migration 0024: Add listing_type, make condition nullable, retire direction=support

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
  price_type       TEXT NOT NULL CHECK(price_type IN ('fixed','negotiable','free')),
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
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO listings
  (id, user_id, title, description, category_id, listing_type, condition,
   price_type, price, city, district, photos, status, direction,
   rejection_reason, slug, view_count, created_at, updated_at)
SELECT
  id, user_id, title, description, category_id,
  CASE WHEN direction = 'support' THEN 'service' ELSE 'item' END,
  CASE WHEN direction IN ('request', 'support') THEN NULL ELSE condition END,
  price_type, price, city, district, photos, status,
  CASE WHEN direction = 'support' THEN 'offer' ELSE direction END,
  rejection_reason, slug, view_count, created_at, updated_at
FROM listings_old;

DROP TABLE listings_old;

CREATE INDEX idx_listings_user_id      ON listings(user_id);
CREATE INDEX idx_listings_category_id  ON listings(category_id);
CREATE INDEX idx_listings_location     ON listings(city, district);
CREATE INDEX idx_listings_status_date  ON listings(status, created_at DESC);
CREATE INDEX idx_listings_slug         ON listings(slug);
CREATE INDEX idx_listings_direction    ON listings(direction);
CREATE INDEX idx_listings_listing_type ON listings(listing_type);

INSERT INTO categories (id, name, slug, sort_order) VALUES
  ('cat_hizmet', 'Hizmet', 'hizmet', 6);

INSERT INTO categories (id, name, slug, parent_id, sort_order) VALUES
  ('cat_hizmet_ozel_ders',    'Özel Ders',          'ozel-ders',    'cat_hizmet', 1),
  ('cat_hizmet_tasima',       'Taşıma & Nakliyat',  'tasima',       'cat_hizmet', 2),
  ('cat_hizmet_mentor',       'Mentörlük & Koçluk', 'mentorluk',    'cat_hizmet', 3),
  ('cat_hizmet_el_sanatlari', 'El Sanatları',       'el-sanatlari', 'cat_hizmet', 4),
  ('cat_hizmet_diger',        'Diğer Hizmet',       'diger-hizmet', 'cat_hizmet', 5);

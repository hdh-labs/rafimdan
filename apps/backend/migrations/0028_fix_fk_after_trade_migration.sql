-- Migration 0028: Fix FK references broken by listings table recreation in 0027
-- SQLite auto-updates FK references on RENAME, so favorites/reports pointed to listings_old

ALTER TABLE favorites RENAME TO favorites_old;

CREATE TABLE favorites (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, listing_id)
);

INSERT INTO favorites (id, user_id, listing_id, created_at)
SELECT id, user_id, listing_id, created_at FROM favorites_old;

DROP TABLE favorites_old;

CREATE INDEX idx_favorites_user_id    ON favorites(user_id);
CREATE INDEX idx_favorites_listing_id ON favorites(listing_id);

ALTER TABLE reports RENAME TO reports_old;

CREATE TABLE reports (
  id          TEXT PRIMARY KEY,
  listing_id  TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'resolved', 'dismissed')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(listing_id, reporter_id)
);

INSERT INTO reports (id, listing_id, reporter_id, reason, created_at)
SELECT id, listing_id, reporter_id, reason, created_at FROM reports_old;

DROP TABLE reports_old;

CREATE INDEX idx_reports_listing_id  ON reports(listing_id);
CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_status      ON reports(status);

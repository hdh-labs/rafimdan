CREATE TABLE favorites (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, listing_id)
);

CREATE INDEX idx_favorites_user_id    ON favorites(user_id);
CREATE INDEX idx_favorites_listing_id ON favorites(listing_id);

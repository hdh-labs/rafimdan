CREATE TABLE users (
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
);

CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_slug      ON users(slug);

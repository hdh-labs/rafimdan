-- Migration 0029: Auth endpoint rate limiting table

CREATE TABLE IF NOT EXISTS auth_rate_limit (
  key          TEXT PRIMARY KEY,
  count        INTEGER NOT NULL DEFAULT 1,
  window_start TEXT NOT NULL
);

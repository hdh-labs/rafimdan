CREATE TABLE IF NOT EXISTS listing_rate_limit (
  key          TEXT PRIMARY KEY,
  count        INTEGER NOT NULL DEFAULT 1,
  window_start TEXT    NOT NULL
);

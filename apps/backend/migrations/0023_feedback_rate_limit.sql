CREATE TABLE IF NOT EXISTS feedback_rate_limit (
  ip           TEXT    NOT NULL PRIMARY KEY,
  count        INTEGER NOT NULL DEFAULT 1,
  window_start TEXT    NOT NULL
);

CREATE TABLE notifications (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,
  entity_id    TEXT NOT NULL,
  entity_slug  TEXT NOT NULL,
  entity_title TEXT NOT NULL,
  read_at      TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_notifs_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifs_unread ON notifications(user_id, read_at);

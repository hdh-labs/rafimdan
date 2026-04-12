ALTER TABLE reports ADD COLUMN description TEXT;
ALTER TABLE reports ADD COLUMN status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'resolved', 'dismissed'));

CREATE INDEX idx_reports_status ON reports(status);

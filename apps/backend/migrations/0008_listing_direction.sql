-- Add direction column: 'offer' (default) or 'request' (destek arıyor)
ALTER TABLE listings ADD COLUMN direction TEXT NOT NULL DEFAULT 'offer';
CREATE INDEX idx_listings_direction ON listings(direction);

-- Rename sadaka → el_uzat in existing data
UPDATE listings SET price_type = 'el_uzat' WHERE price_type = 'sadaka';

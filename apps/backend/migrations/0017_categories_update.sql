-- Migration 0017: Add Spor main category, add İslami under Kitap, remove Tarih & Biyografi

-- Restore Spor main category
INSERT INTO categories (id, name, slug, sort_order)
VALUES ('cat_spor', 'Spor', 'spor', 5);

-- Add İslami subcategory under Kitap
INSERT INTO categories (id, name, slug, parent_id, sort_order)
VALUES ('cat_islami', 'İslami', 'islami', 'cat_kitap', 5);

-- Move Tarih & Biyografi listings to Diğer, then delete category
UPDATE listings SET category_id = 'cat_diger' WHERE category_id = 'cat_tarih';
DELETE FROM categories WHERE id = 'cat_tarih';

-- Spor ve Sanat & Tasarım kategorilerini kaldır
-- Bu kategorilerdeki ilanlar cat_diger'e taşınır
UPDATE listings SET category_id = 'cat_diger' WHERE category_id IN ('cat_spor', 'cat_sanat');

DELETE FROM categories WHERE id IN ('cat_spor', 'cat_sanat');

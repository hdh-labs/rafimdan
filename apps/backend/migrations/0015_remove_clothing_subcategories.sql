-- Giyim alt kategorileri kaldırıldı — Giyim ana kategori olarak yeterli
DELETE FROM categories WHERE id IN (
  'cat_giyim_kadin',
  'cat_giyim_erkek',
  'cat_giyim_cocuk',
  'cat_giyim_ayakkabi'
);

CREATE TABLE categories (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  slug       TEXT UNIQUE NOT NULL,
  parent_id  TEXT REFERENCES categories(id),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_categories_slug      ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- Seed: ana kategoriler
INSERT INTO categories (id, name, slug, sort_order) VALUES
  ('cat_kitap',      'Kitap',        'kitap',      1),
  ('cat_elektronik', 'Elektronik',   'elektronik', 2),
  ('cat_giyim',      'Giyim',        'giyim',      3),
  ('cat_ev',         'Ev & Yaşam',   'ev-yasam',   4),
  ('cat_spor',       'Spor',         'spor',       5),
  ('cat_diger',      'Diğer',        'diger',      99);

-- Seed: kitap alt kategorileri
INSERT INTO categories (id, name, slug, parent_id, sort_order) VALUES
  ('cat_roman',    'Roman',            'roman',           'cat_kitap', 1),
  ('cat_teknik',   'Teknik & Bilim',   'teknik-bilim',    'cat_kitap', 2),
  ('cat_cocuk',    'Çocuk',            'cocuk-kitaplari', 'cat_kitap', 3),
  ('cat_kisisel',  'Kişisel Gelişim',  'kisisel-gelisim', 'cat_kitap', 4),
  ('cat_tarih',    'Tarih & Biyografi','tarih-biyografi',  'cat_kitap', 5),
  ('cat_sanat',    'Sanat & Tasarım',  'sanat-tasarim',   'cat_kitap', 6);

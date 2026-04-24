-- ============================================================
-- Local seed: her ilan business case kombinasyonu için 1 örnek
-- Çalıştır: wrangler d1 execute rafimdan-db --local --file apps/backend/scripts/seed-local.sql
-- ============================================================

-- Test kullanıcısı (satıcı)
INSERT OR IGNORE INTO users (id, google_id, name, display_name, slug, whatsapp, city, district, is_active, is_admin)
VALUES
  ('seed-seller', 'google-seed-seller', 'Ahmet Yılmaz', 'Ahmet', 'ahmet-yilmaz', '5551234567', 'istanbul', 'Kadıköy', 1, 0),
  ('seed-admin',  'google-seed-admin',  'Admin Kullanıcı', NULL, 'site-admin', '5559876543', 'istanbul', NULL, 1, 1);

-- Kategori bul (zaten var olmalı)
-- Eğer yok ise Elektronik kategorisini al veya ilk kategoriyi kullan

-- ============================================================
-- İLAN KOMBİNASYONLARI
-- ============================================================

-- 1. item + offer + fixed + good + public
INSERT OR IGNORE INTO listings
  (id, user_id, title, description, category_id, listing_type, direction, condition, price_type, price, city, district, meeting_type, status, slug, photos)
SELECT
  'seed-item-fixed', 'seed-seller',
  'iPhone 13 Pro — Sabit Fiyatlı',
  'Kullanılmış, iyi durumda. Ekran çizik yok. Tüm aksesuarları tam.',
  id, 'item', 'offer', 'good', 'fixed', 4500, 'istanbul', 'Kadıköy', 'public', 'active',
  'test-iphone-13-pro', '[]'
FROM categories WHERE parent_id IS NOT NULL LIMIT 1;

-- 2. item + offer + negotiable + like_new + from_seller
INSERT OR IGNORE INTO listings
  (id, user_id, title, description, category_id, listing_type, direction, condition, price_type, price, city, district, meeting_type, status, slug, photos)
SELECT
  'seed-item-negotiable', 'seed-seller',
  'MacBook Air M1 — Pazarlığa Açık',
  'Az kullanılmış, şarj döngüsü 47. Orijinal kutusu var.',
  id, 'item', 'offer', 'like_new', 'negotiable', 12000, 'istanbul', 'Beşiktaş', 'from_seller', 'active',
  'test-macbook-air-m1', '[]'
FROM categories WHERE parent_id IS NOT NULL LIMIT 1;

-- 3. item + offer + free + fair + to_buyer
INSERT OR IGNORE INTO listings
  (id, user_id, title, description, category_id, listing_type, direction, condition, price_type, price, city, district, meeting_type, status, slug, photos)
SELECT
  'seed-item-free', 'seed-seller',
  'Eski Yazıcı — Ücretsiz Alabilirsiniz',
  'Çalışıyor ama artık kullanmıyorum. Alan götürsün.',
  id, 'item', 'offer', 'fair', 'free', NULL, 'istanbul', 'Ümraniye', 'to_buyer', 'active',
  'test-eski-yazici-ucretsiz', '[]'
FROM categories WHERE parent_id IS NOT NULL LIMIT 1;

-- 4. item + offer + trade + new + no meeting
INSERT OR IGNORE INTO listings
  (id, user_id, title, description, category_id, listing_type, direction, condition, price_type, price, city, district, meeting_type, status, slug, photos)
SELECT
  'seed-item-trade', 'seed-seller',
  'Yeni Bluetooth Kulaklık — Takas',
  'Hiç açılmamış, hediye geldi. PlayStation veya Xbox joystick ile takas yaparım.',
  id, 'item', 'offer', 'new', 'trade', NULL, 'istanbul', 'Şişli', NULL, 'active',
  'test-bluetooth-kulaklik-takas', '[]'
FROM categories WHERE parent_id IS NOT NULL LIMIT 1;

-- 5. service + offer + fixed + public
INSERT OR IGNORE INTO listings
  (id, user_id, title, description, category_id, listing_type, direction, condition, price_type, price, city, district, meeting_type, status, slug, photos)
SELECT
  'seed-service-fixed', 'seed-seller',
  'Web Tasarım Hizmetleri',
  'Nuxt, Vue ve Tailwind ile modern web siteleri yapıyorum. Freelance çalışıyorum.',
  id, 'service', 'offer', NULL, 'fixed', 2000, 'istanbul', NULL, 'public', 'active',
  'test-web-tasarim-hizmetleri', '[]'
FROM categories WHERE parent_id IS NOT NULL LIMIT 1;

-- 6. service + offer + negotiable + no meeting
INSERT OR IGNORE INTO listings
  (id, user_id, title, description, category_id, listing_type, direction, condition, price_type, price, city, district, meeting_type, status, slug, photos)
SELECT
  'seed-service-negotiable', 'seed-seller',
  'Matematik ve Fizik Özel Ders',
  'LGS ve YKS için özel ders. Haftada 2-3 saat. Fiyat görüşülür.',
  id, 'service', 'offer', NULL, 'negotiable', 400, 'istanbul', 'Maltepe', NULL, 'active',
  'test-matematik-fizik-ozel-ders', '[]'
FROM categories WHERE parent_id IS NOT NULL LIMIT 1;

-- 7. service + offer + free + from_seller
INSERT OR IGNORE INTO listings
  (id, user_id, title, description, category_id, listing_type, direction, condition, price_type, price, city, district, meeting_type, status, slug, photos)
SELECT
  'seed-service-free', 'seed-seller',
  'Ücretsiz CV Danışmanlığı',
  'İş arayanlara CV hazırlama ve düzenleme konusunda ücretsiz yardım ediyorum.',
  id, 'service', 'offer', NULL, 'free', NULL, 'istanbul', NULL, 'from_seller', 'active',
  'test-ucretsiz-cv-danismanligi', '[]'
FROM categories WHERE parent_id IS NOT NULL LIMIT 1;

-- 8. item + pending (moderasyon bekliyor)
INSERT OR IGNORE INTO listings
  (id, user_id, title, description, category_id, listing_type, direction, condition, price_type, price, city, district, meeting_type, status, slug, photos)
SELECT
  'seed-item-pending', 'seed-seller',
  'Bisiklet — İncelemede',
  'Şehir bisikleti, 21 vites. Zinciri yeni değiştirildi.',
  id, 'item', 'offer', 'good', 'fixed', 1800, 'istanbul', 'Bağcılar', 'public', 'pending',
  'test-bisiklet-incelemede', '[]'
FROM categories WHERE parent_id IS NOT NULL LIMIT 1;

-- 9. item + rejected (reddedilmiş)
INSERT OR IGNORE INTO listings
  (id, user_id, title, description, category_id, listing_type, direction, condition, price_type, price, city, district, meeting_type, status, rejection_reason, slug, photos)
SELECT
  'seed-item-rejected', 'seed-seller',
  'Laptop — Reddedilmiş İlan',
  'Test amaçlı reddedilmiş ilan.',
  id, 'item', 'offer', 'good', 'fixed', 8000, 'istanbul', NULL, NULL, 'rejected',
  'Fiyat bilgisi eksik veya yanıltıcı. Lütfen gerçek fiyatı belirtin.',
  'test-laptop-reddedilmis', '[]'
FROM categories WHERE parent_id IS NOT NULL LIMIT 1;

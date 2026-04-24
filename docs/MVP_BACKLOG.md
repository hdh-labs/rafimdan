# MVP Lansman Öncesi Backlog
> Oluşturulma: 2026-04-20 | Kaynak: Frontend, Security, Performance, Quality audit

**Önem seviyeleri:**
- `P0` — Lansman blocker. Çözülmeden deploy edilmez.
- `P1` — Lansman öncesi çözülmeli. Risk yüksek.
- `P2` — Lansman sonrası. Teknik borç veya iyileştirme.

---

## P0 — Lansman Blocker

| # | Alan | Sorun | Dosya:Satır |
|---|------|-------|------------|
| ✅ 1 | **Security** | Google OAuth `userInfo` response'u Zod veya explicit kontrol olmadan `as string` cast ediliyor. `id` veya `email` undefined gelirse null user kaydı oluşabilir. | `apps/backend/src/services/auth.service.ts:72-79` |
| ✅ 2 | **Frontend** | `apps/frontend/error.vue` yok. Sunucu hataları (5xx, ağ hatası) marka dışı Nuxt default sayfasına düşüyor. | `apps/frontend/` kökü |
| ✅ 3 | **Frontend** | `auth.ts` middleware `if (import.meta.server) return` ile SSR'ı tamamen atlıyor. Korunan sayfalar (`/ilan-ver`, `/ayarlar`, `/ilanlarim`, `/favoriler`) sunucuda render ediliyor, JS yüklenmeden içerik görünür. | `apps/frontend/middleware/auth.ts:2` |
| ✅ 4 | **Security** | Auth endpoint'lerinde (login, register, token refresh) rate limiting yok. Feedback route'unda var ancak kritik auth yolları açık. | `apps/backend/src/routes/auth.routes.ts` |

---

## P1 — Lansman Öncesi Çözülmeli

### Backend / Güvenlik

| # | Sorun | Dosya:Satır |
|---|-------|------------|
| ✅ 5 | `admin.ts` global `handleError` yerine yerel versiyon kullanıyor; `err.statusCode as 400` ile tüm hatalar 400 dönüyor. 403, 404, 409 gereken yerlerde yanlış HTTP kodu. | `apps/backend/src/routes/admin.ts:41-46` |
| ✅ 6 | `admin.ts` body'leri `c.req.json<T>()` ile alıyor ama Zod validation yok. Runtime'da tip garantisi yok. | `apps/backend/src/routes/admin.ts:87,219` |
| ✅ 7 | `notifications.ts` route'unda tek bir `try/catch` yok. DB hatası Hono'nun işlenmemiş exception mekanizmasına düşüyor. | `apps/backend/src/routes/notifications.ts:8-21` |
| ✅ 8 | Aktif ilanlar güncelleme sonrası moderasyona gitmiyor. `status === "active"` olan ilan başlık/fiyat değiştirerek admin incelemesinden geçmiyor. | `apps/backend/src/services/listing.service.ts:121-127` |
| ✅ 9 | Satılmış (`sold`) ilan düzenlenebilir. `update()` sadece sahiplik kontrolü yapıyor, `status !== "sold"` kontrolü yok. | `apps/backend/src/services/listing.service.ts:106-127` |
| ✅ 10 | Admin `sold` ilanı `active`'e çekebilir. `ALLOWED` status listesinde kısıtlama yok. | `apps/backend/src/routes/admin.ts:128-131` |
| ✅ 11 | `updateListingSchema`'da `price_type=free` iken `price` alanı sıfırlanmıyor — `createListingSchema`'daki `.refine()` koşulu `update`'te yok. | `apps/backend/src/schemas/listing.schemas.ts:37-49` |
| ⚠️ 12 | Production'da structured logging yok. `console.*` proje kuralı gereği atlandı — P2'ye taşındı. | Tüm backend |
| ✅ 13 | Error class mesajları İngilizce ve `handleError` bunları direkt response body'e yazıyor. Kullanıcıya "TokenExpiredError", "InvalidFileTypeError" gibi mesajlar görünüyor. | `apps/backend/src/errors/index.ts:14-100` |

### Frontend / UX

| # | Sorun | Dosya:Satır |
|---|-------|------------|
| ✅ 14 | `ilan-ver.vue` formun tamamı `<ClientOnly>` ile sarılı ve fallback slot yok. JS yüklenmezse sayfa tamamen boş. | `apps/frontend/pages/ilan-ver.vue:193` |
| ✅ 15 | `index.vue` `useFetch` hata durumu handle edilmiyor. API hatası ile boş durum ayrıştırılamıyor; "Henüz ilan yok" mesajı gösteriliyor. | `apps/frontend/pages/index.vue:8` |
| ✅ 16 | İlan detay: "Profili görüntüle" linki `seller.id` kullanıyor; profil sayfası `slug` bekliyor → sayfa yüklenemiyor. | `apps/frontend/pages/ilan/[slug]/index.vue:523` |
| ✅ 17 | `kategori/[slug].vue` ve çeşitli sayfalarda `useFetch` error binding alınmamış; API hatası sessizce boş state'e düşüyor. | `apps/frontend/pages/kategori/[slug].vue:11` |
| ✅ 18 | `ilanlarim.vue` delete confirm modal'ında focus trap yok. Escape key handler var ama focus yönetimi eksik. | `apps/frontend/pages/ilanlarim.vue:435` |
| ✅ 19 | `ilanlar/index.vue` filter drawer açılınca focus modal içine taşınmıyor. `aria-modal`, `role="dialog"` ve focus trap eksik. | `apps/frontend/pages/ilanlar/index.vue:129` |
| ✅ 20 | `ListingCard` FavoriteButton touch target 14px (WCAG min 44px). | `apps/frontend/components/ListingCard.vue:139` |
| ✅ 21 | Mobil sticky WhatsApp butonu `aria-label` yok — hangi ilan için olduğu ekran okuyucuya belirsiz. | `apps/frontend/pages/ilan/[slug]/index.vue:614` |
| ✅ 22 | `AppHeader.vue` ve `ilanlarim.vue` dropdown menülerinde `role="menu"` var ama item'larda `role="menuitem"` yok. WAI-ARIA pattern eksik. | `apps/frontend/components/AppHeader.vue:174`, `pages/ilanlarim.vue:346` |
| ✅ 23 | `ilanlar/[city].vue` filtre select elementlerinde `<label>` yok. Ekran okuyucu için isimsiz alanlar. | `apps/frontend/pages/ilanlar/[city].vue:99-131` |

---

## P2 — Lansman Sonrası

### Backend

| # | Sorun | Dosya:Satır |
|---|-------|------------|
| 24 | `update()` + `moderate()` iki ayrı DB write; D1'de transaction yok. `update` başarılı, `moderate` başarısız olursa ilan `rejected` kalır. | `apps/backend/src/services/listing.service.ts:122-126` |
| 25 | Refresh cooldown `updated_at` bazlı. Normal güncelleme sonrası 24 saat yenileme yapılamıyor. Ayrı `last_refreshed_at` kolonu gerekiyor. | `apps/backend/src/services/listing.service.ts:237-239` |
| 26 | WhatsApp numarası normalize edilmiyor. `05551234567` ve `+905551234567` farklı kayıtlar olarak saklanabilir. | `apps/backend/src/schemas/auth.schemas.ts:7` |
| 27 | Avatar eski key silme `void` ile fire-and-forget. R2'de orphan dosyalar birikebilir. | `apps/backend/src/routes/auth.ts:217` |
| 28 | `stale` favorite kayıtları temizlenmiyor. Pending/rejected olan ilanlar favori listesinden sessizce kayboluyor ama DB kaydı kalmaya devam ediyor. | `apps/backend/src/services/favorite.service.ts:17-19` |
| 29 | `is_admin` ve `is_active` kolonları için `CHECK(value IN (0,1))` constraint yok. Herhangi bir integer yazılabilir. | `apps/backend/migrations/0009_admin.sql` |
| 30 | `userRepository.deleteById()` R2 cleanup yapmıyor. Şu an sadece `auth.service` çağırıyor (güvenli) ama güvensiz tasarım. | `apps/backend/src/repositories/user.repository.ts:87-90` |
| 31 | `direction` hardcoded `"offer"` — "Arıyorum" ilanı oluşturma akışı frontend'de desteklenmiyor. Backend hazır. | `apps/frontend/pages/ilan-ver.vue:145` |

### Frontend

| # | Sorun | Dosya:Satır |
|---|-------|------------|
| 32 | İlan fotoğrafları `<img>` tag ile render ediliyor; `<NuxtImg>` yok. WebP dönüşümü, responsive srcset, lazy loading eksik. | `pages/ilan/[slug]/index.vue:415`, `components/ListingCard.vue` |
| 33 | `index.vue` `pending` binding alınmamış. Yüklenme sırasında listing grid boş, kategoriler yükleniyor → CLS riski. | `apps/frontend/pages/index.vue:8` |
| 34 | `profil/[slug].vue` loading skeleton yok. Client-side navigasyonda içerik flash'ı oluşuyor. | `apps/frontend/pages/profil/[slug].vue:16` |
| 35 | `ilanlar/[city].vue` geçersiz şehir slug'ı için 404 fırlatılmıyor. `/ilanlar/asdfasdf` geçerli sayfa gibi görünüyor. | `apps/frontend/pages/ilanlar/[city].vue:12` |
| 36 | `duzenle.vue` `ssr: false` nedeniyle cold render gecikme yaşanıyor. Mobil bağlantılarda belirgin. | `apps/frontend/pages/ilan/[slug]/duzenle.vue:18` |
| 37 | `Button.vue` loading state'inde `aria-busy="true"` set edilmiyor. | `apps/frontend/components/ui/Button.vue:53` |
| 38 | İlan detay thumbnail strip `overflow-x-auto` ama scroll indicator yok. Mobilde dışarı taşan thumbnail'lar görünmüyor. | `apps/frontend/pages/ilan/[slug]/index.vue:405` |
| 39 | `useEagerPhotoUpload.ts` DELETE çağrıları `void` ile fire-and-forget; hata durumunda kullanıcı bilgilendirilmiyor. | `apps/frontend/composables/useEagerPhotoUpload.ts:82,103` |
| 40 | Sıfır test coverage. Kritik iş mantığı (durum geçişleri, favori idempotency, token rotation) test edilmemiş. | Tüm proje |

---

## Öncelik Özeti

| Seviye | Adet | Bu Pazar (lansmanа kadar) |
|--------|------|--------------------------|
| P0 | 4 | Hepsi çözülmeli |
| P1 | 19 | Hepsi çözülmeli |
| P2 | 17 | Sonraya bırakılabilir |

**Kritik yol:** P0 #1 (Google auth null user) → P0 #4 (rate limiting) → P1 #5 (admin 400 bug) → P1 #8 (aktif ilan moderasyon bypass) sıralamasıyla başlanması önerilir.

---

## 2026-04-24 Kapsamlı Audit — Yeni Bulgular

> 5 alan audit: Frontend · Backend · Security · Performance · Quality  
> Mail entegrasyonu kapsam dışı.

### 🔴 Yeni Launch Blocker

| ID | Alan | Dosya | Sorun |
|----|------|-------|-------|
| A-1 | Security | `src/lib/image-validation.ts` | `isGif` branch magic byte'ı `true` döndürüyor ama ALLOWED_TYPES'ta `image/gif` yok — polyglot dosya upload |
| A-2 | Security | `src/routes/listings.ts:38` | `POST /listings` (ilan oluştur) rate limit yok — spam/abuse |
| A-3 | Security | `src/routes/listings.ts:53` | `POST /listings/photos/temp` rate limit yok — R2 storage bomb |
| A-4 | Security | `src/repositories/listing.repository.ts:88` | `toDetail()` response'da `seller.whatsapp` anonim kullanıcıya açık |
| A-5 | Security | `src/routes/listings.ts:296` | `POST /:slug/report` Zod schema yok — ham JSON parse, geçersiz reason DB'ye yazılıyor |
| A-6 | Backend | `src/routes/admin.ts:119` | Admin `page`/`limit` `Number()` parse — NaN olunca DB query bozuluyor |
| A-7 | Backend | `src/routes/feedback.ts` | `POST /feedback/attachments` try/catch yok, handleError kullanılmıyor — AppError 500 |
| A-8 | Frontend | `pages/ilanlar/index.vue:16` | API fetch error state yok — sessiz boş grid |
| A-9 | Frontend | `pages/ilanlar/[city].vue:26` | Aynı — API hatasında sessiz boş sayfa |
| A-10 | Frontend | `pages/ilan/[slug]/index.vue:143` | JSON-LD `price: 0` free/trade ilanlar için — Google'a yanlış Product schema |
| A-11 | Frontend | `pages/ilan/[slug]/duzenle.vue:169` | Edit form'da önceki validasyon hataları temizlenmiyor |

### 🟠 Yeni Yüksek Öncelik

| ID | Alan | Dosya | Sorun |
|----|------|-------|-------|
| B-1 | Security | `src/routes/listings.ts:227` | Photo reorder: gelen URL'lerin mevcut `listing.photos`'a ait olduğu doğrulanmıyor |
| B-2 | Security | `src/routes/admin.ts:86` | Admin `statusFilter` Zod validation yok — geçersiz string servis katmanına ulaşıyor |
| B-3 | Security | `src/lib/rate-limit.ts:16` | SELECT+UPDATE iki ayrı sorgu — race condition (TOCTOU) |
| B-4 | Quality | `src/schemas/listing.schemas.ts` + `src/routes/admin.ts:47` | `adminModerateSchema` ile route-local `moderateListingSchema` farklı status setleri — dead export, tutarsızlık |
| B-5 | Quality | `src/services/listing.service.ts:214` | `deletePhoto` geçersiz index → `ListingNotFoundError` (yanlış semantic; 400 olmalı) |
| B-6 | Quality | `src/lib/handle-error.ts:7` | `err.statusCode as 400` type cast — Hono `StatusCode` tipi kullanılmalı |
| B-7 | Quality | `src/routes/listings.ts:71` + `src/services/listing.service.ts:27` | `MAX_FILE_SIZE`/`ALLOWED_TYPES` iki yerde tanımlı |
| B-8 | SEO | `pages/ilanlar/[city].vue:78` | `ogTitle`, `ogImage`, `ogUrl` eksik |
| B-9 | SEO | `pages/kategori/[slug].vue:46` | `ogTitle`, `ogImage`, `ogUrl` eksik |
| B-10 | SEO | `pages/profil/[slug].vue:49` | `ogImage`, `ogUrl` eksik |
| B-11 | SEO | `pages/ilan/[slug]/index.vue:55` | `ogDescription` yoksa boş — fallback dinamik açıklama üret |

### 🟡 Yeni Orta Öncelik

| ID | Alan | Sorun |
|----|------|-------|
| C-1 | Backend | `findAllAdmin` — `db.batch()` kullanmıyor, iki ayrı roundtrip |
| C-2 | Backend | `notifications` tablosunda `type` kolonu CHECK constraint yok |
| C-3 | Backend | `POST /favorites` rate limit yok — notification flood riski |
| C-4 | Perf | `GET /api/listings` ve `GET /api/listings/:slug` — Cache-Control header yok; CF edge cache'e girmiyor |
| C-5 | Perf | `sitemap.xml.ts` — her request'te full backend fetch, cache yok |
| C-6 | Frontend | `pages/ilan-ver.vue:499` — fotoğraf `input[type=file]` aria-label eksik |
| C-7 | Frontend | `components/AppHeader.vue:171` — header dropdown Tab focus trap eksik |
| C-8 | Frontend | `pages/ilan/[slug]/index.vue:633` — report modal'da `textarea` Tab geziniminde atlanıyor |
| C-9 | Frontend | `pages/ilan-ver.vue:415` — foto thumbnail rotate/sil butonları 20px (WCAG min 44px) |
| C-10 | Frontend | `components/ListingCard.vue:80` — above-the-fold kartlar için `loading="eager"` eksik |
| C-11 | Frontend | `error.vue` — 401/403/429/500 hepsi aynı mesajı gösteriyor |
| C-12 | Quality | `useEagerPhotoUpload.ts` + `useListingPhotos.ts` — `MAX_PHOTO_SIZE`/`MAX_PHOTOS` her iki dosyada ayrı tanımlı |
| C-13 | Quality | Auth route'larında sıfır test coverage (refresh, me, avatar, delete) |
| C-14 | Quality | `POST /:slug/photos` photo upload endpoint test edilmemiş |
| C-15 | Quality | `GET /api/listings` query param filtreleme testleri yok |

# Rafımdan — Product Requirements Document

**Versiyon:** 1.0
**Tarih:** 2026-04-05
**Durum:** MVP Geliştirme

---

## 1. Vizyon ve Amaç

Rafımdan, aynı şehir veya mahallede yaşayan insanların ikinci el eşyalarını kargosuz, yüz yüze buluşarak alıp sattığı hiperlokal bir pazar yeridir.

### Problem
- Mevcut platformlar (Letgo, Sahibinden) kargo odaklı → güvensiz, maliyetli
- Yerel alışveriş için özel bir platform yok
- WhatsApp grupları organize değil, aranabilir değil
- Kitap gibi düşük değerli ürünler için kargo mantıksız

### Çözüm
Konum bazlı ilan sistemi. Satıcı ve alıcı aynı semtte → WhatsApp üzerinden buluşma → nakit ödeme. Platform sadece aracı.

---

## 2. Hedef Kitle

| Segment | Tanım | İhtiyaç |
|---------|-------|---------|
| Kitap satıcısı | Okuduğu kitapları satan öğrenci/genç | Hızlı, kargosuz satış |
| Taşınan ev | Eşyalarını bırakan kişi | Çabuk elden çıkarma |
| Alıcı | Yakınında ucuz eşya arayan | Güvenilir, yakın ilan |
| Koleksiyoncu | Özel kategori arayan | Filtreli arama |

---

## 3. MVP Kapsamı

### Olan
- Google OAuth (tek provider)
- İlan oluşturma (başlık, açıklama, kategori, durum, fiyat tipi, konum, fotoğraf)
- İlan listeleme (filtreli, sayfalı)
- İlan detay (fotoğraf galerisi, WhatsApp CTA)
- Satıcı profili (aktif ilanlar)
- Kategori ağacı
- R2 fotoğraf yükleme (max 6 foto, 5MB, jpeg/png/webp)

### Yok (MVP'de kasıtlı)
- Mesajlaşma → WhatsApp'a delege edildi
- Online ödeme → nakit/havale, platform dışı
- Açık artırma, takas
- Email bildirimleri
- Harita entegrasyonu
- Admin paneli

---

## 4. Veri Modeli

```
users          → Google OAuth, slug, whatsapp, şehir/ilçe
refresh_tokens → Güvenli token rotation
categories     → Ana + alt kategori ağacı (seed data)
listings       → İlan (photos JSON array, slug unique)
```

### Kategori Seed'i
```
Kitap (ana)
  ├── Roman
  ├── Teknik & Bilim
  ├── Çocuk
  ├── Kişisel Gelişim
  └── Tarih & Biyografi
Elektronik
Giyim
Ev & Yaşam
Diğer
```

### İlan Durumları
- `active` → yayında
- `reserved` → rezerve (alıcı bekleniyor)
- `sold` → satıldı

### Fiyat Tipleri
- `fixed` → sabit fiyat
- `negotiable` → pazarlığa açık
- `free` → ücretsiz

---

## 5. Kullanıcı Akışları

### 5.1 Google ile Giriş
```
/giris → Google OAuth → /api/auth/google
  → Google → /api/auth/google/callback
  → /auth/callback#access_token=xxx
  → Token store'a yazılır → / redirect
```

### 5.2 İlan Ver
```
/ilan-ver (auth required)
  → Form doldur (başlık, kategori, durum, fiyat, konum)
  → POST /api/listings → slug oluşturulur
  → Fotoğraf yükle → POST /api/listings/:slug/photos
  → /ilan/:slug yönlendirme
```

### 5.3 İlan Bul & Satıcıya Ulaş
```
/ veya /ilanlar
  → Filtrele (şehir, kategori, fiyat tipi)
  → /ilan/:slug
  → "WhatsApp'tan Yaz" → wa.me/:phone?text=...
```

---

## 6. Sayfa Listesi

| Sayfa | Route | SSR | Auth |
|-------|-------|-----|------|
| Ana Sayfa | `/` | ✅ | — |
| İlan Listesi | `/ilanlar` | ✅ | — |
| İlan Detay | `/ilan/[slug]` | ✅ | — |
| Satıcı Profili | `/profil/[slug]` | ✅ | — |
| Giriş | `/giris` | ❌ | — |
| OAuth Callback | `/auth/callback` | ❌ | — |
| İlan Ver | `/ilan-ver` | ❌ | ✅ |
| İlan Düzenle | `/ilan/[slug]/duzenle` | ❌ | ✅ owner |
| Ayarlar | `/ayarlar` | ❌ | ✅ |

---

## 7. Başarı Metrikleri (MVP)

| Metrik | Hedef (1 ay) |
|--------|-------------|
| Kayıtlı kullanıcı | 100 |
| Aktif ilan | 200 |
| WhatsApp tıklaması | 50/gün |
| Geri dönen kullanıcı | %30 haftalık |

---

## 8. Roadmap

```
MVP (Phase 1-8) ← şu an buradayız
  ✅ Monorepo + shared types
  ✅ Google OAuth + D1 migrations
  ✅ Categories + Listings CRUD + R2
  ✅ Frontend auth + layout + ana sayfa
  ✅ İlan listesi + detay + WhatsApp CTA
  — İlan ver + düzenle + ayarlar (Phase 6)
  — SEO sayfaları + sitemap (Phase 7)
  — CI/CD deploy (Phase 8)

v1.1
  — Favoriler (liste kaydetme)
  — İlan bildirimi (yeni ilan uyarısı)
  — Şehir/semt otomatik tamamlama
  — Admin moderasyon paneli

v2.0
  — In-app teklif sistemi
  — Kullanıcı yorumları/güven puanı
  — Mobile app (React Native)
```

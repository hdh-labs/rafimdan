# Rafımdan

> Hiperlokal ikinci el pazar yeri. Kargo yok, yüz yüze buluşma.

Rafımdan, aynı şehirde yaşayan insanların eşyalarını satmasını, ücretsiz vermesini veya topluluktan destek istemesini sağlar. Basit, hızlı, güvenli.

---

## Özellikler

**İlan Akışı**
- Sat / Ver, Destek İste, Destek Sun — üç farklı ilan tipi
- Çoklu fotoğraf yükleme (eager upload, sürükle-sırala, max 6)
- Kategori, şehir ve ilçe bazlı filtreleme
- Sıralama: En Yeni / En Popüler
- Benzer ilanlar

**Kullanıcı**
- Google OAuth ile tek tıkla giriş
- Profil sayfası: biyografi, şehir, WhatsApp butonu
- Avatar yükleme
- İlanlarımda inline fiyat düzenleme
- Hesap silme

**İletişim**
- WhatsApp'tan Yaz butonu — satıcıyla direkt mesajlaşma
- İlan bildir

**Admin**
- İlan moderasyonu (onayla / reddet)
- Kullanıcı yönetimi (ban / admin yetki)
- İstatistik paneli, işlem logları

**SEO & Teknik**
- Nuxt 3 SSR — her ilan sayfası server-side render
- Sitemap, robots.txt, JSON-LD structured data
- CI/CD: `main` → otomatik deploy

---

## Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Nuxt 3 SSR — Cloudflare Pages |
| Backend | Hono — Cloudflare Workers |
| Veritabanı | Cloudflare D1 (SQLite) |
| Depolama | Cloudflare R2 |
| Auth | Google OAuth 2.0 + JWT + httpOnly refresh token |
| Monorepo | pnpm workspaces |

---

## Geliştirme

```bash
# Bağımlılıkları kur
pnpm install

# Backend (localhost:8787)
pnpm --filter @rafimdan/backend run dev

# Frontend (localhost:3000)
pnpm --filter @rafimdan/frontend run dev

# Local migration
pnpm --filter @rafimdan/backend run db:migrate:local
```

---

## Deploy

`main` branch'e push edildiğinde GitHub Actions otomatik deploy eder.

| Uygulama | Platform | URL |
|----------|----------|-----|
| Frontend | Cloudflare Pages | `rafimdan.com` |
| Backend | Cloudflare Workers | `api.rafimdan.com` |

---

## Proje Yapısı

```
apps/
├── backend/
│   ├── src/
│   │   ├── routes/        HTTP handler'lar
│   │   ├── services/      İş mantığı
│   │   ├── repositories/  DB sorguları
│   │   ├── middleware/    Auth, CORS
│   │   ├── schemas/       Zod validasyon şemaları
│   │   └── lib/           JWT, slug, storage helpers
│   └── migrations/        D1 SQL migration'ları
├── frontend/
│   ├── pages/             Sayfa bileşenleri (file-based routing)
│   ├── components/        UI bileşenleri
│   ├── composables/       useEagerPhotoUpload, useListingPhotos
│   ├── stores/            Pinia store'ları (auth)
│   └── utils/             API client, Turkey locations
└── shared/
    └── src/types/         Ortak TypeScript tipleri
```

---

## Ortam Değişkenleri

### Backend — `apps/backend/.dev.vars`

| Değişken | Açıklama |
|----------|----------|
| `JWT_SECRET` | JWT imzalama anahtarı |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `CORS_ORIGIN` | İzin verilen origin (örn: `http://localhost:3000`) |
| `STORAGE_PUBLIC_URL` | R2 public bucket URL |
| `ADMIN_API_KEY` | Admin panel erişim anahtarı |
| `GITHUB_TOKEN` | Feedback issue açmak için GitHub token |

### Frontend — Nuxt runtime config

| Değişken | Açıklama |
|----------|----------|
| `NUXT_PUBLIC_API_BASE` | Public API URL (prod: `https://api.rafimdan.com`) |
| `NUXT_PUBLIC_SITE_URL` | Site URL (prod: `https://rafimdan.com`) |
| `NUXT_BACKEND_URL` | Server-side proxy hedefi |

# Rafimdan

Hiperlokal ikinci el pazar yeri. Kargo yok, yüz yüze buluşma.

## Stack

- **Frontend:** Nuxt 3 SSR — Cloudflare Pages
- **Backend:** Hono — Cloudflare Workers
- **DB:** Cloudflare D1 (SQLite)
- **Storage:** Cloudflare R2
- **Monorepo:** pnpm workspaces

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

## Deploy

`main` branch'e push → GitHub Actions otomatik deploy eder.

- **Frontend** → Cloudflare Pages (`rafimdan.com`)
- **Backend** → Cloudflare Workers (`api.rafimdan.com`)

## Proje Yapısı

```
apps/
  backend/          Hono API
    src/
      routes/       HTTP route handler'ları
      services/     İş mantığı
      repositories/ DB sorguları
      middleware/   Auth, CORS
    migrations/     D1 SQL migration'ları
  frontend/         Nuxt 3
    pages/          Sayfa bileşenleri
    components/     UI bileşenleri
    server/api/     Backend proxy
    utils/          API client, helpers
  shared/           Ortak TypeScript tipleri
```

## Özellikler

- Google OAuth ile giriş
- İlan ver, düzenle, sil
- Fotoğraf yükleme (R2)
- Favoriler
- WhatsApp ile satıcıya ulaş
- İlan bildir / Admin panel (`/admin`)
- SEO: sitemap, robots.txt, JSON-LD
- Kategori ve şehir bazlı filtreleme

## Ortam Değişkenleri

### Backend (`apps/backend/.dev.vars`)

| Değişken | Açıklama |
|----------|----------|
| `JWT_SECRET` | JWT imzalama anahtarı |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `CORS_ORIGIN` | İzin verilen origin (`http://localhost:3000`) |
| `STORAGE_PUBLIC_URL` | R2 public URL |
| `ADMIN_API_KEY` | Admin panel erişim anahtarı |

### Frontend

| Değişken | Açıklama |
|----------|----------|
| `NUXT_PUBLIC_API_BASE` | Public API URL (prod: `https://api.rafimdan.com`) |
| `NUXT_PUBLIC_SITE_URL` | Site URL (prod: `https://rafimdan.com`) |
| `NUXT_BACKEND_URL` | Server-side proxy hedefi (prod: `https://api.rafimdan.com`) |

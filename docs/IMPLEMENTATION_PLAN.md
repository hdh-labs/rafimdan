# Rafımdan — Implementation Plan (Claude Code Kılavuzu)

> Bu dosyayı her session başında oku. Mimari kararlar, kurallar ve phase durumu burada.

---

## Stack

| Katman | Teknoloji |
|--------|-----------|
| Monorepo | pnpm workspaces |
| Frontend | Nuxt 3 SSR → Cloudflare Pages |
| Backend | Hono.js → Cloudflare Workers |
| Database | D1 (SQLite) — raw SQL, migration tabanlı |
| Storage | Cloudflare R2 |
| Auth | Google OAuth (manuel, jose JWT) |
| UI | Tailwind CSS v4 + Lucide Vue Next |
| Validasyon | Zod |
| Test | Vitest + @cloudflare/vitest-pool-workers |

---

## Dizin Yapısı

```
rafimdan/
├── apps/
│   ├── backend/          @rafimdan/backend  (port 8787)
│   │   ├── migrations/   0001_*.sql  0002_*.sql  ...
│   │   ├── src/
│   │   │   ├── errors/       AppError + domain subclass'ları
│   │   │   ├── lib/          jwt.ts  crypto.ts  slug.ts
│   │   │   ├── middleware/   auth.ts  cors.ts
│   │   │   ├── repositories/ *.repository.ts
│   │   │   ├── routes/       *.ts
│   │   │   ├── schemas/      *.schemas.ts (Zod)
│   │   │   ├── services/     *.service.ts
│   │   │   └── types/        env.ts
│   │   └── tests/
│   ├── frontend/         @rafimdan/frontend (port 3000)
│   │   ├── components/   UI bileşenleri
│   │   ├── layouts/      default.vue
│   │   ├── middleware/   auth.ts
│   │   ├── pages/        route tabanlı sayfalar
│   │   ├── stores/       Pinia store'ları
│   │   └── utils/        api.ts  cn.ts
│   └── shared/           @rafimdan/shared (tipler)
│       └── src/types/    api.ts  auth.ts  listing.ts  category.ts  common.ts
├── docs/
│   ├── PRODUCT_PLAN.md
│   └── IMPLEMENTATION_PLAN.md  ← bu dosya
└── CLAUDE.md
```

---

## Mimari Kurallar

### Backend
- **Route → Service → Repository** — route asla `db.prepare()` çağırmaz
- **Response şekli:** `{ data: T, status: "ok" }` | `{ error: string, status: "error", code: string }`
- **Hata yönetimi:** `AppError` subclass'ları, route'da `handleError(c, err)` ile yakala
- **Validasyon:** tüm input `zValidator("json"|"query", schema)` ile — şemasız input yok
- **Migration dışında schema değişikliği yapma** — sadece `migrations/XXXX_*.sql`
- **Binding'ler:** `c.env.DB` (D1), `c.env.STORAGE` (R2)
- **ID üretimi:** `crypto.randomUUID()` — harici lib yok

### Frontend
- **SSR data:** `useFetch(() => url)` — reaktif URL için arrow function kullan
- **CSR mutations:** `apiFetch()` — 401 → otomatik refresh retry
- **Auth token:** `access_token` cookie (JS-readable, 15dk)
- **Store:** Pinia setup store (`defineStore('name', () => { ... })`)
- **Emoji yok** → Lucide Vue Next ikonlar
- **`cursor-pointer`** → Tailwind v4'te default değil, her tıklanabilir elemana ekle
- **Türkçe karakterler doğru yaz:** ş ç ğ ı ö ü İ Ğ Ş

### Genel
- TypeScript strict — `any` yok, `@ts-ignore` yok
- `console.*` production kodda yok
- Max 2 nesting level — early return pattern
- Fonksiyon max ~20 satır, dosya max ~250 satır
- Magic number yok — named constant kullan

---

## Dev Komutları

```bash
# Backend
cd apps/backend
pnpm run dev                           # wrangler dev → :8787
pnpm run typecheck                     # tsc --noEmit
pnpm run test                          # vitest
pnpm run db:migrate:local              # local D1'e migration uygula
pnpm run db:migrate:remote             # production D1'e migration uygula

# Frontend
cd apps/frontend
pnpm run dev                           # nuxt dev → :3000
pnpm run typecheck                     # nuxt typecheck

# Root
pnpm install                           # tüm workspace
pnpm --filter @rafimdan/backend run X  # spesifik package
```

---

## Ortam Değişkenleri

### `apps/backend/.dev.vars` (git'e girmesin)
```
JWT_SECRET=<min 32 char>
GOOGLE_CLIENT_ID=<google console>
GOOGLE_CLIENT_SECRET=<google console>
CORS_ORIGIN=http://localhost:3000
STORAGE_PUBLIC_URL=                    # boş bırakılabilir local'de
```

### Google Console'da kayıtlı olması gereken URI
```
http://localhost:8787/api/auth/google/callback   ← local dev
https://api.rafimdan.com/api/auth/google/callback ← production
```

---

## Phase Durumu

| Phase | Durum | İçerik |
|-------|-------|--------|
| 1 | ✅ Tamamlandı | Monorepo iskelet, shared types, backend scaffold |
| 2 | ✅ Tamamlandı | Google OAuth, JWT, D1 migrations (users, refresh_tokens) |
| 3 | ✅ Tamamlandı | Categories + Listings CRUD, R2 photo upload |
| 4 | ✅ Tamamlandı | Frontend: auth store, layout, AppHeader, ana sayfa |
| 5 | ✅ Tamamlandı | İlan listesi (filtreli), ilan detay, profil, WhatsApp CTA |
| 6 | ✅ Tamamlandı | İlan ver formu, ilan düzenle, ayarlar sayfası |
| 7 | ✅ Tamamlandı | SEO: şehir/kategori sayfaları, sitemap, JSON-LD |
| 8 | ✅ Tamamlandı | CI/CD: GitHub Actions → CF Workers + CF Pages |

---

## v1.1 Roadmap

| Özellik | Durum | Notlar |
|---------|-------|--------|
| Favoriler | ⏳ Sıradaki | DB: favorites tablosu, GET/POST/DELETE /api/favorites |
| İlan bildirimi | — | In-app: yeni ilan uyarısı (kategori/şehir bazlı) |
| Şehir otomatik tamamlama | — | Static Türkiye şehir listesi, kombo input |
| Admin moderasyon paneli | — | İlan onay/red, kullanıcı ban |

---

## v1.1 — Favoriler (Sıradaki)

**Hedef:** Kullanıcı ilanları favorilerine ekleyebiliyor, listesini görebiliyor.

### Backend

**Migration:** `0005_favorites.sql`
```sql
CREATE TABLE favorites (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, listing_id)
);
CREATE INDEX idx_favorites_user_id    ON favorites(user_id);
CREATE INDEX idx_favorites_listing_id ON favorites(listing_id);
```

**API endpoints:**
```
GET    /api/favorites           → [auth] kullanıcının favori ilanları (ListingListItem[])
POST   /api/favorites           → [auth] { listing_id } → favori ekle
DELETE /api/favorites/:listingId → [auth] favoriden çıkar
GET    /api/listings/:slug      → is_favorited alanı eklenir (auth opsiyonel)
```

**shared types'a ekle:**
```typescript
// listing.ts
ListingListItem.is_favorited?: boolean
```

### Frontend

**`pages/favoriler.vue`** (CSR, auth required)
- Favori ilan listesi — `ListingCard` grid
- Boş durum mesajı

**`components/FavoriteButton.vue`**
- Kalp ikonu (Lucide: `Heart`)
- Toggle: POST/DELETE /api/favorites
- İlan detay ve listede göster

---

## API Referansı

### Auth
```
GET  /api/auth/google              → Google OAuth redirect
GET  /api/auth/google/callback     → token set, frontend'e redirect
POST /api/auth/logout              → cookie temizle
POST /api/auth/refresh             → yeni token pair
GET  /api/auth/me                  → [auth] profil
PATCH /api/auth/me                 → [auth] profil güncelle
```

### Listings
```
GET    /api/listings               → filtreli liste (city, category, price_type, condition, q, page, limit)
POST   /api/listings               → [auth] ilan oluştur
GET    /api/listings/:slug         → detay (view_count++)
PATCH  /api/listings/:slug         → [auth] güncelle (owner)
DELETE /api/listings/:slug         → [auth] sil (owner)
PATCH  /api/listings/:slug/status  → [auth] durum değiştir
POST   /api/listings/:slug/photos  → [auth] fotoğraf yükle (multipart)
```

### Diğer
```
GET /api/categories                → CategoryTree[]
GET /api/users/:slug               → public profil + aktif ilanlar
GET /api/health                    → { status: "ok" }
```

---

## Kritik Tipler (shared)

```typescript
// api.ts
ApiResponse<T> = { data: T; status: "ok" }
PaginatedResponse<T> = { items: T[]; total: number; page: number; limit: number }

// listing.ts
ListingListItem  → liste görünümü (cover_photo, seller özet)
ListingDetail    → detay (photos[], seller.whatsapp dahil)

// auth.ts
UserProfile      → /api/auth/me response
AccessTokenPayload → { sub: string; email: string }
```

---

## Test Stratejisi

### Backend (öncelikli)
- `tests/routes/auth.test.ts` — OAuth flow, token refresh, 401 senaryoları
- `tests/routes/listings.test.ts` — CRUD, owner kontrolü, foto validasyon
- Pattern: gerçek D1 (mock değil), `getMiniflareBindings()` ile

### Frontend
- Pinia store unit testleri (auth store: login/logout/fetchMe)
- E2E (Phase 6 sonrası): login akışı + ilan oluşturma

---

## Anti-Pattern'lar

```
❌ Route içinde db.prepare() çağırma
❌ any tipi
❌ console.* production'da
❌ Zod şeması olmadan input kabul etme
❌ Migration dışında schema değişikliği
❌ Emoji kullanımı (UI'da Lucide ikon kullan)
❌ cursor-pointer'sız tıklanabilir element
❌ rm -rf onaysız
❌ Auto-commit (kullanıcı söylemedikçe commit atma)
```

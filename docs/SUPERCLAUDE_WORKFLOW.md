# SuperClaude ile Full-Stack Proje Playbook

> Bu belge Rafımdan projesinden çıkarılan derslerin birikimi.
> 60+ session ve ~85.000 token harcandı. Aynı sonuca ~10 promptla ulaşılabilirdi.
>
> **claude-mem gerektirmez.** Tüm komutlar `/sc:*` tabanlı.
> Yeni projeye başlarken bu belgeyi birebir uygula.

---

## Hızlı Araç Referansı

| Araç | Ne zaman kullan |
|------|----------------|
| `/sc:brainstorm` | Scope belirsiz, ne yapacağını netleştir |
| `/sc:design` | Mimari, API kontrat, DB şeması, env listesi |
| `/sc:workflow` | Adım adım implementation sırası çıkar |
| `/sc:implement x5` | Backend veya frontend — çoklu dosya |
| `/sc:implement x7` | Backend + frontend + shared birlikte |
| `/sc:analyze` | Deploy öncesi güvenlik + env + tip kontrolü |
| `/sc:troubleshoot` | Hata ayıklama — reaktif değil, sistematik |
| `/sc:improve` | Çalışan kodu refactor et |
| `/sc:git` | Conventional commit mesajı oluştur |

**Agent sayısı:**
```
1-2 dosya    → direkt prompt (agent yok)
Küçük feature    → x3
Sadece backend veya frontend → x5
İkisi + shared tipler  → x7
Major refactor/arch   → x10
```

---

## CLAUDE.md — Ne Zaman, Ne Yazar?

### Ne zaman oluştur?

**Faz 1'de, ilk commit'ten önce.** Repo açılır açılmaz iki dosya oluşur:
1. `CLAUDE.md` — kısa, sadece Claude'a yönelik
2. `docs/IMPLEMENTATION_PLAN.md` — detay, her session'da referans

CLAUDE.md'yi sonradan yazmak işe yaramaz — Claude her session'da bağlamı sıfırdan okur.
Baştan yazılmışsa sormadan bilir; sonradan yazılırsa eski hatalar tekrarlanır.

### Ne yazar?

CLAUDE.md şu soruları yanıtlar:
1. Bu proje ne? (1 cümle)
2. Stack nedir?
3. Dev nasıl başlatılır?
4. Hangi kurallar kesinlikle çiğnenmez?
5. Detay nerede? (docs/ linkler)

**Rafımdan CLAUDE.md (gerçek, çalışan örnek):**
```markdown
# Rafımdan — CLAUDE.md

> Mimari ve phase durumu: docs/IMPLEMENTATION_PLAN.md
> Ürün vizyonu: docs/PRODUCT_PLAN.md

## Özet

Hiperlokal ikinci el pazar yeri. Kargo yok, yüz yüze buluşma.
Stack: pnpm monorepo · Nuxt 3 SSR · Hono + CF Workers · D1 · R2

## Hızlı Başlangıç

pnpm --filter @rafimdan/backend run dev        # :8787
pnpm --filter @rafimdan/frontend run dev       # :3000
pnpm --filter @rafimdan/backend run db:migrate:local

## Kritik Kurallar

- Route → Service → Repository (route DB'ye doğrudan erişemez)
- any yok, console.* yok, emoji yok
- Her tıklanabilir elemana cursor-pointer
- Migration dışında schema değişikliği yapma
- Auto-commit yok
```

### CLAUDE.md şablonu (yeni proje):
```markdown
# [Proje Adı] — CLAUDE.md

> Detaylı mimari: docs/IMPLEMENTATION_PLAN.md
> Ürün vizyonu: docs/PRODUCT_PLAN.md

## Özet

[1 cümle açıklama]
Stack: [liste]

## Hızlı Başlangıç

[dev komutları]

## Kritik Kurallar

- [proje-spesifik kural 1]
- [proje-spesifik kural 2]
- Auto-commit yok
```

**Kural:** CLAUDE.md max 40 satır. Detay docs/'a gider.

---

## Faz 0 — Vision (Repo açmadan önce)

**Amaç:** MVP sınırlarını net çizmek. Yapılacaklar kadar yapılmayacakları da belirlemek.

**Komut:**
```
/sc:brainstorm

[Ürün açıklaması — 2-3 cümle]

Yanıtla:
- MVP kapsamı: olan vs kasıtlı olmayan
- En riskli 3 teknik varsayım
- Stack kararları: [tercihini yaz]
- Hangi kararları şimdi vermem gerekiyor, hangilerini erteleyebilirim?
```

**Rafımdan örneği — Brainstorm soruları:**
```
/sc:brainstorm

Hiperlokal ikinci el pazar yeri. Kargo yok, yüz yüze buluşma.
Satıcı-alıcı WhatsApp üzerinden buluşuyor. Stack: CF Workers + D1 + Nuxt 3.

- Mesajlaşma MVP'de olmalı mı?
- Konum: gerçek GPS mi, şehir/ilçe text field mi yeter?
- Auth: sadece Google mu?
- Admin paneli ne zaman?
```

**Rafımdan'da alınan kararlar (cevaplar):**
- Mesajlaşma yok → WhatsApp'a delege edildi (3 session tartışması önlendi)
- Şehir/ilçe text field yeterli → GPS entegrasyonu v2'ye atıldı
- Sadece Google OAuth → birden fazla provider karmaşıklığı önlendi
- Admin paneli v1.1 → MVP dışı kaldı

**Çıktı:** `docs/PRODUCT_PLAN.md` (max 150 satır, vizyon + kullanıcı akışları + veri modeli)

---

## Faz 1 — Mimari Tasarım

**Amaç:** Tek referans belge oluşturmak. Tüm fazlarda bu belge kullanılır.

**Komut:**
```
/sc:design

[Proje adı] için tam mimari.

Stack:
- [Backend teknolojileri]
- [Frontend teknolojileri]
- [DB, storage, auth]

Üret:
1. Dizin yapısı (tüm kritik dosyalar — lib/, middleware/, routes/, services/, repositories/)
2. Veri modeli (CREATE TABLE + index'ler + seed SQL)
3. API kontrat (her endpoint: method, path, auth?, request body, response shape)
4. Frontend route listesi (SSR mi / CSR mi / auth gerekli mi)
5. Shared TypeScript tipleri
6. Env değişkenleri: local vs prod ayrı ayrı
7. Anti-pattern listesi (bu projede yapılmaması gereken şeyler)

ZORUNLU — Prod/dev farkları bölümü:
- Cookie: local'de domain yok, prod'da .domain.com (noktalı!)
- CORS origin: local=http://localhost:3000, prod=https://domain.com
- OAuth redirect URI: local ve prod ikisi de — ikisini Google Console'a kaydetmem gerekecek
- CI/CD secrets: hangi secret nerede tanımlanacak (GitHub Secrets vs wrangler secret)
- Frontend build'e inject edilmesi gereken env vars
```

**Rafımdan örneği — Prod/dev farkları bölümünden:**

Bu bölüm yazılmadığı için 15 session harcandı. Şimdi üretilen çıktı:

```
Prod/dev farkları:

Cookie domain:
  local : domain belirtme (undefined)
  prod  : ".rafimdan.com" (nokta ile! yoksa sadece api.rafimdan.com okur)

CORS origin:
  local : "http://localhost:3000"
  prod  : "https://rafimdan.com"
  → CORS_ORIGIN env var'dan okunur, hardcode değil

OAuth redirect URI:
  local : http://localhost:8787/api/auth/google/callback
  prod  : https://api.rafimdan.com/api/auth/google/callback
  → Google Console'da HER İKİSİ de kayıtlı olmalı (bkz. Faz 3 — Google Cloud Console)

Frontend env:
  local : NUXT_PUBLIC_API_BASE=http://localhost:8787 (.env dosyasında)
  prod  : NUXT_PUBLIC_API_BASE=https://api.rafimdan.com (CI/CD workflow'da inject)
  → Bu inject edilmezse frontend production'da localhost:8787 çağırır!

CI/CD secrets (GitHub → repo Settings → Secrets):
  CLOUDFLARE_API_TOKEN
  CLOUDFLARE_ACCOUNT_ID
  JWT_SECRET
  GOOGLE_CLIENT_ID
  GOOGLE_CLIENT_SECRET
```

**Çıktı:** `docs/IMPLEMENTATION_PLAN.md`

---

## Faz 2 — Google Cloud Console Kurulumu

> **Bu adımı atlama.** OAuth kurulumu sonraya bırakılırsa production'da `redirect_uri_mismatch`
> hatası alırsın. Rafımdan'da bu hata 6 session harcattı.

### Adım adım:

**1. Proje oluştur:**
- console.cloud.google.com → "New Project" → isim ver

**2. OAuth consent screen:**
- APIs & Services → OAuth consent screen
- User Type: External
- App name, support email doldur
- Scopes: `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`
- Test users: kendi email'ini ekle (production'a açmadan önce test için)

**3. Credentials:**
- APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client IDs
- Application type: **Web application**
- Authorized redirect URIs — **İKİSİNİ DE ekle:**
  ```
  http://localhost:8787/api/auth/google/callback
  https://api.rafimdan.com/api/auth/google/callback
  ```
- Client ID ve Client Secret'ı kopyala → `.dev.vars`'a yaz

**4. `.dev.vars` (backend — git'e girmesin):**
```
JWT_SECRET=en-az-32-karakter-rastgele-string-buraya
GOOGLE_CLIENT_ID=1234567890-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
CORS_ORIGIN=http://localhost:3000
STORAGE_PUBLIC_URL=
```

### Rafımdan'da yaşanan hatalar ve çözümleri:

**Hata 1: `redirect_uri_mismatch`**
```
Error 400: redirect_uri_mismatch
The redirect URI in the request did not match.
```
Neden: Backend'in gönderdiği `redirect_uri` ile Google Console'daki URI eşleşmiyor.

Rafımdan'daki çözüm — `auth.routes.ts`'de callback URL dinamik:
```typescript
// auth.routes.ts
function getCallbackUrl(c: Context<HonoEnv>): string {
  const frontendUrl = c.env.CORS_ORIGIN || "http://localhost:3000";
  return `${frontendUrl}/api/auth/google/callback`;
}
// CORS_ORIGIN=http://localhost:3000 → callback=http://localhost:3000/api/auth/google/callback
// CORS_ORIGIN=https://rafimdan.com → callback=https://rafimdan.com/api/auth/google/callback
// UYARI: Bu URL Google Console'da kayıtlı olmak ZORUNDA
```

**Hata 2: `invalid_client`**
Neden: `GOOGLE_CLIENT_SECRET` yanlış veya boş.
Kontrol: Wrangler dev'de `c.env.GOOGLE_CLIENT_SECRET` var mı?
```bash
# .dev.vars'a bak
cat apps/backend/.dev.vars | grep GOOGLE
```

**Hata 3: Production'da OAuth çalışmıyor, local'de çalışıyor**
Neden: Worker'a secret deploy edilmedi.
```bash
# Tek tek secret set et
echo "değer" | pnpm exec wrangler secret put GOOGLE_CLIENT_ID --name proje-backend
echo "değer" | pnpm exec wrangler secret put GOOGLE_CLIENT_SECRET --name proje-backend
```
Ya da CI/CD'ye ekle (bkz. Faz 8 — GitHub Actions).

---

## Faz 3 — Foundation: Monorepo + Auth

**Amaç:** Çalışan iskelet + auth akışı. Başka her şey bunun üzerine inşa edilir.

**Komut:**
```
/sc:implement x5

docs/IMPLEMENTATION_PLAN.md Faz 1-2'yi uygula.

Monorepo:
- pnpm-workspace.yaml
- tsconfig.base.json (strict: true, no any)
- apps/shared: @proje/shared — tüm TypeScript tipleri

Backend (apps/backend):
- wrangler.toml (D1 + R2 binding, nodejs_compat flag)
- src/types/env.ts — Env + HonoEnv
- src/errors/index.ts — AppError base + domain subclass'ları
- src/middleware/auth.ts — authMiddleware + optionalAuthMiddleware
- src/middleware/cors.ts — CORS_ORIGIN env'dan dynamic
- src/lib/jwt.ts — jose ile sign/verify (access 15m, refresh 7d, oauth state 5m)
- src/lib/crypto.ts — sha256 (Web Crypto API, harici lib yok)
- src/lib/slug.ts — Turkish slug generator + unique kontrol
- migrations/0001_users.sql + 0002_refresh_tokens.sql
- src/repositories/user.repository.ts + refresh-token.repository.ts
- src/services/auth.service.ts
- src/routes/auth.ts + routes/health.ts
- .dev.vars.example

.gitignore'a ekle: .dev.vars, node_modules, dist, .wrangler
```

### Gerçek kod örnekleri — Rafımdan'dan

**Cookie domain (en sık hatalanan yer):**
```typescript
// apps/backend/src/routes/auth.ts
function getCookieDomain(c: Context<HonoEnv>): string | undefined {
  const origin = c.env.CORS_ORIGIN;
  if (!origin) return undefined;
  try {
    const { hostname } = new URL(origin);
    // localhost → undefined (domain set etme)
    // rafimdan.com → ".rafimdan.com" (noktalı! cross-subdomain için şart)
    return hostname === "localhost" ? undefined : `.${hostname}`;
  } catch {
    return undefined;
  }
}

function setRefreshCookie(c: Context<HonoEnv>, token: string): void {
  setCookie(c, "refresh_token", token, {
    httpOnly: true,      // JS erişemez — güvenlik
    secure: true,        // sadece HTTPS
    sameSite: "Lax",     // CSRF koruması, redirect'e izin verir
    path: "/api/auth",   // sadece auth route'larında gönderilir
    maxAge: 7 * 24 * 60 * 60,
    domain: getCookieDomain(c),
  });
}
```

Neden `.rafimdan.com` (noktalı)? `api.rafimdan.com`'dan set edilen cookie,
`rafimdan.com` frontend'inde okunmaz. Nokta prefiksi tüm subdomainleri kapsar.

**CORS middleware:**
```typescript
// apps/backend/src/middleware/cors.ts
export const corsMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const origin = c.env.CORS_ORIGIN || "http://localhost:3000";
  const handler = cors({
    origin,               // string — wildcard "*" değil, credentials ile uyumsuz
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 86_400,
    credentials: true,    // cookie gönderimi için şart
  });
  return handler(c, next);
};
// UYARI: credentials: true ile origin "*" olmaz — kesin URL gerekir
```

**JWT (jose, Cloudflare Workers uyumlu):**
```typescript
// apps/backend/src/lib/jwt.ts
import { SignJWT, jwtVerify, errors } from "jose";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";
const OAUTH_STATE_EXPIRY = "5m";
const ISSUER = "rafimdan.com";   // → kendi domain'in

export async function signAccessToken(payload: AccessTokenPayload, secret: string) {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(new TextEncoder().encode(secret));
}
// jsonwebtoken, bcrypt, node:crypto gibi Node.js-only kütüphaneler
// Cloudflare Workers'da çalışmaz → jose + Web Crypto API kullan
```

**wrangler.toml:**
```toml
name = "rafimdan-backend"
main = "src/index.ts"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]   # ← zorunlu, pek çok lib için

[[d1_databases]]
binding = "DB"
database_name = "rafimdan-db"
database_id = "BURAYA_D1_ID"   # wrangler d1 create rafimdan-db komutu ile al

[[r2_buckets]]
binding = "STORAGE"
bucket_name = "rafimdan-storage"

[vars]
CORS_ORIGIN = "http://localhost:3000"   # prod için wrangler secret put kullan
```

**Bitti kriterleri:**
- `pnpm --filter @proje/backend run typecheck` → 0 hata
- `GET /api/health` → `{ status: "ok" }`
- Google login → cookie set edilmiş, `/api/auth/me` 200 dönüyor
- Token olmadan `/api/auth/me` → 401

---

## Faz 4 — Backend CRUD + Servisler

**Amaç:** Domain tabloları, repository'ler, servisler, route'lar.

**Komut:**
```
/sc:implement x5

docs/IMPLEMENTATION_PLAN.md Faz 3'ü uygula.

Migrations: [tablolar + indexler + seed]
Repositories: [liste]
  - as const object export pattern
  - D1 raw SQL (ORM yok)
  - toListItem(), toDetail() dönüşüm fonksiyonları
Services: [liste]
  - Route → Service → Repository zinciri (route'da db.prepare() yok)
Routes: [liste]
  - zValidator("json"|"query", schema) her endpoint'te
  - handleError(c, err) catch bloklarında
Tests: gerçek D1 ile (mock değil)
  - Owner kontrolü senaryosu
  - Filtre senaryoları
```

**Rafımdan'dan Route → Service → Repository örneği:**

```typescript
// YANLIŞ — route içinde doğrudan DB
auth.get("/me", async (c) => {
  const user = await c.env.DB.prepare("SELECT * FROM users WHERE id = ?")
    .bind(userId).first();
});

// DOĞRU — route sadece orkestre eder
auth.get("/me", authMiddleware, async (c) => {
  try {
    const { sub } = c.get("user");
    const profile = await authService.getProfile(c.env.DB, sub);
    return c.json({ data: profile, status: "ok" });
  } catch (err) {
    return handleError(c, err);
  }
});

// Response shape tutarlılığı:
// Başarı: { data: T, status: "ok" }
// Hata:   { error: string, status: "error", code: string }
```

**D1 query pattern'ları (Rafımdan'da doğrulanmış):**
```typescript
// Tek kayıt
const user = await db.prepare("SELECT * FROM users WHERE id = ?")
  .bind(id).first<UserRow>();

// Liste
const { results } = await db.prepare("SELECT * FROM listings WHERE city = ?")
  .bind(city).all<ListingRow>();

// Yazma
await db.prepare("INSERT INTO users (id, name) VALUES (?, ?)")
  .bind(id, name).run();

// Toplu işlem (atomic)
await db.batch([
  db.prepare("INSERT INTO ...").bind(...),
  db.prepare("UPDATE ...").bind(...),
]);
```

---

## Faz 5 — Frontend Core (Auth + Liste + Detay)

**Amaç:** Çalışan frontend, API'ya bağlı, SSR sayfalar.

**Komut:**
```
/sc:implement x7

docs/IMPLEMENTATION_PLAN.md Faz 4-5'i uygula.

nuxt.config.ts:
- runtimeConfig.public.apiBase: http://localhost:8787 (local)
- modules: @pinia/nuxt
- ssr: true

utils/api.ts — apiFetch wrapper:
- Authorization: Bearer {accessToken} header injection
- 401 → POST /api/auth/refresh → retry
- access_token cookie'den oku (JS-readable)

Stores (Pinia setup store formatı):
- stores/auth.ts: user, accessToken, isLoggedIn, login(), logout(), fetchMe()

SSR sayfalar (useFetch ile):
- pages/index.vue
- pages/ilanlar/index.vue (filtreli, query param sync)
- pages/ilan/[slug].vue (SEO kritik — useSeoMeta + JSON-LD)
- pages/profil/[slug].vue

CSR sayfalar:
- pages/giris.vue
- pages/auth/callback.vue (hash'ten token parse et)

Kurallar:
- Her <button>, <a>, @click → cursor-pointer class
- Emoji yok → Lucide Vue Next ikon kullan
- SSR sayfalarda useFetch(() => url) — reaktif URL için arrow function
```

**Rafımdan'dan auth callback akışı:**
```
Kullanıcı "Google ile Giriş" tıklar
  → GET /api/auth/google
  → Backend: Google OAuth URL'e redirect (state JWT ile imzalı)
  → Google: kullanıcı izin verir
  → GET /api/auth/google/callback?code=xxx&state=xxx
  → Backend: code exchange → user bul/oluştur → refresh cookie set et
  → Redirect: https://rafimdan.com/auth/callback (access_token YOK — cookie ile gider)
  → Frontend /auth/callback:
      POST /api/auth/refresh (cookie otomatik gider)
      → { access_token, user }
      → store'a yaz
      → / redirect

Neden access_token URL'de değil?
  Hash'te access_token iletmek mümkün ama kötü pratik.
  Cookie httpOnly olduğu için JS okuyamaz zaten.
  /refresh endpoint'i cookie'yi okur, access_token döner.
```

**apiFetch wrapper özeti (Rafımdan pattern'ı):**
```typescript
// utils/api.ts
export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const { accessToken } = useAuthStore();

  const response = await fetch(`${apiBase}${url}`, {
    ...options,
    credentials: "include",   // cookie gönder
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    // Token expired → refresh → retry
    const refreshed = await refreshToken();
    if (refreshed) return apiFetch<T>(url, options);
    navigateTo("/giris");
    throw new Error("Unauthorized");
  }

  return response.json();
}
```

---

## Faz 6 — Mutation Sayfaları (Create/Edit/Settings)

**Amaç:** Kullanıcının veri oluşturduğu ve düzenlediği akışlar.

**Komut:**
```
/sc:implement x5

Faz 6: Create + Edit sayfaları.

[/create-route]:
- Form alanları: [liste]
- Validasyon: client-side (Zod veya manual) + server-side (zValidator)
- Submit flow: POST → slug/id al → yönlendir
- [Varsa] File upload: multipart, [boyut limiti], [izin verilen tipler]
- Auth middleware: yetkisiz → /giris redirect

[/edit-route/[id]]:
- Mevcut veri prefill (GET endpoint'ten)
- Owner check: değilse → ana sayfa redirect
- Status değiştirme varsa: ayrı buton/dropdown

[/settings]:
- Profil güncelleme: PATCH /api/auth/me
- Mevcut değerler prefill
```

**Rafımdan fotoğraf upload akışı (yaygın sorun):**
```
Problem: İlan create'de slug henüz yok → fotoğraf hangi ilan'a?

Çözüm: Sıralı akış
  1. POST /api/listings (fotoğrafsız) → { slug }
  2. POST /api/listings/:slug/photos (multipart, her fotoğraf ayrı request)
  3. Tümü yüklendiyse → /ilan/:slug redirect

Frontend'de:
  const listing = await apiFetch('/api/listings', { method: 'POST', body: ... })
  for (const photo of selectedPhotos) {
    const formData = new FormData()
    formData.append('photo', photo)
    await apiFetch(`/api/listings/${listing.slug}/photos`, {
      method: 'POST', body: formData,
      headers: {} // Content-Type'ı fetch otomatik set etsin, override etme!
    })
  }
```

---

## Faz 7 — SEO + Sitemap

**Komut:**
```
/sc:implement x3

Faz 7: SEO.

Dynamic routes: [liste]
  - Her biri için useSeoMeta (title, description, ogImage)

sitemap.xml:
  - Dahil: [hangi sayfalar]
  - Hariç: /auth/*, /ayarlar, /ilan-ver

JSON-LD: [sayfa tipi — Product, Article, BreadcrumbList]

routeRules:
  '/': { prerender: true }
  '/[dynamic]/**': { ssr: true }
  '/[csr-pages]': { ssr: false }
```

---

## Faz 8 — CI/CD + GitHub Actions

> **Kritik:** Bu fazı sonraya bırakma. Rafımdan'da en çok zaman harcanan faz bu oldu.
> Faz 1'de secrets listesini çıkar, Faz 8'de sadece uygula.

### GitHub Secrets Kurulumu

Repo → Settings → Secrets and variables → Actions → New repository secret

Rafımdan'da gereken secrets:
```
CLOUDFLARE_API_TOKEN    # Cloudflare → My Profile → API Tokens → Create Token
CLOUDFLARE_ACCOUNT_ID   # Cloudflare → sol alt köşe, hesap ID
JWT_SECRET              # openssl rand -base64 32 ile üret
GOOGLE_CLIENT_ID        # Google Cloud Console'dan
GOOGLE_CLIENT_SECRET    # Google Cloud Console'dan
```

### Backend Deploy Workflow (gerçek Rafımdan dosyası):

```yaml
# .github/workflows/deploy-backend.yml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - "apps/backend/**"
      - "apps/shared/**"
      - ".github/workflows/deploy-backend.yml"

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @rafimdan/backend run typecheck

      - name: Apply migrations (remote)
        run: pnpm --filter @rafimdan/backend run db:migrate:remote
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

      - name: Deploy Worker
        run: pnpm --filter @rafimdan/backend run deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

      - name: Set secrets on Worker
        # wrangler.toml'daki [vars]'a yazılmaz — her deploy'da ayrıca set edilir
        run: |
          echo "${{ secrets.JWT_SECRET }}" | pnpm exec wrangler secret put JWT_SECRET --name rafimdan-backend
          echo "${{ secrets.GOOGLE_CLIENT_ID }}" | pnpm exec wrangler secret put GOOGLE_CLIENT_ID --name rafimdan-backend
          echo "${{ secrets.GOOGLE_CLIENT_SECRET }}" | pnpm exec wrangler secret put GOOGLE_CLIENT_SECRET --name rafimdan-backend
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

**Neden "Set secrets on Worker" ayrı adım?**
`wrangler.toml`'daki `[vars]` plaintext ve git'e girer. Secretlar `wrangler secret put`
ile Worker'a şifreli olarak yüklenir. Bu adım atlanırsa Worker'da env var boş kalır.

### Frontend Deploy Workflow (gerçek Rafımdan dosyası):

```yaml
# .github/workflows/deploy-frontend.yml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - "apps/frontend/**"
      - "apps/shared/**"
      - ".github/workflows/deploy-frontend.yml"

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @rafimdan/frontend run typecheck

      - name: Build
        run: pnpm --filter @rafimdan/frontend run build
        env:
          NUXT_PUBLIC_API_BASE: https://api.rafimdan.com   # ← BU OLMADAN localhost çağırır!
          NUXT_PUBLIC_SITE_URL: https://rafimdan.com
          NUXT_BACKEND_URL: https://api.rafimdan.com

      - name: Deploy to Cloudflare Pages
        run: pnpm --filter @rafimdan/frontend exec wrangler pages deploy dist --project-name=rafimdan --commit-dirty=true
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

**Rafımdan'da yaşanan hata:**
```
Semptom: Production'da tüm API çağrıları başarısız
Log: Failed to fetch: http://localhost:8787/api/listings
Neden: Build'e NUXT_PUBLIC_API_BASE inject edilmemişti
Çözüm: env: satırı deploy workflow'a eklendi
```

### Deploy Öncesi Zorunlu Kontrol:
```
/sc:analyze

Production deployment öncesi kontrol:
1. Auth: cookie domain prod'da ".domain.com" (noktalı) mu?
2. CORS: credentials: true ile origin wildcard "*" değil mi?
3. OAuth: Google Console'da prod redirect URI kayıtlı mı?
4. Env: backend secrets GitHub Secrets'a girildi mi?
5. Env: frontend build'de NUXT_PUBLIC_API_BASE (veya NEXT_PUBLIC_) inject ediliyor mu?
6. TypeScript: any veya @ts-ignore var mı?
7. console.*: production kodda kaldı mı?
```

---

## Faz 9+ — Yeni Özellik (Mevcut Proje)

Her yeni özellik aynı döngüyü izler: Design → Implement → Analyze.

**Komut şablonu:**
```
/sc:design

[Özellik adı] tasarımı.

Mevcut mimari: docs/IMPLEMENTATION_PLAN.md
Etkilenen katmanlar: backend / frontend / shared / DB

Üret:
1. Migration SQL (varsa)
2. Yeni veya değişen API endpoint'leri
3. Shared type değişiklikleri
4. Frontend değişiklikleri
5. Mevcut kodla çakışma noktaları
```

Ardından:
```
/sc:implement x[N]

[Özellik] implementasyonu.

[Design çıktısını buraya yapıştır]

Mevcut pattern referansı:
- Backend: apps/backend/src/services/listing.service.ts
- Frontend: apps/frontend/pages/ilanlar/index.vue
```

---

### Gerçek Örnek — Favoriler (Rafımdan Faz 9)

**Design prompt:**
```
/sc:design

Favoriler özelliği.

Mevcut: docs/IMPLEMENTATION_PLAN.md
Etkilenen: backend (yeni tablo + 3 endpoint), shared (type ekleme), frontend (2 bileşen + 1 sayfa)

Üret:
1. 0005_favorites.sql
2. /api/favorites endpoint'leri
3. ListingListItem.is_favorited?: boolean ekleme
4. FavoriteButton.vue + /favoriler sayfası
5. Listing detay sayfasında is_favorited query'si
```

**Implement prompt:**
```
/sc:implement x7

Favoriler.

Migration:
CREATE TABLE favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, listing_id)
);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_listing_id ON favorites(listing_id);

Backend:
- favorite.repository.ts: add(), remove(), findByUserId(), isFavorited()
- favorite.service.ts: toggle, liste
- routes/favorites.ts:
    GET    /api/favorites           → [auth] kullanıcının favorileri
    POST   /api/favorites           → [auth] { listing_id }
    DELETE /api/favorites/:listingId → [auth]

Shared: ListingListItem.is_favorited?: boolean ekle

Frontend:
- components/FavoriteButton.vue
    Heart ikonu (Lucide), toggle POST/DELETE, iyimser UI update
- pages/favoriler.vue
    auth required, ListingCard grid, boş durum mesajı
- ListingCard.vue'ya FavoriteButton entegre et (opsiyonel prop)
```

---

## Sık Karşılaşılan Hatalar ve Çözümleri

### OAuth / Auth

| Hata | Kök neden | Çözüm |
|------|----------|-------|
| `redirect_uri_mismatch` | Google Console'da URI kayıtlı değil | Her iki URI'yi (local+prod) Console'a ekle |
| `invalid_client` | Client secret yanlış/boş | Worker secret'ı kontrol et |
| Cookie set ama okunamıyor | `domain: api.domain.com` — nokta yok | `.domain.com` (noktalı) yap |
| Local çalışıyor, prod çalışmıyor | Worker'a secret deploy edilmedi | CI/CD'de `wrangler secret put` adımı |
| `CORS blocked` | `credentials: true` ile `origin: "*"` | Origin'i kesin URL yap |

### Frontend / Build

| Hata | Kök neden | Çözüm |
|------|----------|-------|
| Prod'da `localhost` çağrısı | Build'e env inject edilmedi | Workflow'a `NUXT_PUBLIC_API_BASE` ekle |
| `useFetch` reactive çalışmıyor | `useFetch(url)` sabit string | `useFetch(() => url)` arrow function yap |
| Cookie gönderilmiyor | `credentials: "include"` eksik | fetch/apiFetch'e ekle |
| 401 sonrası sonsuz döngü | Refresh token yokken retry | Refresh başarısızsa login'e yönlendir |

### Cloudflare Workers

| Hata | Kök neden | Çözüm |
|------|----------|-------|
| `node:crypto` çalışmıyor | Node.js-only API | Web Crypto API kullan + `nodejs_compat` flag |
| `jsonwebtoken` çalışmıyor | Node.js-only | `jose` kütüphanesiyle değiştir |
| D1 migration hata | SQL syntax | SQLite uyumlu syntax, `IF NOT EXISTS` kullan |
| Worker env var boş | `wrangler.toml [vars]` değil | `wrangler secret put` ile set et |

---

## Commit Stratejisi

Faz sonunda:
```
/sc:git
```

Faz içinde her mantıklı birimde:
```
feat(auth): add Google OAuth with refresh token rotation
feat(listings): add R2 photo upload endpoint
fix(auth): set cookie on parent domain for cross-subdomain access
fix(frontend): inject NUXT_PUBLIC_API_BASE in CI/CD build
ci: add backend deploy workflow with wrangler secret management
```

---

## Özet — Yeni Proje Checklist

```
[ ] Faz 0: /sc:brainstorm → scope + kasıtlı olmayan kararlar
[ ] Faz 1: /sc:design → IMPLEMENTATION_PLAN.md (prod/dev farkları dahil)
[ ] Faz 1: CLAUDE.md oluştur (max 40 satır)
[ ] Faz 2: Google Cloud Console → OAuth app + iki redirect URI kayıt
[ ] Faz 2: .dev.vars.example oluştur, .gitignore'a ekle
[ ] Faz 3: /sc:implement x5 → monorepo + auth
[ ] Faz 3: Lokal auth akışını test et (login → cookie → /me → refresh → logout)
[ ] Faz 4: /sc:implement x5 → backend CRUD
[ ] Faz 5: /sc:implement x7 → frontend
[ ] Faz 6: /sc:implement x5 → form + upload + settings
[ ] Faz 7: /sc:implement x3 → SEO
[ ] Faz 8: GitHub Secrets ekle (CF token, account ID, JWT secret, OAuth secrets)
[ ] Faz 8: /sc:implement x5 → CI/CD workflows
[ ] Deploy: /sc:analyze → prod hazırlık kontrolü (ATLAMA)
[ ] Deploy: main'e push → workflows tetikleniyor mu kontrol et
[ ] Faz 9+: /sc:design → /sc:implement (her yeni özellik bu döngü)
```

**Token karşılaştırması:**

| Yaklaşım | Session | Token tahmini |
|----------|---------|--------------|
| Rafımdan (gerçek) | 60+ | ~85.000 |
| Bu workflow | ~10-15 | ~20.000 |
| Fark | ~75% az | ~75% az |

Fark neden bu kadar? Çünkü her hata "yaşandıktan sonra" düzeltilmedi — bu belgede
"yaşanmadan önce" çözüm var.

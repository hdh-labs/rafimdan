# Rafımdan — CLAUDE.md

> Detaylı mimari, kurallar ve phase durumu için: **`docs/IMPLEMENTATION_PLAN.md`**
> Ürün vizyonu ve kullanıcı akışları için: **`docs/PRODUCT_PLAN.md`**

---

## Özet

Hiperlokal ikinci el pazar yeri. Kargo yok, yüz yüze buluşma.
**Stack:** pnpm monorepo · Nuxt 3 SSR · Hono + CF Workers · D1 · R2

## Hızlı Başlangıç

```bash
pnpm --filter @rafimdan/backend run dev        # :8787
pnpm --filter @rafimdan/frontend run dev       # :3000
pnpm --filter @rafimdan/backend run db:migrate:local
```

## Phase Durumu

| Phase | Durum | İçerik |
|-------|-------|--------|
| 1–5 | ✅ | Monorepo → Auth → CRUD → Frontend → İlan listesi/detay |
| 6 | ✅ | İlan ver + düzenle + ayarlar |
| 7 | ✅ | SEO sayfaları + sitemap + robots + JSON-LD |
| 8 | ✅ | CI/CD — GitHub Actions → CF Workers + CF Pages |

## Kritik Kurallar

- Route → Service → Repository (route DB'ye doğrudan erişemez)
- `any` yok, `console.*` yok, emoji yok
- Her tıklanabilir elemana `cursor-pointer`
- Migration dışında schema değişikliği yapma
- Auto-commit yok — kullanıcı söylemedikçe commit atma

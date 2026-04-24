const SITE_URL = process.env.NUXT_PUBLIC_SITE_URL || "https://rafimdan.com"

const CITIES = [
  "İstanbul", "Ankara", "İzmir", "Bursa", "Antalya",
  "Adana", "Konya", "Gaziantep", "Mersin", "Kayseri",
]

const CATEGORIES = [
  "kitap", "elektronik", "giyim", "ev-yasam", "spor", "diger",
]

function url(loc: string, priority: string, changefreq: string, lastmod?: string) {
  const lastmodLine = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""
  return `  <url>
    <loc>${SITE_URL}${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${lastmodLine}
  </url>`
}

type ListingItem = { slug: string; updated_at: string }
type ListingsResponse = { data: { items: ListingItem[] }; status: string }

async function fetchAllListingSlugs(backendUrl: string): Promise<ListingItem[]> {
  const items: ListingItem[] = []
  let page = 1
  const limit = 200

  while (true) {
    try {
      const res = await fetch(`${backendUrl}/api/listings?limit=${limit}&page=${page}`)
      if (!res.ok) break
      const json = await res.json() as ListingsResponse
      const batch = json.data?.items ?? []
      items.push(...batch)
      if (batch.length < limit) break
      page++
    } catch {
      break
    }
  }

  return items
}

export default defineEventHandler(async (event) => {
  setHeader(event, "Content-Type", "application/xml")
  setHeader(event, "Cache-Control", "public, max-age=3600, s-maxage=3600")

  const config = useRuntimeConfig(event)
  const backendUrl = (config.backendUrl as string) || "http://localhost:8787"

  const listings = await fetchAllListingSlugs(backendUrl)

  const urls = [
    url("/", "1.0", "daily"),
    url("/ilanlar", "0.9", "hourly"),
    ...CITIES.map((city) => url(`/ilanlar/${encodeURIComponent(city)}`, "0.7", "daily")),
    ...CATEGORIES.map((slug) => url(`/kategori/${slug}`, "0.7", "weekly")),
    ...listings.map((l) =>
      url(
        `/ilan/${l.slug}`,
        "0.8",
        "weekly",
        l.updated_at ? l.updated_at.slice(0, 10) : undefined,
      )
    ),
  ]

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`
})

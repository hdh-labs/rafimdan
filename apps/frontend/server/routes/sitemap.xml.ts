const SITE_URL = process.env.NUXT_PUBLIC_SITE_URL || "https://rafimdan.com"

const CITIES = [
  "İstanbul", "Ankara", "İzmir", "Bursa", "Antalya",
  "Adana", "Konya", "Gaziantep", "Mersin", "Kayseri",
]

const CATEGORIES = [
  "kitap", "elektronik", "giyim", "ev-yasam", "spor", "diger",
]

function url(loc: string, priority: string, changefreq: string) {
  return `  <url>
    <loc>${SITE_URL}${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
}

export default defineEventHandler((event) => {
  setHeader(event, "Content-Type", "application/xml")

  const urls = [
    url("/", "1.0", "daily"),
    url("/ilanlar", "0.9", "hourly"),
    ...CITIES.map((city) => url(`/ilanlar/${encodeURIComponent(city)}`, "0.7", "daily")),
    ...CATEGORIES.map((slug) => url(`/kategori/${slug}`, "0.7", "weekly")),
  ]

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`
})

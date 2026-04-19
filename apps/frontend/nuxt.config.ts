import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  ssr: true,
  devtools: { enabled: false },
  devServer: { host: "0.0.0.0" },

  css: ["~/assets/css/main.css"],

  modules: ["@pinia/nuxt", "@vite-pwa/nuxt"],

  pwa: {
    registerType: "autoUpdate",
    manifest: {
      name: "Rafımdan",
      short_name: "Rafımdan",
      description: "Yakınındaki ikinci el ilanlar. Kargosuz, yüz yüze.",
      theme_color: "#C05C38",
      background_color: "#FDF9F7",
      display: "standalone",
      orientation: "portrait",
      start_url: "/",
      icons: [
        { src: "/icons/pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/icons/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    workbox: {
      navigateFallback: null,
      globPatterns: ["**/*.{js,css,html,png,svg,ico,woff2}"],
    },
    devOptions: {
      enabled: false,
    },
  },

  components: [
    { path: "~/components", pathPrefix: false },
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  nitro: {
    preset: "cloudflare-pages",
  },

  runtimeConfig: {
    backendUrl: process.env.NUXT_BACKEND_URL || "http://localhost:8787",
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "",
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || "http://localhost:3000",
    },
  },

  routeRules: {
    "/": { ssr: true },
    "/ilanlar/**": { ssr: true },
    "/ilan/**": { ssr: true },
    "/kategori/**": { ssr: true },
    "/profil/**": { ssr: true },
    "/giris": { ssr: false },
    "/auth/**": { ssr: false },
    "/ayarlar": { ssr: false },
    "/ilan-ver": { ssr: false },
    "/ilan/*/duzenle": { ssr: false },
    "/admin/**": { ssr: false },
    "/admin": { ssr: false },
    "/ilanlarim": { ssr: false },
    "/favoriler": { ssr: false },
  },

  app: {
    head: {
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
      htmlAttrs: { lang: "tr" },
      title: "Rafımdan - Yerel İkinci El Pazar Yeri",
      link: [
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&display=swap",
        },
      ],
      meta: [
        {
          name: "description",
          content: "Yakınındaki insanlarla kargosuz, yüz yüze ikinci el alışveriş.",
        },
      ],
    },
  },
});

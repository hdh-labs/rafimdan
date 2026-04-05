import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  ssr: true,
  devtools: { enabled: false },

  css: ["~/assets/css/main.css"],

  modules: ["@pinia/nuxt"],

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
    "/": { prerender: true },
    "/ilanlar/**": { ssr: true },
    "/ilan/**": { ssr: true },
    "/kategori/**": { ssr: true },
    "/profil/**": { ssr: true },
    "/giris": { ssr: false },
    "/auth/**": { ssr: false },
    "/ayarlar": { ssr: false },
    "/ilan-ver": { ssr: false },
    "/ilan/*/duzenle": { ssr: false },
  },

  app: {
    head: {
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      htmlAttrs: { lang: "tr" },
      title: "Rafımdan - Yerel İkinci El Pazar Yeri",
      meta: [
        {
          name: "description",
          content: "Yakınındaki insanlarla kargosuz, yüz yüze ikinci el alışveriş.",
        },
      ],
    },
  },
});

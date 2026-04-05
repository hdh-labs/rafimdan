<script setup lang="ts">
import { MapPin, Eye, MessageCircle, ChevronLeft, ChevronRight, Pencil } from "lucide-vue-next"
import type { ListingDetail } from "@rafimdan/shared"

type DetailResp = { data: ListingDetail; status: "ok" }

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const authStore = useAuthStore()
const isOwner = computed(() => authStore.user?.id === listing.value?.seller.id)

const { data: res, error } = await useFetch<DetailResp>(() => `/api/listings/${slug.value}`)

if (error.value || !res.value) {
  throw createError({ statusCode: 404, message: "İlan bulunamadı" })
}

const listing = computed(() => res.value!.data)

useSeoMeta({
  title: () => `${listing.value.title} — Rafımdan`,
  description: () => listing.value.description?.slice(0, 160) ?? undefined,
  ogImage: () => listing.value.photos[0] ?? undefined,
})

const selectedIndex = ref(0)
const mainPhoto = computed(() => listing.value.photos[selectedIndex.value] ?? null)

function prevPhoto() {
  if (selectedIndex.value > 0) selectedIndex.value--
}

function nextPhoto() {
  if (selectedIndex.value < listing.value.photos.length - 1) selectedIndex.value++
}

const waUrl = computed(() => {
  const phone = listing.value.seller.whatsapp
  if (!phone) return null
  const text = encodeURIComponent(
    `Rafımdan'da "${listing.value.title}" ilanını gördüm, hâlâ satılık mı?`,
  )
  return `https://wa.me/${phone}?text=${text}`
})

const priceDisplay = computed(() => {
  const { price, price_type } = listing.value
  if (price_type === "free") return "Ücretsiz"
  const formatted = (price ?? 0).toLocaleString("tr-TR") + " ₺"
  if (price_type === "negotiable") return `${formatted} · Pazarlığa açık`
  return formatted
})

const sellerName = computed(
  () => listing.value.seller.display_name ?? listing.value.seller.name,
)

const sellerInitials = computed(() =>
  sellerName.value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join(""),
)

const CONDITION_LABELS: Record<string, string> = {
  new: "Yeni",
  like_new: "Az Kullanılmış",
  good: "İyi",
  fair: "Fena Değil",
}

const STATUS_LABELS: Record<string, string> = {
  reserved: "Rezerve",
  sold: "Satıldı",
}

const config = useRuntimeConfig()
const siteUrl = (config.public.siteUrl as string) || "https://rafimdan.com"

useHead({
  script: [
    {
      type: "application/ld+json",
      innerHTML: () =>
        JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: listing.value.title,
          description: listing.value.description ?? undefined,
          image: listing.value.photos.length > 0 ? listing.value.photos : undefined,
          url: `${siteUrl}/ilan/${listing.value.slug}`,
          offers: {
            "@type": "Offer",
            priceCurrency: "TRY",
            price: listing.value.price ?? 0,
            availability:
              listing.value.status === "active"
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
          },
          seller: {
            "@type": "Person",
            name: sellerName.value,
          },
        }),
    },
  ],
})

const memberSince = computed(() => {
  const d = new Date(listing.value.seller.created_at)
  return d.toLocaleDateString("tr-TR", { year: "numeric", month: "long" })
})

const sellerAvatarError = ref(false)
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-6">
      <NuxtLink
        to="/ilanlar"
        class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
      >
        <ChevronLeft class="size-4" />
        İlanlara Dön
      </NuxtLink>
      <NuxtLink
        v-if="isOwner"
        :to="`/ilan/${slug}/duzenle`"
        class="inline-flex items-center gap-1.5 text-sm border border-border px-3 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors"
      >
        <Pencil class="size-3.5" />
        Düzenle
      </NuxtLink>
    </div>

    <div class="grid md:grid-cols-[1fr_320px] gap-8">
      <div class="space-y-4">
        <div class="relative rounded-lg overflow-hidden bg-muted aspect-[4/3]">
          <img
            v-if="mainPhoto"
            :src="mainPhoto"
            :alt="listing.title"
            class="size-full object-cover"
          />
          <div
            v-else
            class="size-full flex items-center justify-center text-muted-foreground text-sm"
          >
            Fotoğraf yok
          </div>

          <div
            v-if="listing.status !== 'active'"
            class="absolute inset-0 flex items-center justify-center bg-black/40"
          >
            <span class="bg-white/90 text-foreground font-semibold px-4 py-1.5 rounded-full text-sm">
              {{ STATUS_LABELS[listing.status] }}
            </span>
          </div>

          <template v-if="listing.photos.length > 1">
            <button
              class="absolute left-2 top-1/2 -translate-y-1/2 size-8 flex items-center justify-center bg-white/80 rounded-full cursor-pointer hover:bg-white transition-colors disabled:opacity-40"
              :disabled="selectedIndex === 0"
              @click="prevPhoto"
            >
              <ChevronLeft class="size-4" />
            </button>
            <button
              class="absolute right-2 top-1/2 -translate-y-1/2 size-8 flex items-center justify-center bg-white/80 rounded-full cursor-pointer hover:bg-white transition-colors disabled:opacity-40"
              :disabled="selectedIndex === listing.photos.length - 1"
              @click="nextPhoto"
            >
              <ChevronRight class="size-4" />
            </button>
          </template>
        </div>

        <div v-if="listing.photos.length > 1" class="flex gap-2 overflow-x-auto pb-1">
          <button
            v-for="(photo, i) in listing.photos"
            :key="i"
            class="shrink-0 size-16 rounded-md overflow-hidden border-2 cursor-pointer transition-colors"
            :class="i === selectedIndex ? 'border-foreground' : 'border-border'"
            @click="selectedIndex = i"
          >
            <img :src="photo" :alt="`Fotoğraf ${i + 1}`" class="size-full object-cover" />
          </button>
        </div>

        <div>
          <div class="flex items-start gap-2 flex-wrap mb-2">
            <h1 class="text-xl font-bold text-foreground flex-1">{{ listing.title }}</h1>
            <span class="shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
              {{ CONDITION_LABELS[listing.condition] }}
            </span>
            <FavoriteButton :listing-id="listing.id" />
          </div>

          <p
            class="text-2xl font-bold"
            :class="listing.price_type === 'free' ? 'text-green-700' : 'text-foreground'"
          >
            {{ priceDisplay }}
          </p>

          <div class="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
            <MapPin class="size-4 shrink-0" />
            <span>{{ listing.district ? `${listing.district}, ${listing.city}` : listing.city }}</span>
            <span class="mx-1">·</span>
            <Eye class="size-4 shrink-0" />
            <span>{{ listing.view_count }} görüntülenme</span>
          </div>

          <div v-if="listing.description" class="mt-4 prose prose-sm max-w-none">
            <p class="text-foreground whitespace-pre-line text-sm leading-relaxed">
              {{ listing.description }}
            </p>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div class="rounded-lg border border-border p-4 space-y-4">
          <div class="flex items-center gap-3">
            <span
              class="inline-flex shrink-0 items-center justify-center size-11 rounded-full bg-muted text-sm font-medium text-muted-foreground overflow-hidden"
            >
              <img
                v-if="listing.seller.avatar_url && !sellerAvatarError"
                :src="listing.seller.avatar_url"
                :alt="sellerName"
                referrerpolicy="no-referrer"
                class="size-full object-cover"
                @error="sellerAvatarError = true"
              />
              <span v-else>{{ sellerInitials }}</span>
            </span>
            <div class="min-w-0">
              <p class="font-medium text-foreground text-sm truncate">{{ sellerName }}</p>
              <p v-if="listing.seller.city" class="text-xs text-muted-foreground">
                {{ listing.seller.city }}
              </p>
              <p class="text-xs text-muted-foreground">{{ memberSince }}'dan beri üye</p>
            </div>
          </div>

          <NuxtLink
            v-if="listing.seller.slug"
            :to="`/profil/${listing.seller.slug}`"
            class="block w-full text-center text-sm border border-border rounded-md py-2 cursor-pointer hover:bg-muted transition-colors"
          >
            Profili Gör
          </NuxtLink>
        </div>

        <a
          v-if="waUrl"
          :href="waUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg cursor-pointer transition-colors"
        >
          <MessageCircle class="size-5" />
          WhatsApp'tan Yaz
        </a>
        <p v-else class="text-sm text-muted-foreground text-center">
          Satıcı iletişim bilgisi paylaşmamış.
        </p>
      </div>
    </div>
  </div>
</template>

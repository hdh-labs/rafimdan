<script setup lang="ts">
import { MapPin, Eye, MessageCircle, ChevronLeft, ChevronRight, Pencil, Flag, Share2, AlertCircle, ArrowRight, Clock, XCircle } from "lucide-vue-next"
import { useSwipe } from "@vueuse/core"
import { toast } from "vue-sonner"
import type { ListingDetail, ListingListItem } from "@rafimdan/shared"
import { apiFetch, ApiError } from "~/utils/api"
import { CONDITION_LABELS, STATUS_LABELS, getInitials } from "~/utils/listing-constants"

type DetailResp = { data: ListingDetail; status: "ok" }
type SimilarResp = { data: { items: ListingListItem[] }; status: "ok" }

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const authStore = useAuthStore()

const token = useCookie<string | null>("access_token")

const { data: listingData, error } = await useAsyncData(
  `listing-${slug.value}`,
  () => $fetch<DetailResp>(`/api/listings/${slug.value}`, {
    headers: token.value ? { Authorization: `Bearer ${token.value}` } : undefined,
  }),
)

if (error.value || !listingData.value) {
  throw createError({ statusCode: 404, message: "İlan bulunamadı" })
}

const listing = computed(() => listingData.value!.data)
const isOwner = computed(() => authStore.user?.id === listing.value?.seller.id)
const isPending = computed(() => listing.value?.status === "pending")
const isRejected = computed(() => listing.value?.status === "rejected")

useSeoMeta({
  title: () => `${listing.value.title} — Rafımdan`,
  description: () => listing.value.description?.slice(0, 160) ?? undefined,
  ogImage: () => listing.value.photos[0] ?? undefined,
})

const selectedIndex = ref(0)
const mainPhoto = computed(() => listing.value.photos[selectedIndex.value] ?? null)

const lightboxIndex = ref<number | null>(null)

function prevPhoto() {
  const len = listing.value.photos.length
  selectedIndex.value = (selectedIndex.value - 1 + len) % len
}

function nextPhoto() {
  selectedIndex.value = (selectedIndex.value + 1) % listing.value.photos.length
}

const galleryRef = ref<HTMLElement | null>(null)
useSwipe(galleryRef, {
  onSwipeEnd(_, direction) {
    if (direction === "left") nextPhoto()
    else if (direction === "right") prevPhoto()
  },
})


const isRequest = computed(() => listing.value.direction === "request")
const isService = computed(() => listing.value.listing_type === "service")

const waUrl = computed(() => {
  const phone = listing.value.seller.whatsapp
  if (!phone) return null
  const digits = phone.replace(/\D/g, "")
  const waPhone = digits.startsWith("90") ? digits : `90${digits}`
  let text: string
  if (isRequest.value) {
    text = encodeURIComponent(`Merhaba, "${listing.value.title}" ilanını gördüm, yardımcı olabilir miyim?`)
  } else if (isService.value) {
    text = encodeURIComponent(`Merhaba, "${listing.value.title}" hizmet ilanınla ilgileniyorum.`)
  } else {
    text = encodeURIComponent(`Merhaba, "${listing.value.title}" ilanın hâlâ aktif mi?`)
  }
  return `https://wa.me/${waPhone}?text=${text}`
})

const waButtonText = computed(() => {
  if (isRequest.value) return "Yardım Teklif Et"
  if (isService.value) return "Hizmet Hakkında Yaz"
  return "WhatsApp'tan Yaz"
})

const priceDisplay = computed(() => {
  if (isRequest.value) return isService.value ? "Hizmet Arıyor" : "Eşya Arıyor"
  if (isService.value) return "Hizmet Sunuyor"
  const { price, price_type } = listing.value
  if (price_type === "free") return "Ücretsiz"
  const formatted = (price ?? 0).toLocaleString("tr-TR") + " ₺"
  if (price_type === "negotiable") return `${formatted} · Pazarlığa açık`
  return formatted
})

const isFree = computed(() => listing.value.price_type === "free")

const sellerName = computed(
  () => listing.value.seller.display_name ?? listing.value.seller.name,
)

const sellerInitials = computed(() => getInitials(sellerName.value))


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

function parseUTC(dateStr: string): Date {
  if (dateStr.endsWith("Z") || dateStr.includes("+")) return new Date(dateStr)
  return new Date(dateStr.replace(" ", "T") + "Z")
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - parseUTC(dateStr).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "az önce"
  if (minutes < 60) return `${minutes} dakika önce`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} saat önce`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} gün önce`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks} hafta önce`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} ay önce`
  return `${Math.floor(days / 365)} yıl önce`
}

const sellerAvatarError = ref(false)

const { data: similarRes } = await useFetch<SimilarResp>(
  () => {
    const p = new URLSearchParams({
      category: listing.value.category.slug,
      city: listing.value.city,
      limit: "5",
      status: "active",
    })
    return `/api/listings?${p}`
  },
  { lazy: true },
)

const similarListings = computed(() =>
  (similarRes.value?.data.items ?? []).filter((l) => l.slug !== slug.value).slice(0, 4),
)

const reportPending = ref(false)

async function share() {
  if (!import.meta.client) return
  const url = window.location.href
  const { title, price, price_type, city, district } = listing.value

  const priceText =
    price_type === "free"
      ? "Ücretsiz"
      : price_type === "negotiable"
        ? `${price?.toLocaleString("tr-TR")} ₺ (Pazarlığa açık)`
        : `${price?.toLocaleString("tr-TR")} ₺`

  const locationText = district ? `${district}, ${city}` : city
  const text = `${priceText} · ${locationText}`

  if (navigator.share) {
    await navigator.share({ title, text, url })
  } else {
    await navigator.clipboard.writeText(`${title}\n${text}\n${url}`)
    toast.success("Link kopyalandı.")
  }
}


const REPORT_REASONS = [
  { value: "spam", label: "Spam / Reklam" },
  { value: "fraud", label: "Dolandırıcılık" },
  { value: "inappropriate", label: "Uygunsuz İçerik" },
  { value: "wrong_category", label: "Yanlış Kategori" },
  { value: "other", label: "Diğer" },
] as const

const showReportModal = ref(false)
const reportReason = ref<string>("spam")
const reportDescription = ref("")
const reportModalRef = ref<HTMLDivElement | null>(null)
const reportTriggerRef = ref<HTMLButtonElement | null>(null)

function openReportModal() {
  reportReason.value = "spam"
  reportDescription.value = ""
  showReportModal.value = true
  nextTick(() => {
    reportModalRef.value?.querySelector<HTMLElement>("[data-autofocus]")?.focus()
  })
}

function closeReportModal() {
  showReportModal.value = false
  reportTriggerRef.value?.focus()
}

function onReportKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") { closeReportModal(); return }
  if (e.key !== "Tab" || !reportModalRef.value) return
  const focusable = Array.from(
    reportModalRef.value.querySelectorAll<HTMLElement>(
      'button, input, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute("disabled"))
  if (focusable.length === 0) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault(); last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault(); first.focus()
  }
}

async function submitReport() {
  if (!authStore.isLoggedIn) {
    await navigateTo("/giris")
    return
  }
  reportPending.value = true
  try {
    await apiFetch(`/api/listings/${slug.value}/report`, {
      method: "POST",
      body: JSON.stringify({
        reason: reportReason.value,
        description: reportDescription.value.trim() || null,
      }),
    })
    toast.success("Bildirimin alındı, teşekkürler.")
    showReportModal.value = false
  } catch (err) {
    toast.error(err instanceof ApiError ? err.message : "Bildirim gönderilemedi, tekrar dene")
  } finally {
    reportPending.value = false
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8 pb-28 md:pb-8 overflow-x-hidden">
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

    <div
      v-if="isOwner && isPending"
      class="flex items-start gap-3 mb-6 rounded-lg border border-border bg-muted px-4 py-3"
    >
      <Clock class="size-4 shrink-0 mt-0.5 text-muted-foreground" />
      <div>
        <p class="text-sm font-medium text-foreground">İlanınız inceleniyor</p>
        <p class="text-xs text-muted-foreground mt-0.5">Onaylandıktan sonra herkes görebilir olacak. Bekleyen ilanlarınızı <NuxtLink to="/ilanlarim" class="underline underline-offset-2">ilanlarım</NuxtLink> sayfasından takip edebilirsiniz.</p>
      </div>
    </div>

    <div
      v-if="isOwner && isRejected"
      class="flex items-start gap-3 mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3"
    >
      <XCircle class="size-4 shrink-0 mt-0.5 text-destructive" />
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-destructive">İlanınız reddedildi</p>
        <p v-if="listing.rejection_reason" class="text-xs text-destructive/80 mt-0.5">Gerekçe: {{ listing.rejection_reason }}</p>
        <NuxtLink :to="`/ilan/${slug}/duzenle`" class="inline-flex items-center gap-1 text-xs text-destructive underline underline-offset-2 mt-1 cursor-pointer">
          Düzenleyip tekrar gönder
        </NuxtLink>
      </div>
    </div>

    <div class="grid md:grid-cols-[1fr_320px] gap-8">
      <div class="space-y-4">
        <div ref="galleryRef" class="relative rounded-lg overflow-hidden bg-muted aspect-[4/3]">
          <img
            v-if="mainPhoto"
            :src="mainPhoto"
            :alt="listing.title"
            fetchpriority="high"
            loading="eager"
            class="size-full object-cover cursor-zoom-in"
            @click="lightboxIndex = selectedIndex"
          />
          <div
            v-else
            class="size-full flex items-center justify-center text-muted-foreground text-sm"
          >
            Fotoğraf yok
          </div>

          <div
            v-if="listing.status !== 'active'"
            class="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none"
          >
            <span class="bg-white/90 text-foreground font-semibold px-4 py-1.5 rounded-full text-sm">
              {{ STATUS_LABELS[listing.status] }}
            </span>
          </div>

          <template v-if="listing.photos.length > 1">
            <button
              aria-label="Önceki fotoğraf"
              class="absolute left-2 top-1/2 -translate-y-1/2 size-11 flex items-center justify-center bg-white/80 rounded-full cursor-pointer hover:bg-white transition-colors disabled:opacity-40"
              @click="prevPhoto"
            >
              <ChevronLeft class="size-5" />
            </button>
            <button
              aria-label="Sonraki fotoğraf"
              class="absolute right-2 top-1/2 -translate-y-1/2 size-11 flex items-center justify-center bg-white/80 rounded-full cursor-pointer hover:bg-white transition-colors disabled:opacity-40"
              @click="nextPhoto"
            >
              <ChevronRight class="size-5" />
            </button>
          </template>
        </div>

        <div v-if="listing.photos.length > 1" class="flex gap-2 overflow-x-auto pb-1">
          <button
            v-for="(photo, i) in listing.photos"
            :key="i"
            :aria-label="`Fotoğraf ${i + 1}`"
            :aria-pressed="i === selectedIndex"
            class="shrink-0 size-16 rounded-md overflow-hidden border-2 cursor-pointer transition-colors"
            :class="i === selectedIndex ? 'border-foreground' : 'border-border'"
            @click="selectedIndex = i"
          >
            <img :src="photo" :alt="`Fotoğraf ${i + 1}`" class="size-full object-cover" />
          </button>
        </div>

        <div>
          <div class="flex items-start gap-2 flex-wrap mb-2 min-w-0">
            <h1 class="text-xl font-bold text-foreground flex-1 break-words min-w-0">{{ listing.title }}</h1>
            <span
              v-if="listing.condition"
              class="shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground"
            >
              {{ CONDITION_LABELS[listing.condition] }}
            </span>
            <FavoriteButton v-if="listing.status === 'active'" :listing-id="listing.id" :count="listing.favorites_count" />
          </div>

          <p
            class="text-2xl font-bold"
            :class="isRequest || isService || listing.price_type === 'free' ? 'text-brand' : 'text-foreground'"
          >
            {{ priceDisplay }}
          </p>

          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-muted-foreground">
            <span class="flex items-center gap-1">
              <MapPin class="size-4 shrink-0" />
              <span>{{ listing.district ? `${listing.district}, ${listing.city}` : listing.city }}</span>
            </span>
            <span class="flex items-center gap-1">
              <Eye class="size-4 shrink-0" />
              <span>{{ listing.view_count }} görüntülenme</span>
            </span>
            <span class="flex items-center gap-1">
              <Clock class="size-4 shrink-0" />
              <span>{{ timeAgo(listing.created_at) }}</span>
            </span>
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
              <div class="flex items-center gap-1.5 flex-wrap">
                <p class="font-medium text-foreground text-sm truncate">{{ sellerName }}</p>
              </div>
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

        <NuxtLink
          v-if="isOwner && !listing.seller.whatsapp"
          to="/ayarlar"
          class="flex items-start gap-2 p-3 rounded-lg bg-brand/5 border border-brand/20 text-foreground hover:bg-brand/10 transition-colors cursor-pointer"
        >
          <AlertCircle class="size-4 shrink-0 mt-0.5" />
          <span class="text-xs">Alıcılar sana ulaşamıyor. <span class="underline underline-offset-2 font-medium">WhatsApp ekle →</span></span>
        </NuxtLink>

        <a
          v-if="waUrl"
          :href="waUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-center gap-2 w-full bg-whatsapp hover:bg-whatsapp-hover text-whatsapp-foreground font-medium py-3 rounded-lg cursor-pointer transition-colors"
        >
          <MessageCircle class="size-5" />
          {{ waButtonText }}
        </a>
        <div v-else-if="!isOwner" class="text-center space-y-1.5">
          <p class="text-sm text-muted-foreground">Satıcı henüz iletişim bilgisi eklememiş.</p>
          <NuxtLink
            :to="`/profil/${listing.seller.id}`"
            class="text-xs text-brand hover:underline cursor-pointer"
          >
            Profili görüntüle
          </NuxtLink>
        </div>

        <button
          v-if="listing.status === 'active'"
          type="button"
          class="flex items-center justify-center gap-2 w-full border border-border py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted cursor-pointer transition-colors"
          @click="share"
        >
          <Share2 class="size-4" />
          İlanı Paylaş
        </button>

        <SafeMeetingTips />

        <button
          v-if="!isOwner && listing.status === 'active'"
          ref="reportTriggerRef"
          type="button"
          class="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors cursor-pointer w-full justify-center pt-1"
          :aria-expanded="showReportModal"
          aria-haspopup="dialog"
          @click="openReportModal"
        >
          <Flag class="size-3" />
          İlanı Bildir
        </button>
      </div>
    </div>
  </div>

  <!-- Benzer İlanlar -->
  <div v-if="similarListings.length > 0" class="max-w-5xl mx-auto px-4 pb-10">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-base font-semibold text-foreground">
        {{ listing.category.name }} kategorisinde benzer ilanlar
      </h2>
      <NuxtLink
        :to="`/ilanlar?category=${listing.category.slug}&city=${listing.city}`"
        class="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        Tümünü gör
        <ArrowRight class="size-3.5" />
      </NuxtLink>
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <ListingCard
        v-for="item in similarListings"
        :key="item.id"
        :id="item.id"
        :slug="item.slug"
        :title="item.title"
        :price="item.price ?? 0"
        :price_type="item.price_type"
        :listing_type="item.listing_type"
        :condition="item.condition"
        :status="item.status"
        :cover_photo="item.cover_photo ?? undefined"
        :city="item.city"
        :district="item.district ?? undefined"
        :seller="{
          id: item.seller.id,
          name: item.seller.display_name ?? item.seller.name,
          avatar_url: item.seller.avatar_url ?? undefined,
        }"
        :created_at="item.created_at"
        :favorites_count="item.favorites_count"
      />
    </div>
  </div>

  <!-- Mobil sticky CTA -->
  <Teleport to="body">
    <div
      v-if="waUrl && !isOwner"
      class="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background border-t border-border px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
    >
      <a
        :href="waUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center justify-center gap-2 w-full bg-whatsapp hover:bg-whatsapp-hover text-whatsapp-foreground font-medium py-3 rounded-lg cursor-pointer transition-colors"
      >
        <MessageCircle class="size-5" />
        {{ waButtonText }}
      </a>
    </div>
  </Teleport>

  <!-- Lightbox -->
  <ImageLightbox v-model="lightboxIndex" :images="listing.photos" />

  <!-- Bildir Modal -->
  <Teleport to="body">
    <div
      v-if="showReportModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      @click.self="closeReportModal"
      @keydown="onReportKeydown"
    >
      <div
        ref="reportModalRef"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        class="w-full max-w-sm bg-background rounded-lg border border-border shadow-lg p-5 space-y-4"
      >
        <h2 id="report-modal-title" class="text-sm font-semibold text-foreground">İlanı Bildir</h2>
        <fieldset class="space-y-2 border-0 p-0 m-0">
          <legend class="sr-only">Bildirim nedeni</legend>
          <label
            v-for="opt in REPORT_REASONS"
            :key="opt.value"
            class="flex items-center gap-2 text-sm cursor-pointer"
          >
            <input
              v-model="reportReason"
              type="radio"
              :value="opt.value"
              class="accent-foreground cursor-pointer"
              :data-autofocus="opt.value === 'spam' ? true : undefined"
            />
            {{ opt.label }}
          </label>
        </fieldset>
        <div>
          <label for="report-description" class="block text-xs font-medium text-muted-foreground mb-1">
            Açıklama
            <span class="font-normal">(isteğe bağlı)</span>
          </label>
          <textarea
            id="report-description"
            v-model="reportDescription"
            rows="3"
            maxlength="500"
            placeholder="Daha fazla bilgi vermek istersen buraya yaz..."
            class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
          />
          <p class="text-right text-xs text-muted-foreground mt-0.5 tabular-nums">
            {{ reportDescription.length }}/500
          </p>
        </div>
        <div class="flex gap-2 pt-1">
          <button
            type="button"
            class="flex-1 py-2 text-sm border border-border rounded-md hover:bg-muted cursor-pointer transition-colors"
            @click="closeReportModal"
          >
            Vazgeç
          </button>
          <button
            type="button"
            :disabled="reportPending"
            class="flex-1 py-2 text-sm bg-foreground text-background rounded-md hover:opacity-90 cursor-pointer transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            @click="submitReport"
          >
            {{ reportPending ? "Gönderiliyor..." : "Gönder" }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ImageOff, MapPin, Heart } from "lucide-vue-next"
import { cn } from "~/utils/cn"

type PriceType = "fixed" | "negotiable" | "free" | "el_uzat"
type ListingStatus = "active" | "reserved" | "sold"
type Condition = "new" | "like_new" | "good" | "fair"
type Direction = "offer" | "request"

interface Seller {
  id: string
  name: string
  display_name?: string | null
  slug?: string | null
  avatar_url?: string | null
  is_ahali?: number
}

interface Props {
  id: string
  slug: string
  title: string
  price: number | null
  price_type: PriceType
  condition: Condition
  status: ListingStatus
  direction?: Direction
  cover_photo?: string | null
  city: string
  district?: string | null
  seller: Seller
  created_at: string
  favorites_count?: number
}

const props = defineProps<Props>()

const CONDITION_LABELS: Record<Condition, string> = {
  new: "Yeni",
  like_new: "Az Kullanılmış",
  good: "İyi",
  fair: "Fena Değil",
}

const CONDITION_COLORS: Record<Condition, string> = {
  new: "bg-green-50 text-green-700",
  like_new: "bg-blue-50 text-blue-700",
  good: "bg-amber-50 text-amber-700",
  fair: "bg-gray-100 text-gray-600",
}

const isOverlaid = computed(() => props.status === "reserved" || props.status === "sold")

const statusLabel = computed(() => {
  if (props.status === "reserved") return "Rezerve"
  if (props.status === "sold") return "Satıldı"
  return null
})

const priceDisplay = computed(() => {
  if (props.direction === "request") return "Destek Arıyor"
  if (props.price_type === "free") return "Askıda"
  if (props.price_type === "el_uzat") return "El Uzat"
  const formatted = (props.price ?? 0).toLocaleString("tr-TR") + " ₺"
  if (props.price_type === "negotiable") return formatted + " · Pazarlık"
  return formatted
})

const locationDisplay = computed(() => {
  if (props.district) return `${props.district}, ${props.city}`
  return props.city
})

const sellerInitials = computed(() =>
  props.seller.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
)

const sellerAvatarError = ref(false)
</script>

<template>
  <NuxtLink
    :to="`/ilan/${slug}`"
    :class="cn(
      'group block rounded-xl border bg-white overflow-hidden',
      'hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer',
      direction === 'request' ? 'border-amber-300' : 'border-border',
      isOverlaid && 'opacity-60'
    )"
  >
    <!-- Görsel -->
    <div class="relative aspect-[4/3] bg-muted overflow-hidden">
      <img
        v-if="cover_photo"
        :src="cover_photo"
        :alt="title"
        class="size-full object-cover group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
      />
      <div
        v-else
        class="size-full flex items-center justify-center"
        aria-hidden="true"
      >
        <ImageOff class="size-10 text-muted-foreground/30" />
      </div>

      <div
        v-if="statusLabel"
        class="absolute inset-0 flex items-center justify-center bg-black/30"
      >
        <span class="bg-white/90 text-foreground text-sm font-semibold px-3 py-1 rounded-full">
          {{ statusLabel }}
        </span>
      </div>

      <div class="absolute top-2 right-2">
        <FavoriteButton :listing-id="id" />
      </div>
    </div>

    <!-- Bilgiler -->
    <div class="p-3 space-y-1.5">
      <h3 class="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
        {{ title }}
      </h3>

      <div class="flex items-center justify-between gap-2">
        <p
          class="text-sm font-bold"
          :class="direction === 'request' ? 'text-amber-700' : price_type === 'free' || price_type === 'el_uzat' ? 'text-green-700' : 'text-foreground'"
        >
          {{ priceDisplay }}
        </p>
        <span
          class="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
          :class="CONDITION_COLORS[condition]"
        >
          {{ CONDITION_LABELS[condition] }}
        </span>
      </div>

      <div class="flex items-center justify-between pt-1 border-t border-border/60">
        <div class="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
          <MapPin class="size-3 shrink-0" />
          <span class="truncate">{{ locationDisplay }}</span>
        </div>
        <div class="flex items-center gap-2 shrink-0 ml-2">
          <span
            v-if="favorites_count"
            class="flex items-center gap-0.5 text-xs text-muted-foreground"
          >
            <Heart class="size-3 text-rose-400" />
            {{ favorites_count }}
          </span>
          <span
            v-if="seller.is_ahali"
            class="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
          >
            Ahali
          </span>
          <span
            class="inline-flex items-center justify-center size-5 rounded-full bg-muted text-xs font-medium text-muted-foreground overflow-hidden"
          >
            <img
              v-if="seller.avatar_url && !sellerAvatarError"
              :src="seller.avatar_url"
              :alt="seller.name"
              referrerpolicy="no-referrer"
              class="size-full object-cover"
              @error="sellerAvatarError = true"
            />
            <span v-else>{{ sellerInitials }}</span>
          </span>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>

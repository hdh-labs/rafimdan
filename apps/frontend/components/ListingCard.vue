<script setup lang="ts">
import { ImageOff, MapPin } from "lucide-vue-next"
import { cn } from "~/utils/cn"

type PriceType = "fixed" | "negotiable" | "free"
type ListingStatus = "active" | "reserved" | "sold"
type Condition = "new" | "like_new" | "good" | "fair"

interface Seller {
  id: string
  name: string
  avatar_url?: string
}

interface Props {
  id: string
  slug: string
  title: string
  price: number
  price_type: PriceType
  condition: Condition
  status: ListingStatus
  cover_photo?: string
  city: string
  district?: string
  seller: Seller
  created_at: string
}

const props = defineProps<Props>()

const CONDITION_LABELS: Record<Condition, string> = {
  new: "Yeni",
  like_new: "Az Kullanılmış",
  good: "İyi",
  fair: "Fena Değil",
}

const isOverlaid = computed(() => props.status === "reserved" || props.status === "sold")

const statusLabel = computed(() => {
  if (props.status === "reserved") return "Rezerve"
  if (props.status === "sold") return "Satıldı"
  return null
})

const priceDisplay = computed(() => {
  if (props.price_type === "free") return "Ücretsiz"
  const formatted = props.price.toLocaleString("tr-TR") + " ₺"
  if (props.price_type === "negotiable") return `${formatted} · Pazarlığa açık`
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
</script>

<template>
  <NuxtLink
    :to="`/ilan/${slug}`"
    :class="cn(
      'group block rounded-lg border border-border bg-background overflow-hidden',
      'hover:shadow-md transition-shadow cursor-pointer',
      isOverlaid && 'opacity-70'
    )"
  >
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
        <ImageOff class="size-10 text-muted-foreground/40" />
      </div>

      <div
        v-if="statusLabel"
        class="absolute inset-0 flex items-center justify-center bg-black/30"
      >
        <span class="bg-white/90 text-foreground text-sm font-semibold px-3 py-1 rounded-full">
          {{ statusLabel }}
        </span>
      </div>
    </div>

    <div class="p-3 flex flex-col gap-2">
      <div class="flex items-start justify-between gap-2">
        <h3 class="text-sm font-medium text-foreground line-clamp-2 leading-snug flex-1">
          {{ title }}
        </h3>
        <span
          class="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground"
        >
          {{ CONDITION_LABELS[condition] }}
        </span>
      </div>

      <p
        :class="cn(
          'text-sm font-semibold',
          price_type === 'free' ? 'text-green-700' : 'text-foreground'
        )"
      >
        {{ priceDisplay }}
      </p>

      <div class="flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin class="size-3 shrink-0" />
        <span class="truncate">{{ locationDisplay }}</span>
      </div>

      <div class="flex items-center gap-2 pt-1 border-t border-border">
        <span
          class="inline-flex shrink-0 items-center justify-center size-6 rounded-full bg-muted text-xs font-medium text-muted-foreground overflow-hidden"
        >
          <img
            v-if="seller.avatar_url"
            :src="seller.avatar_url"
            :alt="seller.name"
            class="size-full object-cover"
          />
          <span v-else>{{ sellerInitials }}</span>
        </span>
        <span class="text-xs text-muted-foreground truncate">{{ seller.name }}</span>
      </div>
    </div>
  </NuxtLink>
</template>

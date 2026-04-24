<script setup lang="ts">
import { MapPin, BookOpen, Monitor, Shirt, Home, Package, Dumbbell, Wrench } from "lucide-vue-next"
import type { Component } from "vue"
import { cn } from "~/utils/cn"
import { CONDITION_LABELS, CONDITION_COLORS, getInitials } from "~/utils/listing-constants"
import type { ListingCondition, ListingPriceType, ListingStatus, ListingDirection, ListingType } from "@rafimdan/shared"

type PriceType = ListingPriceType
type Condition = ListingCondition | null
type Direction = ListingDirection

interface Seller {
  id: string
  name: string
  display_name?: string | null
  slug?: string | null
  avatar_url?: string | null
}

interface Props {
  id: string
  slug: string
  title: string
  price: number | null
  price_type: PriceType
  condition: Condition
  status: ListingStatus
  listing_type?: ListingType
  direction?: Direction
  cover_photo?: string | null
  category_slug?: string | null
  city: string
  district?: string | null
  seller: Seller
  created_at: string
  favorites_count?: number
  eager?: boolean
}

const props = defineProps<Props>()


const isOverlaid = computed(() => props.status === "sold")

const statusLabel = computed(() => {
  if (props.status === "sold") return "Satıldı"
  return null
})

const priceDisplay = computed(() => {
  if (props.direction === "request") {
    return props.listing_type === "service" ? "Hizmet Arıyor" : "Eşya Arıyor"
  }
  if (props.listing_type === "service") return "Hizmet Sunuyor"
  if (props.price_type === "free") return "Ücretsiz"
  if (props.price_type === "trade") return "Takas"
  const formatted = (props.price ?? 0).toLocaleString("tr-TR") + " ₺"
  return formatted
})

const locationDisplay = computed(() => {
  if (props.district) return `${props.district}, ${props.city}`
  return props.city
})

const sellerInitials = computed(() => getInitials(props.seller.name))

const sellerAvatarError = ref(false)

const CATEGORY_ICONS: Record<string, Component> = {
  kitap: BookOpen,
  elektronik: Monitor,
  giyim: Shirt,
  "ev-yasam": Home,
  spor: Dumbbell,
  diger: Package,
}

const placeholderIcon = computed<Component>(() =>
  props.listing_type === "service"
    ? Wrench
    : (CATEGORY_ICONS[props.category_slug ?? ""] ?? Package)
)
</script>

<template>
  <div
    :class="cn(
      'group relative flex flex-col rounded-xl border bg-background overflow-hidden',
      'hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200',
      direction === 'request' ? 'border-brand/40' : listing_type === 'service' ? 'border-brand/20' : 'border-border',
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
        :loading="eager ? 'eager' : 'lazy'"
      />
      <div
        v-else
        :class="cn(
          'size-full flex flex-col items-center justify-center gap-2',
          listing_type === 'service' ? 'bg-brand/5' : 'bg-muted'
        )"
        aria-hidden="true"
      >
        <component :is="placeholderIcon" class="size-10 text-muted-foreground/40" />
        <span v-if="listing_type === 'service'" class="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wide">
          Hizmet
        </span>
      </div>

      <div
        v-if="statusLabel"
        class="absolute inset-0 flex items-center justify-center bg-black/30"
      >
        <span class="bg-white/90 text-foreground text-sm font-semibold px-3 py-1 rounded-full">
          {{ statusLabel }}
        </span>
      </div>

      <span
        v-if="price_type === 'negotiable' && status === 'active' && direction !== 'request'"
        class="absolute top-2 right-2 rounded-full px-2 py-0.5 text-[11px] font-medium bg-background/90 text-brand border border-brand/30 backdrop-blur-sm"
      >
        Pazarlık
      </span>
    </div>

    <!-- Bilgiler -->
    <div class="p-3 flex flex-col flex-1 gap-1.5">
      <h3 class="text-sm font-semibold text-foreground line-clamp-2 leading-snug h-10 overflow-hidden">
        <NuxtLink
          :to="`/ilan/${slug}`"
          class="after:absolute after:inset-0 after:z-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm"
        >
          {{ title }}
        </NuxtLink>
      </h3>

      <div class="flex items-center justify-between gap-2">
        <p
          class="text-sm font-bold"
          :class="direction === 'request' || listing_type === 'service' || price_type === 'free' || price_type === 'trade' ? 'text-brand' : 'text-foreground'"
        >
          {{ priceDisplay }}
        </p>
        <span
          v-if="direction === 'offer' && listing_type === 'item' && condition"
          class="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
          :class="CONDITION_COLORS[condition]"
        >
          {{ CONDITION_LABELS[condition] }}
        </span>
      </div>

      <div class="flex items-center justify-between pt-1 border-t border-border/60 mt-auto">
        <div class="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
          <MapPin class="size-3 shrink-0" />
          <span class="truncate">{{ locationDisplay }}</span>
        </div>
        <div class="flex items-center gap-1.5 shrink-0 ml-2 relative z-10">
          <FavoriteButton :listing-id="id" :count="favorites_count" />
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
  </div>
</template>

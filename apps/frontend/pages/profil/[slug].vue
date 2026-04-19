<script setup lang="ts">
import { MapPin, CalendarDays, MessageCircle, ShoppingBag, BadgeCheck } from "lucide-vue-next"
import type { UserProfile, ListingListItem } from "@rafimdan/shared"
import { getInitials } from "~/utils/listing-constants"

type ProfileWithStats = UserProfile & { listing_count: number; sold_count: number }

type ProfileResp = {
  data: { profile: ProfileWithStats; listings: ListingListItem[] }
  status: "ok"
}

const route = useRoute()
const slug = computed(() => route.params.slug as string)

const { data: res, error } = await useFetch<ProfileResp>(() => `/api/users/${slug.value}`)

if (error.value || !res.value) {
  throw createError({ statusCode: 404, message: "Kullanıcı bulunamadı" })
}

const profile = computed(() => res.value!.data.profile)
const listings = computed(() =>
  res.value!.data.listings.filter((l) => l.status === "active"),
)

const displayName = computed(
  () => profile.value.display_name ?? profile.value.name,
)

const initials = computed(() => getInitials(displayName.value))

const memberSince = computed(() => {
  const d = new Date(profile.value.created_at)
  return d.toLocaleDateString("tr-TR", { year: "numeric", month: "long" })
})

const avatarError = ref(false)

const waUrl = computed(() => {
  const phone = profile.value.whatsapp
  if (!phone) return null
  const text = encodeURIComponent(`Merhaba ${displayName.value}, seninle iletişime geçmek istedim.`)
  const digits = phone.replace(/\D/g, "")
  const waPhone = digits.startsWith("90") ? digits : `90${digits}`
  return `https://wa.me/${waPhone}?text=${text}`
})

useSeoMeta({
  title: () => `${displayName.value} — Rafımdan`,
  description: () =>
    `${displayName.value} kullanıcısının Rafımdan'daki ${listings.value.length} aktif ilanı.`,
})
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8 space-y-8">
    <div class="flex items-start gap-4">
      <span
        class="inline-flex shrink-0 items-center justify-center size-16 rounded-full bg-muted text-lg font-semibold text-muted-foreground overflow-hidden"
      >
        <img
          v-if="profile.avatar_url && !avatarError"
          :src="profile.avatar_url"
          :alt="displayName"
          referrerpolicy="no-referrer"
          class="size-full object-cover"
          @error="avatarError = true"
        />
        <span v-else>{{ initials }}</span>
      </span>

      <div class="min-w-0 space-y-1.5">
        <div class="flex items-center gap-2 flex-wrap">
          <h1 class="text-xl font-bold text-foreground">{{ displayName }}</h1>
          <span
            v-if="profile.sold_count >= 5"
            class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-brand/10 text-brand border border-brand/20"
          >
            <BadgeCheck class="size-3 shrink-0" />
            Güvenilir Satıcı
          </span>
        </div>
        <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span v-if="profile.city" class="flex items-center gap-1">
            <MapPin class="size-3.5 shrink-0" />
            {{ profile.district ? `${profile.district}, ${profile.city}` : profile.city }}
          </span>
          <span class="flex items-center gap-1">
            <CalendarDays class="size-3.5 shrink-0" />
            Üyelik: {{ memberSince }}
          </span>
        </div>
        <div class="flex flex-wrap gap-3 pt-0.5">
          <span class="flex items-center gap-1 text-sm text-muted-foreground">
            <ShoppingBag class="size-3.5 shrink-0" />
            {{ profile.listing_count }} aktif ilan
          </span>
          <span v-if="profile.sold_count > 0" class="flex items-center gap-1 text-sm text-muted-foreground">
            {{ profile.sold_count }} satış
          </span>
        </div>
      </div>
    </div>

    <div v-if="profile.bio">
      <h2 class="text-base font-semibold text-foreground mb-2">Hakkında</h2>
      <p class="text-sm text-muted-foreground leading-relaxed">{{ profile.bio }}</p>
    </div>

    <a
      v-if="waUrl"
      :href="waUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="flex items-center justify-center gap-2 w-full sm:w-auto bg-whatsapp hover:bg-whatsapp-hover text-whatsapp-foreground font-medium py-3 px-6 rounded-lg cursor-pointer transition-colors"
    >
      <MessageCircle class="size-5" />
      WhatsApp'tan Yaz
    </a>

    <div>
      <h2 class="text-base font-semibold text-foreground mb-4">Aktif İlanlar</h2>

      <div v-if="listings.length === 0" class="py-12 text-center">
        <p class="text-sm text-muted-foreground">Şu an aktif ilan yok.</p>
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <ListingCard
          v-for="listing in listings"
          :key="listing.id"
          :id="listing.id"
          :slug="listing.slug"
          :title="listing.title"
          :price="listing.price ?? 0"
          :price_type="listing.price_type"
          :condition="listing.condition"
          :status="listing.status"
          :listing_type="listing.listing_type"
          :direction="listing.direction"
          :cover_photo="listing.cover_photo ?? undefined"
          :category_slug="listing.category.slug"
          :city="listing.city"
          :district="listing.district ?? undefined"
          :seller="{
            id: listing.seller.id,
            name: listing.seller.display_name ?? listing.seller.name,
            avatar_url: listing.seller.avatar_url ?? undefined,
          }"
          :created_at="listing.created_at"
          :favorites_count="listing.favorites_count"
        />
      </div>
    </div>
  </div>
</template>

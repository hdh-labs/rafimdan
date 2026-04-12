<script setup lang="ts">
import {
  BookOpen,
  Monitor,
  Shirt,
  Home,
  Package,
  BookMarked,
  FlaskConical,
  Smile,
  Brain,
  Dumbbell,
  Moon,
} from "lucide-vue-next"
import type { CategoryTree } from "@rafimdan/shared"
import type { Component } from "vue"

defineProps<{ categories: CategoryTree[] }>()

const SLUG_ICONS: Record<string, Component> = {
  kitap: BookOpen,
  elektronik: Monitor,
  giyim: Shirt,
  "ev-yasam": Home,
  spor: Dumbbell,
  roman: BookMarked,
  "teknik-bilim": FlaskConical,
  "cocuk-kitaplari": Smile,
  "kisisel-gelisim": Brain,
  islami: Moon,
  diger: Package,
}

const SLUG_COLORS: Record<string, { bg: string; icon: string }> = {
  kitap:           { bg: "bg-amber-50",   icon: "text-amber-600" },
  elektronik:      { bg: "bg-blue-50",    icon: "text-blue-600" },
  giyim:           { bg: "bg-pink-50",    icon: "text-pink-600" },
  "ev-yasam":      { bg: "bg-green-50",   icon: "text-green-600" },
  spor:            { bg: "bg-orange-50",  icon: "text-orange-600" },
  roman:           { bg: "bg-amber-50",   icon: "text-amber-600" },
  "teknik-bilim":  { bg: "bg-purple-50",  icon: "text-purple-600" },
  "cocuk-kitaplari": { bg: "bg-yellow-50", icon: "text-yellow-600" },
  "kisisel-gelisim": { bg: "bg-teal-50",  icon: "text-teal-600" },
  islami:            { bg: "bg-emerald-50", icon: "text-emerald-600" },
  diger:           { bg: "bg-gray-100",   icon: "text-gray-500" },
}

function colorFor(slug: string) {
  return SLUG_COLORS[slug] ?? { bg: "bg-gray-100", icon: "text-gray-500" }
}
</script>

<template>
  <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
    <NuxtLink
      v-for="cat in categories"
      :key="cat.id"
      :to="`/ilanlar?category=${cat.slug}`"
      class="flex flex-col items-center gap-2.5 p-4 rounded-xl bg-white border border-border hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer text-center"
    >
      <span
        class="inline-flex items-center justify-center size-10 rounded-full"
        :class="colorFor(cat.slug).bg"
      >
        <component
          :is="SLUG_ICONS[cat.slug] ?? Package"
          class="size-5"
          :class="colorFor(cat.slug).icon"
          :aria-hidden="true"
        />
      </span>
      <span class="text-xs font-medium text-foreground leading-tight">{{ cat.name }}</span>
    </NuxtLink>
  </div>
</template>

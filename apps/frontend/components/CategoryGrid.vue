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

const HIDDEN_SLUGS = ["spor"]

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

function colorFor(_slug: string) {
  return { bg: "bg-brand/10", icon: "text-brand" }
}
</script>

<template>
  <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
    <NuxtLink
      v-for="cat in categories.filter(c => !HIDDEN_SLUGS.includes(c.slug))"
      :key="cat.id"
      :to="`/ilanlar?category=${cat.slug}`"
      class="flex flex-col items-center gap-2.5 p-4 rounded-xl bg-brand/5 border border-brand/10 hover:bg-brand/10 hover:-translate-y-0.5 transition-all cursor-pointer text-center"
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

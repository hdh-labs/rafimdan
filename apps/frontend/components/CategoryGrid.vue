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
} from "lucide-vue-next"
import type { CategoryTree } from "@rafimdan/shared"
import type { Component } from "vue"

const props = defineProps<{
  categories: CategoryTree[]
}>()

const SLUG_ICONS: Record<string, Component> = {
  kitap: BookOpen,
  elektronik: Monitor,
  giyim: Shirt,
  "ev-yasam": Home,
  roman: BookMarked,
  "teknik-bilim": FlaskConical,
  "cocuk-kitaplari": Smile,
  "kisisel-gelisim": Brain,
  diger: Package,
}

</script>

<template>
  <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
    <NuxtLink
      v-for="cat in categories"
      :key="cat.id"
      :to="`/ilanlar?category=${cat.slug}`"
      class="flex flex-col items-center gap-2 p-3 rounded-lg border border-border bg-background hover:bg-muted transition-colors cursor-pointer text-center"
    >
      <component
        :is="SLUG_ICONS[cat.slug] ?? Package"
        class="size-6 text-muted-foreground"
        :aria-hidden="true"
      />
      <span class="text-xs font-medium text-foreground leading-tight">{{ cat.name }}</span>
    </NuxtLink>
  </div>
</template>

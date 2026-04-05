<script setup lang="ts">
import { Heart } from "lucide-vue-next"

const props = defineProps<{ listingId: string }>()

const favoritesStore = useFavoritesStore()
const isFavorited = computed(() => favoritesStore.isFavorited(props.listingId))

async function handleClick(e: Event) {
  e.preventDefault()
  e.stopPropagation()
  await favoritesStore.toggle(props.listingId)
}
</script>

<template>
  <button
    type="button"
    :aria-label="isFavorited ? 'Favorilerden çıkar' : 'Favorilere ekle'"
    :aria-pressed="isFavorited"
    class="flex items-center justify-center size-8 rounded-full bg-white/90 shadow-sm hover:bg-white transition-colors cursor-pointer"
    @click="handleClick"
  >
    <Heart
      class="size-4 transition-colors"
      :class="isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-500'"
    />
  </button>
</template>

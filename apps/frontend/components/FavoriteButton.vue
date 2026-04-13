<script setup lang="ts">
import { Heart } from "lucide-vue-next"

const props = defineProps<{ listingId: string; count?: number }>()

const favoritesStore = useFavoritesStore()
const isFavorited = computed(() => favoritesStore.isFavorited(props.listingId))
const isPending = computed(() => favoritesStore.isPending(props.listingId))

async function handleClick(e: Event) {
  e.preventDefault()
  e.stopPropagation()
  await favoritesStore.toggle(props.listingId)
}
</script>

<template>
  <ClientOnly>
    <button
      type="button"
      :disabled="isPending"
      :aria-label="isFavorited ? 'Favorilerden çıkar' : 'Favorilere ekle'"
      :aria-pressed="isFavorited"
      class="flex items-center gap-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-opacity relative z-10"
      @click="handleClick"
    >
      <Heart
        class="size-3.5 transition-all duration-150"
        :class="isFavorited ? 'fill-rose-500 text-rose-500 scale-110' : 'text-muted-foreground hover:text-rose-400'"
      />
      <span v-if="count" class="text-xs text-muted-foreground tabular-nums">{{ count }}</span>
    </button>
    <template #fallback>
      <span class="flex items-center gap-0.5">
        <Heart class="size-3.5 text-muted-foreground" />
        <span v-if="count" class="text-xs text-muted-foreground tabular-nums">{{ count }}</span>
      </span>
    </template>
  </ClientOnly>
</template>

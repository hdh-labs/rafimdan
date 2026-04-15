<script setup lang="ts">
import { Heart } from "lucide-vue-next"

const props = defineProps<{ listingId: string; count?: number }>()

const favoritesStore = useFavoritesStore()
const isFavorited = computed(() => favoritesStore.isFavorited(props.listingId))
const isPending = computed(() => favoritesStore.isPending(props.listingId))

const toggleDelta = ref(0)

const displayCount = computed(() => Math.max(0, (props.count ?? 0) + toggleDelta.value))

async function handleClick(e: Event) {
  e.preventDefault()
  e.stopPropagation()
  const wasFavorited = isFavorited.value
  await favoritesStore.toggle(props.listingId)
  if (isFavorited.value !== wasFavorited) {
    toggleDelta.value += isFavorited.value ? 1 : -1
  }
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
      <span v-if="displayCount >= 2" class="text-xs text-foreground/60 tabular-nums">{{ displayCount }}</span>
    </button>
    <template #fallback>
      <span class="flex items-center gap-0.5">
        <Heart class="size-3.5 text-muted-foreground" />
        <span v-if="(count ?? 0) >= 2" class="text-xs text-foreground/60 tabular-nums">{{ count }}</span>
      </span>
    </template>
  </ClientOnly>
</template>

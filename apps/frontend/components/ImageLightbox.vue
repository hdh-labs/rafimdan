<script setup lang="ts">
import { X, ChevronLeft, ChevronRight } from "lucide-vue-next"

const props = defineProps<{
  images: string[]
  modelValue: number | null
}>()

const emit = defineEmits<{ "update:modelValue": [number | null] }>()

const closeButtonRef = ref<HTMLButtonElement | null>(null)

const isOpen = computed(() => props.modelValue !== null)
const activeIndex = computed(() => props.modelValue ?? 0)
const activeUrl = computed(() => props.images[activeIndex.value] ?? null)
const hasMultiple = computed(() => props.images.length > 1)

function close() {
  emit("update:modelValue", null)
}

function prev() {
  emit("update:modelValue", (activeIndex.value - 1 + props.images.length) % props.images.length)
}

function next() {
  emit("update:modelValue", (activeIndex.value + 1) % props.images.length)
}

function onKey(e: KeyboardEvent) {
  if (e.key === "Escape") { close(); return }
  if (e.key === "ArrowLeft") { prev(); return }
  if (e.key === "ArrowRight") { next(); return }
  if (e.key === "Tab") { e.preventDefault(); closeButtonRef.value?.focus() }
}

watch(isOpen, (val) => {
  if (val) {
    window.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    nextTick(() => closeButtonRef.value?.focus())
  } else {
    window.removeEventListener("keydown", onKey)
    document.body.style.overflow = ""
  }
})

onUnmounted(() => {
  window.removeEventListener("keydown", onKey)
  document.body.style.overflow = ""
})
</script>

<template>
  <Teleport to="body">
    <Transition name="lb">
      <div
        v-if="isOpen && activeUrl"
        class="fixed inset-0 z-[60] flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-label="Fotoğraf görüntüleyici"
        @click="close"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/85 backdrop-blur-sm" />

        <!-- Image -->
        <div class="relative z-10 flex items-center justify-center" @click.stop>
          <img
            :src="activeUrl"
            alt="Tam boyut fotoğraf"
            class="lb-img max-h-[88vh] max-w-[88vw] rounded-xl object-contain shadow-2xl"
          />
        </div>

        <!-- Close -->
        <button
          ref="closeButtonRef"
          type="button"
          class="absolute top-4 right-4 z-10 flex items-center justify-center size-9 rounded-full bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm transition-colors cursor-pointer"
          aria-label="Kapat"
          @click="close"
        >
          <X class="size-5" />
        </button>

        <!-- Prev / Next -->
        <template v-if="hasMultiple">
          <button
            type="button"
            class="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center size-10 rounded-full bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm transition-colors cursor-pointer"
            aria-label="Önceki fotoğraf"
            @click.stop="prev"
          >
            <ChevronLeft class="size-5" />
          </button>

          <button
            type="button"
            class="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center size-10 rounded-full bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm transition-colors cursor-pointer"
            aria-label="Sonraki fotoğraf"
            @click.stop="next"
          >
            <ChevronRight class="size-5" />
          </button>

          <!-- Counter -->
          <p class="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 text-xs text-white/60 select-none pointer-events-none tabular-nums">
            {{ activeIndex + 1 }} / {{ images.length }}
          </p>
        </template>

        <template v-else>
          <p class="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 text-xs text-white/50 select-none pointer-events-none">
            Kapatmak için tıkla veya Esc
          </p>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.lb-enter-active {
  transition: opacity 0.2s ease;
}
.lb-leave-active {
  transition: opacity 0.18s ease;
}
.lb-enter-from,
.lb-leave-to {
  opacity: 0;
}

.lb-enter-active .lb-img {
  animation: lb-pop-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
.lb-leave-active .lb-img {
  animation: lb-pop-out 0.18s ease forwards;
}

@keyframes lb-pop-in {
  from { transform: scale(0.82); opacity: 0; }
  to   { transform: scale(1);    opacity: 1; }
}
@keyframes lb-pop-out {
  from { transform: scale(1);    opacity: 1; }
  to   { transform: scale(0.88); opacity: 0; }
}
</style>

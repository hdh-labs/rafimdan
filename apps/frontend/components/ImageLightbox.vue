<script setup lang="ts">
import { X } from "lucide-vue-next"

const props = defineProps<{ url: string | null }>()
const emit = defineEmits<{ close: [] }>()

const closeButtonRef = ref<HTMLButtonElement | null>(null)

function onKey(e: KeyboardEvent) {
  if (e.key === "Escape") {
    emit("close")
    return
  }
  if (e.key === "Tab") {
    e.preventDefault()
    closeButtonRef.value?.focus()
  }
}

watch(() => props.url, (val) => {
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
        v-if="url"
        class="fixed inset-0 z-[60] flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-label="Fotoğraf görüntüleyici"
        @click="emit('close')"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/85 backdrop-blur-sm" />

        <!-- Image -->
        <div class="relative z-10 flex items-center justify-center" @click.stop>
          <img
            :src="url"
            alt="Tam boyut fotoğraf"
            class="lb-img max-h-[88vh] max-w-[88vw] rounded-xl object-contain shadow-2xl"
          />
        </div>

        <!-- Close button -->
        <button
          ref="closeButtonRef"
          type="button"
          class="absolute top-4 right-4 z-10 flex items-center justify-center size-9 rounded-full bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm transition-colors cursor-pointer"
          aria-label="Kapat"
          @click="emit('close')"
        >
          <X class="size-5" />
        </button>

        <!-- Hint -->
        <p class="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs text-white/50 select-none pointer-events-none">
          Kapatmak için tıkla veya Esc
        </p>
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

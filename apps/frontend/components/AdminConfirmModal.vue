<script setup lang="ts">
defineProps<{
  open: boolean
  title: string
  description: string
  confirmLabel?: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") emit("cancel")
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @keydown="onKeydown"
      >
        <div
          class="absolute inset-0 bg-black/40"
          @click="emit('cancel')"
        />
        <div class="relative bg-background border border-border rounded-xl shadow-lg w-full max-w-sm p-6">
          <h2 class="text-base font-semibold mb-1">{{ title }}</h2>
          <p class="text-sm text-muted-foreground mb-5">{{ description }}</p>
          <div class="flex gap-2 justify-end">
            <button
              type="button"
              class="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted cursor-pointer transition-colors"
              @click="emit('cancel')"
            >
              İptal
            </button>
            <button
              type="button"
              class="px-4 py-2 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-700 cursor-pointer transition-colors"
              @click="emit('confirm')"
            >
              {{ confirmLabel ?? 'Onayla' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.15s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>

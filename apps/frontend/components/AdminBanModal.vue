<script setup lang="ts">
import type { AdminUserProfile } from "@rafimdan/shared"
import { ref, watch, computed } from "vue"

const props = defineProps<{
  open: boolean
  user: AdminUserProfile | null
}>()

const emit = defineEmits<{
  confirm: [reason: string]
  cancel: []
}>()

const reason = ref("")
const isBanning = computed(() => props.user?.is_active !== 0)

watch(() => props.open, (val) => {
  if (!val) reason.value = ""
})

const MIN_REASON = 5

const canConfirm = computed(() =>
  !isBanning.value || reason.value.trim().length >= MIN_REASON
)

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") emit("cancel")
}

function submit() {
  if (!canConfirm.value) return
  emit("confirm", reason.value.trim())
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open && user"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @keydown="onKeydown"
      >
        <div
          class="absolute inset-0 bg-black/40"
          @click="emit('cancel')"
        />
        <div class="relative bg-background border border-border rounded-xl shadow-lg w-full max-w-sm p-6">
          <template v-if="isBanning">
            <h2 class="text-base font-semibold mb-1">Kullanıcıyı Banla</h2>
            <p class="text-sm text-muted-foreground mb-4">
              <span class="font-medium text-foreground">{{ user.name }}</span>
              kullanıcısı banlanacak. Ban sebebini girin.
            </p>
            <div class="mb-4">
              <textarea
                v-model="reason"
                rows="3"
                placeholder="Ban sebebi (zorunlu)..."
                class="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-destructive/30 focus:border-destructive/50 transition-colors"
              />
              <p
                v-if="reason.length > 0 && reason.trim().length < MIN_REASON"
                class="text-xs text-destructive mt-1"
              >
                {{ reason.trim().length }}/{{ MIN_REASON }} karakter
              </p>
            </div>
          </template>
          <template v-else>
            <h2 class="text-base font-semibold mb-1">Banı Kaldır</h2>
            <p class="text-sm text-muted-foreground mb-4">
              <span class="font-medium text-foreground">{{ user.name }}</span>
              kullanıcısının banı kaldırılacak.
            </p>
          </template>
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
              :disabled="!canConfirm"
              class="px-4 py-2 text-sm rounded-lg cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              :class="isBanning
                ? 'bg-destructive text-white hover:bg-destructive/90'
                : 'bg-green-600 text-white hover:bg-green-700'"
              @click="submit"
            >
              {{ isBanning ? 'Banla' : 'Banı Kaldır' }}
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

<script setup lang="ts">
import { MessageSquarePlus, X } from "lucide-vue-next"
import { toast } from "vue-sonner"
import { apiFetch, ApiError } from "~/utils/api"

const FEEDBACK_TYPES = [
  { value: "bug", label: "Hata / Bug" },
  { value: "ux", label: "UX / Tasarım" },
  { value: "suggestion", label: "Öneri" },
  { value: "other", label: "Diğer" },
] as const

type FeedbackType = (typeof FEEDBACK_TYPES)[number]["value"]

const open = ref(false)
const type = ref<FeedbackType>("bug")
const description = ref("")
const pending = ref(false)
const modalRef = ref<HTMLDivElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)

const route = useRoute()

// İlan detay sayfasında mobil sticky CTA var — feedback butonunu üstüne taşı
const isListingDetail = computed(() => route.name === "ilan-slug")

function openModal() {
  open.value = true
  nextTick(() => {
    modalRef.value?.querySelector<HTMLElement>("textarea")?.focus()
  })
}

function closeModal() {
  open.value = false
  description.value = ""
  type.value = "bug"
  triggerRef.value?.focus()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") closeModal()
}

async function submit() {
  if (!description.value.trim()) return
  pending.value = true
  try {
    await apiFetch("/api/feedback", {
      method: "POST",
      body: JSON.stringify({
        type: type.value,
        description: description.value.trim(),
        page_url: import.meta.client ? window.location.href : route.fullPath,
      }),
    })
    toast.success("Geri bildirim alındı, teşekkürler!")
    closeModal()
  } catch (err) {
    toast.error(err instanceof ApiError ? err.message : "Gönderilemedi, tekrar dene.")
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <!-- Trigger button — ilan detay sayfasında mobil sticky CTA'nın üstüne taşı -->
  <button
    ref="triggerRef"
    type="button"
    aria-label="Geri bildirim gönder"
    :aria-expanded="open"
    aria-haspopup="dialog"
    class="fixed right-4 z-40 flex items-center gap-2 bg-foreground text-background text-sm font-medium px-4 py-2.5 rounded-full shadow-lg cursor-pointer hover:opacity-90 transition-all select-none"
    :class="isListingDetail ? 'bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-6' : 'bottom-6'"
    @click="openModal"
  >
    <MessageSquarePlus class="size-4 shrink-0" />
    <span>Feedback</span>
  </button>

  <!-- Modal -->
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40"
      @click.self="closeModal"
      @keydown="onKeydown"
    >
      <div
        ref="modalRef"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
        class="w-full sm:max-w-md bg-background rounded-t-2xl sm:rounded-xl border border-border shadow-xl"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
          <div>
            <h2 id="feedback-modal-title" class="text-sm font-semibold text-foreground">
              Feedback Gönder
            </h2>
            <p class="text-xs text-muted-foreground mt-0.5">
              Gördüğünü yaz, direkt backlog'a düşer.
            </p>
          </div>
          <button
            type="button"
            aria-label="Kapat"
            class="flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
            @click="closeModal"
          >
            <X class="size-4" />
          </button>
        </div>

        <!-- Body -->
        <div class="px-5 py-4 space-y-4">
          <!-- Type -->
          <div>
            <label for="feedback-type" class="block text-xs font-medium text-muted-foreground mb-1">
              Tür
            </label>
            <select
              id="feedback-type"
              v-model="type"
              class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            >
              <option v-for="opt in FEEDBACK_TYPES" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <!-- Description -->
          <div>
            <label for="feedback-description" class="block text-xs font-medium text-muted-foreground mb-1">
              Açıklama
            </label>
            <textarea
              id="feedback-description"
              v-model="description"
              rows="4"
              maxlength="2000"
              placeholder="Ne gördün, ne olmasını bekliyordun, ne oldu..."
              class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
            />
            <p class="text-right text-xs text-muted-foreground mt-0.5 tabular-nums">
              {{ description.length }}/2000
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-5 pb-5 flex gap-2">
          <button
            type="button"
            class="flex-1 py-2.5 text-sm border border-border rounded-md hover:bg-muted cursor-pointer transition-colors"
            @click="closeModal"
          >
            Vazgeç
          </button>
          <Button
            type="button"
            class="flex-1"
            :loading="pending"
            :disabled="pending || description.trim().length < 5"
            @click="submit"
          >
            Gönder
          </Button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

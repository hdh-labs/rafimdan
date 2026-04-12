<script setup lang="ts">
import { MessageSquarePlus, X, Paperclip, Camera, Loader2 } from "lucide-vue-next"
import { toast } from "vue-sonner"
import { apiFetch, ApiError } from "~/utils/api"

const FEEDBACK_TYPES = [
  { value: "bug",        label: "Hata / Bug" },
  { value: "ux",         label: "UX / Tasarım" },
  { value: "suggestion", label: "Öneri" },
  { value: "other",      label: "Diğer" },
] as const

type FeedbackType = (typeof FEEDBACK_TYPES)[number]["value"]

const MAX_ATTACHMENTS = 3
const MAX_SIZE_MB = 5
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

const open = ref(false)
const type = ref<FeedbackType>("bug")
const description = ref("")
const pending = ref(false)
const capturing = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const descriptionRef = ref<HTMLTextAreaElement | null>(null)

const attachments = ref<{ file: File; preview: string }[]>([])

const route = useRoute()
const isListingDetail = computed(() => route.name === "ilan-slug")

function openModal() {
  open.value = true
  nextTick(() => descriptionRef.value?.focus())
}

function closeModal() {
  open.value = false
  description.value = ""
  type.value = "bug"
  attachments.value.forEach((a) => URL.revokeObjectURL(a.preview))
  attachments.value = []
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") closeModal()
}

function onFileChange(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  addFiles(files)
  if (fileInputRef.value) fileInputRef.value.value = ""
}

function addFiles(files: File[]) {
  const remaining = MAX_ATTACHMENTS - attachments.value.length
  files.slice(0, remaining).forEach((f) => {
    if (f.size > MAX_SIZE_BYTES) { toast.error(`${f.name}: ${MAX_SIZE_MB} MB'dan büyük olamaz`); return }
    attachments.value.push({ file: f, preview: URL.createObjectURL(f) })
  })
}

function removeAttachment(i: number) {
  URL.revokeObjectURL(attachments.value[i].preview)
  attachments.value.splice(i, 1)
}

async function captureScreen() {
  if (!import.meta.client) return
  if (attachments.value.length >= MAX_ATTACHMENTS) {
    toast.error(`En fazla ${MAX_ATTACHMENTS} dosya ekleyebilirsin`)
    return
  }
  capturing.value = true
  open.value = false
  await nextTick()
  await new Promise((r) => setTimeout(r, 80))

  try {
    const { default: html2canvas } = await import("html2canvas")
    const canvas = await html2canvas(document.body, {
      useCORS: false,
      allowTaint: false,
      logging: false,
      scale: Math.min(window.devicePixelRatio, 2),
      ignoreElements: (el) => {
        if (el.tagName !== "IMG") return false
        const src = (el as HTMLImageElement).src
        return Boolean(src && !src.startsWith(window.location.origin))
      },
    })
    canvas.toBlob((blob) => {
      if (!blob) return
      const file = new File([blob], `screenshot-${Date.now()}.png`, { type: "image/png" })
      addFiles([file])
    }, "image/png")
  } catch {
    toast.error("Ekran görüntüsü alınamadı.")
  } finally {
    capturing.value = false
    open.value = true
  }
}

async function uploadAttachment(file: File): Promise<string> {
  const form = new FormData()
  form.append("file", file)
  const res = await apiFetch<{ data: { url: string }; status: "ok" }>("/api/feedback/attachments", {
    method: "POST",
    body: form,
  })
  return res.data.url
}

async function submit() {
  if (!description.value.trim()) return
  pending.value = true
  try {
    const attachment_urls: string[] = []
    for (const { file } of attachments.value) {
      attachment_urls.push(await uploadAttachment(file))
    }
    await apiFetch("/api/feedback", {
      method: "POST",
      body: JSON.stringify({
        type: type.value,
        description: description.value.trim(),
        page_url: import.meta.client ? window.location.href : route.fullPath,
        attachment_urls,
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
  <!-- Trigger -->
  <button
    type="button"
    aria-label="Geri bildirim gönder"
    :aria-expanded="open"
    aria-haspopup="dialog"
    class="fixed right-4 z-40 flex items-center gap-2 bg-foreground text-background text-sm font-medium px-4 py-2.5 rounded-full shadow-lg cursor-pointer hover:opacity-90 transition-all select-none"
    :class="isListingDetail ? 'bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-6' : 'bottom-6'"
    @click="openModal"
  >
    <Loader2 v-if="capturing" class="size-4 shrink-0 animate-spin" />
    <MessageSquarePlus v-else class="size-4 shrink-0" />
    <span>Feedback</span>
  </button>

  <!-- Hidden file input -->
  <input
    ref="fileInputRef"
    type="file"
    accept="image/jpeg,image/png,image/gif,image/webp"
    multiple
    class="sr-only"
    @change="onFileChange"
  />

  <!-- Panel -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:translate-x-4"
      enter-to-class="opacity-100 translate-y-0 sm:translate-x-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 sm:translate-x-0"
      leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:translate-x-4"
    >
      <div
        v-if="open"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-panel-title"
        class="fixed z-50 w-full sm:w-96 bg-background border border-border shadow-2xl
               bottom-0 left-0 right-0 rounded-t-2xl
               sm:bottom-20 sm:right-4 sm:left-auto sm:rounded-xl"
        @keydown="onKeydown"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
          <div>
            <h2 id="feedback-panel-title" class="text-sm font-semibold text-foreground">
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
          <div>
            <label for="feedback-type" class="block text-xs font-medium text-muted-foreground mb-1">Tür</label>
            <select
              id="feedback-type"
              v-model="type"
              class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            >
              <option v-for="opt in FEEDBACK_TYPES" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>

          <div>
            <label for="feedback-description" class="block text-xs font-medium text-muted-foreground mb-1">Açıklama</label>
            <textarea
              id="feedback-description"
              ref="descriptionRef"
              v-model="description"
              rows="3"
              maxlength="2000"
              placeholder="Ne gördün, ne olmasını bekliyordun, ne oldu..."
              class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
            />
            <p class="text-right text-xs text-muted-foreground mt-0.5 tabular-nums">{{ description.length }}/2000</p>
          </div>

          <!-- Attachments -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium text-muted-foreground">Ekler</span>
              <span class="text-xs text-muted-foreground">{{ attachments.length }}/{{ MAX_ATTACHMENTS }} · max {{ MAX_SIZE_MB }} MB</span>
            </div>
            <div v-if="attachments.length > 0" class="flex gap-2 mb-2 flex-wrap">
              <div
                v-for="(att, i) in attachments"
                :key="i"
                class="relative size-16 rounded-md overflow-hidden border border-border bg-muted"
              >
                <img :src="att.preview" :alt="`Ek ${i + 1}`" class="size-full object-cover" />
                <button
                  type="button"
                  class="absolute top-0.5 right-0.5 size-4 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer hover:bg-black/80 transition-colors"
                  @click="removeAttachment(i)"
                >
                  <X class="size-2.5" />
                </button>
              </div>
            </div>
            <div v-if="attachments.length < MAX_ATTACHMENTS" class="flex gap-2">
              <button
                type="button"
                class="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs border border-border rounded-md hover:bg-muted cursor-pointer transition-colors text-muted-foreground hover:text-foreground"
                @click="fileInputRef?.click()"
              >
                <Paperclip class="size-3.5" />
                Dosya ekle
              </button>
              <button
                type="button"
                class="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs border border-border rounded-md hover:bg-muted cursor-pointer transition-colors text-muted-foreground hover:text-foreground"
                @click="captureScreen"
              >
                <Camera class="size-3.5" />
                Ekran görüntüsü
              </button>
            </div>
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
    </Transition>
  </Teleport>
</template>

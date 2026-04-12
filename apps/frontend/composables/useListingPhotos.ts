import { toast } from "vue-sonner"
import { apiFetch } from "~/utils/api"

const MAX_PHOTO_SIZE = 10 * 1024 * 1024
const MAX_PHOTOS = 6

export function useListingPhotos(initialExistingPhotos: string[] = []) {
  const selectedFiles = ref<File[]>([])
  const existingPhotos = ref<string[]>([...initialExistingPhotos])
  const submitting = ref(false)
  const submitError = ref<string | null>(null)
  const uploadedCount = ref(0)

  const previewUrls = new Map<File, string>()

  const totalPhotos = computed(() => existingPhotos.value.length + selectedFiles.value.length)

  function previewUrl(file: File): string {
    if (!previewUrls.has(file)) {
      previewUrls.set(file, URL.createObjectURL(file))
    }
    return previewUrls.get(file)!
  }

  function onFileChange(e: Event) {
    const input = e.target as HTMLInputElement
    if (!input.files) return
    const incoming = Array.from(input.files)
    const oversized = incoming.filter(f => f.size > MAX_PHOTO_SIZE)
    if (oversized.length > 0) {
      toast.error(`${oversized.length} dosya 10MB sınırını aşıyor, atlandı.`)
    }
    const valid = incoming.filter(f => f.size <= MAX_PHOTO_SIZE)
    const remaining = MAX_PHOTOS - totalPhotos.value
    selectedFiles.value = [...selectedFiles.value, ...valid.slice(0, remaining)]
    input.value = ""
  }

  function removeFile(index: number) {
    const file = selectedFiles.value[index]
    if (file) {
      const url = previewUrls.get(file)
      if (url) URL.revokeObjectURL(url)
      previewUrls.delete(file)
    }
    selectedFiles.value = selectedFiles.value.filter((_, i) => i !== index)
  }

  async function uploadFiles(slug: string): Promise<number> {
    const files = selectedFiles.value
    if (files.length === 0) return 0
    uploadedCount.value = 0
    const results = await Promise.allSettled(
      files.map(async (file) => {
        const fd = new FormData()
        fd.append("file", file)
        await apiFetch(`/api/listings/${slug}/photos`, { method: "POST", body: fd })
        uploadedCount.value++
      }),
    )
    return results.filter(r => r.status === "rejected").length
  }

  onUnmounted(() => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url))
    previewUrls.clear()
  })

  return {
    selectedFiles,
    existingPhotos,
    submitting,
    submitError,
    uploadedCount,
    totalPhotos,
    previewUrl,
    onFileChange,
    removeFile,
    uploadFiles,
    MAX_PHOTO_SIZE,
    MAX_PHOTOS,
  }
}

import { toast } from "vue-sonner"
import { apiFetch } from "~/utils/api"
import { correctAndCompress } from "~/utils/image-utils"
import { PHOTO_MAX_SIZE, PHOTO_MAX_COUNT } from "~/utils/listing-constants"

const MAX_PHOTO_SIZE = PHOTO_MAX_SIZE
const MAX_PHOTOS = PHOTO_MAX_COUNT

type PendingPhoto = {
  file: File
  blob: Blob
  url: string
  rotation: 0 | 90 | 180 | 270
}

export function useListingPhotos(initialExistingPhotos: string[] = []) {
  const pendingPhotos = ref<PendingPhoto[]>([])
  const existingPhotos = ref<string[]>([...initialExistingPhotos])
  const submitting = ref(false)
  const submitError = ref<string | null>(null)
  const uploadedCount = ref(0)

  const totalPhotos = computed(() => existingPhotos.value.length + pendingPhotos.value.length)

  function previewUrl(index: number): string {
    return pendingPhotos.value[index]?.url ?? ""
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
    for (const file of valid.slice(0, remaining)) {
      void (async () => {
        const result = await correctAndCompress(file, 0)
        pendingPhotos.value.push({ file, blob: result.blob, url: result.url, rotation: 0 })
      })()
    }
    input.value = ""
  }

  async function rotateFile(index: number) {
    const p = pendingPhotos.value[index]
    if (!p) return
    const newRot = ((p.rotation + 90) % 360) as 0 | 90 | 180 | 270
    URL.revokeObjectURL(p.url)
    const result = await correctAndCompress(p.file, newRot)
    pendingPhotos.value[index] = { ...p, blob: result.blob, url: result.url, rotation: newRot }
  }

  function removeFile(index: number) {
    const p = pendingPhotos.value[index]
    if (p) URL.revokeObjectURL(p.url)
    pendingPhotos.value.splice(index, 1)
  }

  async function uploadFiles(slug: string): Promise<number> {
    if (pendingPhotos.value.length === 0) return 0
    uploadedCount.value = 0
    const results = await Promise.allSettled(
      pendingPhotos.value.map(async (p) => {
        const fd = new FormData()
        fd.append("file", p.blob, p.file.name.replace(/\.[^.]+$/, ".jpg"))
        await apiFetch(`/api/listings/${slug}/photos`, { method: "POST", body: fd })
        uploadedCount.value++
      }),
    )
    return results.filter(r => r.status === "rejected").length
  }

  onUnmounted(() => {
    pendingPhotos.value.forEach(p => URL.revokeObjectURL(p.url))
  })

  return {
    pendingPhotos,
    existingPhotos,
    submitting,
    submitError,
    uploadedCount,
    totalPhotos,
    previewUrl,
    onFileChange,
    rotateFile,
    removeFile,
    uploadFiles,
    MAX_PHOTO_SIZE,
    MAX_PHOTOS,
  }
}

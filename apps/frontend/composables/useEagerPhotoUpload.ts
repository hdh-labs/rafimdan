import { toast } from "vue-sonner"
import { apiFetch, ApiError } from "~/utils/api"
import { correctAndCompress } from "~/utils/image-utils"
import type { ApiResponse } from "@rafimdan/shared"

const MAX_PHOTO_SIZE = 10 * 1024 * 1024
const MAX_PHOTOS = 6

type PhotoStatus = "uploading" | "done" | "error"

export type PhotoEntry = {
  file: File
  previewUrl: string
  status: PhotoStatus
  tempKey: string | null
  rotation: 0 | 90 | 180 | 270
}

export function useEagerPhotoUpload() {
  const photos = ref<PhotoEntry[]>([])

  const totalCount = computed(() => photos.value.length)
  const isUploading = computed(() => photos.value.some(p => p.status === "uploading"))
  const doneKeys = computed(() =>
    photos.value
      .filter(p => p.status === "done" && p.tempKey)
      .map(p => p.tempKey!),
  )
  const doneCount = computed(() => photos.value.filter(p => p.status === "done").length)

  async function uploadEntry(entry: PhotoEntry) {
    try {
      const corrected = await correctAndCompress(entry.file, entry.rotation)
      URL.revokeObjectURL(entry.previewUrl)
      entry.previewUrl = corrected.url

      const fd = new FormData()
      fd.append("file", corrected.blob, entry.file.name.replace(/\.[^.]+$/, ".jpg"))
      const res = await apiFetch<ApiResponse<{ key: string }>>("/api/listings/photos/temp", {
        method: "POST",
        body: fd,
        signal: AbortSignal.timeout(30_000),
      })
      entry.tempKey = res.data.key
      entry.status = "done"
    } catch (err) {
      entry.status = "error"
      toast.error(err instanceof ApiError ? err.message : "Fotoğraf yüklenemedi, tekrar dene")
    }
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
    for (const file of valid) {
      if (photos.value.length >= MAX_PHOTOS) break
      photos.value.push({
        file,
        previewUrl: URL.createObjectURL(file),
        status: "uploading",
        tempKey: null,
        rotation: 0,
      })
      void uploadEntry(photos.value.at(-1)!)
    }
    input.value = ""
  }

  function rotate(index: number) {
    const entry = photos.value[index]
    if (!entry || entry.status === "uploading") return
    entry.rotation = ((entry.rotation + 90) % 360) as 0 | 90 | 180 | 270
    entry.status = "uploading"
    entry.tempKey = null
    void uploadEntry(entry)
  }

  function retry(index: number) {
    const entry = photos.value[index]
    if (!entry || entry.status !== "error") return
    entry.status = "uploading"
    void uploadEntry(entry)
  }

  function remove(index: number) {
    const entry = photos.value[index]
    if (entry) URL.revokeObjectURL(entry.previewUrl)
    photos.value.splice(index, 1)
  }

  function setCover(index: number) {
    if (index === 0 || !photos.value[index]) return
    const [entry] = photos.value.splice(index, 1)
    photos.value.unshift(entry!)
  }

  onUnmounted(() => {
    photos.value.forEach(p => URL.revokeObjectURL(p.previewUrl))
  })

  return {
    photos,
    totalCount,
    isUploading,
    doneKeys,
    doneCount,
    onFileChange,
    rotate,
    retry,
    remove,
    setCover,
    MAX_PHOTOS,
  }
}

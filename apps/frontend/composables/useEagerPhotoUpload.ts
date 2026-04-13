import { toast } from "vue-sonner"
import { apiFetch, ApiError } from "~/utils/api"
import type { ApiResponse } from "@rafimdan/shared"

const MAX_PHOTO_SIZE = 10 * 1024 * 1024
const MAX_PHOTOS = 6
const MAX_DIMENSION = 1920
const JPEG_QUALITY = 0.85

type PhotoStatus = "uploading" | "done" | "error"

export type PhotoEntry = {
  file: File
  previewUrl: string
  status: PhotoStatus
  tempKey: string | null
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

  function compress(file: File): Promise<File> {
    return new Promise((resolve) => {
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(objectUrl)
        let { width, height } = img
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width >= height) {
            height = Math.round((height * MAX_DIMENSION) / width)
            width = MAX_DIMENSION
          } else {
            width = Math.round((width * MAX_DIMENSION) / height)
            height = MAX_DIMENSION
          }
        }
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(file); return }
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }))
          },
          "image/jpeg",
          JPEG_QUALITY,
        )
      }
      img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file) }
      img.src = objectUrl
    })
  }

  async function uploadEntry(entry: PhotoEntry) {
    try {
      const compressed = await compress(entry.file)
      const fd = new FormData()
      fd.append("file", compressed)
      const res = await apiFetch<ApiResponse<{ key: string }>>("/api/listings/photos/temp", {
        method: "POST",
        body: fd,
      })
      entry.tempKey = res.data.key
      entry.status = "done"
    } catch (err) {
      entry.status = "error"
      toast.error(err instanceof ApiError ? err.message : "Fotoğraf yüklenemedi. Yeniden dene.")
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
    const remaining = MAX_PHOTOS - totalCount.value
    for (const file of valid.slice(0, remaining)) {
      photos.value.push({
        file,
        previewUrl: URL.createObjectURL(file),
        status: "uploading",
        tempKey: null,
      })
      void uploadEntry(photos.value.at(-1)!)
    }
    input.value = ""
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
    retry,
    remove,
    setCover,
    MAX_PHOTOS,
  }
}

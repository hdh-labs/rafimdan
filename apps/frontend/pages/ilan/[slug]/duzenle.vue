<script setup lang="ts">
import { Save, Trash2, ImagePlus, X, Loader2 } from "lucide-vue-next"
import type {
  ListingDetail,
  CategoryTree,
  ApiResponse,
  ListingCondition,
  ListingPriceType,
  ListingStatus,
} from "@rafimdan/shared"
import { apiFetch, ApiError } from "~/utils/api"

definePageMeta({ middleware: ["auth"] })

const route = useRoute()
const slug = route.params.slug as string
const authStore = useAuthStore()

const {
  data: listing,
  pending: listingPending,
  error: listingError,
} = await useAsyncData<ListingDetail>(
  `listing-edit-${slug}`,
  async () => {
    const res = await apiFetch<ApiResponse<ListingDetail>>(`/api/listings/${slug}`)
    return res.data
  },
)

const { data: categoriesData } = await useAsyncData<CategoryTree[]>(
  "categories-edit",
  async () => {
    const res = await apiFetch<ApiResponse<CategoryTree[]>>("/api/categories")
    return res.data
  },
)

const categories = computed(() => categoriesData.value ?? [])

if (!listingPending.value && (listingError.value || !listing.value)) {
  throw createError({ statusCode: 404, message: "İlan bulunamadı" })
}

if (listing.value && listing.value.seller.id !== authStore.user?.id) {
  await navigateTo(`/ilan/${slug}`)
}

const CONDITION_OPTIONS: { value: ListingCondition; label: string }[] = [
  { value: "new", label: "Yeni" },
  { value: "like_new", label: "Az Kullanılmış" },
  { value: "good", label: "İyi" },
  { value: "fair", label: "Fena Değil" },
]

const PRICE_TYPE_OPTIONS: { value: ListingPriceType; label: string }[] = [
  { value: "fixed", label: "Sabit" },
  { value: "negotiable", label: "Pazarlığa Açık" },
  { value: "free", label: "Ücretsiz" },
]

const STATUS_OPTIONS: { value: ListingStatus; label: string }[] = [
  { value: "active", label: "Aktif" },
  { value: "reserved", label: "Rezerve" },
  { value: "sold", label: "Satıldı" },
]

const initialListing = listing.value!

const form = reactive({
  title: initialListing.title,
  category_id: initialListing.category.id,
  condition: initialListing.condition as ListingCondition,
  price_type: initialListing.price_type as ListingPriceType,
  price: (initialListing.price ?? "") as number | "",
  city: initialListing.city,
  district: initialListing.district ?? "",
  description: initialListing.description ?? "",
})

const currentStatus = ref<ListingStatus>(initialListing.status)
const existingPhotos = ref<string[]>([...initialListing.photos])
const newFiles = ref<File[]>([])

const totalPhotos = computed(() => existingPhotos.value.length + newFiles.value.length)

const submitting = ref(false)
const deleting = ref(false)
const statusChanging = ref(false)
const deletingPhotoIndex = ref<number | null>(null)
const error = ref<string | null>(null)

watch(() => form.price_type, (val) => {
  if (val === "free") form.price = ""
})

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  const incoming = Array.from(input.files)
  const remaining = 6 - totalPhotos.value
  newFiles.value = [...newFiles.value, ...incoming.slice(0, remaining)]
  input.value = ""
}

function removeNewFile(i: number) {
  newFiles.value = newFiles.value.filter((_, idx) => idx !== i)
}

function previewUrl(file: File) {
  return URL.createObjectURL(file)
}

async function deleteExistingPhoto(index: number) {
  deletingPhotoIndex.value = index
  error.value = null
  try {
    await apiFetch(`/api/listings/${slug}/photos/${index}`, { method: "DELETE" })
    existingPhotos.value = existingPhotos.value.filter((_, i) => i !== index)
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : "Fotoğraf silinemedi."
  } finally {
    deletingPhotoIndex.value = null
  }
}

async function save() {
  error.value = null

  if (!form.title || !form.category_id || !form.condition || !form.city) {
    error.value = "Zorunlu alanları doldurun."
    return
  }
  if (form.price_type !== "free" && form.price === "") {
    error.value = "Fiyat giriniz."
    return
  }

  submitting.value = true
  try {
    const body: Record<string, unknown> = {
      title: form.title,
      category_id: form.category_id,
      condition: form.condition,
      price_type: form.price_type,
      city: form.city,
    }
    if (form.district) body.district = form.district
    if (form.description) body.description = form.description
    if (form.price !== "") body.price = Number(form.price)

    await apiFetch<ApiResponse<ListingDetail>>(`/api/listings/${slug}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    })

    for (const file of newFiles.value) {
      const fd = new FormData()
      fd.append("file", file)
      await apiFetch(`/api/listings/${slug}/photos`, { method: "POST", body: fd })
    }

    await navigateTo(`/ilan/${slug}`)
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : "Bir hata oluştu."
  } finally {
    submitting.value = false
  }
}

async function changeStatus(status: ListingStatus) {
  if (statusChanging.value) return
  statusChanging.value = true
  error.value = null
  try {
    await apiFetch(`/api/listings/${slug}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    })
    currentStatus.value = status
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : "Durum değiştirilemedi."
  } finally {
    statusChanging.value = false
  }
}

async function deleteListing() {
  if (!confirm("İlanı kalıcı olarak silmek istediğinize emin misiniz?")) return
  deleting.value = true
  error.value = null
  try {
    await apiFetch(`/api/listings/${slug}`, { method: "DELETE" })
    await navigateTo("/ilanlar")
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : "İlan silinemedi."
    deleting.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-foreground">İlanı Düzenle</h1>
      <button
        type="button"
        :disabled="deleting"
        class="flex items-center gap-1.5 text-sm text-destructive hover:opacity-70 cursor-pointer transition-opacity disabled:opacity-40"
        @click="deleteListing"
      >
        <Trash2 class="size-4" />
        İlanı Sil
      </button>
    </div>

    <div class="rounded-xl border border-border p-4 space-y-3">
      <p class="text-sm font-medium text-foreground">İlan Durumu</p>
      <div class="flex gap-2">
        <button
          v-for="opt in STATUS_OPTIONS"
          :key="opt.value"
          type="button"
          :disabled="statusChanging"
          class="px-4 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors disabled:opacity-50"
          :class="currentStatus === opt.value
            ? 'border-foreground bg-foreground text-background font-medium'
            : 'border-border hover:bg-muted'"
          @click="changeStatus(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <form class="space-y-5" @submit.prevent="save">
      <div>
        <label class="block text-sm font-medium text-foreground mb-1">
          Başlık <span class="text-destructive">*</span>
        </label>
        <input
          v-model="form.title"
          type="text"
          maxlength="100"
          class="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-foreground mb-1">
          Kategori <span class="text-destructive">*</span>
        </label>
        <select
          v-model="form.category_id"
          class="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
        >
          <template v-for="cat in categories" :key="cat.id">
            <option :value="cat.id">{{ cat.name }}</option>
            <option v-for="child in cat.children" :key="child.id" :value="child.id">
              &nbsp;&nbsp;{{ child.name }}
            </option>
          </template>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-foreground mb-2">
          Ürün Durumu <span class="text-destructive">*</span>
        </label>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <label
            v-for="opt in CONDITION_OPTIONS"
            :key="opt.value"
            class="flex items-center justify-center py-2 px-3 rounded-xl border text-sm cursor-pointer transition-colors"
            :class="form.condition === opt.value
              ? 'border-foreground bg-foreground text-background font-medium'
              : 'border-border hover:bg-muted'"
          >
            <input v-model="form.condition" type="radio" :value="opt.value" class="sr-only" />
            {{ opt.label }}
          </label>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-foreground mb-2">
          Fiyat Tipi <span class="text-destructive">*</span>
        </label>
        <div class="flex gap-2">
          <label
            v-for="opt in PRICE_TYPE_OPTIONS"
            :key="opt.value"
            class="flex items-center justify-center py-2 px-4 rounded-xl border text-sm cursor-pointer transition-colors flex-1"
            :class="form.price_type === opt.value
              ? 'border-foreground bg-foreground text-background font-medium'
              : 'border-border hover:bg-muted'"
          >
            <input v-model="form.price_type" type="radio" :value="opt.value" class="sr-only" />
            {{ opt.label }}
          </label>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-foreground mb-1">
          Fiyat (₺)
          <span v-if="form.price_type !== 'free'" class="text-destructive">*</span>
        </label>
        <input
          v-model.number="form.price"
          type="number"
          min="0"
          :disabled="form.price_type === 'free'"
          class="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-40 disabled:cursor-not-allowed"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-foreground mb-1">
            Şehir <span class="text-destructive">*</span>
          </label>
          <input
            v-model="form.city"
            type="text"
            class="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-foreground mb-1">İlçe</label>
          <input
            v-model="form.district"
            type="text"
            class="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-foreground mb-1">Açıklama</label>
        <textarea
          v-model="form.description"
          maxlength="2000"
          rows="4"
          class="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
        />
        <p class="text-xs text-muted-foreground mt-1 text-right">
          {{ form.description.length }} / 2000
        </p>
      </div>

      <div>
        <label class="block text-sm font-medium text-foreground mb-2">
          Fotoğraflar
          <span class="font-normal text-muted-foreground">(max 6)</span>
        </label>

        <div class="flex flex-wrap gap-2">
          <div
            v-for="(url, i) in existingPhotos"
            :key="`existing-${i}`"
            class="relative size-20 rounded-xl overflow-hidden border border-border"
          >
            <img :src="url" alt="Mevcut fotoğraf" class="size-full object-cover" />
            <button
              type="button"
              :disabled="deletingPhotoIndex === i"
              class="absolute top-0.5 right-0.5 size-5 rounded-full bg-black/60 flex items-center justify-center cursor-pointer disabled:opacity-50"
              @click="deleteExistingPhoto(i)"
            >
              <Loader2 v-if="deletingPhotoIndex === i" class="size-3 text-white animate-spin" />
              <X v-else class="size-3 text-white" />
            </button>
          </div>

          <div
            v-for="(file, i) in newFiles"
            :key="`new-${i}`"
            class="relative size-20 rounded-xl overflow-hidden border border-border border-dashed"
          >
            <img :src="previewUrl(file)" :alt="file.name" class="size-full object-cover" />
            <button
              type="button"
              class="absolute top-0.5 right-0.5 size-5 rounded-full bg-black/60 flex items-center justify-center cursor-pointer"
              @click="removeNewFile(i)"
            >
              <X class="size-3 text-white" />
            </button>
          </div>

          <label
            v-if="totalPhotos < 6"
            class="size-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-muted transition-colors"
          >
            <ImagePlus class="size-5 text-muted-foreground" />
            <span class="text-xs text-muted-foreground">Ekle</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              class="sr-only"
              @change="onFileChange"
            />
          </label>
        </div>
      </div>

      <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

      <div class="flex gap-3">
        <NuxtLink
          :to="`/ilan/${slug}`"
          class="flex-1 text-center border border-border py-2.5 rounded-xl text-sm cursor-pointer hover:bg-muted transition-colors"
        >
          Vazgeç
        </NuxtLink>
        <button
          type="submit"
          :disabled="submitting"
          class="flex-1 bg-foreground text-background py-2.5 rounded-xl text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Loader2 v-if="submitting" class="size-4 animate-spin" />
          <Save v-else class="size-4" />
          {{ submitting ? "Kaydediliyor..." : "Kaydet" }}
        </button>
      </div>
    </form>
  </div>
</template>

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
import { IL_NAMES, getIlceler } from "~/utils/turkey-locations"

definePageMeta({ middleware: ["auth"], ssr: false })

const route = useRoute()
const slug = route.params.slug as string
const authStore = useAuthStore()

const { data: listing, pending: listingPending, error: listingError } = useAsyncData<ListingDetail>(
  `listing-edit-${slug}`,
  async () => {
    const res = await apiFetch<ApiResponse<ListingDetail>>(`/api/listings/${slug}`)
    return res.data
  },
)

const { data: categoriesData } = useAsyncData<CategoryTree[]>(
  "categories-edit",
  async () => {
    const res = await apiFetch<ApiResponse<CategoryTree[]>>("/api/categories")
    return res.data
  },
)

const categories = computed(() => categoriesData.value ?? [])

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

const form = reactive({
  title: "",
  category_id: "",
  condition: "good" as ListingCondition,
  price_type: "fixed" as ListingPriceType,
  price: "" as number | "",
  city: "",
  district: "",
  description: "",
})

const errors = reactive<Record<string, string>>({})
const currentStatus = ref<ListingStatus>("active")
const existingPhotos = ref<string[]>([])
const newFiles = ref<File[]>([])

const totalPhotos = computed(() => existingPhotos.value.length + newFiles.value.length)
const ilceler = computed(() => getIlceler(form.city))

const submitting = ref(false)
const deleting = ref(false)
const showDeleteConfirm = ref(false)
const statusChanging = ref(false)
const deletingPhotoIndex = ref<number | null>(null)
const submitError = ref<string | null>(null)

watch(listing, (val) => {
  if (!val) return
  form.title = val.title
  form.category_id = val.category.id
  form.condition = val.condition as ListingCondition
  form.price_type = val.price_type as ListingPriceType
  form.price = val.price ?? ""
  form.city = IL_NAMES.includes(val.city) ? val.city : ""
  form.district = val.district ?? ""
  form.description = val.description ?? ""
  currentStatus.value = val.status as ListingStatus
  existingPhotos.value = [...val.photos]
}, { immediate: true })

watchEffect(() => {
  if (!listing.value || !authStore.user) return
  if (listing.value.seller.id !== authStore.user.id) {
    navigateTo(`/ilan/${slug}`)
  }
})

watch(() => form.city, () => {
  if (!getIlceler(form.city).includes(form.district)) form.district = ""
  delete errors.city
})

watch(() => form.price_type, (val) => {
  if (val === "free") form.price = ""
  delete errors.price
})

watch(() => form.title, () => { delete errors.title })
watch(() => form.category_id, () => { delete errors.category_id })
watch(() => form.condition, () => { delete errors.condition })
watch(() => form.price, () => { delete errors.price })

function validate(): boolean {
  const e: Record<string, string> = {}

  const title = form.title.trim()
  if (!title) e.title = "Başlık zorunludur."
  else if (title.length < 3) e.title = "Başlık en az 3 karakter olmalıdır."
  else if (title.length > 100) e.title = "Başlık en fazla 100 karakter olabilir."

  if (!form.category_id) e.category_id = "Kategori seçiniz."
  if (!form.condition) e.condition = "Ürün durumu seçiniz."
  if (!form.city) e.city = "Şehir seçiniz."

  if (form.price_type !== "free") {
    if (form.price === "" || form.price === null) e.price = "Fiyat zorunludur."
    else if (Number(form.price) <= 0) e.price = "Fiyat 0'dan büyük olmalıdır."
  }

  Object.assign(errors, e)
  return Object.keys(e).length === 0
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  const incoming = Array.from(input.files)
  const remaining = 6 - totalPhotos.value
  newFiles.value = [...newFiles.value, ...incoming.slice(0, remaining)]
  input.value = ""
}

const previewUrls = new Map<File, string>()

function previewUrl(file: File): string {
  if (!previewUrls.has(file)) {
    previewUrls.set(file, URL.createObjectURL(file))
  }
  return previewUrls.get(file)!
}

function removeNewFile(i: number) {
  const file = newFiles.value[i]
  if (file) {
    const url = previewUrls.get(file)
    if (url) URL.revokeObjectURL(url)
    previewUrls.delete(file)
  }
  newFiles.value = newFiles.value.filter((_, idx) => idx !== i)
}

onUnmounted(() => {
  previewUrls.forEach((url) => URL.revokeObjectURL(url))
  previewUrls.clear()
})

async function deleteExistingPhoto(index: number) {
  deletingPhotoIndex.value = index
  submitError.value = null
  try {
    await apiFetch(`/api/listings/${slug}/photos/${index}`, { method: "DELETE" })
    existingPhotos.value = existingPhotos.value.filter((_, i) => i !== index)
  } catch (err) {
    submitError.value = err instanceof ApiError ? err.message : "Fotoğraf silinemedi."
  } finally {
    deletingPhotoIndex.value = null
  }
}

async function save() {
  submitError.value = null
  if (!validate()) return

  submitting.value = true
  try {
    const body: Record<string, unknown> = {
      title: form.title.trim(),
      category_id: form.category_id,
      condition: form.condition,
      price_type: form.price_type,
      city: form.city,
    }
    if (form.district) body.district = form.district
    if (form.description.trim()) body.description = form.description.trim()
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
    submitError.value = err instanceof ApiError ? err.message : "Bir hata oluştu, tekrar deneyin."
  } finally {
    submitting.value = false
  }
}

async function changeStatus(status: ListingStatus) {
  if (statusChanging.value) return
  statusChanging.value = true
  submitError.value = null
  try {
    await apiFetch(`/api/listings/${slug}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    })
    currentStatus.value = status
  } catch (err) {
    submitError.value = err instanceof ApiError ? err.message : "Durum değiştirilemedi."
  } finally {
    statusChanging.value = false
  }
}

async function confirmDelete() {
  deleting.value = true
  showDeleteConfirm.value = false
  submitError.value = null
  try {
    await apiFetch(`/api/listings/${slug}`, { method: "DELETE" })
    await navigateTo("/ilanlar")
  } catch (err) {
    submitError.value = err instanceof ApiError ? err.message : "İlan silinemedi."
    deleting.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8 space-y-6">
    <div v-if="listingPending" class="flex items-center justify-center py-20">
      <Loader2 class="size-6 animate-spin text-muted-foreground" />
    </div>

    <div v-else-if="listingError || !listing" class="text-center py-20 text-muted-foreground text-sm">
      İlan bulunamadı.
    </div>

    <template v-else>
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-bold text-foreground">İlanı Düzenle</h1>
        <button
          v-if="!showDeleteConfirm"
          type="button"
          :disabled="deleting"
          class="flex items-center gap-1.5 text-sm text-destructive hover:opacity-70 cursor-pointer transition-opacity disabled:opacity-40"
          @click="showDeleteConfirm = true"
        >
          <Trash2 class="size-4" />
          İlanı Sil
        </button>
      </div>

      <div
        v-if="showDeleteConfirm"
        class="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3"
      >
        <p class="text-sm font-medium text-foreground">
          <span class="text-destructive">"{{ listing.title }}"</span> ilanını kalıcı olarak silmek istediğine emin misin?
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            :disabled="deleting"
            class="px-4 py-1.5 text-sm bg-destructive text-white rounded-lg cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
            @click="confirmDelete"
          >
            <Loader2 v-if="deleting" class="size-3.5 animate-spin" />
            Evet, sil
          </button>
          <button
            type="button"
            class="px-4 py-1.5 text-sm border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors"
            @click="showDeleteConfirm = false"
          >
            Vazgeç
          </button>
        </div>
      </div>

      <!-- İlan Durumu -->
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

      <form class="space-y-5" novalidate @submit.prevent="save">

        <!-- Başlık -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1">
            Başlık <span class="text-destructive">*</span>
          </label>
          <input
            v-model="form.title"
            type="text"
            maxlength="100"
            :class="[
              'w-full px-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-1 transition-colors',
              errors.title ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-ring',
            ]"
          />
          <p v-if="errors.title" class="mt-1 text-xs text-destructive">{{ errors.title }}</p>
        </div>

        <!-- Kategori -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1">
            Kategori <span class="text-destructive">*</span>
          </label>
          <select
            v-model="form.category_id"
            :class="[
              'w-full px-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-1 cursor-pointer transition-colors',
              errors.category_id ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-ring',
            ]"
          >
            <template v-for="cat in categories" :key="cat.id">
              <option :value="cat.id">{{ cat.name }}</option>
              <option v-for="child in cat.children" :key="child.id" :value="child.id">
                &nbsp;&nbsp;{{ child.name }}
              </option>
            </template>
          </select>
          <p v-if="errors.category_id" class="mt-1 text-xs text-destructive">{{ errors.category_id }}</p>
        </div>

        <!-- Ürün Durumu -->
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
                : errors.condition
                  ? 'border-destructive hover:bg-muted'
                  : 'border-border hover:bg-muted'"
            >
              <input v-model="form.condition" type="radio" :value="opt.value" class="sr-only" />
              {{ opt.label }}
            </label>
          </div>
          <p v-if="errors.condition" class="mt-1 text-xs text-destructive">{{ errors.condition }}</p>
        </div>

        <!-- Fiyat Tipi -->
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

        <!-- Fiyat -->
        <div v-if="form.price_type !== 'free'">
          <label class="block text-sm font-medium text-foreground mb-1">
            {{ form.price_type === 'negotiable' ? 'Başlangıç Fiyatı (₺)' : 'Fiyat (₺)' }} <span class="text-destructive">*</span>
          </label>
          <input
            v-model.number="form.price"
            type="number"
            min="1"
            :class="[
              'w-full px-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-1 transition-colors',
              errors.price ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-ring',
            ]"
          />
          <p v-if="errors.price" class="mt-1 text-xs text-destructive">{{ errors.price }}</p>
        </div>

        <!-- Şehir / İlçe -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">
              Şehir <span class="text-destructive">*</span>
            </label>
            <select
              v-model="form.city"
              :class="[
                'w-full px-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-1 cursor-pointer transition-colors',
                errors.city ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-ring',
              ]"
            >
              <option value="" disabled>Seçiniz</option>
              <option v-for="il in IL_NAMES" :key="il" :value="il">{{ il }}</option>
            </select>
            <p v-if="errors.city" class="mt-1 text-xs text-destructive">{{ errors.city }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">İlçe</label>
            <select
              v-model="form.district"
              :disabled="!form.city"
              class="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="">Seçiniz</option>
              <option v-for="ilce in ilceler" :key="ilce" :value="ilce">{{ ilce }}</option>
            </select>
          </div>
        </div>

        <!-- Açıklama -->
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

        <!-- Fotoğraflar -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            Fotoğraflar
            <span class="font-normal text-muted-foreground">(max 6, jpeg/png/webp)</span>
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
              class="relative size-20 rounded-xl overflow-hidden border border-dashed border-border"
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

        <!-- Submit error -->
        <p
          v-if="submitError"
          class="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-md px-3 py-2"
        >
          {{ submitError }}
        </p>

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
    </template>
  </div>
</template>

<script setup lang="ts">
import { Upload, X, ImagePlus, MessageCircle, Loader2, RefreshCw, Star, RotateCw } from "lucide-vue-next"
import { toast } from "vue-sonner"
import type { ListingDetail, CategoryTree, ApiResponse, ListingType, ListingCondition, ListingPriceType, ListingMeetingType, ListingDirection } from "@rafimdan/shared"
import { apiFetch, ApiError } from "~/utils/api"
import { IL_NAMES, getIlceler } from "~/utils/turkey-locations"

definePageMeta({ middleware: ["auth"] })

useSeoMeta({
  title: "İlan Ver — Rafımdan",
  robots: "noindex, nofollow",
})

const { data: catsRes } = await useFetch<ApiResponse<CategoryTree[]>>("/api/categories")
const categories = computed(() => catsRes.value?.data ?? [])

const authStore = useAuthStore()
const route = useRoute()

const initialListingType = route.query.listing_type === "service" ? "service" : "item"

const form = reactive({
  listing_type: initialListingType as ListingType,
  direction: "offer" as ListingDirection,
  title: "",
  category_id: "",
  condition: "" as ListingCondition | "",
  price_type: "fixed" as ListingPriceType,
  price: "" as number | "",
  city: IL_NAMES.includes(authStore.user?.city ?? "") ? (authStore.user?.city ?? "") : "",
  district: "",
  description: "",
  meeting_type: "" as ListingMeetingType | "",
})

const errors = reactive<Record<string, string>>({})
const submitting = ref(false)
const submitError = ref<string | null>(null)
const pendingSubmit = ref(false)
const submitted = ref(false)

const isDirty = computed(() =>
  !!form.title || !!form.category_id || !!form.description || photos.value?.length > 0,
)

onBeforeRouteLeave(() => {
  if (isDirty.value && !submitted.value && !submitting.value) {
    return window.confirm("Kaydedilmemiş değişiklikler var. Sayfadan çıkmak istediğine emin misin?")
  }
})

const {
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
} = useEagerPhotoUpload()

watch(isUploading, (uploading) => {
  if (!uploading && pendingSubmit.value) {
    const errorCount = photos.value.filter(p => p.status === "error").length
    if (errorCount > 0) {
      toast.warning(`${errorCount} fotoğraf yüklenemedi.`, {
        description: "Hatalı olanları tekrar deneyebilir veya diğer fotoğraflarla devam edebilirsin.",
        action: { label: "Devam et", onClick: () => void doSubmit() },
        duration: 10000,
      })
      pendingSubmit.value = false
      return
    }
    pendingSubmit.value = false
    void doSubmit()
  }
})

const ilceler = computed(() => getIlceler(form.city))

const filteredCategories = computed(() =>
  form.listing_type === "service"
    ? categories.value.filter((c) => c.slug === "hizmet")
    : categories.value.filter((c) => c.slug !== "hizmet"),
)

watch(() => form.city, () => {
  form.district = ""
  delete errors.city
})

watch(() => form.listing_type, () => {
  form.category_id = ""
  form.condition = ""
  Object.keys(errors).forEach((k) => delete errors[k])
})

watch(() => form.price_type, (val) => {
  if (val === "free" || val === "trade") form.price = ""
  delete errors.price
})

watch(() => form.title, () => { delete errors.title })
watch(() => form.category_id, () => { delete errors.category_id })
watch(() => form.condition, () => { delete errors.condition })
watch(() => form.price, () => { delete errors.price })
watch(doneKeys, (keys) => { if (keys.length > 0) delete errors.photos })

const CONDITION_OPTIONS = [
  { value: "new", label: "Yeni" },
  { value: "like_new", label: "Az Kullanılmış" },
  { value: "good", label: "İyi" },
  { value: "fair", label: "Orta" },
] as const

function validate(): boolean {
  const e: Record<string, string> = {}

  const title = form.title.trim()
  if (!title) e.title = "Başlık zorunludur."
  else if (title.length < 3) e.title = "Başlık en az 3 karakter olmalıdır."
  else if (title.length > 100) e.title = "Başlık en fazla 100 karakter olabilir."

  if (!form.category_id) e.category_id = "Kategori seçiniz."
  if (!form.city) e.city = "Şehir seçiniz."

  if (form.listing_type === "item" && form.direction === "offer" && !form.condition) {
    e.condition = "Ürün durumu seçiniz."
  }

  const priceOptional = form.direction === "request" || form.price_type === "free" || form.price_type === "trade"
  if (!priceOptional && form.price !== "") {
    if (Number(form.price) <= 0) e.price = "Fiyat 0'dan büyük olmalıdır."
    else if (Number(form.price) > 9_999_999) e.price = "Fiyat 9.999.999 ₺'den fazla olamaz."
  }
  if (!priceOptional) {
    if (form.price === "" || form.price === null) e.price = "Fiyat zorunludur."
  }

  if (form.listing_type === "item" && doneKeys.value.length === 0) {
    e.photos = "En az 1 fotoğraf zorunludur."
  }

  Object.keys(errors).forEach((k) => delete errors[k])
  Object.assign(errors, e)
  return Object.keys(e).length === 0
}

async function doSubmit() {
  submitting.value = true
  try {
    const body: Record<string, unknown> = {
      listing_type: form.listing_type,
      direction: form.direction,
      title: form.title.trim(),
      category_id: form.category_id,
      price_type: form.price_type,
      city: form.city,
    }
    if (form.listing_type === "item") {
      body.condition = form.condition
    }
    if (form.district) body.district = form.district
    if (form.description.trim()) body.description = form.description.trim()
    if (form.price !== "") body.price = Number(form.price)
    if (form.meeting_type) body.meeting_type = form.meeting_type
    if (doneKeys.value.length > 0) body.temp_photo_keys = doneKeys.value

    const res = await apiFetch<ApiResponse<ListingDetail>>("/api/listings", {
      method: "POST",
      body: JSON.stringify(body),
    })

    submitted.value = true
    await navigateTo(`/ilan/${res.data.slug}`)
  } catch (err) {
    submitError.value = err instanceof ApiError ? err.message : "Bir hata oluştu, tekrar deneyin."
  } finally {
    submitting.value = false
  }
}

function submit() {
  submitError.value = null
  if (!validate()) return

  if (isUploading.value) {
    pendingSubmit.value = true
    return
  }

  void doSubmit()
}

const descPlaceholder = computed(() => {
  if (form.listing_type === "service") return "Ne kadar süre ayırabilirsin, hangi şehir, nasıl iletişime geçilsin..."
  return "Ürün durumunu, eksiklerini, buluşma tercihin yaz... (örn: Çiğdem Mah. civarı uygun)"
})
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <h1 class="text-xl font-bold text-foreground mb-6">İlan Ver</h1>

    <ClientOnly>
      <template #fallback>
        <div class="py-16 flex flex-col items-center gap-3">
          <div class="size-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
          <p class="text-sm text-muted-foreground">Yükleniyor...</p>
        </div>
      </template>
      <!-- WhatsApp Gate -->
      <div v-if="!authStore.user?.whatsapp" class="py-8 flex flex-col items-center text-center gap-4">
        <div class="size-16 rounded-full bg-brand/10 flex items-center justify-center">
          <MessageCircle class="size-8 text-brand" />
        </div>
        <div class="space-y-1.5 max-w-sm">
          <p class="text-lg font-semibold text-foreground">Önce WhatsApp numaranı ekle</p>
          <p class="text-sm text-muted-foreground leading-relaxed">
            İlgili kişiler sana WhatsApp'tan ulaşır. Numara eklemeden ilan veremezsin.
          </p>
        </div>
        <NuxtLink
          to="/ayarlar"
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-brand-foreground rounded-lg text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
        >
          Ayarlara Git
        </NuxtLink>
      </div>

      <form v-else class="space-y-5" novalidate @submit.prevent="submit">

      <!-- İlan Türü -->
      <div class="grid grid-cols-2 gap-3">
        <label
          class="flex flex-col items-center gap-1.5 py-3 px-4 rounded-lg border-2 cursor-pointer transition-colors"
          :class="form.listing_type === 'item'
            ? 'border-brand bg-brand text-brand-foreground'
            : 'border-border hover:bg-muted'"
        >
          <input v-model="form.listing_type" type="radio" value="item" class="sr-only" />
          <span class="text-sm font-semibold">Eşya</span>
          <span class="text-xs opacity-70">Ürün veya eşya paylaş</span>
        </label>
        <label
          class="flex flex-col items-center gap-1.5 py-3 px-4 rounded-lg border-2 cursor-pointer transition-colors"
          :class="form.listing_type === 'service'
            ? 'border-brand bg-brand text-brand-foreground'
            : 'border-border hover:bg-muted'"
        >
          <input v-model="form.listing_type" type="radio" value="service" class="sr-only" />
          <span class="text-sm font-semibold">Hizmet</span>
          <span class="text-xs opacity-70">Ders, taşıma, mentörlük...</span>
        </label>
      </div>

      <!-- Yön (sadece offer, MVP'de "Arıyorum" yok) -->

      <!-- Başlık -->
      <div>
        <label for="form-title" class="block text-sm font-medium text-foreground mb-1">
          Başlık <span class="text-destructive">*</span>
        </label>
        <input
          id="form-title"
          v-model="form.title"
          type="text"
          maxlength="100"
          :placeholder="form.listing_type === 'service' ? 'Hangi hizmeti sunuyorsun?' : 'Ne satıyorsun veya veriyorsun?'"
          :class="[
            'w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 transition-colors',
            errors.title ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-ring',
          ]"
        />
        <p v-if="errors.title" class="mt-1 text-xs text-destructive">{{ errors.title }}</p>
      </div>

      <!-- Kategori -->
      <div>
        <label for="form-category" class="block text-sm font-medium text-foreground mb-1">
          Kategori <span class="text-destructive">*</span>
        </label>
        <select
          id="form-category"
          v-model="form.category_id"
          :class="[
            'w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 cursor-pointer transition-colors',
            errors.category_id ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-ring',
          ]"
        >
          <option value="" disabled>Seçiniz</option>
          <template v-for="cat in filteredCategories" :key="cat.id">
            <option :value="cat.id">{{ cat.name }}</option>
            <option v-for="child in cat.children" :key="child.id" :value="child.id">
              &nbsp;&nbsp;{{ child.name }}
            </option>
          </template>
        </select>
        <p v-if="errors.category_id" class="mt-1 text-xs text-destructive">{{ errors.category_id }}</p>
      </div>

      <!-- Ürün Durumu (sadece eşya, sadece offer) -->
      <div v-if="form.listing_type === 'item' && form.direction === 'offer'">
        <span id="condition-label" class="block text-sm font-medium text-foreground mb-2">
          Ürün Durumu <span class="text-destructive">*</span>
        </span>
        <div role="group" aria-labelledby="condition-label" class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <label
            v-for="opt in CONDITION_OPTIONS"
            :key="opt.value"
            class="flex items-center justify-center py-2 px-3 rounded-md border text-sm cursor-pointer transition-colors"
            :class="form.condition === opt.value
              ? 'border-foreground bg-foreground text-background'
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
      <div v-if="form.direction === 'offer'">
        <span id="price-type-label" class="block text-sm font-medium text-foreground mb-2">
          Fiyat Tipi <span class="text-destructive">*</span>
        </span>
        <div role="group" aria-labelledby="price-type-label" class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <label
            v-for="opt in [{ value: 'fixed', label: 'Sabit' }, { value: 'negotiable', label: 'Pazarlığa Açık' }, { value: 'free', label: 'Ücretsiz' }, { value: 'trade', label: 'Takas' }]"
            :key="opt.value"
            class="flex items-center justify-center py-2 px-3 rounded-md border text-sm cursor-pointer transition-colors"
            :class="form.price_type === opt.value
              ? 'border-brand bg-brand text-brand-foreground'
              : 'border-border hover:bg-muted'"
          >
            <input v-model="form.price_type" type="radio" :value="opt.value" class="sr-only" />
            {{ opt.label }}
          </label>
        </div>
      </div>

      <!-- Fiyat -->
      <div v-if="form.direction === 'offer' && form.price_type !== 'free' && form.price_type !== 'trade'">
        <label for="form-price" class="block text-sm font-medium text-foreground mb-1">
          {{ form.price_type === 'negotiable' ? 'Başlangıç Fiyatı (₺)' : 'Fiyat (₺)' }}
          <span class="text-destructive">*</span>
        </label>
        <input
          id="form-price"
          v-model.number="form.price"
          type="number"
          min="1"
          max="9999999"
          placeholder="0"
          :class="[
            'w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 transition-colors',
            errors.price ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-ring',
          ]"
        />
        <p v-if="errors.price" class="mt-1 text-xs text-destructive">{{ errors.price }}</p>
      </div>

      <!-- Şehir / İlçe -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="form-city" class="block text-sm font-medium text-foreground mb-1">
            Şehir <span class="text-destructive">*</span>
          </label>
          <CityAutocomplete v-model="form.city" :has-error="!!errors.city" input-id="form-city" />
          <p v-if="errors.city" class="mt-1 text-xs text-destructive">{{ errors.city }}</p>
        </div>
        <div>
          <label for="form-district" class="block text-sm font-medium text-foreground mb-1">İlçe</label>
          <DistrictAutocomplete
            v-model="form.district"
            :options="ilceler"
            :disabled="!form.city"
            input-id="form-district"
          />
        </div>
      </div>

      <!-- Buluşma Tercihi -->
      <div>
        <span id="meeting-type-label" class="block text-sm font-medium text-foreground mb-2">Buluşma Tercihi</span>
        <div role="group" aria-labelledby="meeting-type-label" class="grid grid-cols-3 gap-2">
          <label
            v-for="opt in [{ value: 'public', label: 'Ortak Yer' }, { value: 'from_seller', label: 'Adresimden' }, { value: 'to_buyer', label: 'Adrese Teslim' }]"
            :key="opt.value"
            class="flex items-center justify-center py-2 px-3 rounded-md border text-sm cursor-pointer transition-colors"
            :class="form.meeting_type === opt.value
              ? 'border-foreground bg-foreground text-background'
              : 'border-border hover:bg-muted'"
          >
            <input v-model="form.meeting_type" type="radio" :value="opt.value" class="sr-only" />
            {{ opt.label }}
          </label>
        </div>
      </div>

      <!-- Açıklama -->
      <div>
        <label for="form-description" class="block text-sm font-medium text-foreground mb-1">Açıklama</label>
        <textarea
          id="form-description"
          v-model="form.description"
          maxlength="2000"
          rows="4"
          :placeholder="descPlaceholder"
          class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
        />
        <p class="text-xs text-muted-foreground mt-1 text-right">
          {{ form.description.length }} / 2000
        </p>
      </div>

      <!-- Fotoğraflar -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <p class="text-sm font-medium text-foreground">
            Fotoğraflar
            <span v-if="form.listing_type === 'item'" class="text-destructive">*</span>
          </p>
          <span class="text-xs text-muted-foreground">{{ totalCount }}/{{ MAX_PHOTOS }}</span>
        </div>

        <div class="grid grid-cols-3 gap-2">
          <!-- Fotoğraf tile'ları -->
          <div
            v-for="(photo, i) in photos"
            :key="i"
            class="relative aspect-square rounded-lg overflow-hidden border"
            :class="[
              i === 0 ? 'border-foreground' : 'border-border',
              errors.photos ? 'ring-1 ring-destructive' : '',
            ]"
          >
            <img :src="photo.previewUrl" :alt="`Fotoğraf ${i + 1}`" class="size-full object-cover" />

            <!-- Yükleniyor overlay -->
            <div
              v-if="photo.status === 'uploading'"
              class="absolute inset-0 bg-black/50 flex items-center justify-center"
            >
              <Loader2 class="size-6 text-white animate-spin" />
            </div>

            <!-- Hata overlay — tıklayınca retry -->
            <button
              v-else-if="photo.status === 'error'"
              type="button"
              class="absolute inset-0 bg-destructive/70 flex flex-col items-center justify-center gap-1 cursor-pointer w-full"
              @click="retry(i)"
            >
              <RefreshCw class="size-5 text-white" />
              <span class="text-[10px] text-white font-medium">Tekrar</span>
            </button>

            <!-- Kapak / Kapağa Al -->
            <template v-else>
              <div
                v-if="i === 0"
                class="absolute bottom-0 inset-x-0 text-center text-[10px] font-medium py-0.5 bg-black/60 text-white"
              >
                Kapak
              </div>
              <button
                v-else
                type="button"
                class="absolute bottom-0 inset-x-0 text-center text-[10px] font-medium py-0.5 bg-foreground/80 text-background cursor-pointer"
                @click="setCover(i)"
              >
                Kapağa Al
              </button>
            </template>

            <!-- Yıldız (kapak göstergesi) -->
            <div
              class="absolute top-1 left-1 size-5 flex items-center justify-center pointer-events-none"
            >
              <Star
                class="size-3.5"
                :class="i === 0 ? 'text-yellow-400' : 'text-white/50'"
                :fill="i === 0 ? 'currentColor' : 'none'"
              />
            </div>

            <!-- Sil butonu -->
            <button
              v-if="photo.status !== 'uploading'"
              type="button"
              class="absolute top-0 right-0 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
              @click="remove(i)"
            >
              <span class="size-5 rounded-full bg-black/60 flex items-center justify-center">
                <X class="size-3 text-white" />
              </span>
            </button>

            <!-- Rotate butonu -->
            <button
              v-if="photo.status === 'done'"
              type="button"
              class="absolute top-0 left-0 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
              @click.stop="rotate(i)"
            >
              <span class="size-5 rounded-full bg-black/60 flex items-center justify-center">
                <RotateCw class="size-3 text-white" />
              </span>
            </button>
          </div>

          <!-- Ekle butonu -->
          <label
            v-if="totalCount < MAX_PHOTOS"
            class="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors"
            :class="errors.photos ? 'border-destructive' : 'border-border hover:bg-muted'"
          >
            <ImagePlus class="size-6 text-muted-foreground" />
            <span class="text-xs text-muted-foreground">Ekle</span>
            <input
              type="file"
              accept="image/*"
              multiple
              class="sr-only"
              aria-label="Fotoğraf seç"
              @change="onFileChange"
            />
          </label>
        </div>

        <p v-if="errors.photos" class="mt-1 text-xs text-destructive">{{ errors.photos }}</p>
      </div>

      <!-- Submit error -->
      <p v-if="submitError" class="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-md px-3 py-2">
        {{ submitError }}
      </p>

      <Button
        type="submit"
        variant="brand"
        size="lg"
        :loading="submitting"
        :disabled="submitting"
        class="w-full"
      >
        <Upload v-if="!submitting && !pendingSubmit" class="size-4" />
        <span v-if="pendingSubmit">Fotoğraflar hazırlanıyor {{ doneCount }}/{{ totalCount }}...</span>
        <span v-else-if="submitting">Yayınlanıyor...</span>
        <span v-else>Yayınla</span>
      </Button>
    </form>
    </ClientOnly>
  </div>
</template>

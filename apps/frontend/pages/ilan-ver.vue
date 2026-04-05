<script setup lang="ts">
import { Upload, X, ImagePlus } from "lucide-vue-next"
import type { ListingDetail, CategoryTree, ApiResponse } from "@rafimdan/shared"
import { apiFetch, ApiError } from "~/utils/api"
import { IL_NAMES, getIlceler } from "~/utils/turkey-locations"

definePageMeta({ middleware: ["auth"] })

const { data: catsRes } = await useFetch<ApiResponse<CategoryTree[]>>("/api/categories")
const categories = computed(() => catsRes.value?.data ?? [])

const authStore = useAuthStore()

const form = reactive({
  title: "",
  category_id: "",
  condition: "" as "new" | "like_new" | "good" | "fair" | "",
  price_type: "fixed" as "fixed" | "negotiable" | "free",
  price: "" as number | "",
  city: IL_NAMES.includes(authStore.user?.city ?? "") ? (authStore.user?.city ?? "") : "",
  district: "",
  description: "",
})

const errors = reactive<Record<string, string>>({})
const selectedFiles = ref<File[]>([])
const submitting = ref(false)
const submitError = ref<string | null>(null)

const ilceler = computed(() => getIlceler(form.city))

watch(() => form.city, () => {
  const saved = authStore.user?.district ?? ""
  form.district = getIlceler(form.city).includes(saved) ? saved : ""
  delete errors.city
})

watch(() => form.title, () => { delete errors.title })
watch(() => form.category_id, () => { delete errors.category_id })
watch(() => form.condition, () => { delete errors.condition })
watch(() => form.price, () => { delete errors.price })
watch(() => form.price_type, (val) => {
  if (val === "free") form.price = ""
  delete errors.price
})

const CONDITION_OPTIONS = [
  { value: "new", label: "Yeni" },
  { value: "like_new", label: "Az Kullanılmış" },
  { value: "good", label: "İyi" },
  { value: "fair", label: "Fena Değil" },
] as const

const priceDisabled = computed(() => form.price_type === "free")

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
  const remaining = 6 - selectedFiles.value.length
  selectedFiles.value = [...selectedFiles.value, ...incoming.slice(0, remaining)]
  input.value = ""
}

function removeFile(i: number) {
  selectedFiles.value = selectedFiles.value.filter((_, idx) => idx !== i)
}

function previewUrl(file: File) {
  return URL.createObjectURL(file)
}

async function submit() {
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

    const res = await apiFetch<ApiResponse<ListingDetail>>("/api/listings", {
      method: "POST",
      body: JSON.stringify(body),
    })

    const { slug } = res.data

    await Promise.allSettled(
      selectedFiles.value.map((file) => {
        const fd = new FormData()
        fd.append("file", file)
        return apiFetch(`/api/listings/${slug}/photos`, { method: "POST", body: fd })
      }),
    )

    await navigateTo(`/ilan/${slug}`)
  } catch (err) {
    submitError.value = err instanceof ApiError ? err.message : "Bir hata oluştu, tekrar deneyin."
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <h1 class="text-xl font-bold text-foreground mb-6">İlan Ver</h1>

    <form class="space-y-5" novalidate @submit.prevent="submit">

      <!-- Başlık -->
      <div>
        <label class="block text-sm font-medium text-foreground mb-1">
          Başlık <span class="text-destructive">*</span>
        </label>
        <input
          v-model="form.title"
          type="text"
          maxlength="100"
          placeholder="Ne satıyorsunuz?"
          :class="[
            'w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 transition-colors',
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
            'w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 cursor-pointer transition-colors',
            errors.category_id ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-ring',
          ]"
        >
          <option value="" disabled>Seçiniz</option>
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
      <div>
        <label class="block text-sm font-medium text-foreground mb-2">
          Fiyat Tipi <span class="text-destructive">*</span>
        </label>
        <div class="flex gap-2">
          <label
            v-for="opt in [
              { value: 'fixed', label: 'Sabit' },
              { value: 'negotiable', label: 'Pazarlığa Açık' },
              { value: 'free', label: 'Ücretsiz' },
            ]"
            :key="opt.value"
            class="flex items-center justify-center py-2 px-4 rounded-md border text-sm cursor-pointer transition-colors flex-1"
            :class="form.price_type === opt.value
              ? 'border-foreground bg-foreground text-background'
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
          Fiyat (₺) <span class="text-destructive">*</span>
        </label>
        <input
          v-model.number="form.price"
          type="number"
          min="1"
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
          <label class="block text-sm font-medium text-foreground mb-1">
            Şehir <span class="text-destructive">*</span>
          </label>
          <select
            v-model="form.city"
            :class="[
              'w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 cursor-pointer transition-colors',
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
            class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
          placeholder="Ürün hakkında detay verin..."
          class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
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
            v-for="(file, i) in selectedFiles"
            :key="i"
            class="relative size-20 rounded-md overflow-hidden border border-border"
          >
            <img :src="previewUrl(file)" :alt="file.name" class="size-full object-cover" />
            <button
              type="button"
              class="absolute top-0.5 right-0.5 size-5 rounded-full bg-black/60 flex items-center justify-center cursor-pointer"
              @click="removeFile(i)"
            >
              <X class="size-3 text-white" />
            </button>
          </div>

          <label
            v-if="selectedFiles.length < 6"
            class="size-20 rounded-md border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-muted transition-colors"
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
      <p v-if="submitError" class="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-md px-3 py-2">
        {{ submitError }}
      </p>

      <button
        type="submit"
        :disabled="submitting"
        class="w-full bg-foreground text-background py-2.5 rounded-md text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Upload v-if="!submitting" class="size-4" />
        <span v-if="submitting">Yayınlanıyor...</span>
        <span v-else>Yayınla</span>
      </button>
    </form>
  </div>
</template>

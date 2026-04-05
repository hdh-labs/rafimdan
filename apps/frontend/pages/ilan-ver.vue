<script setup lang="ts">
import { Upload, X, ImagePlus } from "lucide-vue-next"
import type { ListingDetail, CategoryTree, ApiResponse } from "@rafimdan/shared"
import { apiFetch, ApiError } from "~/utils/api"

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
  city: authStore.user?.city ?? "",
  district: authStore.user?.district ?? "",
  description: "",
})

const selectedFiles = ref<File[]>([])
const submitting = ref(false)
const error = ref<string | null>(null)

const CONDITION_OPTIONS = [
  { value: "new", label: "Yeni" },
  { value: "like_new", label: "Az Kullanılmış" },
  { value: "good", label: "İyi" },
  { value: "fair", label: "Fena Değil" },
] as const

const priceDisabled = computed(() => form.price_type === "free")

watch(() => form.price_type, (val) => {
  if (val === "free") form.price = ""
})

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
  error.value = null

  if (!form.title || !form.category_id || !form.condition || !form.city) {
    error.value = "Zorunlu alanları doldurun."
    return
  }
  if (form.price_type !== "free" && !form.price) {
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

    const res = await apiFetch<ApiResponse<ListingDetail>>("/api/listings", {
      method: "POST",
      body: JSON.stringify(body),
    })

    const { slug } = res.data

    for (const file of selectedFiles.value) {
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
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <h1 class="text-xl font-bold text-foreground mb-6">İlan Ver</h1>

    <form class="space-y-5" @submit.prevent="submit">
      <div>
        <label class="block text-sm font-medium text-foreground mb-1">
          Başlık <span class="text-destructive">*</span>
        </label>
        <input
          v-model="form.title"
          type="text"
          maxlength="100"
          placeholder="Ne satıyorsunuz?"
          class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-foreground mb-1">
          Kategori <span class="text-destructive">*</span>
        </label>
        <select
          v-model="form.category_id"
          class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
        >
          <option value="" disabled>Seçiniz</option>
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
            class="flex items-center justify-center py-2 px-3 rounded-md border text-sm cursor-pointer transition-colors"
            :class="form.condition === opt.value
              ? 'border-foreground bg-foreground text-background'
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

      <div>
        <label class="block text-sm font-medium text-foreground mb-1">
          Fiyat (₺)
          <span v-if="form.price_type !== 'free'" class="text-destructive">*</span>
        </label>
        <input
          v-model.number="form.price"
          type="number"
          min="0"
          :disabled="priceDisabled"
          placeholder="0"
          class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-40 disabled:cursor-not-allowed"
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
            placeholder="İstanbul"
            class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-foreground mb-1">İlçe</label>
          <input
            v-model="form.district"
            type="text"
            placeholder="Kadıköy"
            class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

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

      <div>
        <label class="block text-sm font-medium text-foreground mb-2">
          Fotoğraflar
          <span class="font-normal text-muted-foreground">(max 6)</span>
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

      <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

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

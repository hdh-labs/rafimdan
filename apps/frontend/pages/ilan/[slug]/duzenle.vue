<script setup lang="ts">
import { Save, Trash2 } from "lucide-vue-next"
import type { ListingDetail, CategoryTree, ApiResponse } from "@rafimdan/shared"
import { apiFetch, ApiError } from "~/utils/api"

definePageMeta({ middleware: ["auth"] })

const route = useRoute()
const slug = route.params.slug as string
const authStore = useAuthStore()

const { data: listingRes, error: fetchError } = await useFetch<ApiResponse<ListingDetail>>(
  `/api/listings/${slug}`,
)
const { data: catsRes } = await useFetch<ApiResponse<CategoryTree[]>>("/api/categories")

if (fetchError.value || !listingRes.value) {
  throw createError({ statusCode: 404, message: "İlan bulunamadı" })
}

const listing = listingRes.value.data
const categories = computed(() => catsRes.value?.data ?? [])

if (listing.seller.id !== authStore.user?.id) {
  await navigateTo(`/ilan/${slug}`)
}

const form = reactive({
  title: listing.title,
  category_id: listing.category.id,
  condition: listing.condition,
  price_type: listing.price_type,
  price: listing.price ?? ("" as number | ""),
  city: listing.city,
  district: listing.district ?? "",
  description: listing.description ?? "",
})

const submitting = ref(false)
const deleting = ref(false)
const error = ref<string | null>(null)

const CONDITION_OPTIONS = [
  { value: "new", label: "Yeni" },
  { value: "like_new", label: "Az Kullanılmış" },
  { value: "good", label: "İyi" },
  { value: "fair", label: "Fena Değil" },
] as const

const STATUS_OPTIONS = [
  { value: "active", label: "Aktif" },
  { value: "reserved", label: "Rezerve" },
  { value: "sold", label: "Satıldı" },
] as const

const currentStatus = ref(listing.status)
const statusChanging = ref(false)

watch(() => form.price_type, (val) => {
  if (val === "free") form.price = ""
})

async function save() {
  error.value = null
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
    await navigateTo(`/ilan/${slug}`)
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : "Bir hata oluştu."
  } finally {
    submitting.value = false
  }
}

async function changeStatus(status: "active" | "reserved" | "sold") {
  statusChanging.value = true
  try {
    await apiFetch(`/api/listings/${slug}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    })
    currentStatus.value = status
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : "Bir hata oluştu."
  } finally {
    statusChanging.value = false
  }
}

async function deleteListing() {
  if (!confirm("İlanı silmek istediğinize emin misiniz?")) return
  deleting.value = true
  try {
    await apiFetch(`/api/listings/${slug}`, { method: "DELETE" })
    await navigateTo("/ilanlar")
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : "Bir hata oluştu."
    deleting.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-foreground">İlanı Düzenle</h1>
      <button
        :disabled="deleting"
        class="flex items-center gap-1.5 text-sm text-destructive hover:opacity-70 cursor-pointer transition-opacity disabled:opacity-40"
        @click="deleteListing"
      >
        <Trash2 class="size-4" />
        Sil
      </button>
    </div>

    <div>
      <p class="text-sm font-medium text-foreground mb-2">Durum</p>
      <div class="flex gap-2">
        <button
          v-for="opt in STATUS_OPTIONS"
          :key="opt.value"
          :disabled="statusChanging"
          class="px-4 py-1.5 rounded-md border text-sm cursor-pointer transition-colors disabled:opacity-50"
          :class="currentStatus === opt.value
            ? 'border-foreground bg-foreground text-background'
            : 'border-border hover:bg-muted'"
          @click="changeStatus(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <form class="space-y-5" @submit.prevent="save">
      <div>
        <label class="block text-sm font-medium text-foreground mb-1">Başlık</label>
        <input
          v-model="form.title"
          type="text"
          maxlength="100"
          class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-foreground mb-1">Kategori</label>
        <select
          v-model="form.category_id"
          class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
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
        <label class="block text-sm font-medium text-foreground mb-2">Ürün Durumu</label>
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
        <label class="block text-sm font-medium text-foreground mb-2">Fiyat Tipi</label>
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
        <label class="block text-sm font-medium text-foreground mb-1">Fiyat (₺)</label>
        <input
          v-model.number="form.price"
          type="number"
          min="0"
          :disabled="form.price_type === 'free'"
          class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-40 disabled:cursor-not-allowed"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-foreground mb-1">Şehir</label>
          <input
            v-model="form.city"
            type="text"
            class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-foreground mb-1">İlçe</label>
          <input
            v-model="form.district"
            type="text"
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
          class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
        />
      </div>

      <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

      <div class="flex gap-3">
        <NuxtLink
          :to="`/ilan/${slug}`"
          class="flex-1 text-center border border-border py-2.5 rounded-md text-sm cursor-pointer hover:bg-muted transition-colors"
        >
          Vazgeç
        </NuxtLink>
        <button
          type="submit"
          :disabled="submitting"
          class="flex-1 bg-foreground text-background py-2.5 rounded-md text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Save class="size-4" />
          {{ submitting ? "Kaydediliyor..." : "Kaydet" }}
        </button>
      </div>
    </form>
  </div>
</template>

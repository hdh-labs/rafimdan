<script setup lang="ts">
import { Save, CheckCircle, ExternalLink, LogOut, MessageCircle, Camera, Trash2 } from "lucide-vue-next"
import { toast } from "vue-sonner"
import type { UserProfile, ApiResponse } from "@rafimdan/shared"
import { apiFetch, ApiError } from "~/utils/api"
import { IL_NAMES, getIlceler } from "~/utils/turkey-locations"

definePageMeta({ middleware: ["auth"] })

const authStore = useAuthStore()

const BIO_MAX = 500

const form = reactive({
  display_name: authStore.user?.display_name ?? "",
  whatsapp: authStore.user?.whatsapp ?? "",
  city: IL_NAMES.includes(authStore.user?.city ?? "") ? (authStore.user?.city ?? "") : "",
  district: authStore.user?.district ?? "",
  bio: authStore.user?.bio ?? "",
})

const savedForm = reactive({ ...form })

const isDirty = computed(() =>
  (Object.keys(form) as (keyof typeof form)[]).some((k) => form[k] !== savedForm[k]),
)

const ilceler = computed(() => getIlceler(form.city))

watch(() => form.city, () => {
  if (!getIlceler(form.city).includes(form.district)) form.district = ""
})

const submitting = ref(false)
const saved = ref(false)
const error = ref<string | null>(null)
const showDeleteConfirm = ref(false)
const deleting = ref(false)

async function deleteAccount() {
  deleting.value = true
  try {
    await apiFetch("/api/auth/me", { method: "DELETE" })
    await authStore.logout()
  } catch {
    deleting.value = false
    showDeleteConfirm.value = false
    toast.error("Hesap silinemedi. Lütfen tekrar deneyin.")
  }
}
const avatarError = ref(false)
const uploading = ref(false)
const uploadError = ref<string | null>(null)
const previewUrl = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const WHATSAPP_RE = /^5\d{9}$/
const WHATSAPP_MAX = 10

const whatsappError = ref<string | null>(null)

function onWhatsappInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(/\D/g, "").slice(0, WHATSAPP_MAX)
  form.whatsapp = raw
  ;(e.target as HTMLInputElement).value = raw
  if (whatsappError.value && WHATSAPP_RE.test(raw)) whatsappError.value = null
}

function onWhatsappBlur() {
  if (!form.whatsapp) { whatsappError.value = null; return }
  whatsappError.value = WHATSAPP_RE.test(form.whatsapp)
    ? null
    : "5 ile başlayan 10 haneli numara girin. (örn: 5321234567)"
}

const MAX_DIMENSION = 1200
const COMPRESS_QUALITY = 0.85

function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const { width, height } = img
      const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height))
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], file.name, { type: "image/jpeg" }) : file),
        "image/jpeg",
        COMPRESS_QUALITY,
      )
    }
    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file) }
    img.src = objectUrl
  })
}

async function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const compressed = await compressImage(file)
  const prev = previewUrl.value
  previewUrl.value = URL.createObjectURL(compressed)
  if (prev) URL.revokeObjectURL(prev)
  uploadAvatar(compressed)
}

async function uploadAvatar(file: File) {
  uploading.value = true
  uploadError.value = null
  const fd = new FormData()
  fd.append("file", file)
  try {
    const res = await apiFetch<ApiResponse<UserProfile>>("/api/auth/me/avatar", {
      method: "POST",
      body: fd,
    })
    authStore.user = res.data
    avatarError.value = false
  } catch (err) {
    uploadError.value = err instanceof ApiError ? err.message : "Yükleme başarısız."
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = null
    }
  } finally {
    uploading.value = false
    if (fileInputRef.value) fileInputRef.value.value = ""
  }
}

async function save() {
  error.value = null

  if (form.whatsapp && !WHATSAPP_RE.test(form.whatsapp.replace(/\s/g, ""))) {
    whatsappError.value = "5 ile başlayan 10 haneli numara girin. (örn: 5321234567)"
    return
  }

  submitting.value = true

  try {
    const body: Record<string, string | null> = {}
    body.display_name = form.display_name.trim() || null
    body.whatsapp = form.whatsapp ? form.whatsapp.replace(/\s/g, "") : null
    if (form.city) body.city = form.city
    if (form.district) body.district = form.district
    body.bio = form.bio

    const res = await apiFetch<ApiResponse<UserProfile>>("/api/auth/me", {
      method: "PATCH",
      body: JSON.stringify(body),
    })

    authStore.user = res.data
    Object.assign(savedForm, { ...form })
    saved.value = true
    setTimeout(() => { saved.value = false }, 2500)
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : "Bir hata oluştu."
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-lg mx-auto px-4 py-8">
    <h1 class="text-xl font-bold text-foreground mb-6">Ayarlar</h1>

    <div class="mb-6 pb-6 border-b border-border">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="relative shrink-0">
            <button
              type="button"
              class="inline-flex items-center justify-center size-12 rounded-full bg-muted text-sm font-medium text-muted-foreground overflow-hidden cursor-pointer"
              :disabled="uploading"
              @click="fileInputRef?.click()"
            >
              <img
                v-if="(previewUrl || authStore.user?.avatar_url) && !avatarError"
                :src="previewUrl ?? authStore.user!.avatar_url!"
                :alt="authStore.user?.name"
                referrerpolicy="no-referrer"
                class="size-full object-cover"
                @error="avatarError = true"
              />
              <span v-else>{{ authStore.user?.name?.[0]?.toUpperCase() }}</span>
              <span
                v-if="uploading"
                class="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full"
              >
                <span class="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </span>
            </button>
            <button
              type="button"
              class="absolute -bottom-0.5 -right-0.5 flex items-center justify-center size-5 rounded-full bg-primary text-primary-foreground shadow cursor-pointer"
              :disabled="uploading"
              @click="fileInputRef?.click()"
              tabindex="-1"
            >
              <Camera class="size-3" />
            </button>
          </div>
          <input
            ref="fileInputRef"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="hidden"
            @change="onFileChange"
          />
          <div>
            <p class="font-medium text-foreground text-sm">{{ authStore.user?.name }}</p>
            <p class="text-xs text-muted-foreground">Google ile giriş yapıldı</p>
            <p v-if="uploadError" class="text-xs text-destructive mt-0.5">{{ uploadError }}</p>
          </div>
        </div>
        <NuxtLink
          v-if="authStore.user?.slug"
          :to="`/profil/${authStore.user.slug}`"
          class="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors shrink-0"
        >
          <ExternalLink class="size-3.5" />
          Profilimi Görüntüle
        </NuxtLink>
      </div>
    </div>

    <!-- WhatsApp missing callout -->
    <ClientOnly>
      <div
        v-if="!authStore.user?.whatsapp"
        class="mb-6 rounded-xl border border-brand/20 bg-brand/5 p-4 flex gap-3"
      >
        <div class="shrink-0">
          <div class="size-9 rounded-full bg-brand/10 flex items-center justify-center">
            <MessageCircle class="size-4.5 text-brand" />
          </div>
        </div>
        <div class="min-w-0">
          <p class="text-sm font-semibold text-foreground">Sana ulaşılamıyor</p>
          <p class="text-sm text-muted-foreground mt-0.5 leading-snug">
            WhatsApp numaran olmadan ilanlarındaki kişiler seninle iletişime geçemez.
          </p>
        </div>
      </div>
    </ClientOnly>

    <form class="space-y-4" @submit.prevent="save">
      <div>
        <label for="settings-display-name" class="block text-sm font-medium text-foreground mb-1">
          Görünen Ad
        </label>
        <input
          id="settings-display-name"
          v-model="form.display_name"
          type="text"
          placeholder="İlanlarda görünecek adın"
          class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <p class="text-xs text-muted-foreground mt-1">
          Boş bırakırsan Google adın görünür.
        </p>
      </div>

      <div>
        <label for="settings-whatsapp" class="block text-sm font-medium text-foreground mb-1">
          WhatsApp Numarası
        </label>
        <div class="flex">
          <span class="inline-flex items-center px-3 border border-r-0 border-border rounded-l-md bg-muted text-sm text-muted-foreground">
            +90
          </span>
          <input
            id="settings-whatsapp"
            :value="form.whatsapp"
            type="tel"
            inputmode="numeric"
            placeholder="5xx xxx xx xx"
            maxlength="10"
            :class="whatsappError ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-ring'"
            class="flex-1 px-3 py-2 text-sm border rounded-r-md bg-background focus:outline-none focus:ring-1"
            @input="onWhatsappInput"
            @blur="onWhatsappBlur"
          />
        </div>
        <p v-if="whatsappError" class="text-xs text-destructive mt-1">{{ whatsappError }}</p>
        <div class="flex items-center justify-between mt-1">
          <p class="text-xs text-muted-foreground">
            İlan sayfasında "WhatsApp'tan Yaz" butonu aktif olur.
          </p>
          <span class="text-xs tabular-nums" :class="form.whatsapp.length === WHATSAPP_MAX ? 'text-brand' : 'text-muted-foreground'">
            {{ form.whatsapp.length }}/{{ WHATSAPP_MAX }}
          </span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="settings-city" class="block text-sm font-medium text-foreground mb-1">Şehir</label>
          <CityAutocomplete v-model="form.city" input-id="settings-city" />
        </div>
        <div>
          <label for="settings-district" class="block text-sm font-medium text-foreground mb-1">İlçe</label>
          <DistrictAutocomplete
            v-model="form.district"
            :options="ilceler"
            input-id="settings-district"
            :disabled="!form.city"
          />
        </div>
      </div>

      <div>
        <label for="settings-bio" class="block text-sm font-medium text-foreground mb-1">
          Biyografi
        </label>
        <textarea
          id="settings-bio"
          v-model="form.bio"
          rows="4"
          :maxlength="BIO_MAX"
          placeholder="Kendinden kısaca bahset..."
          class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
        />
        <div class="flex justify-end mt-1">
          <span
            class="text-xs tabular-nums"
            :class="form.bio.length >= BIO_MAX ? 'text-destructive' : 'text-muted-foreground'"
          >
            {{ form.bio.length }}/{{ BIO_MAX }}
          </span>
        </div>
      </div>

      <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

      <Button
        type="submit"
        size="lg"
        :loading="submitting"
        :disabled="submitting || (!isDirty && !saved)"
        :class="`w-full transition-colors ${saved ? 'bg-brand text-brand-foreground hover:opacity-100' : ''}`"
      >
        <CheckCircle v-if="saved" class="size-4" />
        <Save v-else-if="!submitting" class="size-4" />
        {{ submitting ? "Kaydediliyor..." : saved ? "Kaydedildi" : "Kaydet" }}
      </Button>
    </form>

    <div class="mt-8 pt-6 border-t border-border space-y-4">
      <button
        type="button"
        class="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
        @click="authStore.logout()"
      >
        <LogOut class="size-4" />
        Hesaptan Çıkış Yap
      </button>

      <div>
        <button
          v-if="!showDeleteConfirm"
          type="button"
          class="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
          @click="showDeleteConfirm = true"
        >
          <Trash2 class="size-4" />
          Hesabımı Sil
        </button>

        <div v-else class="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
          <p class="text-sm font-medium text-destructive">Bu işlem geri alınamaz.</p>
          <p class="text-xs text-muted-foreground">Tüm ilanlarınız ve profil bilgileriniz kalıcı olarak silinecek.</p>
          <div class="flex gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              :loading="deleting"
              @click="deleteAccount"
            >
              Evet, hesabımı sil
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              :disabled="deleting"
              @click="showDeleteConfirm = false"
            >
              İptal
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

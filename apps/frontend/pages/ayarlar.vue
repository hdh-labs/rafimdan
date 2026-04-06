<script setup lang="ts">
import { Save, CheckCircle, ExternalLink, LogOut } from "lucide-vue-next"
import type { UserProfile, ApiResponse } from "@rafimdan/shared"
import { apiFetch, ApiError } from "~/utils/api"
import { IL_NAMES, getIlceler } from "~/utils/turkey-locations"

definePageMeta({ middleware: ["auth"] })

const authStore = useAuthStore()

const form = reactive({
  display_name: authStore.user?.display_name ?? "",
  whatsapp: authStore.user?.whatsapp ?? "",
  city: IL_NAMES.includes(authStore.user?.city ?? "") ? (authStore.user?.city ?? "") : "",
  district: authStore.user?.district ?? "",
})

const ilceler = computed(() => getIlceler(form.city))

watch(() => form.city, () => {
  if (!getIlceler(form.city).includes(form.district)) form.district = ""
})

const submitting = ref(false)
const saved = ref(false)
const error = ref<string | null>(null)
const avatarError = ref(false)

const WHATSAPP_RE = /^5\d{9}$/

async function save() {
  error.value = null

  if (form.whatsapp && !WHATSAPP_RE.test(form.whatsapp.replace(/\s/g, ""))) {
    error.value = "WhatsApp numarası 5 ile başlayan 10 haneli olmalıdır. (örn: 5321234567)"
    return
  }

  submitting.value = true

  try {
    const body: Record<string, string> = {}
    if (form.display_name) body.display_name = form.display_name
    if (form.whatsapp) body.whatsapp = form.whatsapp.replace(/\s/g, "")
    if (form.city) body.city = form.city
    if (form.district) body.district = form.district

    const res = await apiFetch<ApiResponse<UserProfile>>("/api/auth/me", {
      method: "PATCH",
      body: JSON.stringify(body),
    })

    authStore.user = res.data
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
          <span
            class="inline-flex shrink-0 items-center justify-center size-12 rounded-full bg-muted text-sm font-medium text-muted-foreground overflow-hidden"
          >
            <img
              v-if="authStore.user?.avatar_url && !avatarError"
              :src="authStore.user.avatar_url"
              :alt="authStore.user.name"
              referrerpolicy="no-referrer"
              class="size-full object-cover"
              @error="avatarError = true"
            />
            <span v-else>
              {{ authStore.user?.name?.[0]?.toUpperCase() }}
            </span>
          </span>
          <div>
            <p class="font-medium text-foreground text-sm">{{ authStore.user?.name }}</p>
            <p class="text-xs text-muted-foreground">Google hesabı ile giriş yapıldı</p>
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

    <form class="space-y-4" @submit.prevent="save">
      <div>
        <label class="block text-sm font-medium text-foreground mb-1">
          Görünen Ad
        </label>
        <input
          v-model="form.display_name"
          type="text"
          placeholder="Görünmesini istediğiniz isim"
          class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <p class="text-xs text-muted-foreground mt-1">
          Boş bırakılırsa Google adınız gösterilir.
        </p>
      </div>

      <div>
        <label class="block text-sm font-medium text-foreground mb-1">
          WhatsApp Numarası
        </label>
        <div class="flex">
          <span class="inline-flex items-center px-3 border border-r-0 border-border rounded-l-md bg-muted text-sm text-muted-foreground">
            +90
          </span>
          <input
            v-model="form.whatsapp"
            type="tel"
            placeholder="5xx xxx xx xx"
            class="flex-1 px-3 py-2 text-sm border border-border rounded-r-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <p class="text-xs text-muted-foreground mt-1">
          İlan detayında "WhatsApp'tan Yaz" butonu görünür.
        </p>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-foreground mb-1">Şehir</label>
          <CityAutocomplete v-model="form.city" />
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

      <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

      <button
        type="submit"
        :disabled="submitting || saved"
        class="w-full py-2.5 rounded-md text-sm font-medium cursor-pointer transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
        :class="saved
          ? 'bg-green-600 text-white opacity-100'
          : 'bg-foreground text-background hover:opacity-90 disabled:opacity-50'"
      >
        <CheckCircle v-if="saved" class="size-4" />
        <Save v-else class="size-4" />
        {{ submitting ? "Kaydediliyor..." : saved ? "Kaydedildi" : "Kaydet" }}
      </button>
    </form>

    <div class="mt-8 pt-6 border-t border-border">
      <button
        type="button"
        class="flex items-center gap-2 text-sm text-muted-foreground hover:text-red-600 cursor-pointer transition-colors"
        @click="authStore.logout()"
      >
        <LogOut class="size-4" />
        Hesaptan Çıkış Yap
      </button>
    </div>
  </div>
</template>

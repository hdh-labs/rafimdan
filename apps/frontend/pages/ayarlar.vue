<script setup lang="ts">
import { Save, CheckCircle, ExternalLink, LogOut, MessageCircle } from "lucide-vue-next"
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
const WHATSAPP_MAX = 10

function onWhatsappInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(/\D/g, "").slice(0, WHATSAPP_MAX)
  form.whatsapp = raw
  ;(e.target as HTMLInputElement).value = raw
}

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
            <p class="text-xs text-muted-foreground">Google ile giriş yapıldı</p>
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
        class="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3"
      >
        <div class="shrink-0">
          <div class="size-9 rounded-full bg-amber-100 flex items-center justify-center">
            <MessageCircle class="size-4.5 text-amber-600" />
          </div>
        </div>
        <div class="min-w-0">
          <p class="text-sm font-semibold text-amber-900">Sana ulaşılamıyor</p>
          <p class="text-sm text-amber-700 mt-0.5 leading-snug">
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
            class="flex-1 px-3 py-2 text-sm border border-border rounded-r-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            @input="onWhatsappInput"
          />
        </div>
        <div class="flex items-center justify-between mt-1">
          <p class="text-xs text-muted-foreground">
            İlan sayfasında "WhatsApp'tan Yaz" butonu aktif olur.
          </p>
          <span class="text-xs tabular-nums" :class="form.whatsapp.length === WHATSAPP_MAX ? 'text-green-600' : 'text-muted-foreground'">
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

      <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

      <Button
        type="submit"
        size="lg"
        :loading="submitting"
        :disabled="submitting || saved"
        :class="`w-full ${saved ? 'bg-green-600 text-white hover:opacity-100' : ''}`"
      >
        <CheckCircle v-if="saved" class="size-4" />
        <Save v-else-if="!submitting" class="size-4" />
        {{ submitting ? "Kaydediliyor..." : saved ? "Kaydedildi" : "Kaydet" }}
      </Button>
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

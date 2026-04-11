<script setup lang="ts">
import { ChevronDown, ClipboardList, User, Heart, Settings, LogOut, AlertCircle } from "lucide-vue-next"

const authStore = useAuthStore()

const displayName = computed(
  () => authStore.user?.display_name || authStore.user?.name || null,
)

const initials = computed(
  () => (displayName.value ?? "?")[0]?.toUpperCase() ?? "?",
)

const menuOpen = ref(false)
const avatarError = ref(false)

function closeMenu() {
  menuOpen.value = false
}

onMounted(() => {
  document.addEventListener("click", closeMenu)
})

onUnmounted(() => {
  document.removeEventListener("click", closeMenu)
})
</script>

<template>
  <header class="bg-white border-b border-border">
    <ClientOnly>
      <div
        v-if="authStore.isLoggedIn && !authStore.user?.whatsapp"
        class="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-center gap-2.5 text-sm text-amber-800"
      >
        <AlertCircle class="size-4 shrink-0" />
        <span class="font-medium">WhatsApp numaranı eklemeden ilanlarına alıcı ulaşamaz.</span>
        <NuxtLink
          to="/ayarlar"
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-600 text-white text-xs font-medium cursor-pointer hover:bg-amber-700 transition-colors shrink-0"
        >
          Hemen Ekle
        </NuxtLink>
      </div>
    </ClientOnly>
    <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
      <NuxtLink to="/" class="cursor-pointer shrink-0">
        <AppLogo />
      </NuxtLink>

      <nav class="flex items-center gap-3">
        <NuxtLink
          to="/ilanlar"
          class="text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded cursor-pointer transition-colors"
        >
          İlanlar
        </NuxtLink>

        <ClientOnly>
          <template #fallback>
            <div class="size-8 rounded-full bg-muted animate-pulse shrink-0" />
          </template>

        <template v-if="authStore.isLoggedIn">
          <NuxtLink
            to="/ilan-ver"
            class="text-sm bg-foreground text-background px-3 py-1.5 rounded-md cursor-pointer hover:opacity-90 transition-opacity"
          >
            İlan Ver
          </NuxtLink>

          <div class="relative" @click.stop>
            <button
              class="flex items-center gap-1.5 cursor-pointer"
              @click="menuOpen = !menuOpen"
            >
              <span
                class="inline-flex items-center justify-center size-8 rounded-full bg-muted text-sm font-medium overflow-hidden shrink-0"
              >
                <img
                  v-if="authStore.user?.avatar_url && !avatarError"
                  :src="authStore.user.avatar_url"
                  :alt="displayName ?? ''"
                  referrerpolicy="no-referrer"
                  class="size-full object-cover"
                  @error="avatarError = true"
                />
                <span v-else>{{ initials }}</span>
              </span>
              <ChevronDown class="size-3.5 text-muted-foreground" :class="menuOpen && 'rotate-180'" />
            </button>

            <div
              v-if="menuOpen"
              class="absolute right-0 top-full mt-1.5 w-44 bg-white border border-border rounded-lg shadow-md py-1 z-50"
            >
              <NuxtLink
                v-if="authStore.user?.slug"
                :to="`/profil/${authStore.user.slug}`"
                class="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted cursor-pointer transition-colors"
                @click="closeMenu"
              >
                <User class="size-3.5 text-muted-foreground shrink-0" />
                <span class="truncate">{{ displayName }}</span>
              </NuxtLink>
              <div class="border-t border-border my-1" />
              <NuxtLink
                to="/ilanlarim"
                class="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted cursor-pointer transition-colors"
                @click="closeMenu"
              >
                <ClipboardList class="size-3.5 text-muted-foreground shrink-0" />
                İlanlarım
              </NuxtLink>
              <NuxtLink
                to="/favoriler"
                class="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted cursor-pointer transition-colors"
                @click="closeMenu"
              >
                <Heart class="size-3.5 text-muted-foreground shrink-0" />
                Favoriler
              </NuxtLink>
              <NuxtLink
                to="/ayarlar"
                class="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted cursor-pointer transition-colors"
                @click="closeMenu"
              >
                <Settings class="size-3.5 text-muted-foreground shrink-0" />
                Ayarlar
              </NuxtLink>
              <div class="border-t border-border my-1" />
              <button
                class="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-muted cursor-pointer transition-colors"
                @click="authStore.logout(); closeMenu()"
              >
                <LogOut class="size-3.5 shrink-0" />
                Çıkış Yap
              </button>
            </div>
          </div>
        </template>

        <template v-else>
          <NuxtLink
            to="/ilan-ver"
            class="text-sm bg-foreground text-background px-3 py-1.5 rounded-md cursor-pointer hover:opacity-90 transition-opacity"
          >
            İlan Ver
          </NuxtLink>
          <NuxtLink
            to="/giris"
            class="text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded cursor-pointer transition-colors"
          >
            Giriş
          </NuxtLink>
        </template>

        </ClientOnly>
      </nav>
    </div>
  </header>
</template>

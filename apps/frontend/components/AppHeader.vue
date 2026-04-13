<script setup lang="ts">
import { ChevronDown, ClipboardList, User, Heart, Settings, LogOut, AlertCircle, ShieldCheck } from "lucide-vue-next"
import type { AdminStats } from "@rafimdan/shared"
import { apiFetch } from "~/utils/api"

const authStore = useAuthStore()

const displayName = computed(
  () => authStore.user?.display_name || authStore.user?.name || null,
)

const initials = computed(
  () => (displayName.value ?? "?")[0]?.toUpperCase() ?? "?",
)

const menuOpen = ref(false)
const avatarError = ref(false)
const pendingCount = useState<number>("admin-pending-count", () => 0)
const menuTriggerRef = ref<HTMLButtonElement | null>(null)

function closeMenu() {
  menuOpen.value = false
}

function onGlobalKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && menuOpen.value) {
    menuOpen.value = false
    menuTriggerRef.value?.focus()
  }
}

onMounted(async () => {
  document.addEventListener("click", closeMenu)
  document.addEventListener("keydown", onGlobalKeydown)
  if (!authStore.user?.is_admin) return
  try {
    const res = await apiFetch<{ data: AdminStats; status: "ok" }>("/api/admin/stats")
    pendingCount.value = res.data.pending_listings
  } catch {
    // ignore
  }
})

onUnmounted(() => {
  document.removeEventListener("click", closeMenu)
  document.removeEventListener("keydown", onGlobalKeydown)
})
</script>

<template>
  <header class="bg-background border-b border-border">
    <ClientOnly>
      <div
        v-if="authStore.isLoggedIn && !authStore.user?.whatsapp"
        class="bg-brand/5 border-b border-brand/20 px-4 py-2.5 flex items-center justify-center gap-2.5 text-sm text-foreground"
      >
        <AlertCircle class="size-4 shrink-0" />
        <span class="font-medium">WhatsApp numaran olmadan ilanlarındaki kişiler sana ulaşamaz.</span>
        <NuxtLink
          to="/ayarlar"
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand text-brand-foreground text-xs font-medium cursor-pointer hover:opacity-90 transition-opacity shrink-0"
        >
          Hemen Ekle
        </NuxtLink>
      </div>
    </ClientOnly>
    <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
      <NuxtLink to="/" class="cursor-pointer shrink-0 flex items-center">
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
            class="text-sm bg-brand text-brand-foreground px-3 py-1.5 rounded-md cursor-pointer hover:opacity-90 transition-opacity"
          >
            İlan Ver
          </NuxtLink>

          <div class="relative" @click.stop>
            <button
              ref="menuTriggerRef"
              :aria-expanded="menuOpen"
              aria-haspopup="menu"
              aria-label="Hesap menüsünü aç"
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
              role="menu"
              class="absolute right-0 top-full mt-1.5 w-44 bg-background border border-border rounded-lg shadow-md py-1 z-50"
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
              <template v-if="authStore.user?.is_admin">
                <div class="border-t border-border my-1" />
                <NuxtLink
                  to="/admin"
                  class="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted cursor-pointer transition-colors"
                  @click="closeMenu"
                >
                  <ShieldCheck class="size-3.5 text-muted-foreground shrink-0" />
                  <span class="flex-1">Yönetim</span>
                  <span
                    v-if="pendingCount > 0"
                    class="inline-flex items-center rounded-full bg-brand/10 text-brand text-xs px-1.5 py-0.5 font-medium"
                  >
                    {{ pendingCount }}
                  </span>
                </NuxtLink>
              </template>
              <div class="border-t border-border my-1" />
              <button
                class="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted cursor-pointer transition-colors"
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
            class="text-sm bg-brand text-brand-foreground px-3 py-1.5 rounded-md cursor-pointer hover:opacity-90 transition-opacity"
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

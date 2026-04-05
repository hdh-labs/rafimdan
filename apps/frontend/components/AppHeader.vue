<script setup lang="ts">
import { ChevronDown } from "lucide-vue-next"

const authStore = useAuthStore()

const displayName = computed(
  () => authStore.user?.display_name || authStore.user?.name || null,
)

const initials = computed(
  () => (displayName.value ?? "?")[0]?.toUpperCase() ?? "?",
)

const menuOpen = ref(false)

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
    <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
      <NuxtLink to="/" class="font-bold text-lg tracking-tight cursor-pointer shrink-0">
        Rafımdan
      </NuxtLink>

      <nav class="flex items-center gap-3">
        <NuxtLink
          to="/ilanlar"
          class="text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded cursor-pointer transition-colors"
        >
          İlanlar
        </NuxtLink>

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
                  v-if="authStore.user?.avatar_url"
                  :src="authStore.user.avatar_url"
                  :alt="displayName ?? ''"
                  referrerpolicy="no-referrer"
                  class="size-full object-cover"
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
                class="flex items-center px-3 py-2 text-sm text-foreground hover:bg-muted cursor-pointer transition-colors"
                @click="closeMenu"
              >
                {{ displayName }}
              </NuxtLink>
              <div class="border-t border-border my-1" />
              <NuxtLink
                to="/favoriler"
                class="flex items-center px-3 py-2 text-sm text-foreground hover:bg-muted cursor-pointer transition-colors"
                @click="closeMenu"
              >
                Favoriler
              </NuxtLink>
              <NuxtLink
                to="/ayarlar"
                class="flex items-center px-3 py-2 text-sm text-foreground hover:bg-muted cursor-pointer transition-colors"
                @click="closeMenu"
              >
                Ayarlar
              </NuxtLink>
              <div class="border-t border-border my-1" />
              <button
                class="flex w-full items-center px-3 py-2 text-sm text-red-600 hover:bg-muted cursor-pointer transition-colors"
                @click="authStore.logout(); closeMenu()"
              >
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
      </nav>
    </div>
  </header>
</template>

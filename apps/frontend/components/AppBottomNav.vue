<script setup lang="ts">
import { LayoutGrid, Plus, Heart, User } from "lucide-vue-next"

const authStore = useAuthStore()
const { unreadCount } = useNotifications()
const route = useRoute()

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + "/")
}

const accountPath = computed(() =>
  authStore.isLoggedIn ? "/ilanlarim" : "/giris"
)
const accountActive = computed(() =>
  ["/ilanlarim", "/favoriler", "/ayarlar", "/profil"].some(p => route.path.startsWith(p))
)
</script>

<template>
  <nav
    class="fixed bottom-0 inset-x-0 z-40 block sm:hidden bg-background border-t border-border"
    style="padding-bottom: env(safe-area-inset-bottom, 0px)"
  >
    <div class="flex items-end h-16">
      <NuxtLink
        to="/ilanlar"
        class="flex-1 flex flex-col items-center justify-center gap-0.5 h-full cursor-pointer transition-colors"
        :class="isActive('/ilanlar') ? 'text-brand' : 'text-muted-foreground'"
      >
        <LayoutGrid class="size-5" />
        <span class="text-[10px] font-medium">İlanlar</span>
      </NuxtLink>

      <NuxtLink
        to="/ilan-ver"
        class="flex-1 flex flex-col items-center justify-center gap-0.5 h-full cursor-pointer"
      >
        <span
          class="flex items-center justify-center size-11 rounded-full bg-brand text-brand-foreground shadow-md -mt-5"
          :class="isActive('/ilan-ver') ? 'opacity-90' : ''"
        >
          <Plus class="size-5" />
        </span>
        <span class="text-[10px] font-medium text-brand mt-0.5">İlan Ver</span>
      </NuxtLink>

      <ClientOnly>
        <NuxtLink
          to="/favoriler"
          class="flex-1 flex flex-col items-center justify-center gap-0.5 h-full cursor-pointer transition-colors"
          :class="isActive('/favoriler') ? 'text-brand' : 'text-muted-foreground'"
        >
          <Heart class="size-5" :class="isActive('/favoriler') && 'fill-brand'" />
          <span class="text-[10px] font-medium">Favoriler</span>
        </NuxtLink>

        <NuxtLink
          :to="accountPath"
          class="flex-1 flex flex-col items-center justify-center gap-0.5 h-full cursor-pointer transition-colors relative"
          :class="accountActive ? 'text-brand' : 'text-muted-foreground'"
        >
          <span class="relative">
            <User class="size-5" />
            <span
              v-if="authStore.isLoggedIn && unreadCount > 0"
              class="absolute -top-1 -right-1 size-3 rounded-full bg-brand"
            />
          </span>
          <span class="text-[10px] font-medium">Hesabım</span>
        </NuxtLink>

        <template #fallback>
          <div class="flex-1 h-full" />
          <div class="flex-1 h-full" />
        </template>
      </ClientOnly>
    </div>
  </nav>
</template>

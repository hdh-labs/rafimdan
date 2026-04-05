<script setup lang="ts">
const authStore = useAuthStore()

const displayName = computed(
  () => authStore.user?.display_name || authStore.user?.name || null,
)
</script>

<template>
  <header class="bg-white border-b border-border">
    <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
      <NuxtLink to="/" class="font-bold text-lg tracking-tight cursor-pointer shrink-0">
        Rafımdan
      </NuxtLink>

      <nav class="flex items-center gap-2">
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

          <div class="relative flex items-center gap-1 ml-1">
            <NuxtLink
              v-if="authStore.user?.slug"
              :to="`/profil/${authStore.user.slug}`"
              class="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              <span
                class="inline-flex items-center justify-center size-7 rounded-full bg-muted text-xs font-medium overflow-hidden shrink-0"
              >
                <img
                  v-if="authStore.user?.avatar_url"
                  :src="authStore.user.avatar_url"
                  :alt="displayName ?? ''"
                  class="size-full object-cover"
                />
                <span v-else>{{ (displayName ?? "?")[0]?.toUpperCase() }}</span>
              </span>
              <span class="hidden sm:block truncate max-w-24">{{ displayName }}</span>
            </NuxtLink>

            <NuxtLink
              to="/ayarlar"
              class="text-xs text-muted-foreground hover:text-foreground px-2 py-1 cursor-pointer transition-colors"
            >
              Ayarlar
            </NuxtLink>
            <button
              class="text-xs text-muted-foreground hover:text-foreground px-2 py-1 cursor-pointer transition-colors"
              @click="authStore.logout()"
            >
              Çıkış
            </button>
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

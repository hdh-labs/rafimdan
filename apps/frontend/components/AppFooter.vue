<template>
  <footer class="border-t border-border bg-background mt-12">
    <div class="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
      <span>&copy; {{ new Date().getFullYear() }} Rafımdan</span>
      <nav class="flex items-center gap-4">
        <NuxtLink to="/hakkimizda" class="hover:text-foreground cursor-pointer transition-colors">
          Hakkımızda
        </NuxtLink>
        <NuxtLink to="/kullanim-kosullari" class="hover:text-foreground cursor-pointer transition-colors">
          Kullanım Koşulları
        </NuxtLink>
        <NuxtLink to="/gizlilik" class="hover:text-foreground cursor-pointer transition-colors">
          Gizlilik
        </NuxtLink>
      </nav>
    </div>
  </footer>
</template>

<template>
  <div class="min-h-screen flex flex-col bg-background">
    <AppHeader />
    <main class="flex-1 pb-16 sm:pb-0">
      <slot />
    </main>
    <AppFooter class="pb-16 sm:pb-0" />
    <FeedbackWidget />
    <AppBottomNav />
  </div>
</template>

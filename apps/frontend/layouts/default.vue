<template>
  <div class="min-h-screen flex flex-col bg-background">
    <AppHeader />
    <main class="flex-1">
      <slot />
    </main>
    <AppFooter />
    <FeedbackWidget />
  </div>
</template>

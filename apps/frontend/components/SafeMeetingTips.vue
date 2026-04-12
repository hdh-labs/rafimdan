<script setup lang="ts">
import { ShieldCheck, ChevronDown } from "lucide-vue-next"

const open = ref(false)
</script>

<template>
  <div class="rounded-lg border border-border text-sm">
    <button
      type="button"
      :aria-expanded="open"
      aria-controls="safe-meeting-tips"
      class="w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted transition-colors rounded-lg"
      @click="open = !open"
    >
      <span class="flex items-center gap-2 text-muted-foreground font-medium">
        <ShieldCheck class="size-4 shrink-0" />
        Güvenli Buluşma İpuçları
      </span>
      <ChevronDown
        class="size-4 text-muted-foreground transition-transform duration-200 shrink-0"
        :class="open ? 'rotate-180' : ''"
      />
    </button>

    <div v-if="open" id="safe-meeting-tips" class="px-4 pb-4 space-y-1.5 text-muted-foreground">
      <p class="flex items-start gap-2">
        <span class="shrink-0 mt-0.5">·</span>
        Kalabalık, kamuya açık bir yer seçin — market önü, AVM girişi, kahve.
      </p>
      <p class="flex items-start gap-2">
        <span class="shrink-0 mt-0.5">·</span>
        Gündüz buluşun; mümkünse yanınızda biri olsun.
      </p>
      <p class="flex items-start gap-2">
        <span class="shrink-0 mt-0.5">·</span>
        WhatsApp konuşmasını silmeyin — her iki taraf için güvence.
      </p>
      <p class="flex items-start gap-2">
        <span class="shrink-0 mt-0.5">·</span>
        Eşyayı teslim almadan ödeme yapmayın.
      </p>
    </div>
  </div>
</template>

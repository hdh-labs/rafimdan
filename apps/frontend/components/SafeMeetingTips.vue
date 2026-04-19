<script setup lang="ts">
import { ShieldCheck, ChevronDown, Check } from "lucide-vue-next"

const open = ref(true)
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
      <span class="flex items-center gap-2 font-medium">
        <ShieldCheck class="size-4 shrink-0 text-green-600" />
        Güvenli Buluşma İpuçları
      </span>
      <ChevronDown
        class="size-4 text-muted-foreground transition-transform duration-200 shrink-0"
        :class="open ? 'rotate-180' : ''"
      />
    </button>

    <Transition
      enter-active-class="transition-all duration-200 ease-out overflow-hidden"
      leave-active-class="transition-all duration-200 ease-in overflow-hidden"
      enter-from-class="max-h-0 opacity-0"
      enter-to-class="max-h-60 opacity-100"
      leave-from-class="max-h-60 opacity-100"
      leave-to-class="max-h-0 opacity-0"
    >
      <ul v-if="open" id="safe-meeting-tips" class="px-4 pb-4 pt-1 space-y-2 text-muted-foreground list-none">
        <li class="flex items-start gap-2">
          <Check class="size-3.5 shrink-0 mt-0.5 text-green-600" />
          Kalabalık, kamuya açık bir yer seçin — market önü, AVM girişi, kahve.
        </li>
        <li class="flex items-start gap-2">
          <Check class="size-3.5 shrink-0 mt-0.5 text-green-600" />
          Gündüz buluşun; mümkünse yanınızda biri olsun.
        </li>
        <li class="flex items-start gap-2">
          <Check class="size-3.5 shrink-0 mt-0.5 text-green-600" />
          WhatsApp konuşmasını silmeyin — her iki taraf için güvence.
        </li>
        <li class="flex items-start gap-2">
          <Check class="size-3.5 shrink-0 mt-0.5 text-green-600" />
          Eşyayı teslim almadan ödeme yapmayın.
        </li>
      </ul>
    </Transition>
  </div>
</template>

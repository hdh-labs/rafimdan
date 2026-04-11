<template>
  <div class="flex items-center gap-2.5 select-none">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      class="size-7 shrink-0"
      aria-hidden="true"
    >
      <!-- Arka plan -->
      <rect width="32" height="32" rx="8" fill="#C05C38"/>
      <!-- Üst parlaklık — hafif derinlik hissi -->
      <rect x="0" y="0" width="32" height="15" rx="8" fill="rgba(255,255,255,0.07)"/>

      <!-- Raf gölgesi -->
      <rect x="4" y="22.5" width="24" height="2.5" rx="1.25" fill="rgba(0,0,0,0.15)"/>
      <!-- Raf tabanı -->
      <rect x="4" y="21.5" width="24" height="2.5" rx="1.25" fill="white"/>

      <!-- Kitap 1 — sol, dar, soluk -->
      <rect x="5" y="11.5" width="4.5" height="10" rx="1.5" fill="rgba(255,255,255,0.55)"/>

      <!-- Kitap 2 — orta, EN UZUN, tam beyaz (odak noktası) -->
      <rect x="11.5" y="8" width="6" height="13.5" rx="1.5" fill="white"/>
      <!-- Kitap 2 sırt detayı -->
      <rect x="11.5" y="8" width="1.5" height="13.5" rx="1.5" fill="rgba(0,0,0,0.07)"/>

      <!-- Kitap 3 — sağ, orta boy -->
      <rect x="20" y="10.5" width="5" height="11" rx="1.5" fill="rgba(255,255,255,0.80)"/>
    </svg>

    <span class="text-lg font-bold tracking-tight leading-none" style="color: oklch(0.35 0.08 38)">
      rafımdan
    </span>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: "Kullanım Koşulları — Rafımdan",
  description: "Rafımdan platformunu kullanırken geçerli olan kullanım koşullarını öğrenin.",
})

const LAST_UPDATED = "19 Nisan 2026"
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-14 space-y-10">
    <header class="space-y-2">
      <h1 class="text-3xl font-bold text-foreground tracking-tight">Kullanım Koşulları</h1>
      <p class="text-xs text-muted-foreground">Son güncelleme: {{ LAST_UPDATED }}</p>
    </header>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold text-foreground">1. Platformun Niteliği</h2>
      <p class="text-sm text-muted-foreground leading-relaxed">
        Rafımdan, kullanıcıların ikinci el eşya ilanlarını yayımladığı bir ilan panosudur.
        Platform; ödeme aracılığı, tahsilat, kefalet veya ticari komisyon hizmeti sunmaz.
        Alıcı ile satıcı arasındaki her türlü anlaşma, buluşma ve para transferi doğrudan
        taraflar arasında gerçekleşir. Rafımdan bu işlemlere taraf değildir.
      </p>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold text-foreground">2. Kabul</h2>
      <p class="text-sm text-muted-foreground leading-relaxed">
        Rafımdan'ı kullanarak bu koşulları kabul etmiş sayılırsın. Koşulları kabul
        etmiyorsan platformu kullanmayı bırakabilirsin.
      </p>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold text-foreground">3. Hesap</h2>
      <p class="text-sm text-muted-foreground leading-relaxed">
        Hesap oluşturmak için Google ile giriş yapman gerekir. Hesabının güvenliğinden
        sen sorumlusun. Başkası adına hesap açmak yasaktır.
      </p>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold text-foreground">4. İlan Kuralları</h2>
      <ul class="space-y-2 text-sm text-muted-foreground">
        <li class="flex gap-2">
          <span class="shrink-0">—</span>
          <span>Yalnızca gerçek ve kendi mülkiyetindeki ürünleri ilan verebilirsin.</span>
        </li>
        <li class="flex gap-2">
          <span class="shrink-0">—</span>
          <span>Yanıltıcı fiyat, açıklama veya fotoğraf kullanamaz­sın.</span>
        </li>
        <li class="flex gap-2">
          <span class="shrink-0">—</span>
          <span>Yasadışı, tehlikeli veya telif hakkı ihlali içeren ürünleri ilan veremezsin.</span>
        </li>
        <li class="flex gap-2">
          <span class="shrink-0">—</span>
          <span>Aynı ürünü birden fazla aktif ilan olarak yayınlayamazsın.</span>
        </li>
      </ul>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold text-foreground">5. Sorumluluk Sınırı</h2>
      <p class="text-sm text-muted-foreground leading-relaxed">
        Rafımdan bir ilan panosudur; alıcı ile satıcı arasındaki işlemlere taraf olmaz,
        ödeme veya teslimat sürecine dahil olmaz. Satış bedelinin ödenmesi, ürünün durumu,
        buluşma güvenliği ve doğabilecek her türlü anlaşmazlık tamamen tarafların
        sorumluluğundadır. Vergi ve mali yükümlülükler dahil olmak üzere yasal
        sorumluluklar kullanıcıya aittir; platform bu konularda taraf veya aracı değildir.
      </p>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold text-foreground">6. İçerik Kaldırma</h2>
      <p class="text-sm text-muted-foreground leading-relaxed">
        Kurallara aykırı içerikleri önceden bildirmeksizin kaldırma ve hesabı askıya alma
        hakkımızı saklı tutarız.
      </p>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold text-foreground">7. Değişiklikler</h2>
      <p class="text-sm text-muted-foreground leading-relaxed">
        Bu koşulları dilediğimiz zaman güncelleyebiliriz. Güncel koşullar her zaman bu
        sayfada yayımlanır. Platformu kullanmaya devam etmen, güncel koşulları kabul
        ettiğin anlamına gelir.
      </p>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold text-foreground">8. İletişim</h2>
      <p class="text-sm text-muted-foreground leading-relaxed">
        Rafımdan şu an yerel topluluklarla büyüyen küçük bir platformdur. Kullanım
        koşullarına ilişkin sorularınız için ilerleyen dönemde açılacak iletişim
        kanallarından bize ulaşabilirsiniz.
      </p>
    </section>
  </div>
</template>

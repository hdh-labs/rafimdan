<script setup lang="ts">
useSeoMeta({
  title: "Gizlilik Politikası — Rafımdan",
  description:
    "Rafımdan olarak kişisel verilerinizi nasıl topladığımızı, kullandığımızı ve koruduğumuzu öğrenin.",
})

const LAST_UPDATED = "19 Nisan 2026"
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-14 space-y-10">
    <header class="space-y-2">
      <h1 class="text-3xl font-bold text-foreground tracking-tight">Gizlilik Politikası</h1>
      <p class="text-xs text-muted-foreground">Son güncelleme: {{ LAST_UPDATED }}</p>
    </header>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold text-foreground">1. Topladığımız Veriler</h2>
      <ul class="space-y-2 text-sm text-muted-foreground">
        <li class="flex gap-2">
          <span class="shrink-0">—</span>
          <span>
            <strong class="text-foreground">Hesap bilgileri:</strong> Google ile giriş
            yaptığında ad, e-posta adresi ve profil fotoğrafın Google'dan alınır.
          </span>
        </li>
        <li class="flex gap-2">
          <span class="shrink-0">—</span>
          <span>
            <strong class="text-foreground">İlan verileri:</strong> Verdiğin ilanlar,
            yüklediğin fotoğraflar ve girdiğin konum bilgileri saklanır.
          </span>
        </li>
        <li class="flex gap-2">
          <span class="shrink-0">—</span>
          <span>
            <strong class="text-foreground">İletişim bilgileri:</strong> Profil ayarlarında
            girdiğin WhatsApp numarası, yalnızca alıcıların sana ulaşması için kullanılır.
          </span>
        </li>
        <li class="flex gap-2">
          <span class="shrink-0">—</span>
          <span>
            <strong class="text-foreground">Teknik veriler:</strong> Hata ayıklama ve
            güvenlik için sunucu günlükleri tutulur; IP adresi bu günlüklerde yer alabilir.
          </span>
        </li>
      </ul>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold text-foreground">2. Verilerin Kullanımı</h2>
      <ul class="space-y-2 text-sm text-muted-foreground">
        <li class="flex gap-2">
          <span class="shrink-0">—</span>
          <span>Hesabını oluşturmak ve kimliğini doğrulamak</span>
        </li>
        <li class="flex gap-2">
          <span class="shrink-0">—</span>
          <span>İlanlarını yayımlamak ve yönetmek</span>
        </li>
        <li class="flex gap-2">
          <span class="shrink-0">—</span>
          <span>Platform güvenliğini sağlamak ve kötüye kullanımı önlemek</span>
        </li>
        <li class="flex gap-2">
          <span class="shrink-0">—</span>
          <span>Yasal yükümlülükleri yerine getirmek</span>
        </li>
      </ul>
      <p class="text-sm text-muted-foreground leading-relaxed">
        Verilerini üçüncü taraflara satmıyor ya da pazarlama amacıyla paylaşmıyoruz.
      </p>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold text-foreground">3. Çerezler</h2>
      <p class="text-sm text-muted-foreground leading-relaxed">
        Oturumunu açık tutmak için yalnızca zorunlu <code class="text-xs bg-muted px-1 py-0.5 rounded">refresh_token</code> çerezi
        kullanıyoruz. Reklam veya analitik amaçlı çerez kullanmıyoruz.
      </p>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold text-foreground">4. Veri Saklama</h2>
      <p class="text-sm text-muted-foreground leading-relaxed">
        Hesabını sildiğinde kişisel verilerini ve ilanlarını 30 gün içinde kalıcı olarak
        sileriz. Yasal zorunluluk gerektiren durumlarda daha uzun süre saklama hakkımızı
        saklı tutarız.
      </p>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold text-foreground">5. Haklarınız</h2>
      <ul class="space-y-2 text-sm text-muted-foreground">
        <li class="flex gap-2">
          <span class="shrink-0">—</span>
          <span>Hakkınızda sakladığımız verilere erişim talep edebilirsiniz.</span>
        </li>
        <li class="flex gap-2">
          <span class="shrink-0">—</span>
          <span>Yanlış verilerin düzeltilmesini isteyebilirsiniz.</span>
        </li>
        <li class="flex gap-2">
          <span class="shrink-0">—</span>
          <span>Hesabınızı ve tüm verilerinizi silebilirsiniz.</span>
        </li>
      </ul>
      <p class="text-sm text-muted-foreground leading-relaxed">
        Talepler için sosyal medya kanallarımızdan ulaşabilirsiniz.
      </p>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold text-foreground">6. Güvenlik</h2>
      <p class="text-sm text-muted-foreground leading-relaxed">
        Verilerini korumak için HTTPS şifrelemesi, HTTP-only çerezler ve Cloudflare altyapısı
        kullanıyoruz. Hiçbir sistem %100 güvenli değildir; güvenlik açığı fark edersen
        lütfen bize bildirin.
      </p>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold text-foreground">7. Değişiklikler</h2>
      <p class="text-sm text-muted-foreground leading-relaxed">
        Bu politikayı güncelleyebiliriz. Güncel politika her zaman bu sayfada yayımlanır.
        Platformu kullanmaya devam etmen, güncel politikayı kabul ettiğin anlamına gelir.
      </p>
    </section>
  </div>
</template>

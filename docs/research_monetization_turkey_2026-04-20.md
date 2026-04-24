# Rafımdan Monetizasyon Araştırması — Türkiye
> Tarih: 20 Nisan 2026

## Mevcut Platform Modelleri

| Platform | Model | Komisyon/Ücret |
|----------|-------|----------------|
| Sahibinden | Ücretli ilan + boost | Kategoriye göre 1.125–3.169 TL/ilan |
| Dolap | Satış komisyonu | Satıcı %15 + alıcı %5-11 |
| Letgo | Sadece boost | 150–400 TL/süre paketi |
| Armut | Lead fee | Teklif başına ücret (kazanmasan da) |

**Önemli içgörüler:**
- Sahibinden ücretsiz başladı; 10M+ kullanıcıya ulaştıktan sonra ücretli ilan sınırını sistematik hale getirdi
- Dolap 2024'te komisyonu ~%23'e çıkardı → büyük kullanıcı tepkisi, 2025'te indirim kampanyasına zorlandı
- Letgo düşük monetizasyonla sürdürülemedi; OLX bünyesinde geri çekildi
- Lead-based model (Armut) C2C için uygun değil — kazanmadan ücret alınamaz

---

## Ödeme Altyapısı Karşılaştırması

### iyzico — Önerilen Seçenek
- Komisyon: %2,99 + 0,25 TL (hacme göre müzakere edilebilir)
- **Marketplace API:** sub-merchant desteği, komisyon split, %1 stopaj otomasyonu
- Bireysel/şahıs/limited şirket sub-merchant onboarding
- 2025 BTRANS ve e-ticaret stopaj uyumluluğu hazır

### PayTR
- Komisyon: %2,80–%3,40
- Marketplace split mevcut ama iyzico kadar olgun değil
- Alternatif seçenek

### Stripe
- Türkiye'de resmi destek yok; yabancı şirket ve banka hesabı gerektirir
- Rafımdan için şu an uygun değil

### Papara
- P2P ödemede güçlü kullanıcı tabanı
- Sub-merchant split için tasarlanmamış; disbursement aracı olarak sınırlı

---

## Vergi Mevzuatı (2024-2025)

### Platform ödeme işlemiyor (mevcut model)
- BTRANS yükümlülüğü: **YOK**
- %1 stopaj: **YOK**
- KDV: sadece platform şirketinin kendi geliri üzerinden

### Platform ödeme aracılığı yapmaya başlarsa (Phase 2+)
- **BTRANS:** GİB'e aylık kullanıcı işlem raporu (TC, tutar, banka hesabı)
- **%1 e-ticaret stopajı:** 1 Ocak 2025'ten itibaren yürürlükte; satıcıya yapılan ödemelerden kesilir, muhtasar beyanname ile bildirilir
- **AHS başvurusu:** Ticaret Bakanlığı'na aracı hizmet sağlayıcı kaydı
- **e-Fatura/e-Arşiv:** altyapısı kurulmalı

### Bireysel satıcılar
- Kişisel kullanım eşyası ikinci el satışı gelir vergisine tabi değil
- 2025 esnaf muaflığı eşiği: 1.580.000 TL/yıl
- GİB 2025 itibarıyla BTRANS verileriyle ticari boyut kazanan satıcıları takip ediyor

### Şirket yapısı
- Limited şirket yeterli; anonim şirket gerekmez
- 2025-2026 kurumlar vergisi: %25

---

## Yasal Çerçeve

- **Mesafeli Satışlar Yönetmeliği:** Yüz yüze satış kapsam dışı; Rafımdan için uygulanmaz
- **6563 ETK (2022 değişiklikleri):** Net işlem hacmi 10 milyar TL altında → "küçük AHS" statüsü, sınırlı yükümlülük
- **KVKK:** Ödeme verisi işlenince kart/IBAN verisi için açık rıza + veri işleme sözleşmesi; iyzico/PayTR kullanımında PCI-DSS sorumluluğu ödeme sağlayıcısına geçer
- **Platform sorumluluğu:** Kullanım koşullarıyla kullanıcılar arası anlaşmazlıklarda sorumluluk sınırlandırılabilir

---

## Freemium Özellik Değerlendirmesi

**En yüksek dönüşüm sağlayan özellikler:**
1. **Öne çıkarma (boost)** — görünürlük→satış doğrudan bağlantısı; kullanıcı ROI görebiliyor
2. **Doğrulanmış satıcı rozeti** — güven sorununu çözer; yeniden satın alma oranını artırır
3. **Genişletilmiş içerik** (fazla fotoğraf/video) — düşük fiyatlı, yüksek hacimli
4. **Premium abonelik** — profesyonel/yoğun satıcılar için; bireysel satıcıda düşük dönüşüm

**Fiyat noktaları (Türkiye bağlamı):**
- Boost: 50–500 TL makul (Letgo ~150–400 TL)
- Aylık premium: 99–299 TL
- Freemium genel dönüşüm: %2-5 gerçekçi hedef

**Kritik uyarı:** Az ilan olan kategorilerde öne çıkarma değersiz — sıralama avantajı yok. Kritik kitleye ulaşmadan fiyatlandırma başarısız.

---

## Aşamalı Monetizasyon Yol Haritası

### Phase 1 — Ücretsiz Büyüme (0 → 5K aktif ilan)
**Durum:** Şu an bu aşamadayız.

| Konu | Detay |
|------|-------|
| Model | Tamamen ücretsiz |
| Odak | Kullanıcı büyümesi, veri toplama, güven altyapısı |
| Yasal yükümlülük | Minimal |
| Teknik gereksinim | Ilan görüntülenme analitikleri, kullanıcı davranış izleme |
| Tahmini gelir | 0 TL |

**Çıkış kriteri:** 5K aktif ilan VE aylık 500+ tamamlanan buluşma

---

### Phase 2 — Freemium (5K → 50K aktif ilan)

| Özellik | Fiyat | Açıklama |
|---------|-------|----------|
| Boost 24 saat | 29 TL | Liste görünümünde öncelikli sıralama |
| Boost 7 gün | 79 TL | |
| Boost 30 gün | 199 TL | |
| Doğrulanmış Satıcı Rozeti | 79 TL/ay | TC doğrulama + satıcı puanı |
| Genişletilmiş fotoğraf | 49 TL/ay | 5 → 15 fotoğraf + video |

**Teknik gereksinimler:**
- iyzico standart POS entegrasyonu
- Kredi/cüzdan sistemi (boost kredisi satışı)
- Kullanıcıya ilan görüntülenme analitik paneli
- AHS başvurusu (Ticaret Bakanlığı)
- e-Fatura/e-Arşiv altyapısı

**Tahmini gelir (Phase 2 sonunda):**
- 50K ilan × %3 boost dönüşüm × 60 TL ort. → ~90K TL/ay
- 500 rozetli üye × 79 TL → ~40K TL/ay
- **Toplam: ~130K TL/ay (~6.500 USD)**

---

### Phase 3 — Komisyon/Escrow (50K+ aktif ilan)

**Tetikleyici:** 50K+ ilan VE kullanıcıların "platform üzerinden güvenli ödeme yapmak istiyorum" talebinin ölçülebilir hale gelmesi.

**Model: İsteğe Bağlı Güvenli Ödeme (Escrow)**
- Yüz yüze satış korunur, escrow zorunlu değil
- Satıcı-alıcı anlaşır → "Güvenli Ödeme" seçeneği sunulur
- Alıcı öder → teslim onayı → satıcıya transfer (iyzico Marketplace API)
- Komisyon: **%6** (Dolap'ın %15'inin altında)

**Teknik gereksinimler:**
- iyzico Marketplace API + sub-merchant onboarding
- BTRANS raporlama modülü
- %1 stopaj hesaplama + muhtasar beyanname altyapısı
- IBAN doğrulama API
- Anlaşmazlık/teslim onayı sistemi

**Tahmini gelir (Phase 3 olgunlaşınca):**
- 5.000 işlem/ay × 1.500 TL ort. × %6 → ~450K TL/ay
- Phase 2 gelirleriyle → **~600K TL/ay (~30K USD)**

---

## Karar Matrisi

| Kriter | Phase 1'de kal | Phase 2'ye geç |
|--------|---------------|----------------|
| Aktif ilan sayısı | <5K | 5K+ |
| Aylık buluşma | <500 | 500+ |
| Tekrar kullanım oranı | Düşük | Yükseliyor |
| Rakip yoğunluğu | Düşük | Orta-Yüksek |

**En kritik risk:** Phase 2→3 geçişinde komisyonu çok yüksek tutmak (Dolap hatası). Escrow gönüllü ve %6 ile başlanmalı, zorla değil.

---

## Kaynaklar

- Dolap komisyon oranları: dolap-help.freshdesk.com
- iyzico Pazaryeri API: docs.iyzico.com/urunler/pazaryeri
- E-ticaret stopaj 2025: alomaliye.com, ideasoft.com.tr
- Sahibinden ilan ücretleri: dopigo.com
- Esnaf muaflığı 2025: muhasebenews.com
- 6563 ETK değişiklikleri: gsghukuk.com
- BTRANS yükümlülükleri: gib.gov.tr
- C2C monetizasyon: simon-kucher.com, shipturtle.com
- Freemium dönüşüm oranları: firstpagesage.com

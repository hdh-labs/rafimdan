# Rafımdan — Güvenlik, Topluluk ve Hayır Özellikleri

**Versiyon:** 0.1 (Brainstorm)
**Tarih:** 2026-04-06
**Durum:** Fikir aşaması — henüz planlara işlenmedi

---

## Bağlam

Rafımdan yüz yüze buluşma odaklı bir platform. Kargo yok, nakit/havale ödeme, WhatsApp üzerinden iletişim. Bu yapı güven sorununu merkeze alıyor: **İki yabancı insan, gerçek hayatta buluşuyor.**

Aşağıdaki üç alan birbirini tamamlıyor. Güven artarsa topluluk büyür, topluluk büyüyünce hayır kültürü yerleşir.

---

## 1. Güvenli Buluşma (Safe Meeting)

### Problem
Kullanıcı tanımadığı biriyle nerede, nasıl buluşacak? Özellikle kadın kullanıcılar için bu ciddi bir engel.

### 1.1 Güvenli Buluşma Noktaları (Safe Zones)

Platform, her semtte **önceden tanımlı, kamuya açık, kalabalık buluşma noktaları** sunar.

**Kriter:** Kamera var, insan trafiği yüksek, tanınabilir landmark.

Örnek lokasyon tipleri:
- AVM girişi / ana kapı
- Büyük market önü (Migros, CarrefourSA)
- PTT / banka şubesi önü
- Eczane / fırın (mahalle bazlı iyi bilinen noktalar)
- Metro/metrobüs çıkışı
- Kahve zinciri şubesi

**Uygulama:**
- İlan detay sayfasında "Önerilen Buluşma Noktaları" harita kartı
- Satıcı kendi semtindeki safe zone'ları listeler/önerir
- Alıcı alternatif önerebilir, ikisi üzerinde anlaşır
- Kullanıcılar yeni nokta önerebilir (admin onayıyla aktif olur)

**Veri modeli fikri:**
```
safe_zones: id, city, district, name, type, lat, lng, verified_at, suggested_by
```

---

### 1.2 Profil Doğrulama Seviyeleri

Tek adımda tam kimlik doğrulama istemek kullanıcı kaçırır. **Kademeli güven** daha iyi:

| Seviye | Gereksinim | Rozet |
|--------|-----------|-------|
| Temel | Google OAuth (mevcut) | — |
| Telefon Doğrulama | SMS OTP | Yeşil telefon ikonu |
| Aktif Üye | 3+ tamamlanmış işlem | "Aktif Satıcı" |
| Güvenilir Üye | 10+ işlem + 4.5 üzeri puan | "Güvenilir" rozeti |

> Kimlik (TC) doğrulama: Gerekmedikçe istemeyiz. Mahkeme/polis ihtiyacı olmadıkça overkill. İleride düşünülebilir.

---

### 1.3 İşlem Onay ve Değerlendirme Sistemi (Transaction Flow)

Mevcut akış: İlan → WhatsApp → Buluşma → Bitti.
Platform bu buluşmadan **habersiz** — güven inşa edemiyor.

**Önerilen akış:**

1. Alıcı ilana "İlgileniyorum" tıklar (intent kaydı)
2. WhatsApp'a yönlendirilir (mevcut)
3. Buluşma sonrası her iki taraf "Bu işlem tamamlandı mı?" push/in-app notification alır
4. Onaylayan taraf 1-5 yıldız + opsiyonel kısa yorum bırakır
5. Profil sayfasında **puan + işlem sayısı** görünür

**Notlar:**
- Değerlendirme zorunlu olmamalı — kullanıcıyı sıkmamalı
- Çift taraflı onay olmadan değerlendirme açılmaz (Airbnb modeli)
- Fake değerlendirme için: yeni hesap + aynı IP/cihaz tespiti

---

### 1.4 Buluşma Güvenlik Bildirimi (Safety Check-in)

**Çok basit, çok değerli bir özellik.**

Kullanıcı buluşmaya gitmeden önce "Bugün X kişiyle buluşuyorum" kaydeder:
- Buluşma saatinden 30dk sonra "Tamam mısın?" bildirimi gelir
- Kullanıcı "Evet, sorun yok" tıklar
- Tıklamazsa, seçtiği güvenilir kişiye (arkadaş/aile) mesaj gönderilir

**Opsiyonel, opt-in.** Zorunlu yapma — sadece teklif et.

**Acil durum butonu:** İlan detay sayfasında gizli "Sorun Yaşıyorum" butonu. Tıklanınca kullanıcının o anki konumunu kaydeder ve güvenilir kişiye iletir. (Konum izni gerektirir — kullanıcı önceden izin vermiş olmalı)

---

### 1.5 Kullanıcı Engelleme ve Şikayet

Minimum ama kritik özellikler:
- Profili/ilanı şikayet et (kategori seçimi: spam, sahte, taciz, tehdit)
- Kullanıcıyı engelle (artık ilanlarını göremez, mesaj gönderemez)
- Admin moderasyon kuyruğu (zaten admin panel var)
- Belirli şikayet sayısında hesap otomatik dondurma + admin incelemesi

---

## 2. Topluluk Desteği (Community Help)

### Problem
"Çift kapılı buzdolabım var ama taşıyacak kimse yok." — Satış isteği var ama fiziksel yardım lazım.

### 2.1 "Yardım Lazım" İlan Kategorisi

Mevcut ilan tipleri: satılık, ücretsiz, takas.
Yeni tip: **yardım** (veya alt kategori olarak)

Örnek yardım ilanları:
- "Buzdolabını 2. kattan indirmek için 2 kişi lazım, 200 TL veririm"
- "IKEA dolap kurulumu yapabilecek biri?"
- "Yarın taşınıyorum, arabalı yardımcı arayışındayım"

Bu ilanlar para karşılığı olabilir (gönüllü değil, hizmet). Platform aracısı değil, sadece buluşturur.

**Fark:** Bu "eşya" ilanı değil, "hizmet" ilanı — ayrı bir `type: 'help'` veya ayrı bir section olabilir.

---

### 2.2 Taşıma Gönüllüleri / Komşuluk Ağı

Arabalı, güçlü, yardımsever komşular platformda kendini "Yardım Edebilirim" olarak işaretleyebilir:

- Profilde "Taşıma yardımı yapabilirim" badge
- Şehir/ilçe bazlı filtrelenebilir
- Yardım talebi gelince bildirim alır (opt-in)
- Ücretsiz ya da sembolik ücret — kendi kararı

**Dikkat:** Bu bir nakliye marketplas değil. Komşuluk ruhu olmalı. Profesyonel nakliyatçılar değil, gerçek komşular.

---

### 2.3 Mahalle Grubu Kavramı

WhatsApp grup kültürünün platforma taşınması:
- Kullanıcı kayıt olurken mahalle seçiyor (şu an şehir/ilçe var)
- "Mahallem" feed: Sadece kendi mahallesindeki ilanlar
- Mahalle bazlı bildirim: "Bingöl Mahallesi'nde yeni ilan"

**Bu zaten hiperlokal vizyon için kritik** — şu an ilçe bazlı çalışıyor, mahalle bazlı daha güçlü bağ kurar.

---

## 3. Hayır İşleri ve Bağış (Sadaka & Charity)

### Problem / Fırsat
Türk kullanıcı kültüründe "Allah rızası için vermek" güçlü bir motivasyon. Platform bunu birinci sınıf özellik olarak sunabilir — değer önerisi oluşturur.

### 3.1 "Allah Rızası İçin" İlan Tipi

Mevcut `price_type: 'free'` var. Bunu iki katmana ayır:

| Tip | Açıklama | Görsel |
|-----|---------|--------|
| `free` | Ücretsiz (pratik nedenle) | "Ücretsiz" etiketi |
| `sadaka` | Allah rızası için, bağış niyetiyle | Yeşil kalp / özel rozet |

`sadaka` ilanları için:
- Ayrı filtre: "Sadece hayır ilanları"
- Öne çıkarma (sponsored değil, kalite sinyali)
- "Bu eşyayı aldım, hayırlı olsun" geri bildirimi
- Kategori önerileri: Kıyafet, kitap, çocuk eşyaları, gıda (raf ömrü olan)

---

### 3.2 Satış Gelirini Bağışla

Satıcı ilan oluştururken seçebilir:
- "Bu ilanın gelirinin tamamını / %50'sini bağışlamak istiyorum"
- Platform ortaklık yaptığı vakıf/derneklerden birini seçer
- İlan sayfasında "Bu satışın geliri [X Vakfı]'na bağışlanacak" bandı görünür

**Dikkat noktaları:**
- Platform ödeme aracısı değil (MVP'de online ödeme yok)
- Şimdilik bu bir **beyan** sistemi olabilir — satıcı verdiğini beyan eder
- Güven için vakıf logosu + satıcı onayı yeterli başlangıç
- İleride makbuz yükleme, QR bağış entegrasyonu eklenebilir

**Potansiyel partner vakıflar:** Türk Kızılay, Ahbap, İhtiyaç Haritası, yerel dernekler

---

### 3.3 Ramazan / Özel Dönem Kampanyaları

Ramazan, kurban bayramı, yeni yıl gibi dönemlerde özel koleksiyonlar:

- "Ramazan Yardım Köşesi": Gıda, kıyafet, ev eşyası bağışı
- "Bayram Öncesi Kıyafet" kampanyası: Çocuk kıyafeti bağış/al
- "Kışlık Eşya" kampanyası: Battaniye, mont, bot

Teknik olarak bu bir `campaign` objesi:
```
campaigns: id, title, slug, start_date, end_date, listing_tag, banner_image
```
İlanlar kampanyaya tag'lenebilir.

---

### 3.4 Sadaka-i Cariye Kategorisi

"Kalıcı hayır" — eşyanın bir kuruma/topluluğa verilmesi:

- Okula masa/sandalye bağışı
- Kütüphaneye kitap bağışı
- Camiye halı/seccade
- Çocuk yuvası / huzurevi

Bunlar bireysel alıcıya değil, **kuruma** gidiyor. Farklı bir akış:
- İlan sayfasında "Kurum talebi" bölümü
- Kurumlar profil açabilir (doğrulanmış)
- Bağışçı kurumla doğrudan iletişim

---

## 4. Açık Sorular (Karar Gerektiren)

### Güvenlik
- [ ] Telefon doğrulama ne zaman zorunlu olacak? (şimdi, Phase 9, asla?)
- [ ] Safe zone veritabanı kim yönetecek? Manuel mi, OpenStreetMap entegrasyonu mu?
- [ ] Değerlendirme sistemi MVP'ye girer mi yoksa sonraki phase mı?
- [ ] Safety check-in için hangi bildirim kanalı? (push, WhatsApp, email?)

### Topluluk
- [ ] Mahalle verisi nasıl toplanacak? Kayıt sırasında zorunlu mu?
- [ ] "Yardım" ilanları ayrı section mı, mevcut kategori ağacına mı giriyor?
- [ ] Taşıma gönüllüsü sistemi için ayrı profil alanı açılacak mı?

### Hayır
- [ ] `sadaka` listing type ne zaman ekleniyor?
- [ ] Bağış beyan sistemi yeterli mi, yoksa doğrulama mekanizması gerekli mi?
- [ ] Hangi vakıflarla başlangıç ortaklığı kurulacak?
- [ ] Kampanya sistemi admin panelinden yönetilecek mi?

---

## 5. Öncelik Önerileri

Fazla büyük düşünmeden, adım adım:

**Hemen yapılabilir (mevcut sisteme eklenti):**
1. `price_type` enum'a `sadaka` ekle — tek migration, tek UI değişikliği
2. Safe zone verisi — başlangıçta statik JSON, harita kartı
3. Kullanıcı engelleme + şikayet — güvenlik için kritik

**Phase 9 adayları:**
4. Değerlendirme sistemi (rating + intent flow)
5. Mahalle bazlı feed
6. "Yardım" ilan tipi

**Phase 10+ (daha büyük iş):**
7. Doğrulanmış kurum profilleri
8. Kampanya sistemi
9. Safety check-in + acil durum butonu
10. Bağış doğrulama / makbuz akışı

---

## 6. Rakip Analiz Notu

`docs/research_competitors_2026-04-05.md` incelendi. Mevcut rakipler (Letgo, Sahibinden, Facebook Marketplace):
- Hiçbirinde yerleşik safe zone sistemi yok
- Bağış/hayır özelliği yok (Facebook'ta informal gruplar var)
- Değerlendirme var ama zayıf

**Bu üç alan Rafımdan'a gerçek bir farklılaşma fırsatı sunuyor.** Özellikle `sadaka` ilan tipi — Türkiye'de başka hiçbir platformda yok, kültürel rezonansı çok güçlü.

---

*Bu belge fikir aşamasındadır. Implementasyon kararları için IMPLEMENTATION_PLAN.md güncellenmeli.*

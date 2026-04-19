# UI/UX Backlog — Rafimdan

Son guncelleme: 2026-04-19

---

## BLOCKER — MVP oncesi cozulmeli

| ID | Konum | Sorun | Oneri |
|----|-------|-------|-------|
| B1 | `ilan-ver.vue` | WhatsApp gate `<ClientOnly>` icinde, form disinda; authStore.user SSR'da null → sayfa bos gorünür. | Gate ve form birlikte `<ClientOnly>` icine alinmali ya da middleware SSR'da user'i hydrate etmeli. |
| B2 | `ilan-ver.vue:211` | B1 ile baglantilidur; SSR'da form render edilmeyince kullanici "sayfa calismiyor" sanir. | B1 cozumu bu durumu da ortadan kaldirir; ayri bir fix gerekmez. |
| B3 | `ilanlar/index.vue` | Mobil drawer arama inputunda `@keydown.enter="applyFilters"` eksik; desktop sidebar'da mevcut. | Mobil input'a ayni event handler eklenmeli. |
| B4 | `ListingCard.vue:137` | FavoriteButton z-10 ile hover alanina cikiyor; mobilde yanlis tiklama riski yuksek. | z-index hiyerarsisi gozden gecirilmeli, gerekirse FavoriteButton alani genisletilmeli. |
| B5 | `favoriler.vue` | Skeleton `aspect-[3/4]`, kartlar farkli oran → layout shift; veri sadece `onMounted`'ta yuklenior, SSR yok. | Skeleton oranini kart orani ile eslestirilmeli; useAsyncData ile SSR destegi eklenmeli. |

---

## HIGH — Yakin sprint

| ID | Konum | Sorun | Oneri |
|----|-------|-------|-------|
| H1 | `ilan/[slug]/index.vue` | "Satici iletisim bilgisi eklememisti." metni gecmis zaman; alternatif yonlendirme yok. | "Satici henuz iletisim bilgisi eklememis." yapilmali; profil linki alternatif olarak sunulmali. |
| H2 | `ilan/[slug]/index.vue` | Foto galerisi mobilde swipe desteklemiyor; gezinme butonlari 32px (HIG min 44px). | Touch/swipe eventi eklenmeli; buton hedef alani 44px'e cikarilmali. |
| H3 | `index.vue:58` | Ilan yoksa "Son Ilanlar" section'i tamamen kayboluyor, bos state yok. | Bos state komponenti eklenmeli (CTA ile birlikte). |
| H4 | `ilanlar/index.vue` | Filtre sonucu bos oldugunda aktif filtreler gosterilmiyor, genisletme onerisi yok. | Aktif filtre etiketleri ve "filtreleri temizle" aksiyonu bos state'e eklenmeli. |
| H5 | `ayarlar.vue` | WhatsApp format hatasi sadece submit'te cikiyor. | Alan odaktan cikinca (blur) gercek zamanli format hint gosterilmeli. |
| H6 | `ilan-ver.vue` | Fotograflar label'inin `for` attribute'u yok; tiklama veya screen reader calismaz. | Label `for` ile input `id` eslestirilmeli. |
| H7 | `profil/[slug].vue` | WhatsApp butonu iki kez render ediliyor (badge + buton); gorsel hiyerarsisi bozuk. | Tekrar eden render kaynagi tespit edilip biri kaldirilmali. |
| H8 | `ilanlarim.vue:260` | Pending/rejected ilana tiklayinca aciklama olmadan sessizce edit sayfasina yonlendiriliyor. | Yonlendirme oncesi kullaniciya durum ve sebep aciklanmali (toast veya inline mesaj). |
| H9 | `AppHeader.vue` | WhatsApp olmayan kullaniciya her sayfada banner gosteriliyor, dismiss yok. | Banner dismiss edilebilir yapilmali; tercih localStorage'a kaydedilmeli. |
| H10 | `ilan/[slug]/duzenle.vue` | `ssr: false` nedeniyle hydration tamamlanana kadar blank sayfa gorünüyor. | Hydration suresince loading skeleton gosterilmeli. |

---

## MEDIUM — Ileriki sprint

| ID | Konum | Sorun | Oneri |
|----|-------|-------|-------|
| M1 | `ListingCard.vue` | Giris yapmamis kullanici favorileme butonuna basinca sessiz kaliyor. | Toast bildirimi veya login redirect eklenmeli. |
| M2 | `ilanlar/index.vue` | Pagination sadece onceki/sonraki; sayfa numarasi gosterilmiyor. | Sayfa numarasi gorunurlugu eklenmeli. |
| M3 | `ilan-ver.vue` | "Kapaga Al" alani `<div @click>` ile yapilmis, keyboard erisilebilir degil. | `<button>` element ile yeniden implemente edilmeli. |
| M4 | `ilanlarim.vue` | Inline fiyat edit `touchstart` eksik; iOS'ta blur tabanli iptal tetiklenebilir. | `@mousedown.prevent` yanina `@touchstart.prevent` da eklenmeli. |
| M5 | `ilan/[slug]/index.vue` | Üyelik tarihi Türkce hal eki apostrofla hardcode edilmis, sesli uyumu bozuluyor. | "Üyelik: {{ memberSince }}" seklinde hal eki kaldirilmali. |
| M6 | `admin/index.vue` | Admin panel tamamen client-only, yukleme sirasinda skeleton yok. | Yukleme durumu icin skeleton eklenmeli. |
| M7 | `kategori/[slug].vue`, `ilanlar/[city].vue` | Bos sehir/kategori kombinasyonunda ne gosterildigi belirsiz. | Bos state ve error handling tanimli hale getirilmeli. |
| M8 | `FavoriteButton.vue` | `displayCount >= 2` esigi; kullanici favorilediginde kendi favorisi count'a eklenmiyor gorunuyor. | Esik mantigini gozden gecir; kullanicinin kendi favorisi aninda sayiya yansimali. |
| M9 | `giris.vue` | Google OAuth hatalarinda kullaniciya feedback yok. | `?error=` query param yakalanarak anlasilir hata mesaji gosterilmeli. |
| M10 | `ilan-ver.vue`, `duzenle.vue` | Taslak kaydetme yok, `beforeRouteLeave` guard yok; kullanici formu kaybedebilir. | Route degisimi oncesi onay diyalogu veya otomatik taslak kayit eklenmeli. |

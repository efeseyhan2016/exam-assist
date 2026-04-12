# EXAM ASSIST — Zekâ Motoru Değerlendirme Çerçevesi

**Versiyon:** 1.0  
**Tarih:** 12 Nisan 2026  
**Amaç:** Hangi zekâ motorunun bir sonraki iyileştirme hedefi olacağını belirlemek için yapısal bir puanlama sistemi.

---

## 0. Bu Çerçeve Nedir, Ne Değildir

**Nedir:**
Bir mühendislik önceliklendirme aracı. Her zekâ motorunun ürün kalitesine katkısını 1–5 yıldız üzerinden değerlendirerek, 4'ün altında kalan motorları doğrudan iyileştirme hedefine çevirir.

**Ne değildir:**
- Kullanıcıya gösterilen bir puan değil.
- Her sprint'te otomatik hesaplanan bir metrik değil.
- Bir motorun "ne kadar karmaşık olduğunu" ölçen bir araç değil.

Temel soru her zaman şu:

> *"Bu motor, öğrenciye doğru bilgiyi doğru zamanda veriyor mu?"*

---

## 1. Yıldız Anlamları

| Yıldız | Etiket | Tanım |
|--------|--------|-------|
| ★☆☆☆☆ | **Kırık** | Motor çalışmıyor, çıktısı yanlış, veya kullanıcıya ulaşmıyor. Kodu mevcut olabilir ama fiilen işlevsiz. |
| ★★☆☆☆ | **Zayıf** | Motor çalışıyor ama bilinen senaryolarda yanlış sonuç üretiyor. Kullanıcı güveni oluşmuyor veya aktif olarak zedeleniyor. |
| ★★★☆☆ | **Kabul Edilebilir** | Çoğu durumda doğru çalışıyor ama edge case'lerde kırılıyor veya önemli bir alt senaryoyu kapsamıyor. Kullanıcı bazen doğru bazen yanlış sonuç görüyor. |
| ★★★★☆ | **Güçlü** | Bilinen senaryoların büyük çoğunluğunda doğru ve tutarlı çalışıyor. Kalan sorunlar nadir veya düşük etkili. Kullanıcı bu motora güvenebilir. |
| ★★★★★ | **Referans** | Motor hem doğru hem de ürün tasarımıyla tam uyumlu. Edge case'ler ele alınmış. Çıktı kalitesi portföy sunumunda gösterilebilecek seviyede. Kullanıcı bu motorun varlığını "fark etmez" — doğal ve güvenilir hisseder. |

**Yönetim kuralı:** 4'ün altında kalan her motor, otomatik olarak bir sonraki micro-pack döngüsünün iyileştirme adayıdır.

---

## 2. Değerlendirme Boyutları

Her zekâ motoru 6 bağımsız boyutta değerlendirilir. Bu boyutlar, bir motorun ürün kalitesine katkısını farklı açılardan ölçer.

### B1. Doğruluk (Accuracy)

> Motor, verilen girdiyle mantıksal olarak doğru çıktı üretiyor mu?

- Girdileri ve çıktıları arasında tutarsızlık var mı?
- Bilinen test senaryolarında beklenen sonucu veriyor mu?
- Hesaplama mantığında bilinen hatalar var mı?

Örnek test: FIN301, 38 saat sonra sınav, 19 saat hedef, 4 saat kalan kapasite → risk motoru "Moderate" diyor. Bu bir doğruluk hatası.

### B2. Kapsam (Coverage)

> Motor, hedef kullanıcı senaryolarının ne kadarını kapsıyor?

- Motorun sorumlu olduğu alan ne? Bu alanın yüzde kaçı implement edilmiş?
- Önemli alt senaryolar eksik mi?
- "Stub" durumunda olan bileşenler var mı?

Önemli ayrım:

- **bilinçli dar kapsam:** motor özellikle küçük ve güvenilir tutulmuştur
- **eksik kapsam:** motorun taşıması gereken temel senaryolar hâlâ yoktur

Bu çerçeve bilinçli darlığı otomatik olarak cezalandırmaz.
Kapsam puanı düşmelidir yalnızca motorun ürün içinde üstlendiği sorumluluk ile gerçek implementasyon arasında boşluk varsa.

Örnek: `resource-document-binding.ts` artık çalışan bir bağlama katmanıdır; kapsam puanı "erken ama eksik" olabilir, ama sadece dosya var diye "stub" sayılmaz.

### B3. Güvenilirlik (Reliability)

> Motor, farklı koşullarda tutarlı mı?

- Aynı girdi her zaman aynı çıktıyı mı veriyor? (Deterministik motorlar için bu garanti olmalı.)
- Boş veri, eksik alan, sıfır değer gibi durumları kaldırıyor mu?
- Runtime'da sessiz hata (silent failure) üretiyor mu?

Örnek: `useResources()` hook'u `isReady = false`'da kalıyor — Resources ekranı hiç açılmıyor. Bu bir güvenilirlik çöküşü.

### B4. Ürün Uyumu (Product Alignment)

> Motorun çıktısı, EXAM ASSIST'in ürün vaadini destekliyor mu?

- Çıktı, kullanıcının "bundan sonra ne yapmalıyım" sorusuna katkı sağlıyor mu?
- Motor, ürünün duygusal çapası (yaklaşan sınav baskısı) ve planlama çapası (neye dikkat edilmeli) ile uyumlu mu?
- Yanlış çıktı, kullanıcıda "bu ürün beni anlamıyor" hissi yaratıyor mu?

Örnek: Daily brief FIN301'e odaklanıyor (proximity), priorities MAN201'i birinci gösteriyor (risk). Kullanıcı iki farklı mesaj alıyor. Ürün uyumu zayıf.

### B5. Geri Besleme Entegrasyonu (Feedback Integration)

> Motor, kullanıcı davranışından veya sonuçlarından öğreniyor mu?

- Session log'ları, reflection'lar, veya örtük sinyaller motoru etkiliyor mu?
- Kullanıcı bir öneriyi reddederse motor bunu kaydediyor ve uyum sağlıyor mu?
- Geri besleme döngüsü gerçekten çıktıyı değiştiriyor mu, yoksa sadece kaydediyor mu?

Örnek: `recommendation-events.ts` → show→accept→convert→reflect zinciri mevcut ve 21 günlük pencerede score adjustment yapıyor. Bu iyi bir entegrasyon.

### B6. Test Edilebilirlik (Testability)

> Motorun doğruluğunu bağımsız olarak doğrulayabilir miyiz?

- Motorun girdileri ve çıktıları deterministik mi?
- Manuel bir test senaryosu yazılabilir mi?
- Birim test mevcut mu?
- QA'de elle doğrulama yapılabiliyor mu?

Örnek: Risk motoru deterministik — girdiler verildiğinde skor elle hesaplanabilir (QA raporunda yaptığımız gibi). Test edilebilirlik yüksek.

---

## 3. Yıldız Eşikleri: 4 ve 5 Yıldız Ne Gerektirir

### 4 Yıldız (Güçlü) İçin Minimum Koşullar

Bir motorun 4 yıldız alabilmesi için **tüm** aşağıdaki koşulları sağlaması gerekir:

1. **Doğruluk:** Bilinen test senaryolarının %90+'ında doğru sonuç. Bilinen doğruluk hataları ya yok ya da "düşük etki + nadir senaryo" kategorisinde.

2. **Kapsam:** Motorun sorumlu olduğu temel senaryoların %80+'ı implement edilmiş ve çalışıyor. "Stub" bileşen olabilir ama bunlar temel kullanım akışını bloke etmemeli.

3. **Güvenilirlik:** Boş veri ve edge case'lerde sessiz çökme yok. Motorun çalıştığı her yerde tutarlı çıktı var.

4. **Ürün uyumu:** Motor çıktısı, kullanıcıya yanlış yönlendirme vermiyor. Birden fazla yüzeyde (home, priorities, sessions, calendar) tutarlı mesaj var.

5. **Geri besleme:** En az bir geri besleme kanalı (session reflection, implicit behavior) motoru etkiliyor.

6. **Test edilebilirlik:** Elle veya otomatik bir test senaryosuyla motorun doğruluğu doğrulanabilir.

### 5 Yıldız (Referans) İçin Ek Koşullar

4 yıldız koşullarına ek olarak:

1. **Edge case dayanıklılığı:** Nadir ama gerçekçi senaryolarda (tek ders, 8 ders, sınav yarın ama 0 saat çalışılmış, sınav 60 gün sonra, tüm dersler "kolay" vb.) motor mantıklı çıktı üretiyor.

2. **Çapraz yüzey tutarlılığı:** Motorun çıktısını kullanan tüm ekranlar (sidebar, home, priorities, sessions, calendar, resources) birbiriyle çelişmiyor.

3. **Kullanıcı algısı:** Motor çıktısı "doğal" hissediyor — kullanıcı "bu mantıklı" diyor, "bu motor nasıl çalışıyor" diye sormuyor. Güven sessizce oluşmuş.

4. **Geri besleme olgunluğu:** Motor, en az iki farklı geri besleme kanalından (session data + recommendation feedback gibi) etkileniyor ve bu etki gözlemlenebilir.

5. **Portföy kalitesi:** Motorun çıktısı bir ürün demosunda gösterilebilir — "bakın, bu senaryo için şunu öneriyor" dendiğinde ikna edici.

---

## 4. 4'ün Altına Düşüren Zayıflıklar

Aşağıdaki durumlardan **herhangi biri** motorun 4'ün altında kalmasına yeterlidir:

### Otomatik 1 Yıldız (Kırık) Koşulları

- Motor kodu mevcut ama runtime'da hiç çalışmıyor (ör: Resources ekranı `isReady` stuck)
- Motor çıktısı kullanıcıya hiç ulaşmıyor
- Motor tamamen stub durumunda — sadece dosya ve interface var, mantık yok

### Otomatik 2 Yıldız (Zayıf) Koşulları

- Bilinen ve tekrarlanabilir bir doğruluk hatası var (ör: risk clamp sorunu)
- Motor, temel kullanım senaryosunda yanlış sonuç veriyor ve bu yanlış sonuç kullanıcıya görünüyor
- Motor çalışıyor ama "güveni kıran" bir çıktı üretiyor (38 saatte sınav olan derse "Moderate" demek gibi)

### Otomatik 3 Yıldız (Kabul Edilebilir) Koşulları

- Temel senaryo doğru ama bilinen bir edge case kırık (ör: tek derste portfolioOverload hesabı anlamsız)
- Kapsam eksikleri var ama temel akış çalışıyor (ör: topic graph var ama prerequisite ilişkileri henüz yok)
- Birden fazla yüzeyde tutarsız mesaj var ama her biri kendi içinde mantıklı
- Geri besleme entegrasyonu yok veya çok yüzeysel

Not:
"Dar ama güvenilir" bir motor ile "yarım kalmış" bir motor aynı şey değildir.
Motorun scope'u bilinçli olarak küçük tutulduysa ve o dar alanı güvenilir biçimde taşıyorsa, sadece henüz genişlememiş diye 3 yıldıza düşürülmemelidir.

---

## 5. Puanlama Nasıl Önceliklendirmede Kullanılmalı

### Temel Kural

```
4'ün altındaki her motor = micro-pack iyileştirme adayı
```

### Önceliklendirme Sıralaması

Birden fazla motor 4'ün altındaysa, aşağıdaki sıralama kuralları uygulanır:

**Kural 1 — Ürün etkisi önceliklidir.**
Aynı yıldız seviyesindeki iki motor arasında, kullanıcının daha sık gördüğü veya güveninin daha çok bağlı olduğu motor önce gelir.

Ürün etkisi sıralaması (en yüksekten en düşüğe):
1. Risk motoru — her ekranın altında yatan sıralama
2. Home focus / daily brief — kullanıcının ilk gördüğü ekran
3. Study recommendation — çalışma aksiyonunu yönlendiren çıktı
4. Task-aware priorities — deadline baskısını yansıtan katman
5. Resource intelligence — kaynak yönlendirmesi
6. Topic focus — konu kapsamı ve zayıf alan tespiti
7. Subject intelligence (study mode) — çalışma modu sınıflandırması
8. Academic event derivation — olay tespiti ve yönetimi
9. Exam proximity — zaman penceresi profili
10. Recommendation feedback loop — geri besleme altyapısı
11. Import selection intelligence — ders ekleme tahmini
12. PDF engine — içerik parmak izi
13. Resource-document binding — kaynak-görev bağlama (erken ama çalışan ilişkilendirme katmanı)

**Kural 2 — Düşük yıldız her zaman yüksek yıldızdan önce gelir.**
1 yıldızlı bir motor, 3 yıldızlı bir motordan önce ele alınır — ürün etkisi ne olursa olsun.

**Kural 3 — Aynı yıldız + aynı etki seviyesinde, fix maliyeti düşük olan önce gelir.**
Tek dosya, dört satır değişiklik gerektiren bir düzeltme, mimari değişiklik gerektiren bir düzeltmeden önce yapılır.

### Karar Tablosu

| Yıldız | Aksiyon | Zamanlama |
|--------|---------|-----------|
| 1 ★ | Acil düzeltme veya devre dışı bırakma | Bu sprint |
| 2 ★★ | Bir sonraki micro-pack'te düzeltme | Bu hafta |
| 3 ★★★ | Planlı iyileştirme, roadmap'e ekle | Bu ay |
| 4 ★★★★ | Aktif iyileştirme hedefi değil, fırsatçı iyileştirme | Uygun olduğunda |
| 5 ★★★★★ | Dokunma, koru | — |

---

## 6. Sahte Hassasiyetten Kaçınma Kuralları

Bu çerçevenin kendisi bir zekâ katmanı olduğu için, kendi güvenilirliğini korumak adına aşağıdaki kurallar zorunludur:

### Kural 1 — Puanı kanıtla, hisle değil.

Her yıldız puanı yanında en az bir somut kanıt olmalıdır:
- Bir test senaryosu sonucu
- Bir QA bulgusu
- Bir kod incelemesi referansı
- Bir kullanıcı gözlemi

"Genel olarak iyi çalışıyor" → geçersiz.
"QA'de FIN301 senaryosunda doğru label üretti" → geçerli.

### Kural 2 — Boyut puanlarının ortalamasını alma.

6 boyutun aritmetik ortalaması yıldız puanını belirlemez. Tek bir "kırık" boyut tüm motoru düşürür:

```
Eğer herhangi bir boyut ≤ 2 ise → motor puanı ≤ 3
Eğer herhangi bir boyut = 1 ise → motor puanı ≤ 2
```

Bu, güçlü boyutların zayıf boyutları maskelemesini engeller.

### Kural 3 — Puanı sadece somut değişiklikle güncelle.

Yıldız puanı şu durumlarda güncellenir:
- Kod değişikliği yapıldığında (bug fix, yeni özellik)
- Yeni bir QA testi yapıldığında
- Bilinen bir sorun kapatıldığında

"Bence artık daha iyi" → güncelleme gerekçesi değil.

### Kural 4 — 5 yıldızı kolay verme.

5 yıldız, ürünün bu motorla ilgili "artık düşünmemize gerek yok" dediği anlamına gelir. Bu, yalnızca:
- Birden fazla QA döngüsünden geçmiş
- Edge case'leri test edilmiş
- Çapraz yüzey tutarlılığı doğrulanmış
- En az bir "stres senaryosu" (çok ders, çok az zaman, çelişkili sinyaller) başarılı geçmiş

motorlara verilir.

### Kural 5 — Çerçevenin kendisini de sorgula.

Bu çerçeve de zamanla eskiyebilir. Her büyük ürün aşamasında (yeni motor ekleme, mimari değişiklik, kullanıcı testi sonrası) çerçevenin boyutlarını ve eşiklerini gözden geçir. Çerçeve ürünün gerisinde kalıyorsa güncelle.

### Kural 6 — Yarım yıldız kullanma.

3.5 yıldız yoktur. Emin değilsen alt yıldızı ver. Bu çerçeve hassasiyet iddia etmez — karar netliği iddia eder. Amaç "bu motor tam 3.7" demek değil, "bu motor 4'ün altında mı, üstünde mi" sorusuna net cevap vermektir.

---

## 7. Motor Envanteri

Aşağıdaki tablo, codebase'de tespit edilen tüm zekâ motorlarını ve değerlendirme için temel referans bilgilerini listeler. Puanlar bu çerçevenin uygulanmasıyla ayrıca belirlenecektir.

| # | Motor Adı | Dosya | Satır (yaklaşık) | Temel Çıktı | Ürün Etkisi |
|---|-----------|-------|-------------------|-------------|-------------|
| 1 | Risk Motoru | `lib/risk.ts` | ~453 | Sıralı risk skorları, etiketler | **Çok Yüksek** — tüm sıralamalar buraya dayanıyor |
| 2 | Home Focus | `lib/home-focus.ts` | ~244 | Bugünkü odak önerisi | **Çok Yüksek** — ana ekranın beyni |
| 3 | Daily Brief | `lib/daily-brief.ts` | ~321 | Başlık, gövde, chip'ler | **Çok Yüksek** — kullanıcının ilk okuduğu metin |
| 4 | Study Mode | `lib/subject-intelligence.ts` | ~461 | Çalışma modu (problem/interpretive/...) | **Yüksek** — session ve kaynak önerilerini şekillendiriyor |
| 5 | Resource Intelligence | `lib/resource-intelligence.ts` | ~692 | Kaynak puanlama, öneri, konu haritası | **Yüksek** — kaynak ekranının beyni |
| 6 | Recommendation Loop | `lib/recommendation-events.ts` | ~648 | Geri besleme profili, skor ayarlamaları | **Orta-Yüksek** — önerilerin zamanla iyileşmesini sağlıyor |
| 7 | Academic Events | `lib/academic-events.ts` | ~566 | Olay tespiti, tür, önem, planlama etkisi | **Yüksek** — task-aware priority'nin girdisi |
| 8 | Topic Focus | `lib/topic-focus.ts` | ~432 | Konu grafiği, kapsam durumu, sonraki odak | **Orta-Yüksek** — çalışma derinliği rehberliği |
| 9 | Task-Aware Priorities | `lib/task-aware-priorities.ts` | ~203 | Görev baskısıyla ayarlanmış sıralama | **Yüksek** — ödev/proje deadline'larını risk'e katıyor |
| 10 | Study Recommendation | `lib/study-recommendation.ts` | ~209 | Blok süresi, aksiyon cümlesi, feedback | **Yüksek** — kullanıcıya söylenen "şunu yap" |
| 11 | Exam Proximity | `lib/exam-proximity.ts` | ~86 | Zaman penceresi profili | **Orta** — diğer motorların zaman girdisi |
| 12 | Import Selection | `lib/import-selection-intelligence.ts` | ~290 | Ders ekleme tahmini ve sıralama | **Düşük-Orta** — sadece onboarding'de aktif |
| 13 | PDF Engine | `lib/pdf-engine.ts` | — | İçerik parmak izi (formula/prose/mixed) | **Orta** — study mode'a girdi |
| 14 | Resource-Document Binding | `lib/resource-document-binding.ts` | — | Kaynak-görev bağlama | **Düşük (henüz erken)** — stub durumunda |

---

## 8. Değerlendirme Şablonu

Her motor değerlendirilirken aşağıdaki şablon kullanılmalıdır:

```markdown
### [Motor Adı] — ★★★☆☆ (3/5)

**Doğruluk:** [1-5] — [kanıt]
**Kapsam:** [1-5] — [kanıt]
**Güvenilirlik:** [1-5] — [kanıt]
**Ürün Uyumu:** [1-5] — [kanıt]
**Geri Besleme:** [1-5] — [kanıt]
**Test Edilebilirlik:** [1-5] — [kanıt]

**Final yıldız:** [min-boyut kuralı uygulanmış]

**Bilinen sorunlar:**
- [sorun 1]
- [sorun 2]

**4 yıldıza ulaşmak için gereken:**
- [somut adım 1]
- [somut adım 2]

**Tahmini iş:** [micro-pack boyutu: küçük/orta/büyük]
```

---

## 9. Kullanım Senaryosu

Bu çerçevenin pratikte nasıl işleyeceğine dair bir örnek:

> Geçmiş bir QA senaryosunda risk motoru FIN301 için "Moderate" veriyordu; 38 saatte sınav vardı, 19 saat hedef vardı ve kalan kapasite dardı.
> 
> → **Doğruluk:** 2 (bilinen hata, capacityPressure clamp 1.5)  
> → **Kapsam:** 4 (çoğu senaryo kapsanıyor)  
> → **Güvenilirlik:** 4 (deterministik, sessiz hata yok)  
> → **Ürün Uyumu:** 2 (yanlış etiket güveni kırıyor)  
> → **Geri Besleme:** 3 (session data etkiliyor ama reflection henüz risk'e girmiyor)  
> → **Test Edilebilirlik:** 5 (elle hesaplanabilir, QA'de doğrulandı)  
> 
> Min-boyut kuralı: Doğruluk=2, Ürün Uyumu=2 → motor puanı ≤ 3  
> → **Risk Motoru: ★★★☆☆ (3/5)**  
> → Otomatik iyileştirme hedefi.  
> → 4'e çıkmak için: capacityPressure clamp'i 3.0'a çıkar + 48h proximity escalator ekle.  
> → Tahmini iş: küçük micro-pack (tek dosya, ~10 satır).

Bu örnek bilinçli olarak **geçmiş bir hata senaryosunu** gösterir.
Çerçevenin amacı, böyle bir sorunun motor puanını nasıl düşüreceğini açıklamaktır.
Eğer aynı senaryo repo'da regression test ile kapanmışsa, bu örnek tarihi bir vaka olarak kalır; güncel yıldız puanı buna dayanarak verilmez.

---

## 10. Çerçeve Bakım Kuralları

| Tetikleyici | Aksiyon |
|-------------|---------|
| Yeni motor eklendi | Motor envanterine ekle, ilk değerlendirmeyi yap |
| Motor kaldırıldı veya birleştirildi | Envanterden çıkar, bağımlı motorların puanını gözden geçir |
| Büyük mimari değişiklik | Tüm motorları yeniden değerlendir |
| QA döngüsü tamamlandı | Etkilenen motorların puanını kanıtla güncelle |
| Kullanıcı testi yapıldı | Ürün uyumu boyutunu yeniden değerlendir |
| 3 ay geçti, güncelleme olmadı | Çerçevenin kendisini sorgula: boyutlar hâlâ doğru mu? |

---

*Bu çerçeve, EXAM ASSIST'in zekâ katmanlarını "çalışıyor" ve "iyi çalışıyor" arasında ayırt etmek için tasarlanmıştır. Amaç, her motorun portföy kalitesine ulaşmasını sağlamak — sahte hassasiyetle değil, kanıta dayalı netlikle.*

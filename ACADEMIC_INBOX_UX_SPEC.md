# EXAM ASSIST — Academic Inbox UX Spec

## Status
Draft

## Purpose
Bu belge, Academic Layer v1'in ana yüzeyi olan **Academic Inbox** için ürün ve UX davranışlarını tanımlar.

Amaç:

- inbox'ın ne olduğunu netleştirmek
- bir inbox item'ının nasıl görünmesi gerektiğini belirlemek
- sıralama mantığını sabitlemek
- inbox ile Home / Priorities / Course Pulse arasındaki handoff'u tanımlamak
- bu yüzeyin bir "noisy dashboard" veya "portal feed"e dönüşmesini engellemek

Ana referanslar:

- [ACADEMIC_LAYER_STRATEGY.md](/Users/vatan/Documents/EXAM%20ASSIST/ACADEMIC_LAYER_STRATEGY.md)
- [ACADEMIC_LAYER_V1.md](/Users/vatan/Documents/EXAM%20ASSIST/ACADEMIC_LAYER_V1.md)
- [ACADEMIC_EVENT_MODEL_SPEC.md](/Users/vatan/Documents/EXAM%20ASSIST/ACADEMIC_EVENT_MODEL_SPEC.md)
- [PROJECT_VISION.md](/Users/vatan/Documents/EXAM%20ASSIST/PROJECT_VISION.md)

---

## 1. Inbox Job

Academic Inbox'un işi tüm akademik veriyi göstermek değildir.
İşi, öğrencinin son kontrolünden beri gerçekten önemli olan akademik değişiklikleri anlamlı ve sakin biçimde göstermektir.

Inbox şu soruya cevap vermelidir:

**"Akademik olarak ne değişti, bunun ne kadarı önemli, ve hangisi şimdi aksiyon gerektiriyor?"**

Inbox bir arşiv değil, bir **significance layer** olmalıdır.

---

## 2. Inbox Must Feel Like

Inbox şu hisleri vermelidir:

- sakin
- güvenilir
- hızlı taranabilir
- aksiyon odaklı
- öğrencinin zihinsel yükünü alan

Inbox şu hisleri vermemelidir:

- portal feed
- notification dump
- admin panel
- dashboard karmaşası
- "her şeyi gösteren" akademik çöplük

---

## 3. Inbox Core Rules

Inbox için temel kurallar:

### 3.1 Default state should already be useful

Kullanıcı filtre kurmak zorunda kalmadan iyi bir varsayılan görünüm görmelidir.

### 3.2 Significance first, chronology second

Zaman önemli ama tek belirleyici olmamalıdır.
Yüksek etkili akademik değişiklik, daha yeni ama anlamsız bir değişiklikten üstte olabilir.

### 3.3 Every item should answer “why should I care?”

Her item yalnızca ne olduğunu değil, neden önemli olduğunu da hissettirmelidir.

### 3.4 Every meaningful item should point toward action

Inbox görünürlükte durmamalıdır.
Anlamlı item'lar mümkün olduğunca bir sonraki adıma bağlanmalıdır.

### 3.5 The inbox should feed the rest of the product

Inbox kendi başına bir son ekran değil, Home / Priorities / Resources akışına giriş yapan katmandır.

---

## 4. Inbox Layout Structure

Academic Inbox bir ana liste yüzeyi olarak düşünülmelidir.

Önerilen hiyerarşi:

### 4.1 Header

Kısa başlık + tek cümle açıklama:

- neyin gösterildiği
- bunun neden değerli olduğu

Örnek ton:

`Bu hafta dikkat gerektiren akademik değişiklikler burada toplanır.`

### 4.2 Primary list

Ana inbox stream'i.
Varsayılan görünümde yalnız aktif ve anlamlı event'ler görünmelidir.

### 4.3 Light filters

Varsayılan deneyimi bozmayacak hafif filtreler:

- this week
- unresolved
- by course
- by significance

### 4.4 Empty state / low-signal state

Inbox boş olduğunda ürün "yokluk" göstermemeli, yön göstermelidir.

Örnek anlam:

- bu hafta anlamlı yeni değişiklik yok
- ana planlama katmanı hâlâ çalışıyor
- istersen kurs bazlı görünümü kontrol et

---

## 5. Inbox Item Anatomy

Her item en az şu beş soruya cevap vermelidir:

1. Ne oldu?
2. Hangi derste oldu?
3. Bu neden önemli?
4. Planımı etkiliyor mu?
5. Şimdi ne yapabilirim?

Bu yüzden ideal item anatomisi:

### 5.1 Eyebrow

Kısa sınıf etiketi:

- `YENİ MATERYAL`
- `DEADLINE`
- `NOT AÇIKLANDI`
- `DUYURU`
- `SINAV`

Bu etiket teknik değil, öğrenci dilinde olmalıdır.

### 5.2 Course chip

İlgili dersin kısa etiketi.
Öğrenci item'ın hangi derse ait olduğunu anında görmelidir.

### 5.3 Main title

En önemli bilgi tek satırda.

Örnek:

- `MAN409 için yeni materyal yüklendi`
- `AİT204 ödevi 2 gün içinde teslim`
- `MAN440 kısa sınav notu açıklandı`

### 5.4 Why-it-matters copy

Bu alan zorunlu zihinsel katmandır.

Örnek:

- `Bu hafta ilk review bloğunu etkileyebilir.`
- `Bu teslim, bu haftaki çalışma baskısını artırıyor.`
- `Bu sonuç ilgili dersin dikkat seviyesini değiştirebilir.`

### 5.5 Time signal

Gerekliyse zaman bilgisi:

- `yarın`
- `2 gün kaldı`
- `bugün yüklendi`
- `3 gün önce açıklandı`

Bu alan yalnızca akademik anlam taşıdığı sürece görünmelidir.

### 5.6 Suggested next step

Mümkün olan her yerde item bir sonraki aksiyona bağlanmalıdır.

Örnekler:

- `Kaynağı aç`
- `Dersi önceliklere taşı`
- `Kütüphaneye git`
- `Çalışma bloğu başlat`
- `Detayı gör`

---

## 6. Item Tone Rules

Copy tonu sakin ama net olmalıdır.

Olması gereken:

- yetişkin
- yön verici
- temiz
- akademik
- gereksiz alarm dili olmayan

Olmaması gereken:

- korkutucu
- emir veren
- lise koçu gibi
- teknik jargon dolu
- “AI bunu düşündü” gibi açıklamalar

Örnek:

Doğru:
`Yeni materyal geldi. Bu hafta ilk review için anlamlı olabilir.`

Yanlış:
`Yeni içerik tespit edildi. Risk skorunuz yeniden hesaplandı.`

---

## 7. Ranking Rules

Inbox sıralaması şu mantıkla çalışmalıdır:

### 7.1 First key: significance

- `high`
- `medium`
- `low`

### 7.2 Second key: planning impact

- `strong`
- `soft`
- `none`

### 7.3 Third key: time sensitivity

- overdue / today / tomorrow gibi yakın baskılar
- sonra tarih yakınlığı

### 7.4 Fourth key: recency

- en son oluşan değişiklik

Bu şu anlama gelir:

- yalnız yeni olduğu için üstte duran anlamsız item olmamalı
- zaman baskısı taşıyan gerçek akademik değişiklik daha görünür olmalı

---

## 8. Bucket Behavior

Varsayılan listede görsel gürültüyü azaltmak için inbox item'ları hafifçe gruplanabilir.

Önerilen doğal bölümler:

### 8.1 Immediate attention

Bu hafta odağı değiştirebilecek güçlü item'lar.

### 8.2 Keep in view

Bağlam veren ama hemen aksiyon zorlamayan item'lar.

### 8.3 Quiet background

Düşük önem ama yararlı görünürlük taşıyan item'lar.

Bu bölümler sert dashboard blokları gibi değil, hafif içerik ayracı gibi davranmalıdır.

---

## 9. Dismiss / Resolve Behavior

Academic Inbox kullanıcıya biraz kontrol vermelidir.

### 9.1 Dismiss

Kullanıcı event'i şimdilik görünürlükten çıkarabilir.
Bu, event'in varlığını silmez; yalnız ana yüzey görünürlüğünü azaltır.

### 9.2 Resolve

Event öğrenci açısından gerçekten kapandıysa resolved olabilir.

Örnek:

- assignment tamamlandı
- grade görüldü ve artık sinyal değeri bitti
- material update'in etkisi işlendi

### 9.3 Expire quietly

Bazı item'lar kullanıcı müdahalesi olmadan zamanla sakin biçimde arka plana düşebilir.

Inbox, tamamı manuel temizlik isteyen bir görev listesine dönüşmemelidir.

---

## 10. Home Handoff

Inbox'taki her item Home'a çıkmamalıdır.

Home'a handoff yalnızca şu durumlarda olmalıdır:

- event bu haftanın odağını değiştiriyorsa
- event zaman baskısı yaratıyorsa
- event yeni çalışma ihtiyacı doğuruyorsa
- event mevcut focus dersini etkiliyorsa

Home brief event'i olduğu gibi kopyalamamalıdır.
Event'i yorumlayıp daha sakin bir cümleye çevirmelidir.

Örnek:

Inbox:
`MAN409 için yeni materyal yüklendi`

Home brief:
`MAN409 için bu hafta ilk review bloğunu açmak daha doğru görünüyor.`

---

## 11. Priorities Handoff

Inbox, priorities yüzeyini ele geçirmemelidir.
Ama şu şekillerde etki üretebilir:

- ilgili dersin attention framing'ini yükseltmek
- kısa vadeli deadline baskısı eklemek
- resource prompt'u güçlendirmek
- grade signal üzerinden performans gap bağlamı yaratmak

Kural:

**Priorities hâlâ çalışma mantığıyla sıralanır; inbox buna akademik bağlam verir.**

---

## 12. Course Pulse Relationship

Inbox item'ı tekil değişikliktir.
Course Pulse ise dersin sıkıştırılmış durum özetidir.

İlişki şu olmalıdır:

- inbox değişikliği gösterir
- course pulse bunun ders seviyesindeki bağlamını gösterir

Örnek:

Inbox:
`AİT204 için deadline 2 gün içinde`

Course Pulse:
- açık baskı var
- bu hafta yeni materyal yok
- sınav da yaklaşıyor
- dikkat seviyesi yükseldi

Bu ikisi aynı şeyi farklı biçimde tekrar etmemelidir.

---

## 13. Empty and Low-Signal States

Inbox'ta anlamlı yeni event yoksa ürün boşa düşmüş hissettirmemelidir.

### 13.1 Empty state

Gerçekten hiç anlamlı yeni değişiklik yoksa:

- ürün bunu sakin biçimde söyler
- öğrenciyi planlama katmanına veya course pulse'a yönlendirir

### 13.2 Low-signal state

Az sayıda düşük önem item varsa:

- bunlar geri planda gösterilebilir
- ama ana yüzey “bu hafta kritik yeni akademik kayma yok” hissi vermelidir

---

## 14. Visual Language Rules

Inbox görsel dili şu nitelikte olmalıdır:

- current EXAM ASSIST calm premium language ile uyumlu
- significance görünür ama dramatik değil
- renk yalnız alarm için değil, yön için kullanılır
- chip / eyebrow / action ilişkisi temizdir

Kaçınılacaklar:

- portal benzeri tablo görünümü
- ağır badge kalabalığı
- kırmızı uyarı spam'i
- bir item içinde 7 ayrı bilgi satırı

Bir item taranınca 2-3 saniyede anlaşılmalıdır.

---

## 15. Success Criteria

Academic Inbox UX başarılı sayılmak için:

### 15.1 Scanability

Kullanıcı birkaç saniyede neyin öne çıktığını anlayabiliyor mu?

### 15.2 Meaning

Item yalnız bilgi değil, önem ve bağlam taşıyor mu?

### 15.3 Actionability

Anlamlı item'lar gerçekten sonraki hamleye bağlanıyor mu?

### 15.4 Calmness

Yüzey daha çok sinyal göstermesine rağmen daha stresli hissettirmiyor mu?

### 15.5 Product coherence

Inbox, Home ve Priorities arasında tek bir sistem hissi var mı?

---

## 16. Immediate Next Definition

Bu belge sonrası en doğru sonraki tanım:

## Academic Layer Data Flow Spec

Orada şunlar kilitlenmelidir:

- event creation paths
- event dedupe rules
- event lifecycle updates
- inbox to home transformation rules
- inbox to priorities signal mapping
- dismissal / resolution persistence behavior

Bu noktadan sonra ekran tasarımı ve implementation planı daha güvenli hale gelir.

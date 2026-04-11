# EXAM ASSIST — Academic Layer Data Flow Spec

## Status
Draft

## Purpose
Bu belge, Academic Layer v1 için veri akışını tanımlar.

Amaç:

- academic event'lerin nasıl oluştuğunu netleştirmek
- event'lerin nasıl normalize edildiğini belirlemek
- dedupe / merge mantığını sabitlemek
- inbox, Home, Priorities ve Course Pulse'a nasıl aktığını göstermek
- sistemin gürültü üretmeden nasıl güncelleneceğini karar verdiren şekilde tanımlamak

Bu belge implementation kodu değildir.
Ama implementation kararlarını yönlendirecek kadar nettir.

Ana referanslar:

- [ACADEMIC_LAYER_STRATEGY.md](/Users/vatan/Documents/EXAM%20ASSIST/ACADEMIC_LAYER_STRATEGY.md)
- [ACADEMIC_LAYER_V1.md](/Users/vatan/Documents/EXAM%20ASSIST/ACADEMIC_LAYER_V1.md)
- [ACADEMIC_EVENT_MODEL_SPEC.md](/Users/vatan/Documents/EXAM%20ASSIST/ACADEMIC_EVENT_MODEL_SPEC.md)
- [ACADEMIC_INBOX_UX_SPEC.md](/Users/vatan/Documents/EXAM%20ASSIST/ACADEMIC_INBOX_UX_SPEC.md)

---

## 1. Core Principle

Academic Layer veri akışı şu zinciri kurmalıdır:

**signal -> normalized event -> significance -> planning effect -> calm user-facing surface**

Bu akışın amacı her sinyali göstermek değildir.
Amacı, yalnızca anlamlı akademik değişiklikleri öğrenci için güvenilir ve aksiyon üretir hale getirmektir.

Ana ilke:

**Veri sisteme girdiği gibi kullanıcıya çıkmamalıdır. Önce yorum katmanından geçmelidir.**

---

## 2. Input Sources

Academic Layer v1 için üç giriş sınıfı vardır.

### 2.1 Manual input

Öğrenci tarafından doğrudan girilen veriler.

Örnekler:

- manuel deadline ekleme
- manuel grade signal girişi
- manuel announcement / önemli değişiklik notu

### 2.2 File-based input

Dosya yükleme veya belge analizi ile gelen sinyaller.

Örnekler:

- uploaded academic PDF
- uploaded grade sheet
- uploaded course document metadata

### 2.3 Imported external input

Portal veya dış kaynaktan gelen veriler.

Örnekler:

- imported course deadline
- imported grade release
- imported course material signal

v1 için bu sınıfın zorunlu olmadığı kabul edilir.
Ama veri akış modeli buna hazır olmalıdır.

---

## 3. Data Flow Stages

Academic Layer veri akışı altı aşamada düşünülmelidir.

### Stage 1 — Capture

Sinyal sisteme gelir.

Örnek:

- öğrenci ödev deadline girer
- öğrenci materyal yükler
- dış kaynaktan assignment tarihi okunur

Bu aşamada veri henüz event değildir.

### Stage 2 — Normalize

Sinyal canonical academic modele çevrilir.

Örnek:

- raw uploaded file -> `material_update`
- manual due date -> `assignment_due`
- imported grade -> `grade_release`

Bu aşamada:

- `courseId`
- `type`
- `source`
- `provenance`
- `occurredAt`
- `dueAt`

gibi çekirdek alanlar oluşur.

### Stage 3 — Dedupe / Merge

Yeni event gerçekten yeni mi, yoksa var olan event'in güncel hali mi belirlenir.

Bu aşama kritik önemdedir.
Çünkü aynı akademik sinyalin tekrar tekrar inbox'a düşmesi ürünü bozar.

### Stage 4 — Interpret

Event significance ve planning impact alır.

Bu aşamada sistem şunu değerlendirir:

- event ne kadar önemli
- bu hafta planı etkiliyor mu
- yalnız görünürlük mü üretmeli
- Home / Priorities'a aktarılmalı mı

### Stage 5 — Surface

Event ilgili yüzeylere aktarılır:

- inbox
- course pulse
- home brief
- priorities context

### Stage 6 — Lifecycle update

Event zamanla:

- active
- resolved
- dismissed
- expired

durumlarına geçer.

---

## 4. Normalization Rules

Bir sinyal event'e çevrilirken şu sorular cevaplanmalıdır:

1. Bu hangi dersle ilişkili?
2. Bu ne tür bir akademik değişiklik?
3. Bunun zaman baskısı var mı?
4. Bu bilgi resmi mi, manuel mi, türetilmiş mi?
5. Bu değişiklik öğrencinin bakış açısından tekil bir event olarak anlamlı mı?

Kural:

**Normalization aşaması teknik kaynak yapısını değil, öğrenci açısından anlamlı yapıyı üretmelidir.**

Örnek:

- üç ayrı dosya yüklenmiş olabilir
- ama öğrenci açısından bunlar tek bir `material_update` olarak anlamlı olabilir

---

## 5. Dedupe Rules

Academic layer'ın güvenilir kalması için dedupe zorunludur.

### 5.1 Exact duplicate

Aynı ders, aynı tip, aynı tarih, aynı başlık:

- yeni event oluşturulmaz
- mevcut event korunur

### 5.2 Update-in-place

Mevcut event'in özü aynı, ama bazı alanları güncellenmiş:

Örnek:

- aynı assignment için tarih güncellendi
- aynı material event için başlık netleşti

Davranış:

- event merge edilir
- gerekirse `deadline_change` gibi yeni bir event üretilir

### 5.3 Multi-signal consolidation

Birden çok ham sinyal tek öğrenci-anlamlı event'e birleşebilir.

Örnek:

- aynı derse ait 4 yeni PDF yüklenmiş

Davranış:

- inbox'ta 4 ayrı satır yerine
- tek `material_update` item'ı üretilebilir

### 5.4 Anti-noise rule

Eğer yeni sinyal öğrencinin mevcut akademik resmini değiştirmiyorsa, yeni event üretmek yerine mevcut durumu güncellemek tercih edilmelidir.

---

## 6. Significance Assignment Flow

Significance ham veriyle gelmez; sistem tarafından atanır.

Temel sinyaller:

- time pressure
- overdue state
- exam proximity
- grade relevance
- material usefulness
- current course attention state

Yüksek significance örnekleri:

- yarın teslim
- gecikmiş assignment
- yakın sınav tarihi
- bu hafta odağı değiştiren material signal

Orta significance örnekleri:

- bu hafta kullanılabilecek yeni materyal
- yaklaşan ama henüz kritik olmayan deadline
- context yaratan grade signal

Düşük significance örnekleri:

- etkisiz duyuru
- eski materyal
- planı değiştirmeyen küçük bağlam sinyali

Kural:

**Significance statik değil, öğrenci bağlamına göre değişebilir.**

Aynı event farklı haftalarda farklı anlam taşıyabilir.

---

## 7. Planning Impact Flow

Planning impact significance'ten sonra değerlendirilir.

Bir event için üç çıkış vardır:

### 7.1 No planning effect

Event yalnız inbox / course pulse görünürlüğü üretir.

### 7.2 Soft planning effect

Event:

- home brief tonunu etkileyebilir
- resource guidance'i güçlendirebilir
- course pulse attention state'ini hafifçe kaydırabilir

### 7.3 Strong planning effect

Event:

- relevant course attention'ı yükseltebilir
- home focus kararını etkileyebilir
- priorities'te bağlamsal baskı yaratabilir

Kural:

**Academic events mevcut risk motorunun yerine geçmez. Risk motorunu daha doğru akademik bağlamla besler.**

---

## 8. Inbox Feed Construction

Inbox listesi şu sırayla kurulmalıdır:

1. active event'leri al
2. dismissed / expired olanları ana listeden çıkar
3. dedupe edilmiş canonical event setini kullan
4. significance'a göre sırala
5. planning impact ile iç önceliği ayarla
6. time sensitivity ve recency ile son sıralamayı kur

Varsayılan görünüm:

- unresolved
- this week relevant
- significance-aware

Inbox bu yüzden ham veri tablosu değil, **filtered event view** olmalıdır.

---

## 9. Course Pulse Construction

Course Pulse event listesini bire bir tekrar etmez.
Her ders için event setini sıkıştırılmış derse-bakış özetine çevirir.

Pulse üretirken şu sorular sorulur:

- bu derste son dönemde gerçekten ne oldu
- açık baskı var mı
- geciken iş var mı
- yeni materyal var mı
- sınav baskısı ne durumda
- dikkat seviyesi artmalı mı

Inbox = event list  
Course Pulse = course summary

Bu ayrım korunmalıdır.

---

## 10. Home Brief Transformation

Home brief'e yalnızca inbox'ta yüksek görünürlüğe sahip olmak yetmez.

Bir event Home brief'i etkileyebilir ancak şu durumlarda:

- bu haftanın ana odağını değiştiriyorsa
- öğrencinin çalışma başlangıcını etkiliyorsa
- yakın zaman baskısı oluşturuyorsa
- mevcut focus dersini güçlendiriyor veya değiştiriyorsa

Transformation mantığı:

- raw event -> interpreted sentence

Örnek:

Raw event:
`material_update / MAN409 / slides uploaded`

Home brief:
`MAN409 için bu hafta ilk review bloğunu açmak daha doğru görünüyor.`

Kural:

**Home, event kopyası göstermez; event'in çalışma açısından anlamını gösterir.**

---

## 11. Priorities Mapping

Academic event'ler priorities'e şu yollarla bağlanabilir:

- ilgili dersin attention state'ini yükseltir
- urgency context ekler
- resource friction ya da resource opportunity sinyali ekler
- performance gap bağlamı oluşturur

Ama priorities'te event listesi görünmemelidir.
Orada yalnız çalışma açısından anlam taşıyan etkiler görünmelidir.

Doğru mantık:

- inbox değişimi gösterir
- priorities değişimin çalışma sıralamasına etkisini gösterir

---

## 12. Lifecycle Behavior

Event'ler sonsuza kadar aktif kalmamalıdır.

### 12.1 Active

Inbox / pulse için hâlâ anlamlı.

### 12.2 Resolved

Öğrenci açısından kapandı.

Örnek:

- deadline tamamlandı
- grade görüldü ve yeni karar üretmiyor

### 12.3 Dismissed

Öğrenci görünürlüğünü düşürdü.

### 12.4 Expired

Zamanla doğal değerini kaybetti.

Kural:

**Lifecycle davranışı manuel temizlik yükü üretmemelidir.**

Ürün kendi kendine sakinleşebilmelidir.

---

## 13. Persistence Rules

v1 için şu davranışlar korunmalıdır:

- event idempotency
- dismissed state persistence
- resolved state persistence
- merge sonrası gereksiz yeni item üretmeme
- course summary'nin event setiyle tutarlı kalması

Persistence katmanı şu ayrımı kaybetmemelidir:

- event'in ham kaynağı
- event'in yorumlanmış hali
- event'in kullanıcı tarafından değiştirilmiş görünürlük durumu

---

## 14. Error and Fallback Rules

Academic layer eksik veriyle de çalışabilmelidir.

### 14.1 Missing course link

Bir event dersle eşleşmiyorsa:

- inbox'ta düşük güvenle gösterilebilir
- planning'e güçlü etki verilmez

### 14.2 Partial signal

Bir event'in tarihi veya detayları eksikse:

- significance düşürülür
- görünürlük korunabilir
- aksiyon dili daha dikkatli olur

### 14.3 Conflicting signal

Aynı akademik gerçeklik için çelişen kaynaklar varsa:

- official imported data önceliklidir
- student-entered override ayrı görünür
- system-derived yorum, resmi veri gibi davranmaz

Kural:

**Eksik veri, sahte kesinliğe dönüşmemelidir.**

---

## 15. Success Criteria

Bu veri akışı başarılıysa:

### 15.1 Signal coherence

Aynı akademik değişiklik inbox, course pulse ve Home arasında çelişki üretmez.

### 15.2 Noise control

Çok sayıda ham sinyal olmasına rağmen ürün sakin kalır.

### 15.3 Planning usefulness

Academic event'ler gerçekten planning kalitesini artırır.

### 15.4 Trust

Öğrenci bilginin nereden geldiğini ve sistemin neyi yorumladığını karıştırmaz.

---

## 16. Immediate Next Definition

Bu belge sonrası en doğru sonraki tanım:

## Academic Layer Interaction Spec

Orada şunlar netleşmelidir:

- dismiss / resolve interaction patterns
- inbox item CTA davranışları
- course pulse drill-down mantığı
- home brief update timing
- state transitions triggered by user actions

Bu noktadan sonra implementation planı güvenli biçimde çıkarılabilir.

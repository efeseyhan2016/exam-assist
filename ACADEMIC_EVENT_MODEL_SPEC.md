# EXAM ASSIST — Academic Event Model Spec

## Status
Draft

## Purpose
Bu belge, Academic Layer v1 için gerekli **event modelini** tanımlar.

Amaç:

- hangi akademik değişikliklerin event olarak temsil edileceğini netleştirmek
- bu event'lerin ne kadar önemli sayılacağını tanımlamak
- bu event'lerin mevcut planning katmanını nasıl etkileyeceğini belirlemek
- UI yüzeylerinde nasıl gösterileceğini tutarlı hale getirmek

Bu belge implementation detayı değil, ürün + domain spec'idir.

Ana referanslar:

- [ACADEMIC_LAYER_STRATEGY.md](/Users/vatan/Documents/EXAM%20ASSIST/ACADEMIC_LAYER_STRATEGY.md)
- [ACADEMIC_LAYER_V1.md](/Users/vatan/Documents/EXAM%20ASSIST/ACADEMIC_LAYER_V1.md)
- [PRODUCT_STRATEGY.md](/Users/vatan/Documents/EXAM%20ASSIST/PRODUCT_STRATEGY.md)

---

## 1. Why the Event Model Exists

Academic Layer v1'in kalbi statik obje listesi değildir.
Kalbi, **öğrencinin akademik hayatında anlam taşıyan değişiklikleri** event olarak yakalayabilmesidir.

Ürünün cevaplamak istediği soru:

**"Son baktığımdan beri ne oldu, ve bu benim planımı değiştirmeli mi?"**

Bu yüzden event modelinin görevi:

- her değişikliği saklamak değil
- öğrencinin dikkatini hak eden değişiklikleri anlamlı biçimde temsil etmek

---

## 2. Core Definition

Bir `AcademicEvent`, öğrencinin akademik durumunda meydana gelen ve görünürlük, anlam veya aksiyon değeri taşıyan bir değişikliktir.

Bir event:

- bir dersle ilişkili olabilir
- bir zaman baskısı taşıyabilir
- bir materyal veya grade sinyali taşıyabilir
- planning katmanında etkisi olabilir veya olmayabilir

Ana ilke:

**Her event veri değildir; her event öğrencinin bakış açısından anlamlı değişimdir.**

---

## 3. Minimum Event Schema

v1 için minimum event yapısı:

```ts
type AcademicEvent = {
  id: string
  courseId: string
  type: AcademicEventType
  title: string
  summary?: string
  occurredAt: string
  dueAt?: string
  source: AcademicEventSource
  provenance: "official_imported" | "student_entered" | "system_derived"
  significance: "low" | "medium" | "high"
  planningImpact: "none" | "soft" | "strong"
  status: "active" | "resolved" | "dismissed" | "expired"
  metadata?: Record<string, unknown>
}
```

Minimum alanların anlamı:

- `type`: event'in sınıfı
- `occurredAt`: event ne zaman oluştu
- `dueAt`: zaman baskısı taşıyorsa son tarihi
- `source`: verinin hangi kanaldan geldiği
- `provenance`: resmi mi, manuel mi, türetilmiş mi
- `significance`: inbox görünürlüğü ve önceliği
- `planningImpact`: planning katmanını ne kadar etkileyeceği
- `status`: öğrencinin gözünden o event'in hâli

---

## 4. Event Type List

Academic Layer v1'de desteklenecek event tipleri:

### 4.1 `exam`

Sınavla ilgili event.

Örnekler:

- yeni sınav takvimi girişi
- sınav tarihinin görünür hale gelmesi
- sınav saatinin değişmesi

### 4.2 `assignment_due`

Ödev, proje veya teslim işi için deadline event'i.

Örnekler:

- yeni ödev son tarihi
- yaklaşan proje teslimi
- teslim tarihinin yaklaştığını gösteren event

### 4.3 `material_update`

Ders materyalinde yeni veya anlamlı değişiklik.

Örnekler:

- yeni PDF/slides upload
- yeni reading eklenmesi
- önemli içerik dosyası gelmesi

### 4.4 `announcement`

Akademik etkisi olan duyuru.

Örnekler:

- ders günü değişimi
- sınav formatı güncellemesi
- teslim kuralı değişikliği

### 4.5 `grade_release`

Yeni not, değerlendirme veya sonuç sinyali.

Örnekler:

- quiz sonucu
- assignment sonucu
- vize/final notu

### 4.6 `deadline_change`

Mevcut deadline'ın ileri/geri çekilmesi veya formatının değişmesi.

Bu event ayrı tutulmalıdır çünkü:

- öğrencinin haftasını doğrudan değiştirebilir
- aynı assignment varlığından daha yüksek sinyal olabilir

---

## 5. Source and Provenance

`source` ile `provenance` aynı şey değildir.

### 5.1 Source

Verinin geldiği kanal:

- `manual`
- `file_import`
- `portal_import`
- `resource_analysis`
- `system_generation`

### 5.2 Provenance

Verinin epistemik sınıfı:

- `official_imported`
- `student_entered`
- `system_derived`

Kurallar:

- portal üzerinden gelen deadline: `source=portal_import`, `provenance=official_imported`
- öğrencinin elle eklediği deadline: `source=manual`, `provenance=student_entered`
- sistemin "bu materyal bu haftayı etkileyebilir" yorumu: `source=system_generation`, `provenance=system_derived`

Bu ayrım hem veri modelinde hem arayüzde korunmalıdır.

---

## 6. Significance Rules

Her event inbox'ta eşit ağırlıkta görünmemelidir.

### 6.1 Low significance

Inbox'ta geri planda kalır.
Planning'i doğrudan değiştirmez.

Örnekler:

- düşük etkili announcement
- eski materyal
- zaman baskısı üretmeyen zayıf context

### 6.2 Medium significance

Görünürdür ama hemen aksiyon talep etmez.
Planning'e yumuşak etki yapabilir.

Örnekler:

- bu hafta işe yarayabilecek yeni materyal
- orta vadeli deadline
- bağlam kuran grade sinyali

### 6.3 High significance

Inbox'ta üstte görünür.
Home brief veya priorities üzerinde etkisi olma ihtimali yüksektir.

Örnekler:

- yakın exam
- yaklaşan assignment due
- overdue work
- önemli deadline değişimi
- dikkat kaydırıcı grade signal

---

## 7. Planning Impact Rules

Significance ile planning impact aynı şey değildir.
Bir event görünür olabilir ama planning'i çok az etkileyebilir.

### 7.1 `none`

Planning katmanını değiştirmez.
Sadece görünürlük sağlar.

Örnek:

- hafif announcement

### 7.2 `soft`

Home brief, resource prompt veya attention framing'i etkileyebilir.

Örnekler:

- yeni materyal update
- orta önem grade release

### 7.3 `strong`

Priorities, Home focus veya ders attention state üzerinde somut etkisi olabilir.

Örnekler:

- yarın deadline
- overdue assignment
- sınav tarihi yaklaşması
- deadline change ile bu haftanın baskısının artması

Kural:

**Academic event'ler risk motorunun yerine geçmez; risk motorunu daha doğru sinyalle besler.**

---

## 8. Status Lifecycle

Event status'u öğrencinin gözünden yönetilmelidir.

### 8.1 `active`

Event hâlâ anlamlı ve görünür.

### 8.2 `resolved`

Event öğrenci açısından kapanmış.

Örnekler:

- deadline geçti ve tamamlandı
- grade görüldü ve artık yeni sinyal üretmiyor

### 8.3 `dismissed`

Öğrenci event'i bilinçli olarak kapattı veya görünürlüğünü azalttı.

### 8.4 `expired`

Event zamanla değerini kaybetti.

Örnek:

- artık anlam taşımayan eski material update

Kural:

Inbox, aktif event yüzeyi olmalıdır.
Eski event arşivi ana deneyimi boğmamalıdır.

---

## 9. Rendering Rules

Bir inbox item şunu cevaplamalıdır:

1. Ne oldu?
2. Hangi derste oldu?
3. Bu neden önemli?
4. Planımı etkiliyor mu?
5. Sıradaki aksiyon ne olabilir?

Bu yüzden her event render'ında şu alanlar hedeflenmelidir:

- kısa başlık
- ders etiketi
- kısa açıklama
- gerekirse zaman baskısı
- significance'a uygun ton
- mümkünse next-step copy

Inbox item asla şu hale gelmemelidir:

- ham veri dump'ı
- portal satırı kopyası
- teknik metadata listesi

---

## 10. Event-to-Home Rules

Her event Home brief'i etkilemez.

Home'a çıkmak için event şu koşullardan en az birini sağlamalıdır:

- bu haftanın odağını kaydırıyor
- zaman baskısı oluşturuyor
- yeni çalışma ihtiyacı doğuruyor
- mevcut planı anlamlı biçimde güncelliyor

Örnekler:

- yeni materyal geldi ama sınava etkisi yoksa: inbox'ta kalabilir, home'a çıkmayabilir
- yarın deadline varsa: home brief'i etkileyebilir
- zayıf bir grade signal geldi ve ilgili derste risk büyüdüyse: priorities framing'e etki edebilir

---

## 11. Event-to-Priorities Rules

Academic events priorities'i şu yollarla etkileyebilir:

- ilgili dersin attention state'ini yükseltme
- dersin resource friction algısını artırma
- yakın deadline üzerinden urgency'yi artırma
- grade signal üzerinden performans gap bağlamı ekleme

Ama event'ler priorities yüzeyini ele geçirmemelidir.

Kural:

**Priorities hâlâ çalışma mantığıyla çalışır; academic events ona bağlam ekler.**

---

## 12. Event Filters

v1'de inbox filtreleme mantığı en az şu düzeyde olmalıdır:

- by course
- by significance
- by unresolved only
- by this week

Ama filtreler ürünün ana deneyimini taşımamalıdır.
Ürünün ana deneyimi zaten iyi sıralanmış bir default görünüm vermelidir.

---

## 13. v1 Boundaries

Bu spec şu şeyleri içermez:

- portal connector implementation
- API contract detayları
- persistence schema finalization
- notification delivery mechanics
- full gradebook logic
- teacher/admin event modelleri

Bu belge yalnız student-facing academic event layer için çekirdek ürün mantığını tanımlar.

---

## 14. Success Tests

Bu model başarılıysa:

### 14.1 Signal quality

Inbox'ta görünen event'ler gerçekten öğrenci açısından önemli hissedilir.

### 14.2 Action quality

Event'ler yalnız görünmez; Home / Priorities / resource guidance üzerinde açıklanabilir etki üretir.

### 14.3 Trust quality

Öğrenci şu ayrımı kaybetmez:

- bu resmi bilgi mi
- bunu ben mi ekledim
- bunu sistem mi yorumladı

### 14.4 Noise control

Event modeli ürünün sakinliğini bozmaz.

---

## 15. Immediate Next Step

Bu belge sonrası sıradaki doğru tanım:

## Academic Inbox UX Spec

Orada şunlar netleşmelidir:

- inbox item anatomy
- ranking order
- significance görsel dili
- home brief handoff davranışı
- dismissed / resolved davranışı
- empty state / low-signal state dili

Bu noktadan sonra implementation planı çıkarılabilir.

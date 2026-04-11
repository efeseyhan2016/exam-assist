# EXAM ASSIST — Academic Layer v1

## Status
Draft

## Purpose
Bu belge, EXAM ASSIST'in academic layer yönündeki **ilk gerçek ürün adımını** tanımlar.

Bu belge strateji belgesi değildir.
Bu belge, hangi dar yüzeyin önce inşa edilmesi gerektiğini ve bunun hangi sınırlar içinde kalacağını netleştirir.

Ana referanslar:

- [ACADEMIC_LAYER_STRATEGY.md](/Users/vatan/Documents/EXAM%20ASSIST/ACADEMIC_LAYER_STRATEGY.md)
- [PRODUCT_STRATEGY.md](/Users/vatan/Documents/EXAM%20ASSIST/PRODUCT_STRATEGY.md)
- [PROJECT_VISION.md](/Users/vatan/Documents/EXAM%20ASSIST/PROJECT_VISION.md)
- [ROADMAP.md](/Users/vatan/Documents/EXAM%20ASSIST/ROADMAP.md)

---

## 1. v1 Product Promise

Academic Layer v1'in vaadi şudur:

**Bir öğrenci EXAM ASSIST'i açtığında, bu hafta dikkat gerektiren akademik değişiklikleri ve bunlara karşı ne yapması gerektiğini hızlıca anlayabilmelidir.**

Bu aşamada ürünün görevi:

- akademik sinyali görmek
- sinyali anlamlandırmak
- bunu mevcut planning katmanına bağlamak

Bu aşamada ürünün görevi olmayan:

- akademik sistemin yerini almak
- öğretmen tarafını yönetmek
- resmi submission veya grade işlemlerini üstlenmek

---

## 2. v1 Scope

Academic Layer v1, üç şeyi birlikte yapmalıdır:

1. öğrenci için anlamlı akademik değişiklikleri toplamak
2. bunları sakin ve öncelikli bir akademik yüzeye dönüştürmek
3. bu sinyalleri mevcut Home / Priorities / study guidance akışına beslemek

v1'in odaklandığı ana yüzey:

## Academic Inbox

Bu yüzey tek başına bir feed değildir.
Bu yüzey, planning sistemine giriş yapan yeni akademik sinyal yüzeyidir.

Yan yüzey:

## Course Pulse

Bu da her ders için kısa durum özeti verir.

Planning katmanıyla bağ:

## Home Brief integration

Academic inbox içindeki anlamlı değişiklikler, Home brief ve focus logic'i besler.

---

## 3. v1 User

### Primary user
University student

### Initial usage context

- çok dersli dönem
- sınav + ödev + materyal takibi ihtiyacı
- Hadi benzeri sistemlerde kaybolan akademik görünürlük

### Design center

Kullanıcı, akademik sistemlerin içinde veri aramak istemez.
Kullanıcı, bu hafta ne değiştiğini ve bunun kendi çalışma planını nasıl etkilediğini görmek ister.

---

## 4. v1 Core Question

Academic Layer v1 şu soruya cevap vermelidir:

**"Sınavlarımın ve derslerimin etrafında bu hafta gerçekten ne değişti, ve bunun benim odağımı değiştirmesi gerekiyor mu?"**

Bu cevap yalnız bilgi göstermemeli.
Şu üç şeyi aynı anda vermelidir:

- visibility
- significance
- suggested next step

---

## 5. v1 Canonical Model

Academic Layer v1 için gerekli minimum canonical model:

### 5.1 Course

Bir akademik dersin temel kaydı.

Örnek alanlar:

- `id`
- `code`
- `title`
- `term`
- `source`

### 5.2 AcademicEvent

v1'in en kritik nesnesi budur.
Static object list'ten daha önemlidir.

Örnek alanlar:

- `id`
- `courseId`
- `type`
- `title`
- `occurredAt`
- `dueAt?`
- `source`
- `significance`
- `status`
- `metadata`

### 5.3 Event types

v1'de desteklenecek event tipleri:

- `exam`
- `assignment_due`
- `material_update`
- `announcement`
- `grade_release`
- `deadline_change`

### 5.4 GradeSignal

v1, full gradebook kurmaz.
Ama grade signal taşır.

Örnek alanlar:

- `courseId`
- `title`
- `score?`
- `maxScore?`
- `weight?`
- `status`
- `releasedAt`

### 5.5 PlanningLink

Academic layer ile planning layer arasındaki bağ.
Bu fiziksel ayrı nesne olmak zorunda değil, ama kavramsal olarak tanımlanmalıdır.

Amaç:

- bir academic event'in risk/priorities üzerinde etkisi var mı
- varsa hangi ders/focus alanına bağlanıyor

---

## 6. Provenance Rules

Bu katman v1'de netleşmelidir.

Her veri şu üç sınıftan birine ait olmalıdır:

### 6.1 Official imported data

Örnek:

- portal'dan gelen ders
- imported deadline
- uploaded material metadata
- grade release signal

### 6.2 Student-entered data

Örnek:

- manuel eklenen deadline
- manuel girilen grade snapshot
- öğrenci notları
- öğrenci override işaretleri

### 6.3 System-derived intelligence

Örnek:

- event significance
- attention level
- priority lift
- home brief suggestion
- “this changed your week” yorumu

Kural:

**Bu üç kaynak ne veri modelinde ne de arayüzde birbirine karışmamalıdır.**

Öğrenci gerekirse şunu anlayabilmelidir:

- bu bilgi nereden geldi
- bunu ben mi girdim
- bunu sistem mi yorumladı

---

## 7. v1 Input Rules

v1'in ilk sürümünde giriş kaynakları şu sırayla düşünülmelidir:

### 7.1 Manual additions

İlk güvenilir başlangıç.
Çünkü entegrasyon bağımlılığı yaratmaz.

Örnek:

- manuel assignment deadline
- manuel grade release girişi
- manuel announcement / material importance notu

### 7.2 Uploaded academic files

İkinci aşama.
Öğrenci sisteme akademik dosya yükler, ürün buradan event çıkarır veya bağlam üretir.

### 7.3 Imported academic signals

Daha sonra açılacak katman.
Portal / dış sistem verisinin normalize edilmesi.

Bu yüzden v1 şunu varsaymamalıdır:

- tam portal entegrasyonu
- canlı senkronizasyon
- resmi API erişimi

v1 önce ürün modelini doğru kurmalıdır.

---

## 8. v1 Surface Definition

### 8.1 Academic Inbox

Amaç:
Öğrencinin son bakışından beri gerçekten önemli akademik değişiklikleri göstermesi.

Inbox yalnız kronolojik olmamalıdır.
Hem zaman hem significance taşımalıdır.

Her item şunu içermelidir:

- ne değişti
- hangi derste oldu
- bu neden önemli
- bunun öğrencinin odağına etkisi var mı
- mümkünse bir sonraki aksiyon

Örnek item:

`MAN409 için yeni materyal yüklendi. Bu hafta ilk review bloğu için anlamlı olabilir.`

### 8.2 Course Pulse

Amaç:
Her dersin mini bir akademik sağlık görünümünü vermek.

Pulse şu alanları içermelidir:

- recent activity
- open pressure
- overdue state
- exam pressure
- material freshness
- current attention signal

Bu yüzey detay sayfası gibi değil, karar destek özeti gibi olmalıdır.

### 8.3 Home Brief Integration

Inbox'taki anlamlı event'ler Home brief'i etkileyebilmelidir.

Örnek:

- yeni materyal yüklenmesi
- ödev deadline yaklaşması
- grade release ile dikkat kayması
- duyurunun bu haftayı değiştirmesi

Home brief artık yalnız exam proximity değil, academic change awareness da taşımalıdır.

### 8.4 Priorities Integration

Academic event'ler risk motorunu körleştirmemeli, ama gerekirse yönlendirmelidir.

Örnek:

- yarın deadline varsa, ilgili ders daha görünür hale gelebilir
- yeni materyal varsa, resource prompt güçlenebilir
- grade signal zayıfsa, ilgili dersin attention state'i yükseltilebilir

Kural:

Academic signals, mevcut planning logic'i yıkmamalı; onu zenginleştirmelidir.

---

## 9. v1 Interpretation Rules

v1 her event'i eşit muameleyle göstermemelidir.
Bir significance mantığı gerekir.

Sistemin en azından şu ayrımı yapması gerekir:

### Low significance

- düşük etkili announcement
- eski materyal
- planning'i değiştirmeyen zayıf sinyal

### Medium significance

- bu hafta etkisi olan materyal
- yaklaşan ama kritik olmayan deadline
- context sağlayan grade signal

### High significance

- yakın deadline
- overdue work
- yeni exam event
- bu haftaki odağı değiştirecek material / grade / deadline signal

Ana kural:

**Inbox her şeyi gösteren yer değil, öğrencinin dikkatini hak eden şeyleri filtreleyen yer olmalıdır.**

---

## 10. v1 Non-Goals

Bu aşamada özellikle yapılmayacaklar:

- teacher-facing tools
- assignment submission
- grade entry as official system
- forum / chat replacement
- admin workflows
- attendance systems
- LMS parity
- institutional authentication dependency as launch blocker
- noisy notification system

Ek kural:

Academic Layer v1, “daha büyük dashboard” projesine dönüşmemelidir.

---

## 11. Success Criteria

Academic Layer v1 başarılı sayılmak için şu üç testi geçmelidir:

### 11.1 30-second clarity test

Kullanıcı 30 saniye içinde şunu anlayabiliyor mu:

- ne değişti
- ne önemli
- sıradaki hareket ne

### 11.2 Planning connection test

Academic event'ler gerçekten Home / Priorities / resource guidance üzerinde fark yaratıyor mu?
Yoksa sadece yeni bir görünürlük katmanı mı kalıyor?

### 11.3 Noise control test

Ürün daha zengin akademik sinyal almasına rağmen daha gürültülü olmuyor mu?

Eğer academic layer clarity yerine dashboard karmaşası üretirse, v1 başarısızdır.

---

## 12. First Ideal User Story

Bir öğrenci 8 derslik yoğun bir dönemde EXAM ASSIST'i açar.

Şunu görür:

- bu hafta hangi derslerde gerçekten değişiklik oldu
- hangi ödev veya sınav yaklaşmış durumda
- hangi ders sessiz ama riskli
- hangi yeni materyal bu hafta işe yarayabilir
- bugünkü odağını neyin değiştirmesi gerektiği

Ve sistem onu şuraya getirir:

**"Tamam, bu hafta akademik resim bu. Bugün şu dersten başlamam gerekiyor."**

Bu kullanıcı hikâyesi kurulmadan academic layer genişletilmemelidir.

---

## 13. Immediate Next Definition After This

Bu belge sonrası yazılması gereken doküman:

## Academic Event Model Spec

Orada şunlar kilitlenmelidir:

- event type list
- significance rules
- planning bağlantı kuralları
- source / provenance alanları
- UI rendering rules for inbox items

Doğru sıradaki ürün tanımı budur.

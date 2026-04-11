# EXAM ASSIST — Academic Layer Strategy

## Status
Draft

## Purpose
Bu belge, EXAM ASSIST'in sınav kökenli çalışma ürününden daha güçlü bir **student-facing academic intelligence layer** yönüne nasıl evrilebileceğini tanımlar.

Bu bir LMS planı değildir.
Bu bir ürün kimliği koruma ve genişleme belgesidir.

Ana referanslar:

- [PRODUCT_STRATEGY.md](/Users/vatan/Documents/EXAM%20ASSIST/PRODUCT_STRATEGY.md)
- [PROJECT_VISION.md](/Users/vatan/Documents/EXAM%20ASSIST/PROJECT_VISION.md)
- [ROADMAP.md](/Users/vatan/Documents/EXAM%20ASSIST/ROADMAP.md)
- [HOW_EXAM_ASSIST_WORKS.md](/Users/vatan/Documents/EXAM%20ASSIST/HOW_EXAM_ASSIST_WORKS.md)
- [HADI_PRODUCT_AUDIT.md](/Users/vatan/Documents/EXAM%20ASSIST/HADI_PRODUCT_AUDIT.md)

---

## 1. Executive Position

EXAM ASSIST, Hadi benzeri üniversite portallarının yerine geçmemelidir.
EXAM ASSIST, o portalların öğrenciye veremediği şeyi vermelidir:

- ne değiştiğini
- neyin önemli olduğunu
- şimdi ne yapılması gerektiğini

Üniversite sistemi akademik gerçekliği depolar.
EXAM ASSIST o gerçekliği **açıklığa, önceliğe ve aksiyona** çevirmelidir.

Bu yön bir pivot değildir.
Bu, aynı ürün tezinin daha geniş bir akademik alana uygulanmasıdır:

- sınav baskısından akademik baskıya
- sınav planlamasından akademik yorumlama + çalışma yönlendirmesine

Ürünün ana filtresi değişmemelidir:

**Bir özellik öğrencinin neyin değiştiğini, neyin önemli olduğunu veya şimdi ne yapması gerektiğini daha net göstermiyorsa, bu ürüne ait değildir.**

---

## 2. Why This Direction Exists

Hadi audit'inin gösterdiği asıl problem kötü görsel tasarım değil, **öğrencinin bilişsel yükünün sistem tarafından alınmaması**.

Portal içinde şu şeyler var:

- dersler
- öğretmen yüklemeleri
- kısmi notlar
- ödev yüzeyleri
- duyurular

Ama öğrenci yine de kolayca anlayamıyor:

- hangi derste ne değişti
- hangi iş gerçekten yaklaşıyor
- ne gecikti
- hangi ders dikkat istiyor
- bu haftanın akademik resmi ne

Bu yüzden fırsat "daha güzel portal" yapmak değildir.
Fırsat, **kurumsal depolama ile öğrenci aksiyonu arasındaki eksik yorumlama katmanını kurmaktır**.

---

## 3. Product Framing

EXAM ASSIST şu yöne evrilmelidir:

**student-facing academic intelligence layer**

Bu ne demek?

- öğrenci tarafında çalışan akademik yorumlama katmanı
- dağınık akademik girdileri tek bir sakin çalışma yüzeyine çeviren sistem
- planlama motorunu daha zengin akademik bağlamla besleyen ürün

Bu ne demek değildir?

- LMS
- portal replacement
- teacher platform
- system of record
- university administration suite

Ürün, öğrencinin üç sorusuna hızlı cevap vermelidir:

1. Ne değişti?
2. Şu an ne önemli?
3. Şimdi ne yapmalıyım?

---

## 4. Strategic Thesis

EXAM ASSIST'in en güçlü sonraki adımı "Hadi'nin yerini almak" değildir.
En güçlü sonraki adımı şudur:

**Parçalı akademik sistemlerin üstünde duran ve bunları öğrenci için anlaşılır hale getiren katman olmak.**

Bu yön stratejik olarak güçlüdür çünkü:

- mevcut planning ve prioritization çekirdeğine doğal biçimde oturur
- gerçek öğrenci acısını çözer
- öğretmen davranışının değişmesini gerektirmez
- kurumsal overreach'e girmeden değer üretir
- hidden intelligence ilkesini korur

Bu yönün tehlikesi de açıktır:

Portal davranışını kopyalayan ürün, portal kadar ağır ve ruhsuz hale gelir.
Bu yüzden her genişleme şu sınır içinde kalmalıdır:

**EXAM ASSIST akademiyi yönetmek için değil, öğrencinin akademi içinde akıllıca hareket etmesine yardım etmek için vardır.**

---

## 5. What EXAM ASSIST Already Has That Matters

EXAM ASSIST bu yöne sıfırdan başlamıyor.
Bugün zaten şu temellere sahip:

- planning runtime
- risk / prioritization mantığı
- yüksek baskı dönemlerinde güçlü yönlendirme yüzeyleri
- kaynak zekâsı
- session / outcome / reflection düşüncesi
- kişisel workspace mantığı
- sakin ve guidance-first ürün dili

Bu önemlidir, çünkü Hadi benzeri sistemlerin eksik olduğu şey zaten şudur:

- sinyali yorumlamak
- baskıyı sıralamak
- dağınık bilgiyi aksiyona çevirmek

EXAM ASSIST bugün bunu sınav ve çalışma bağlamında yapabiliyor.
Yeni yön, aynı motoru daha geniş akademik girdilerle beslemek olmalıdır.

---

## 6. What Is Still Missing

Bu yön için eksik olan şeyler kozmetik değil, yapısaldır.

### 6.1 Academic ingestion layer

Ürün bugün gerçek anlamda akademik sistem verisi almıyor.
Şu sinyaller için yeni bir giriş katmanı gerekiyor:

- dersler
- materyaller
- ödevler
- notlar
- duyurular
- deadline değişimleri

Kaynaklar zamanla çeşitlenebilir:

- institutional portals
- exported files
- uploaded academic documents
- manual additions

Bu katman olmadan ürün akıllı kalır ama kısmen kör kalır.

### 6.2 Canonical academic model

Bugünkü domain hâlâ ağırlıklı olarak study/planning-first.
Bu yön için en az şu nesneler gerekir:

- `Course`
- `Material`
- `Assignment`
- `ExamEvent`
- `GradeItem`
- `Announcement`
- `AcademicEvent`

Burada en kritik nesne statik nesneler değil, olay katmanıdır.
Çünkü öğrencinin asıl sorusu "hangi veri var?" değil, **"ne değişti ve neden umursamalıyım?"** sorusudur.

### 6.3 Provenance model

Bu stratejinin güvenilirlik omurgası budur.
Ürün her zaman şunu ayırmalıdır:

1. official imported data
2. student-entered data
3. system-derived intelligence

Bu katmanlar mimaride ve deneyimde karışmamalıdır.

### 6.4 Academic visibility surfaces

Bugünkü yüzeyler çoğunlukla exam/study-centered.
Yeni aşamada şunlar gerekir:

- academic change visibility
- course status visibility
- grade signal visibility
- deadline state visibility

Ama bunlar dashboard noise olarak değil, input-to-action surfaces olarak tasarlanmalıdır.

---

## 7. Core Product Model

Gelecekteki ürün dört katmanda çalışmalıdır.

### Layer A — Input

Akademik sinyaller şuradan gelir:

- institutional systems
- file imports
- uploaded academic files
- manual additions

### Layer B — Normalization

Bu sinyaller canonical academic objects ve events'e dönüştürülür.

Örnekler:

- teacher uploads a file -> `material_update`
- due date appears -> `assignment_due`
- grade is posted -> `grade_release`
- exam appears -> `exam_event`

### Layer C — Interpretation

EXAM ASSIST şunu belirler:

- ne değişti
- ne acil
- ne gecikti
- ne yeni önem kazandı
- bu değişiklik öğrencinin gerçek haftasını nasıl etkiliyor
- bunun planning motoruna nasıl yansıması gerekiyor

### Layer D — Action

Öğrenci şunu görür:

- sakin bir academic inbox
- course pulse özeti
- güncellenmiş öncelikler
- çalışmaya bağlanan öneriler
- kaynak ve review yönlendirmesi

Ana kural:

**Ürün görünürlükte durmamalı, görünürlüğü aksiyona çevirmelidir.**

---

## 8. AI Readiness Principle

EXAM ASSIST'e gelecekte AI katmanları eklenecektir.
Ama bu katmanlar ürünün temeli değil, **yorum derinliği** katmanı olmalıdır.

Bu yüzden ürün önce şu omurgayı güçlü kurmalıdır:

- structured academic inputs
- canonical academic model
- provenance ayrımı
- academic event layer
- feedback loops
- ranking memory

Bu temeller olmadan AI yalnızca etkileyici görünen ama tutarsız çalışan bir üst katman olur.
Bu temellerle birlikte ise AI:

- daha temiz bağlamla çalışır
- daha küçük ve daha ucuz olabilir
- daha güvenilir kalır
- deterministic katmanlarla çapraz kontrol edilebilir

Ana ilke:

**Önce yapılandırılmış akademik zemin, sonra AI ile anlam derinliği.**

---

## 8. Strategic Boundaries

Bu yönün ürün kimliğini bozmasını engellemek için şu alanlar açık sınır olarak tutulmalıdır:

- official grade entry
- assignment submission infrastructure
- teacher-facing publishing tools
- forum/chat replacement
- admin panels
- enrollment management
- institutional governance workflows
- full LMS parity

Bunlar "v1'de değil" diye ertelenmiş hoş fikirler olarak değil, mevcut ürün tezi dışında alanlar olarak değerlendirilmelidir.

EXAM ASSIST'in işi:

- okumak
- yorumlamak
- önceliklendirmek
- öğrenciyi harekete geçirmek

EXAM ASSIST'in işi olmayan:

- kurumsal sistemi işletmek

---

## 9. Best Wedge

En doğru wedge "better portal" değildir.
En doğru wedge şudur:

## Academic Inbox + Course Pulse

Bu, en dar ama en güçlü giriş yüzeyidir.

Öğrenci burada tek yerde şunu görmelidir:

- son kontrolünden beri ne değişti
- hangi ders dikkat istiyor
- hangi deadline en yakın
- ne gecikti
- hangi yeni materyal gerçekten önemli
- hangi grade signal değişti
- bunlardan hangisi çalışma aksiyonuna çevrilmeli

Bu wedge doğrudur çünkü:

- en büyük acıyı hızlı çözer
- mevcut EXAM ASSIST güçlü yanlarına yaslanır
- teacher adoption gerektirmez
- institutional replacement savaşına sokmaz
- planning motoruna doğal girdi üretir

---

## 10. First Product Surfaces

İlk anlamlı genişleme dört bağlı yüzey etrafında kurulmalıdır.

### 10.1 Academic Inbox

Anlamlı akademik değişimlerin sakin, önem sıralı akışı.

Örnek eventler:

- new material upload
- assignment deadline approaching
- overdue work
- grade posted
- exam updated
- meaningful announcement

### 10.2 Course Pulse

Her ders için kompakt durum görünümü:

- recent changes
- open pressure
- overdue items
- exam state
- material freshness
- current attention signal

### 10.3 Home Brief

Home brief exam-only mantığın ötesine geçer.
Şunu özetler:

- ne değişti
- şu an ne önemli
- öğrencinin sıradaki hamlesi ne olmalı

### 10.4 Existing Planning Layer

Planning yüzeyi çekirdek olmaya devam eder.
Ama artık yalnız sınav setup'ından değil, daha zengin akademik bağlamdan beslenir.

Bu ürünün doğru genişleme yönüdür.

---

## 11. Sequence of Expansion

Sıralama önemlidir.
Yanlış sırayla gidilirse ürün ya dashboard'a dönüşür ya da LMS'e kayar.

### Phase 1 — Academic event layer

Önce şu event ailesi tanımlanır:

- exam
- assignment
- material update
- announcement
- grade release
- deadline change

Bu gerçek temel katmandır.

### Phase 2 — Inbox and course pulse

Sonra bu eventler öğrenci için anlamlı görünürlük yüzeylerine dönüştürülür.

### Phase 3 — Action conversion

Daha sonra bu sinyaller şuna bağlanır:

- updated priorities
- home brief shifts
- study recommendations
- resource prompts
- review reminders

### Phase 4 — Better ingestion

Model ve yüzeyler sağlamlaştıktan sonra:

- connectors
- import flows
- portal-reading mechanisms
- automation improvements

Bu sıra, ürünü "portal clone" olmaktan korur.

---

## 12. Grade Strategy

Notlar önemlidir, ama burada dikkatli olunmalıdır.

İlk adım "full gradebook" olmamalıdır.
İlk adım şu olmalıdır:

- grade visibility
- grade signal interpretation
- gap awareness

Doğru erken framing:

**Grade Snapshot, not Grade Management.**

Ürün öğrencinin şunu anlamasına yardım etmelidir:

- ne notlandı
- ne hâlâ bekliyor
- kabaca nerede duruyor
- bunun dikkat ve çalışma planına etkisi ne

---

## 13. Notification Strategy

Bildirimler değerli olabilir, ama temel katman değildir.

Ürün önce şunlarda kazanmalıdır:

- açıldığında netlik
- yüzeyler arası tutarlılık
- sakin önceliklendirme

Bildirim daha sonra gelmelidir.
Geldiğinde de şu karakterde olmalıdır:

- gentle academic prompt
- meaningful change alert
- action-supporting reminder

Asla şu karakterde olmamalıdır:

- noise
- urgency spam
- generic productivity nagging

---

## 14. Hidden Intelligence Rule

Bu yön, EXAM ASSIST'in ana ilkesini korumalıdır:

**strong internal intelligence, calm external clarity**

Academic layer zenginleşse bile:

- arayüz veri yoğunluğu ile şişmemeli
- kullanıcı iç skor mantığını görmek zorunda kalmamalı
- ürün teknik bir sistem gibi hissettirmemeli

Öğrencinin hissetmesi gereken:

- oriented
- calmer
- guided
- able to act

---

## 15. Success Test

Bir öğrenci EXAM ASSIST'i açtığında 30 saniye içinde şunu anlayabilmelidir:

- ne değişti
- en çok ne önemli
- sıradaki doğru hareket ne

Daha sert test:

**Ürün, akademik değişimi gürültüye dönüşmeden çalışma açısından anlamlı aksiyona çevirebiliyor mu?**

Eğer hayırsa, yön kayıyordur.

---

## 16. Recommendation

Bu yön stratejik olarak akıllıdır.
Ama yalnızca şu çerçevede:

**EXAM ASSIST, parçalı akademik sistemleri yorumlayıp öğrencinin anlayacağı açık aksiyona çeviren student-facing academic intelligence layer olarak evrilmelidir.**

Ürün şunlardan biri olmamalıdır:

- new Hadi
- Moodle replacement
- teacher platform
- generic academic dashboard

Ürün şuna dönüşmelidir:

- student's academic action layer
- institutional chaos üstündeki yorumlama katmanı
- akademik baskıyı çalışılabilir hale getiren yüzey

Bu hem farklılaştırıcıdır hem de gerçekçidir.

---

## 17. Immediate Next Product-Definition Step

Bir sonraki adım implementation değil, daha dar ve karar verdiren bir ürün tanımıdır:

## Academic Layer v1

Bu takip dokümanı şunları kilitlemelidir:

- exact v1 entity model
- exact academic event model
- imported vs personal vs derived boundaries
- first inbox + course pulse flow
- events'in planning katmanına nasıl besleneceği
- strict non-goals
- measurable success criteria

Doğru ilk kullanıcı vaadi şu olmalıdır:

**Bir öğrenci EXAM ASSIST'i açtığında, bu hafta dikkat gerektiren akademik değişiklikleri ve bunlara karşı ne yapması gerektiğini hemen görmelidir.**

Bu belge yazılmadan daha büyük uygulama genişlemesine geçilmemelidir.

# EXAM ASSIST — Build 1: Academic Event Foundation Tasks

## Status
Draft

## Purpose
Bu belge, Academic Layer için ilk gerçek engineering slice olan **Academic Event Foundation** işlerini dosya bazlı ve uygulanabilir görev listesine çevirir.

Bu build'in amacı:

- academic event domain'ini eklemek
- local-first persistence desteği vermek
- ilk event üretim yollarını açmak
- Home / Priorities tarafına minimal bağlam etkisi vermek
- tüm bunları mevcut exam-first çekirdeği bozmadan yapmak

Ana referanslar:

- [ACADEMIC_LAYER_IMPLEMENTATION_PLAN.md](/Users/vatan/Documents/EXAM%20ASSIST/ACADEMIC_LAYER_IMPLEMENTATION_PLAN.md)
- [ACADEMIC_EVENT_MODEL_SPEC.md](/Users/vatan/Documents/EXAM%20ASSIST/ACADEMIC_EVENT_MODEL_SPEC.md)
- [ACADEMIC_LAYER_DATA_FLOW_SPEC.md](/Users/vatan/Documents/EXAM%20ASSIST/ACADEMIC_LAYER_DATA_FLOW_SPEC.md)

---

## 1. Build Goal

Build 1 sonunda ürün şunu yapabilmelidir:

- academic event kaydı tutmak
- event'leri sanitize edip okumak
- manuel event oluşturmak
- significance / planningImpact atamak
- bu event'leri Home ve Priorities'te hafif bağlam sinyali olarak kullanmak

Bu build sonunda henüz tam bir `Academic Inbox` ekranı çıkması gerekmez.

---

## 2. Out of Scope

Bu build'in kapsamı dışı:

- ayrı Academic Inbox sayfası
- Course Pulse UI
- portal entegrasyonu
- advanced notification flow
- full gradebook
- teacher/admin tarafı
- cloud sync genişletmesi zorunluluğu

Ana kural:

**Bu build önce foundation kurar, feature breadth değil.**

---

## 3. Task Group A — Domain Types

### File
- [lib/types.ts](/Users/vatan/Documents/EXAM%20ASSIST/lib/types.ts)

### Tasks

1. Yeni temel type'ları ekle:
   - `AcademicEventType`
   - `AcademicEventSource`
   - `AcademicEventProvenance`
   - `AcademicEventSignificance`
   - `AcademicEventPlanningImpact`
   - `AcademicEventStatus`

2. Minimum `AcademicEvent` interface'ini ekle.

3. Gerekliyse hafif yardımcı tipler ekle:
   - `GradeSignal`
   - `AcademicEventMetadata`

4. `PersistedCloudStateSnapshot` içine academic event alanı eklenip eklenmeyeceğine karar ver.
   İlk build için local-only başlanacaksa bile tip düzeyinde bunun yolu düşünülmeli.

### Done when

- type dosyası academic event modelini taşıyabiliyor
- mevcut tiplerle çakışmıyor
- type isimleri future-proof ama gereksiz geniş değil

---

## 4. Task Group B — Storage Foundation

### File
- [lib/storage.ts](/Users/vatan/Documents/EXAM%20ASSIST/lib/storage.ts)

### Tasks

1. Yeni storage key ekle:
   - `academicEvents`

2. `SCOPED_STORAGE_KEYS` listesine ekle.

3. `sanitizeAcademicEvent` fonksiyonu yaz.

4. Read / write / replace / append yardımcıları ekle:
   - `readAcademicEvents()`
   - `writeAcademicEvents()`
   - `replaceAcademicEvents()`
   - gerekirse `upsertAcademicEvent()`

5. Provenance ve status alanlarını güvenli sanitize et.

6. Dismiss / resolve gibi ileride gerekecek lifecycle güncellemeleri için uygun yazma noktalarını düşün, ama erken aşırı abstraction yapma.

### Done when

- bozuk localStorage verisi academic event katmanını çökertmiyor
- okuma/yazma güvenli
- mevcut scoped storage mantığı bozulmuyor

---

## 5. Task Group C — Event Interpretation Helpers

### New file
- `/Users/vatan/Documents/EXAM ASSIST/lib/academic-events.ts`

### Tasks

1. Event significance helper yaz:
   - `deriveAcademicEventSignificance(...)`

2. Planning impact helper yaz:
   - `deriveAcademicEventPlanningImpact(...)`

3. Event normalization helper yaz:
   - `createAcademicEvent(...)`
   - manual/raw input -> normalized event

4. Dedupe helper yaz:
   - exact duplicate
   - update-in-place
   - multi-signal consolidation için minimum mantık

5. Lifecycle helper yaz:
   - `isAcademicEventActive`
   - `expireAcademicEvents`
   - gerekirse `resolveAcademicEvent`

### Constraints

- helper'lar UI bağımlı olmamalı
- risk motorunun yerine geçmeye kalkmamalı
- sade ve test edilebilir kalmalı

### Done when

- raw/manual input'tan yorumlanmış event üretilebiliyor
- significance/planningImpact ayrı ayrı hesaplanabiliyor
- event listesi dedupe edilebiliyor

---

## 6. Task Group D — Hook Layer

### New file
- `/Users/vatan/Documents/EXAM ASSIST/hooks/useAcademicEvents.ts`

### Tasks

1. `readAcademicEvents()` üstüne kurulu hook yaz.

2. API önerisi:
   - `events`
   - `isReady`
   - `addEvent`
   - `replaceEvents`
   - `dismissEvent`
   - `resolveEvent`

3. `storage` event listener ile sync olmasını sağla.

4. İlk build için gereksiz karmaşık selectors yazma; ama aktif event listesi gibi temel derived değerler döndürülebilir.

### Done when

- UI katmanı academic event'leri hook üzerinden okuyabiliyor
- event state değişince ekranlar refresh olabiliyor

---

## 7. Task Group E — First Event Creation Paths

### Candidate files
- [components/dashboard/schedule-screen.tsx](/Users/vatan/Documents/EXAM%20ASSIST/components/dashboard/schedule-screen.tsx)
- [components/dashboard/resources-screen.tsx](/Users/vatan/Documents/EXAM%20ASSIST/components/dashboard/resources-screen.tsx)
- [components/dashboard/home-screen.tsx](/Users/vatan/Documents/EXAM%20ASSIST/components/dashboard/home-screen.tsx)
- [components/dashboard/exam-command-center.tsx](/Users/vatan/Documents/EXAM%20ASSIST/components/dashboard/exam-command-center.tsx)

### Tasks

1. Manuel `assignment_due` yaratma yolu aç.
   Not:
   bunu mevcut schedule akışına eklemek, tamamen yeni ekran açmaktan daha mantıklı olabilir.

2. Manuel `grade_release` signal girişi için en küçük yol tanımla.
   İlk sürümde full UI gerekmez; küçük, kontrollü giriş yeterli.

3. Resource upload sonrası minimum `material_update` event üretimi düşün.
   Not:
   bu ilk build'de otomatik yapılırsa iyi, ama aşırı karmaşıksa ikinci adım olabilir.

4. Mevcut exam/schedule verisinden academic event türetimi gerekip gerekmediğini dar tut:
   ilk build'de duplicate semantics yaratmayacak şekilde ilerle.

### Done when

- ürün içinde en az 1-2 gerçek creation path çalışıyor
- event layer boş bir soyut model olmaktan çıkıyor

---

## 8. Task Group F — Home Integration

### File
- [components/dashboard/home-screen.tsx](/Users/vatan/Documents/EXAM%20ASSIST/components/dashboard/home-screen.tsx)

### Tasks

1. Home brief'e event-aware bağlam girişi ekle.

2. Kural:
   event Home'u override etmez; yalnız anlamlı bağlam ekler.

3. Yalnız şu event'ler Home'a taşınmalı:
   - high significance
   - soft/strong planning impact
   - bu haftanın odağını değiştirebilecek sinyaller

4. Copy katmanı sakin kalmalı.
   Raw event text'i Home'a taşınmamalı.

### Done when

- Home artık yalnız exam proximity değil, academic change awareness da taşıyor
- ama “dashboard noise” üretmiyor

---

## 9. Task Group G — Priorities Integration

### File
- [components/dashboard/priorities-screen.tsx](/Users/vatan/Documents/EXAM%20ASSIST/components/dashboard/priorities-screen.tsx)

### Tasks

1. Academic event'lerden gelen bağlam sinyalini priorities ekranında göstermek için minimum yol tasarla.

2. Olası kullanım:
   - ders kartında hafif “bu hafta yeni baskı var” sinyali
   - resource gap veya deadline pressure bağlamı

3. Risk sıralaması academic event yüzünden baştan yazılmamalı.
   Event yalnız ranking explanation veya attention framing'e katılmalı.

### Done when

- priorities akademik bağlamdan haberdar oluyor
- ama exam-first risk mantığı bozulmuyor

---

## 10. Task Group H — Command Center Wiring

### File
- [components/dashboard/exam-command-center.tsx](/Users/vatan/Documents/EXAM%20ASSIST/components/dashboard/exam-command-center.tsx)

### Tasks

1. `useAcademicEvents()` hook'unu buraya ekle.

2. Academic event verisini ilgili yüzeylere geçir:
   - Home
   - Priorities
   - ileride Inbox surface

3. Runtime refresh mantığıyla çakışma yaratmamasına dikkat et.

4. Event layer local-first çalışmalı; mevcut gate/auth akışını bozmamalı.

### Done when

- academic event state uygulamanın dashboard orchestration katmanına bağlanmış oluyor

---

## 11. Task Group I — Tests

### Candidate files
- `/Users/vatan/Documents/EXAM ASSIST/tests/academic-events.test.ts`
- mevcut storage test dosyaları
- gerekirse integration odaklı ek testler

### Tests to add

1. `sanitizeAcademicEvent`
2. event read/write roundtrip
3. significance derivation
4. planningImpact derivation
5. dedupe behavior
6. lifecycle expiry
7. manual deadline -> Home bağlam etkisi
8. grade signal -> priorities bağlam etkisi

### Done when

- academic event foundation logic'i UI'dan bağımsız doğrulanabiliyor

---

## 12. Suggested Build Order

En doğru sıra:

1. `lib/types.ts`
2. `lib/storage.ts`
3. `lib/academic-events.ts`
4. tests for storage + helpers
5. `hooks/useAcademicEvents.ts`
6. first manual event creation path
7. `exam-command-center.tsx`
8. `home-screen.tsx`
9. `priorities-screen.tsx`

Bu sıra şu yüzden doğru:

- önce güvenli veri modeli
- sonra yorum katmanı
- sonra wiring
- en son görünür davranış

---

## 13. Risks During Build

### 13.1 Over-modeling

Çok fazla type ve metadata eklemek ilk build'i ağırlaştırabilir.

Karar:
- minimum schema ile başla

### 13.2 UI-first temptation

Inbox ekranını erken yapmak cazip olabilir.

Karar:
- önce event foundation

### 13.3 Duplicate semantics

Mevcut exam/schedule yapısıyla yeni event modeli aynı şeyi iki kez göstermeye başlayabilir.

Karar:
- exam event türetimini ilk build'de dar tut

### 13.4 Planning override

Academic event katmanı risk motorunu boğabilir.

Karar:
- event = context
- risk engine = primary ranking logic

---

## 14. Definition of Done for Build 1

Build 1 tamam sayılmak için:

- `AcademicEvent` domain modeli repo'da vardır
- storage güvenlidir
- event helper'ları çalışır
- en az bir manuel event creation path vardır
- Home ve Priorities tarafında hafif ama gerçek etki görünür
- testler bu mantığı doğrular
- ürün daha gürültülü değil, daha bağlamlı hissedilir

Bu nokta gelmeden `Academic Inbox` ekranını üretmek erken kabul edilmelidir.

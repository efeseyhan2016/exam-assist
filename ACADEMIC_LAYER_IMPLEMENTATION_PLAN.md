# EXAM ASSIST — Academic Layer Implementation Plan

## Status
Draft

## Purpose
Bu belge, academic layer yönünü gerçek ürün geliştirme işlerine indirir.

Amaç:

- büyük vizyonu küçük, test edilebilir slice'lara bölmek
- ilk implementation sırasını netleştirmek
- mevcut EXAM ASSIST çekirdeğini bozmadan genişleme yolunu tarif etmek

Ana referanslar:

- [ACADEMIC_LAYER_STRATEGY.md](/Users/vatan/Documents/EXAM%20ASSIST/ACADEMIC_LAYER_STRATEGY.md)
- [ACADEMIC_LAYER_V1.md](/Users/vatan/Documents/EXAM%20ASSIST/ACADEMIC_LAYER_V1.md)
- [ACADEMIC_EVENT_MODEL_SPEC.md](/Users/vatan/Documents/EXAM%20ASSIST/ACADEMIC_EVENT_MODEL_SPEC.md)
- [ACADEMIC_INBOX_UX_SPEC.md](/Users/vatan/Documents/EXAM%20ASSIST/ACADEMIC_INBOX_UX_SPEC.md)
- [ACADEMIC_LAYER_DATA_FLOW_SPEC.md](/Users/vatan/Documents/EXAM%20ASSIST/ACADEMIC_LAYER_DATA_FLOW_SPEC.md)

---

## 1. Implementation Principle

Academic layer tek seferde "yeni bölüm" olarak inşa edilmemelidir.
Doğru sıra:

1. event tabanı
2. event'lerin planning katmanına en dar bağlantısı
3. inbox yüzeyi
4. course pulse
5. daha iyi ingestion

Ana kural:

**Önce model, sonra sinyal akışı, sonra yüzey.**

---

## 2. What We Are Building First

İlk implementation hedefi şudur:

**Minimum Academic Event slice**

Bu ilk slice sonunda ürün şunu yapabilmelidir:

- bazı akademik sinyalleri event olarak saklamak
- bunları significance mantığıyla sıralamak
- Home ve Priorities'a hafif bağlamsal etki üretmek
- henüz tam academic inbox ekranı çıkmadan bile sistem içinde test edilebilir olmak

Bu yaklaşım önemli çünkü:

- önce çekirdek veri katmanını kurar
- planning sistemini bozmadan genişler
- UI'dan önce ürün mantığını doğrular

---

## 3. Phase Plan

### Phase 0 — Domain foundation

Amaç:
Academic event domain'ini mevcut planning/storage mimarisine eklemek.

Yapılacaklar:

- yeni türler:
  - `AcademicEvent`
  - `AcademicEventType`
  - `AcademicEventSource`
- minimum provenance alanları
- minimum significance / planningImpact alanları
- storage katmanında academic event okuma/yazma
- sanitizer / parser guard'ları

Çıkış:

- local-first çalışan güvenli academic event depolama tabanı

### Phase 1 — Event creation paths

Amaç:
Academic event'lerin ilk üretim yollarını kurmak.

v1 için ilk kaynaklar:

- manual assignment deadline
- manual grade signal
- uploaded resource üzerinden `material_update` türetimi
- mevcut exam/schedule sinyallerinden event üretme

Çıkış:

- sisteme elle veya mevcut akışlardan event düşebiliyor olması

### Phase 2 — Interpretation layer

Amaç:
Event'lerin significance ve planningImpact alması.

Yapılacaklar:

- significance helper
- planning impact mapper
- time sensitivity kuralları
- dedupe / merge mantığı
- active / resolved / dismissed / expired lifecycle kuralları

Çıkış:

- event seti ham veri olmaktan çıkıp yorumlanmış hale gelir

### Phase 3 — Planning integration

Amaç:
Academic event'lerin mevcut sistemi bozmadan Home / Priorities'i etkilemesi.

Yapılacaklar:

- Home brief'e event-aware bağlam ekleme
- Priorities için contextual lift mekanizması
- resource prompts ile event bağı
- event'lerin mevcut risk motorunu override etmeden zenginleştirmesi

Çıkış:

- academic layer etkisi görünür olur
- ama ürün exam-first çekirdeğini kaybetmez

### Phase 4 — Academic Inbox MVP

Amaç:
İlk gerçek inbox yüzeyini çıkarmak.

Yapılacaklar:

- inbox list surface
- item anatomy
- default ranking
- low-noise empty state
- dismiss / resolve davranışı

Çıkış:

- öğrenci ilk kez “academic change layer”ı görünür biçimde kullanır

### Phase 5 — Course Pulse MVP

Amaç:
Event listesini ders bazlı mini özetlere çevirmek.

Yapılacaklar:

- pulse summary builder
- course attention summary
- recent activity + open pressure özeti

Çıkış:

- inbox değişikliği,
- pulse dersin toplu durumunu
gösterir

---

## 4. The Smart First Slice

En doğru ilk engineering slice:

## Slice A — Manual events + light planning integration

Bu slice'ın kapsamı:

- `AcademicEvent` type ekle
- storage desteği ekle
- manuel `assignment_due` ekleme desteği
- manuel `grade_release` signal girişi
- uploaded resource -> `material_update` event üretimi
- significance / planningImpact helper'ları
- Home brief'e minimal event-aware bağlam

Bu slice'ın kapsamı dışı:

- ayrı inbox sayfası
- course pulse UI
- portal import
- advanced dedupe UI
- notifications

Neden bu slice?

- ürün değerini hızlı doğrular
- çok geniş UI çalışmasına girmeden intelligence zincirini test eder
- mevcut kod tabanına en doğal oturan ilk adımdır

---

## 5. Recommended File/Module Direction

İlk implementasyon için muhtemel ekleme alanları:

### Domain / types

- [lib/types.ts](/Users/vatan/Documents/EXAM%20ASSIST/lib/types.ts)

### Storage / persistence

- [lib/storage.ts](/Users/vatan/Documents/EXAM%20ASSIST/lib/storage.ts)
- gerekirse [lib/cloud-state.ts](/Users/vatan/Documents/EXAM%20ASSIST/lib/cloud-state.ts)

### Derivation / interpretation

- yeni bir yardımcı dosya:
  - `lib/academic-events.ts`
  - veya benzeri bir event interpretation katmanı

### Hooks

- yeni hook olası:
  - `hooks/useAcademicEvents.ts`

### Home / priorities integration

- [components/dashboard/home-screen.tsx](/Users/vatan/Documents/EXAM%20ASSIST/components/dashboard/home-screen.tsx)
- [components/dashboard/priorities-screen.tsx](/Users/vatan/Documents/EXAM%20ASSIST/components/dashboard/priorities-screen.tsx)
- [components/dashboard/exam-command-center.tsx](/Users/vatan/Documents/EXAM%20ASSIST/components/dashboard/exam-command-center.tsx)

Bu yapı, academic layer'ı mevcut runtime'a eklemeyi kolaylaştırır.

---

## 6. Testing Strategy

Academic layer'ın ilk slice'ı için testler UI'dan önce gelmelidir.

İlk test grupları:

### 6.1 Storage tests

- academic event save/read
- sanitize fallback
- provenance korunumu

### 6.2 Interpretation tests

- significance assignment
- planningImpact mapping
- event dedupe
- lifecycle transitions

### 6.3 Integration tests

- manual deadline -> home brief etkisi
- material update -> resource guidance etkisi
- grade signal -> priorities context etkisi

Ana kural:

**Academic layer önce testlerde anlamlı görünmeli, sonra ekranda görünmeli.**

---

## 7. Product Risks to Watch

Implementation sırasında özellikle şu risklere dikkat edilmeli:

### 7.1 Dashboard inflation

Academic layer yeni kartlar üretip ana deneyimi şişirebilir.

Çözüm:
- önce veri ve logic
- sonra minimum UI

### 7.2 Risk engine override

Event'ler yanlış kurgulanırsa mevcut exam planning mantığını boğabilir.

Çözüm:
- event'ler risk motorunu değiştirmez, bağlam verir

### 7.3 Noise creep

Her event görünür yapılırsa ürün portal feed'e döner.

Çözüm:
- significance filtresi zorunlu

### 7.4 Provenance blur

Kullanıcı resmi veri ile sistem yorumunu karıştırırsa güven kaybolur.

Çözüm:
- provenance görünür ve tutarlı olmalı

---

## 8. Success Markers for the First Slice

İlk slice başarılıysa şu şeyler doğru çalışmalıdır:

- kullanıcı manuel akademik event girebilir
- ürün bu event'i saklayabilir ve okuyabilir
- event significance alır
- event Home veya Priorities'te küçük ama açıklanabilir fark yaratır
- sistem daha gürültülü değil, daha bağlamlı hissedilir

Eğer bunlar olmuyorsa inbox ekranını erken yapmak doğru değildir.

---

## 9. Immediate Next Build Recommendation

Eğer şimdi koda geçilecekse, ilk build hedefi şu olmalıdır:

## Build 1 — Academic Event Foundation

Kapsam:

- types
- storage
- helpers
- tests
- manual event creation
- minimal Home/Priorities hookup

Bu build bittikten sonra ancak şu soruya bakılmalıdır:

**Academic Inbox ekranı artık gerçek ürün verisiyle çıkmaya hazır mı?**

Doğru cevap evetse, bir sonraki build `Academic Inbox MVP` olur.

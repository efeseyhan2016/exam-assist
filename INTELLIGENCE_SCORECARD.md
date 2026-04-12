# EXAM ASSIST — Zekâ Motoru Skor Kartı

**Versiyon:** 1.0  
**Tarih:** 12 Nisan 2026  
**Çerçeve:** [INTELLIGENCE_SCORING_FRAMEWORK.md](/Users/vatan/Documents/EXAM%20ASSIST/INTELLIGENCE_SCORING_FRAMEWORK.md)

Bu belge, ilk yüksek-etkili zekâ motorları için yapılan ilk kanıta dayalı yıldızlamayı içerir.  
Puanlar hisle değil, kod, test ve mevcut ürün davranışı üzerinden verilmiştir.

---

## Kısa Özet

| Motor | Yıldız | Hüküm |
|---|---|---|
| Risk Motoru | ★★★★☆ | Güçlü |
| Home Focus | ★★★★☆ | Güçlü |
| Daily Brief | ★★★☆☆ | Doğrudan iyileştirme hedefi |
| Study Recommendation | ★★★☆☆ | Doğrudan iyileştirme hedefi |
| Resource Intelligence | ★★★★☆ | Güçlü |
| Topic Focus / Topic Graph | ★★★☆☆ | Doğrudan iyileştirme hedefi |

**İlk 6 motor içinden 4'ün altında kalanlar:**
- `lib/daily-brief.ts`
- `lib/study-recommendation.ts`
- `lib/topic-focus.ts`

Bu üçü bir sonraki iyileştirme döngülerinde doğrudan hedef alınmalıdır.

---

## 1. Risk Motoru — ★★★★☆

**Dosya:** [risk.ts](/Users/vatan/Documents/EXAM%20ASSIST/lib/risk.ts)  
**Test kanıtı:** [risk.test.ts](/Users/vatan/Documents/EXAM%20ASSIST/tests/risk.test.ts), [planning-runtime.test.ts](/Users/vatan/Documents/EXAM%20ASSIST/tests/planning-runtime.test.ts), [urgency.test.ts](/Users/vatan/Documents/EXAM%20ASSIST/tests/urgency.test.ts), [sleep.test.ts](/Users/vatan/Documents/EXAM%20ASSIST/tests/sleep.test.ts)

**Doğruluk:** 4 — Yakın sınav, aşırı kapasite uyumsuzluğu ve portfolio overload gibi regresyonlar testlerle sabitlenmiş. Özellikle `a near exam with extreme capacity mismatch no longer stays moderate` testi bu motorun geçmişteki en kritik açığını kapatıyor.

**Kapsam:** 4 — Urgency, capacity, sleep, resource readiness, preparedness credit ve completed-exam cleanup katmanları mevcut. Yine de reflection ve recommendation feedback henüz risk hesabının merkezinde değil.

**Güvenilirlik:** 5 — Deterministik, zero-floor guard'ları var, completed exam düşümü ve edge case'ler testlenmiş.

**Ürün Uyumu:** 4 — Hâlâ ürünün ana sıralama omurgası ve açıklama dili sakin. Yanlış risk etiketi üreten açık bir güncel kanıt görünmüyor.

**Geri Besleme:** 4 — Session log'ları, studied hours, prepared credit ve student constraints gerçekten sonucu etkiliyor. Daha derin reflection-learning yok, ama bu boyut boş değil.

**Test Edilebilirlik:** 5 — El hesabına yakın, deterministik ve yoğun test kapsaması var.

**Final yıldız:** ★★★★☆

**Bilinen sorunlar:**
- Session reflection ve recommendation outcome henüz risk skoruna doğrudan girmiyor.
- Task pressure ve topic progress daha çok üst katmanlarda çözülüyor; risk motoru bunları temel modelinin parçası saymıyor.

**5 yıldıza ulaşmak için gereken:**
- Reflection ve feedback loop'tan en az bir ek sinyali risk modeline kontrollü şekilde bağlamak.
- Çapraz yüzeyde risk açıklamalarının topic progress ve task pressure ile daha tam hizalanmasını doğrulamak.

**Tahmini iş:** Orta

---

## 2. Home Focus — ★★★★☆

**Dosya:** [home-focus.ts](/Users/vatan/Documents/EXAM%20ASSIST/lib/home-focus.ts)  
**Test kanıtı:** [home-focus.test.ts](/Users/vatan/Documents/EXAM%20ASSIST/tests/home-focus.test.ts)

**Doğruluk:** 4 — Top risk, today minutes, no-log override, task pressure ve accepted recommendation intent gibi davranışlar doğrudan testlerle doğrulanıyor.

**Kapsam:** 4 — Exam-first planning, nearby task pressure ve recommendation intent aynı yüzeyde birleşiyor. Yine de topic progress ve graph hareketi henüz ilk sınıf vatandaş değil.

**Güvenilirlik:** 5 — Deterministik, boş aday havuzunda null dönüyor, top-3 havuzu içinde kalıyor ve ani zıplamaları guard ediyor.

**Ürün Uyumu:** 4 — Ana ekranın “şimdi ne yapayım?” sorusuna güçlü cevap veriyor. Yakın proje sinyalini kabul ediyor ama sınav omurgasını tümüyle bırakmıyor.

**Geri Besleme:** 4 — Study session davranışı, today minutes, recent window ve recommendation feedback profili gerçekten karar değiştiriyor.

**Test Edilebilirlik:** 5 — Küçük girdilerle davranış net biçimde doğrulanabiliyor.

**Final yıldız:** ★★★★☆

**Bilinen sorunlar:**
- Topic graph ve progress katmanı burada henüz hafif sinyal seviyesinde.
- Yorgunluk, uyku modu ve yarın ders programı gibi companion sinyalleri henüz focus seçimine girmiyor.

**5 yıldıza ulaşmak için gereken:**
- Topic progress layer ile doğrudan entegrasyon.
- Tomorrow context ve wider companion signals geldiğinde focus seçiminin hâlâ sakin kalabildiğini doğrulamak.

**Tahmini iş:** Orta

---

## 3. Daily Brief — ★★★☆☆

**Dosya:** [daily-brief.ts](/Users/vatan/Documents/EXAM%20ASSIST/lib/daily-brief.ts)  
**Test kanıtı:** [daily-brief.test.ts](/Users/vatan/Documents/EXAM%20ASSIST/tests/daily-brief.test.ts)

**Doğruluk:** 4 — Yanlış ya da çelişkili text bug'ları için iyi bir test zemini var. No-log uyarısı, stuck reflection, nearby project ve duplicate topic yumuşatma gibi önemli durumlar kapsanıyor.

**Kapsam:** 3 — Brief risk, focus, resources, topics ve task signal'ları okuyabiliyor; ama topic graph hareketi, progress state ve tomorrow context henüz kompozisyonun doğal parçası değil.

**Güvenilirlik:** 5 — Deterministik, calm fallback’i var ve “planning data not ready” halinde bile kırılmıyor.

**Ürün Uyumu:** 3 — Ton artık daha kibar, ama brief hâlâ şablon tabanlı. Bu yüzden bazı durumlarda gerçekten “öğrencinin bugünkü durumu” yerine “birkaç sinyalin düzgün birleştirilmiş metni” gibi hissedebilir.

**Geri Besleme:** 3 — Session reflection ve home focus etkisi var, ama recommendation loop, topic progress ve uzun dönem öğrenme daha yüzeysel yansıyor.

**Test Edilebilirlik:** 5 — Metin çıktıları küçük senaryolarla rahat testlenebiliyor.

**Final yıldız:** ★★★☆☆

**Bilinen sorunlar:**
- Hâlâ compositional ama tam anlatısal değil.
- Topic graph ve progress layer yüzeye tam çıkmadığı için brief bazen “güzel yazılmış ama biraz genel” kalabilir.
- Tomorrow prep / sleep mode / schedule-aware companion davranışları henüz yok.

**4 yıldıza ulaşmak için gereken:**
- Topic progress ve graph movement’i brief kompozisyonuna birinci sınıf sinyal olarak bağlamak.
- Aynı anda aktif olan çoklu sinyalleri daha iyi prioritleyen ikinci nesil composition mantığı kurmak.

**Tahmini iş:** Orta

---

## 4. Study Recommendation — ★★★☆☆

**Dosya:** [study-recommendation.ts](/Users/vatan/Documents/EXAM%20ASSIST/lib/study-recommendation.ts)  
**Test kanıtı:** [study-recommendation.test.ts](/Users/vatan/Documents/EXAM%20ASSIST/tests/study-recommendation.test.ts)

**Doğruluk:** 4 — Near-exam consolidation, switch phrasing, stuck/surface narrowing ve post-session feedback davranışları testlerle doğrulanıyor.

**Kapsam:** 3 — Block minute önerisi ve temel aksiyon cümlesi iyi; ama task kind, topic progress, resource state ve tomorrow context henüz kararın ana parçası değil.

**Güvenilirlik:** 5 — Deterministik, bounded minute aralığı var ve basit girdilerle stabil çıktı üretiyor.

**Ürün Uyumu:** 4 — Kullanıcıya doğrudan “şimdi ne yap” cümlesi veriyor ve ton sakin. Fakat öneri hâlâ daha çok zaman+risk ekseninde.

**Geri Besleme:** 3 — Son reflection ve küçük recommendation adjustment var; bu iyi bir başlangıç. Ama motorun kendisi uzun dönem öğrenen bir öneri katmanı hâline henüz gelmedi.

**Test Edilebilirlik:** 5 — Kısa ve deterministic olduğu için kolay doğrulanıyor.

**Final yıldız:** ★★★☆☆

**Bilinen sorunlar:**
- Topic-first progress modeliyle tam birleşmiş değil.
- Recommendation feedback loop var ama bu motoru kökten şekillendirecek derinlikte değil.
- Assignment/project başlangıç önerileri hâlâ ayrı bir companion iş akışına dönüşmedi.

**4 yıldıza ulaşmak için gereken:**
- Topic progress state ve task pressure'ı block recommendation mantığına bağlamak.
- Recommendation feedback’i sadece dakika ayarı değil, öneri türü seçiminde de etkili yapmak.

**Tahmini iş:** Orta

---

## 5. Resource Intelligence — ★★★★☆

**Dosya:** [resource-intelligence.ts](/Users/vatan/Documents/EXAM%20ASSIST/lib/resource-intelligence.ts)  
**Test kanıtı:** [resource-intelligence.test.ts](/Users/vatan/Documents/EXAM%20ASSIST/tests/resource-intelligence.test.ts), [resource-document-binding.test.ts](/Users/vatan/Documents/EXAM%20ASSIST/tests/resource-document-binding.test.ts)

**Doğruluk:** 4 — Kind inference, task-content signal, topic coverage lift, related-topic pass, engagement freshness ve feedback-aware ranking için zengin test seti var.

**Kapsam:** 4 — Problem/conceptual/interpretive gibi study mode'lara göre öneri verebiliyor, content-derived hint'leri okuyabiliyor, resource feedback ve topic graph ilişkilerini kullanıyor. Yine de gerçek semantik içerik anlama ve topic progress state entegrasyonu henüz sınırlı.

**Güvenilirlik:** 5 — Deterministik, score rounding testleri var, aynı input aynı output veriyor.

**Ürün Uyumu:** 4 — Kaynak ekranının en işlevsel zeka katmanlarından biri. “Bu kaynak neden şimdi iyi?” sorusuna sakin ve uygulanabilir cevap üretiyor.

**Geri Besleme:** 4 — Exact-resource feedback, topic-level feedback, engagement decay ve revisit memory gerçekten puanı değiştiriyor.

**Test Edilebilirlik:** 5 — Çok sayıda küçük ve izole test senaryosu var.

**Final yıldız:** ★★★★☆

**Bilinen sorunlar:**
- Kaynağı gerçekten konu seviyesinde derin anlamıyor; hâlâ hint, fingerprint ve deterministic signal ağırlıklı.
- Topic progress layer gelmeden “hangi konu için şimdi en doğru kaynak?” sorusuna tam derinlikte cevap veremiyor.

**5 yıldıza ulaşmak için gereken:**
- Topic progress layer ile doğrudan entegrasyon.
- Kaynak içeriği ile ders konusu arasındaki bağın daha güçlü, ama hâlâ grounded bir katmanda kurulması.

**Tahmini iş:** Orta-Büyük

---

## 6. Topic Focus / Topic Graph — ★★★☆☆

**Dosya:** [topic-focus.ts](/Users/vatan/Documents/EXAM%20ASSIST/lib/topic-focus.ts)  
**Test kanıtı:** [topic-focus.test.ts](/Users/vatan/Documents/EXAM%20ASSIST/tests/topic-focus.test.ts)

**Doğruluk:** 4 — Resource co-occurrence, temporal co-occurrence, active event hints ve conservative normalization iyi testlenmiş.

**Kapsam:** 3 — Topic graph foundation güçlü, ama bu hâlâ gerçek topic progress layer değil. Prerequisite ilişkileri, long-term topic state ve richer evidence model yok.

**Güvenilirlik:** 5 — Deterministik, cross-subject/self-edge guard'ları mevcut, 3 günlük pencere net.

**Ürün Uyumu:** 3 — İç omurga olarak çok değerli ama kullanıcı yüzeylerine tam yayılmadığı için ürün değeri henüz potansiyelinin altında kalıyor.

**Geri Besleme:** 3 — Session reflection ve active event sinyali kullanıyor; fakat question performance, generated review completion, recommendation outcomes ve topic progress memory henüz yok.

**Test Edilebilirlik:** 5 — Graph davranışı net senaryolarla kolay testleniyor.

**Final yıldız:** ★★★☆☆

**Bilinen sorunlar:**
- Coverage state ile gerçek progress modeli aynı şey değil.
- Home / Inbox / Priorities bu graph’i hâlâ sınırlı kullanıyor.
- Topic-level learning memory henüz tam kurulmuş değil.

**4 yıldıza ulaşmak için gereken:**
- Topic progress layer’ı graph üstünde inşa etmek.
- Graph’i Home, Inbox, Resources ve ileride AI execution katmanına daha derin yaymak.

**Tahmini iş:** Büyük

---

## Öncelik Kararı

Bu ilk skor kartına göre bir sonraki doğrudan iyileştirme adayları:

1. [topic-focus.ts](/Users/vatan/Documents/EXAM%20ASSIST/lib/topic-focus.ts)  
   Çünkü topic progress layer için ana omurga burada ve ürün vizyonunun en büyük açık hattı bu.

2. [daily-brief.ts](/Users/vatan/Documents/EXAM%20ASSIST/lib/daily-brief.ts)  
   Çünkü kullanıcı zeka katmanını en görünür biçimde burada hissediyor.

3. [study-recommendation.ts](/Users/vatan/Documents/EXAM%20ASSIST/lib/study-recommendation.ts)  
   Çünkü “ne yapmalıyım?” cümlesi topic progress ve companion mantığıyla daha derin birleşmeli.

Bu üç motor birlikte ele alınırsa, EXAM ASSIST “zeka omurgası güçlü ama yüzeye yarım yansıyor” aşamasından çıkıp daha bütün hissedebilir.

# EXAM ASSIST Roadmap

## Roadmap framing

Bu roadmap'in ana strateji kaynağı:

- [PRODUCT_STRATEGY.md](/Users/vatan/Documents/EXAM%20ASSIST/PRODUCT_STRATEGY.md)

Bu dosyanın görevi “ne yapılabilir?” listesini büyütmek değil,
şunu net tutmaktır:

- neleri zaten inşa ettik
- şimdi neyi cilalamalıyız
- sonra neyi açmalıyız
- hangi fikirler kulağa hoş gelse de ürün kimliğini bozar

Ana ilke:

**EXAM ASSIST önce daha güvenilir, sonra daha derin, en son daha geniş olmalı.**

---

## Current position

Ürün artık fikir aşamasında değil.
Çekirdekte çalışan bir sistem var:

- gerçek PDF exam import
- aday ders seçimi
- planning runtime ve risk yüzeyleri
- Home brief ve focus önerileri
- resource intelligence
- notes katmanı
- session behavior ve reflection
- topic map
- Supabase auth, cloud state ve cloud resource storage

Bu yüzden roadmap artık “sıfırdan ne yapacağız?” değil:

**“Bu çekirdeği gerçekten güvenilir, tekrar kullanılan ve premium'a hazır bir ürüne nasıl çevireceğiz?”**

---

## North-star metrics

Roadmap kararları şu metrikleri iyileştirmelidir:

### 1. Time to first study
İlk açılıştan ilk gerçek çalışma başlangıcına kadar geçen süre.

### 2. Weekly active studying users
Haftalık olarak en az bir anlamlı seans açan kullanıcı oranı.

### 3. Resource-to-study conversion
Yüklenen bir kaynağın gerçekten çalışma akışına girme oranı.

### 4. Return before next exam cycle
Kullanıcının yalnızca sınav haftasında değil, bir sonraki sınav döngüsünden önce geri dönmesi.

---

## BUILT

Bu alan bugün ürünün gerçek çekirdeğini temsil eder.

### 1. PDF-to-study flow foundation
- sınav takvimi PDF'ten içe aktarılıyor
- aday ders listesi çıkarılıyor
- kullanıcı sadece kendine ait dersleri seçiyor

### 2. Behavior-aware study guidance
- import seçimlerinden öğrenen ranking
- dismissed feedback
- session behavior sinyalleri
- reflection loop
- subject learning profile

### 3. Resource intelligence foundation
- kaynak türü çıkarımı
- topic-style notes tanıma
- deterministic topic hints
- konu haritası
- notes layer

### 4. Cloud foundation
- Supabase auth
- profile + user state
- canonical auth entry
- cloud-backed resources via Supabase Storage

Bu alan “tamamlandı, unutuldu” anlamına gelmez.
Tam tersine:

**bundan sonraki işler bu temeli cilalamak ve büyütmek için var.**

---

## NOW POLISH

Bu alan ürünün hemen sonraki en yüksek kaldıraçlı işleri içindir.

### 1. Single-link, single-account continuity

Hedef:
- ana domain her kullanıcı için tek güvenilir giriş noktası olsun
- preview/origin karmaşası kullanıcı deneyimini bozmasın
- kayıtlı hesap, farklı hesap ve sıfır hesap akışı tertemiz olsun

Odak:
- auth hub copy ve akış netliği
- account switching
- welcome/reset edge case'leri
- cross-device continuity doğrulaması

### 2. PDF import reliability on more real fixtures

Hedef:
- parser farklı üniversite formatlarında da imza özelliği gibi çalışsın

Odak:
- daha fazla gerçek PDF fixture
- çok sayfalı tablolar
- birleşik hücreler
- tarih/saat varyasyonları
- import regression seti

### 3. Exam proximity mode shift

Hedef:
- ürün sınav yaklaştıkça hissedilir biçimde daha odaklı hale gelsin

Odak:
- 14 / 7 / 3 / 1 gün eşikleri
- Home hiyerarşisi
- brief tonu
- resource önerisi daralması
- toparlama modu

### 4. Resource continuity and study conversion polish

Hedef:
- kaynak yüklemek ile gerçekten o kaynaktan çalışmak arasındaki boşluk küçülsün

Odak:
- cross-device resource restore güvenilirliği
- upload sonrası ilk rehberlik
- ilk açılacak kaynak doğruluğu
- notes + topics + guidance bütünlüğü

### 5. Instrumentation and product truth

Hedef:
- ürün kararlarını hisle değil ölçüyle verebilmek

Odak:
- time-to-first-study ölçümü
- weekly active studying users ölçümü
- resource-to-study conversion ölçümü
- auth/onboarding drop-off görünürlüğü

---

## NEXT

Bu alan çekirdeği bozmadan ürünü belirgin şekilde güçlendirecek ikinci dalgadır.

### 1. AI resource digestion

Hedef:
- yüklenen notu gerçekten çalışılabilir formata çevirmek

İlk yüzey:
- kısa yapılandırılmış özet
- key concepts
- ders tipine uygun practice questions
- quick review flow

Kural:
- AI chat değil
- kaynak bağlı, kısa, kontrollü çıktı

### 2. Forward planning from reflections

Hedef:
- `iyi geçti / yüzeyde kaldı / takıldım` sinyali ertesi gün önerilerini gerçekten etkilesin

Odak:
- stuck pattern'leri
- surface pattern'leri
- approach shift önerileri

### 3. Grade and outcome loop

Hedef:
- sistem sadece davranışı değil sonucu da öğrenmeye başlasın

İlk sürüm:
- exam result logging
- vize/final ayrımı
- outcome correlation groundwork

### 4. Lightweight notifications

Hedef:
- ürünün faydası görünür olsun, ama intrusive olmasın

Odak:
- local notifications
- gentle reminder copy
- exam proximity destekli hatırlatma

---

## LATER

Bu alan değerlidir ama çekirdek ürün iyice oturmadan açılmamalıdır.

### 1. Full bilingual experience
- Türkçe + İngilizce
- sadece UI değil, brief ve guidance tonunun da doğal olması

### 2. University-specific academic depth
- not sistemi farkları
- üniversite bazlı grade calculation
- sınırlı ama yüksek değerli okul desteği

### 3. Premium launch
- AI study layer
- unlimited resources
- behavior analytics
- cross-semester intelligence

### 4. Distribution loops
- basit referral
- öğrenci toplulukları / üniversite partnerlikleri
- sosyal ağ değil, hafif büyüme kanalları

---

## NEVER

Şu fikirler kulağa çekici gelse de EXAM ASSIST'in kimliğini bozar:

### 1. Social stack
- grup chat
- study room
- voice
- screen sharing
- community feed

### 2. Generic AI chat
- her soruya cevap veren bot
- kaynaksız, doğrulanamaz AI konuşmaları

### 3. Productivity creep
- genel to-do sistemi
- proje yönetimi
- Notion/Todoist benzeri expansion

### 4. Loud gamification
- XP
- leaderboard
- rozet ekonomisi

### 5. Ambience features
- playlist
- built-in music
- lo-fi study environment

Roadmap filtresi:

**Bu iş kullanıcıyı daha hızlı ve daha net şekilde çalışmaya başlatıyor mu?**

Evetse değerlendirilir.
Hayırsa, şu an öncelikli değildir.

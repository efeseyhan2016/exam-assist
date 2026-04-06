# EXAM ASSIST Now Sprint

## Purpose

Bu dosya, [PRODUCT_STRATEGY.md](/Users/vatan/Documents/EXAM%20ASSIST/PRODUCT_STRATEGY.md) ve [ROADMAP.md](/Users/vatan/Documents/EXAM%20ASSIST/ROADMAP.md) içindeki yönü,
gerçekten şu anda yapılması gereken yakın dönem işe çevirir.

Bu dosya bir feature wish-list değildir.
Bu, bir sonraki güçlü ürün sıçraması için aktif sprint odağıdır.

---

## Sprint thesis

Bu sprintin ana tezi şudur:

**EXAM ASSIST'i tek linkten girilen, hesabı hatırlayan, kaynağı taşıyan ve kullanıcıyı hızla çalışmaya başlatan güvenilir bir sistem haline getirmek.**

Yani bu sprintin odağı:
- sıfırdan özellik büyütmek değil
- mevcut çekirdeği daha güvenilir ve daha tekrar kullanılabilir hale getirmek

---

## Already true

Bu sprint şunların üstüne kuruluyor:

- PDF exam import çalışıyor
- aday ders seçimi var
- behavior-aware ranking var
- Home brief ve focus yüzeyleri var
- resources tarafında guidance, notes ve topic map var
- session reflection ve subject learning profile var
- Supabase auth, cloud state ve cloud resources temeli var

Bu yüzden sprint “bunları icat etmek” için değil,
**bunları production-grade hale getirmek** için var.

---

## Intelligence overlay

Bu sprint boyunca her iş için şu soru sorulacak:

**Bu değişiklik EXAM ASSIST'i daha güvenilir ve daha doğru çalışan bir study operating system yapıyor mu?**

Doğru cevaplar:
- daha net auth ve account continuity
- daha güvenilir import
- daha doğru exam proximity davranışı
- daha iyi resource-to-study conversion
- daha görünür ürün metriği

Yanlış cevaplar:
- sadece yeni ekran eklemek
- sadece “AI” kelimesi eklemek
- sosyal ya da generic productivity yönüne kaymak

---

## 1. Single-link auth and account continuity polish

### Hedef
Ana domain tek güvenilir giriş kapısı olsun.

### Yapılacak
- auth hub davranışını netleştirmek
- kayıtlı hesap / farklı hesap / yeni hesap akışlarını sadeleştirmek
- preview/origin karmaşasının kullanıcıya yansımamasını sağlamak
- cross-device state continuity'yi gerçek hesaplarla doğrulamak

### Başarı ölçütü
- kullanıcı “hangi link doğru?” diye düşünmemeli
- aynı hesapla girince çalışma alanı geri gelmeli
- hiç hesabı yoksa giriş/kayıt akışı net görünmeli

---

## 2. PDF import regression pack

### Hedef
PDF import ürünün imza özelliği olarak güven vermeye devam etsin.

### Yapılacak
- daha fazla gerçek üniversite takvimiyle regression seti büyütmek
- merged cells, split headers, multi-page edge case'leri testlemek
- aday sıralamasında kalan kırılgan pattern'leri azaltmak
- browser-side PDF loading patikalarını stabil tutmak

### Başarı ölçütü
- manuel girişe düşme ihtiyacı daha da azalmalı
- import sonrası güven duygusu korunmalı

---

## 3. Exam proximity mode shift foundation

### Hedef
Sınav yaklaştıkça ürün daha odaklı ve daha faydalı hissettirsin.

### Yapılacak
- 14 / 7 / 3 / 1 gün eşikleri için davranış şeması çıkarmak
- Home brief copy ve hiyerarşisini buna göre daraltmak
- `ilk açılacak kaynak` mantığını sınava yakınlıkla hizalamak
- final review / toparlama modu için ilk yüzeyi tasarlamak

### Başarı ölçütü
- ürün statik dashboard gibi değil, zaman baskısına göre şekillenen sistem gibi hissettirmeli

---

## 4. Resource-to-study conversion polish

### Hedef
Kaynak yüklemekle gerçekten o kaynaktan çalışmak arasındaki mesafe kısalsın.

### Yapılacak
- upload sonrası ilk yönlendirmeyi daha netleştirmek
- notes, topic map ve first-resource önerisini daha sıkı bağlamak
- cloud-restored kaynakların Resources ekranında “hazır” hissettirmesini sağlamak
- boş resource durumlarını daha yararlı hale getirmek

### Başarı ölçütü
- kullanıcı “kaynağı yükledim ama şimdi ne yapacağım?” dememeli

---

## 5. Metrics groundwork

### Hedef
Ürünün gerçekten işe yarayıp yaramadığını ölçebilelim.

### Yapılacak
- time-to-first-study için event akışı
- weekly active studying users için temel metrik
- resource upload → first study dönüşüm metriği
- auth/onboarding drop-off noktalarını görünür kılmak

### Başarı ölçütü
- bir sonraki roadmap kararı sezgiye değil veriyle desteklenen gerçeğe dayanmalı

---

## Explicitly not in this sprint

Bu sprintte yapılmayacaklar:
- generic AI chat
- sosyal özellikler
- group study / voice / playlist
- büyük dashboard redesign
- genel task manager expansion
- advanced university grading logic

Sebep:
- bunlar şu an çekirdeği güçlendirmez, sadece scope'u büyütür

---

## Sprint success definition

Bu sprint başarılı sayılacaksa kullanıcı şu deneyimi yaşamalı:

1. tek doğru linke gider
2. hesabına net biçimde girer ya da hesap açar
3. eski çalışma alanı gerekiyorsa geri gelir
4. yeni kullanıcıysa onboarding/import akışına temiz düşer
5. kaynağını yükler
6. ürün ona nereden başlayacağını güvenilir biçimde gösterir

Kısacası:

**EXAM ASSIST sadece akıllı görünmemeli; güvenilir biçimde aynı hesabı, aynı kaynakları ve doğru çalışma başlangıcını taşıyabilmeli.**

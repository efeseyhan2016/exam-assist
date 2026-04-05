# EXAM ASSIST Now Sprint

## Purpose

Bu dosya, [PROJECT_VISION.md](/Users/vatan/Documents/EXAM%20ASSIST/PROJECT_VISION.md) ve [ROADMAP.md](/Users/vatan/Documents/EXAM%20ASSIST/ROADMAP.md) içindeki yönü, gerçekten uygulanacak yakın dönem işlere çevirir.

Bu bir hayal listesi değildir.
Bu, ürünün şu an en doğru şekilde nasıl ilerlemesi gerektiğinin çalışma planıdır.

Ana hedef:

**EXAM ASSIST'i daha büyük değil, daha net, daha güvenilir ve daha çalıştıran bir ürün haline getirmek.**

---

## Sprint thesis

Bu sprint'in ana tezi şudur:

**Kullanıcı PDF ile gelsin, kendi derslerini seçsin, dashboard'a geçsin ve uygulama onu gerçekten çalışmaya başlatsın.**

Bu yüzden sprint boyunca odak:
- onboarding
- import
- home
- kaynaklar
- çalışma başlangıcı
üzerinde kalmalı.

---

## Intelligence overlay

Bu sprintten itibaren her iş için ek bir soru sorulacak:

**Bu değişiklik EXAM ASSIST'i zamanla daha akıllı hale getiriyor mu?**

Bu sorunun doğru cevapları genelde şunlardır:
- daha iyi sinyal toplamak
- kullanıcı davranışını daha iyi anlamak
- daha doğru sıralama üretmek
- daha kişisel ama güvenilir yönlendirme vermek

Bu sorunun yanlış cevapları ise genelde şunlardır:
- sadece daha çok özellik eklemek
- AI etiketi koymak
- akıllı görünmeye çalışmak

Bu sprintte amaç "AI eklemek" değil,
**daha akıllı ürün için doğru zemini kurmak**tır.

---

## 1. Onboarding clarity pass

### Hedef
İlk kez gelen kullanıcı uygulamada kaybolmasın.

### Yapılacak
- onboarding adımlarını daha da sadeleştirmek
- gereksiz yazıları azaltmak
- ilerlemeyi daha anlaşılır göstermek
- her ekranda kullanıcıya tek net aksiyon bırakmak

### Başarı ölçütü
- kullanıcı ilk 1-2 dakika içinde sisteme girebilmeli
- "bunu nasıl kullanacağım?" hissi minimuma inmeli

### Not
Bu, tasarım şovu değil; kullanım netliği işi.

### Intelligence contribution
- onboarding hangi adımda kullanıcıların daha çok zorlandığını anlamaya zemin hazırlar
- import ve seçim davranışı gelecekte daha iyi rehberlik için sinyal üretir

---

## 2. PDF import reliability pack

### Hedef
PDF yükleme sistemi ürünün imza özelliği gibi çalışsın.

### Yapılacak
- daha fazla gerçek üniversite PDF fixture'ı toplamak
- parser regression seti kurmak
- başlık varyasyonları için test kapsamını büyütmek
- import sonrası adayların daha güvenilir görünmesini sağlamak

### Başarı ölçütü
- kullanıcıların önemli bir kısmı manuel girişe düşmeden devam edebilmeli

### Not
Bu alan teknik olarak zor ama ürün değeri en yüksek alanlardan biri.

### Intelligence contribution
- hangi PDF formatlarının kırıldığını
- kullanıcıların hangi adayları gerçekten seçtiğini
- hangi başlıkların sürekli elendiğini
anlamak için en kritik veri kaynağıdır

---

## 3. Home as action surface

### Hedef
Home ekranı "özet dashboard" değil, "bugün ne yapıyorum?" yüzeyi olsun.

### Yapılacak
- bugünün odağını daha net göstermek
- ilk çalışma bloğunu görünür hale getirmek
- gereksiz ikincil alanları azaltmak
- kullanıcının tek tıkla çalışma başlatabileceği bir akış kurmak

### Başarı ölçütü
- Home açıldığında kullanıcı ne yapacağını 5 saniye içinde anlayabilmeli

### Intelligence contribution
- Home ileride kullanıcıya göre değişen ilk çalışma bloğu yüzeyi olacak
- bu yüzden bugünden aksiyon odaklı kurulmalı

---

## 4. Resources tab -> real study surface

### Hedef
Kaynaklar sekmesi arşiv değil, çalışma alanı olsun.

### Yapılacak
- ders bazlı kaynak alanı güçlendirilsin
- yüklenen kaynaklar daha okunabilir bağlamda gösterilsin
- "buradan çalış" hissi oluşsun
- kaynak yüklemeden sonra boşluk hissi yerine yönlendirme verilsin

### İlk versiyonda istenen
- upload
- dersle bağ
- kısa özet görünümü
- önemli başlıkları ayıklamaya hazırlık

### Başarı ölçütü
- kullanıcı not yükledikten sonra "tamam ama şimdi ne olacak?" dememeli

### Intelligence contribution
- kaynakların türünü, dilini ve çalışma biçimini anlamaya başlayan ilk yer burası olacak

---

## 5. First AI study workflow

### Hedef
AI, ürünün içinde gerçek fayda üreten ilk güçlü katman olsun.

### İlk sürüm kapsamı
- kaynak özeti
- önemli kavramlar
- mini soru üretimi
- hızlı tekrar akışı

### Ne olmayacak
- genel sohbet botu
- her soruya cevap veren dağınık AI yüzeyi
- sahte "smart" gösterisi

### Başarı ölçütü
- kullanıcı kaynak yükledikten sonra uygulama içinde gerçekten çalışmaya başlayabilmeli

### Intelligence contribution
- bu katman içerik zekâsının ilk gerçek ürün yüzeyi olacak
- notlardan özet, kavram ve soru üretimi ürünün "akıllı" tarafını ilk kez somutlaştıracak

---

## 6. Lightweight note layer

### Hedef
Kullanıcı başka uygulamaya kaçmadan kısa not alabilsin.

### İlk sürüm
- hızlı metin notu
- ders bazlı not
- çalışma seansına bağlanabilen not
- pinned not

### Bilinçli olarak ertelenenler
- serbest çizim
- kalemler
- renkli sketch sistemi
- gelişmiş note editor

### Başarı ölçütü
- not alma akışı hızlı ve sürtünmesiz olmalı

### Intelligence contribution
- not alma davranışı ileride hangi konuların zorlandığını ve hangi derslerde tekrar gerektiğini anlamak için sinyal olabilir

---

## 7. Daily briefing foundation

### Hedef
Ürün sadece sınav haftasında değil, dönem içinde de açılmaya devam etsin.

### Yapılacak
- bugünün kısa briefing yüzeyi
- hangi ders yakın
- nereden başlanmalı
- küçük ama sakin rehberlik metni

### Başarı ölçütü
- uygulama "bir şeyler depoladığım yer"den çıkıp "dönüp baktığım yer" haline gelmeli

### Intelligence contribution
- briefing sistemi gelecekte kullanıcı davranışı ve ders baskısına göre kişiselleşecek
- bu yüzden ilk sürümden itibaren güvenilir ve sade kurulmalı

---

## What we are explicitly not doing in this sprint

Bu sprint'te yapılmayacaklar:
- arkadaş ekleme
- grup çalışma odaları
- sohbet
- sesli sohbet
- ekran paylaşma
- müzik / playlist sistemi
- sosyal/community yönü
- genel amaçlı productivity tool'a dönüşme

Sebep:
- çekirdek ürünü büyütmeden dağıtırlar

---

## Sprint success definition

Bu sprint başarılı sayılacaksa kullanıcı şu akışı yaşayabilmeli:

1. uygulamaya kolay girer
2. sınav takvimini yükler
3. kendi derslerini seçer
4. dashboard'a geçer
5. o gün ne yapacağını anlar
6. not veya kaynak yükler
7. uygulamanın içinde gerçekten çalışmaya başlayabilir

Kısacası:

**EXAM ASSIST kullanıcının sadece takvimini değil, çalışma başlangıcını da taşıyabilmeli.**

---

## Final rule

Bu sprint boyunca her iş için son kontrol sorusu:

**Bu iş kullanıcıyı daha hızlı ve daha net şekilde çalışmaya başlatıyor mu?**

Eğer cevap evetse, doğru yöndeyiz.
Eğer cevap hayırsa, şu anda öncelikli değildir.

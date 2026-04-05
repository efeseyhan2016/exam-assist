# EXAM ASSIST Roadmap

## Roadmap framing

Bu yol haritası, [PROJECT_VISION.md](/Users/vatan/Documents/EXAM%20ASSIST/PROJECT_VISION.md) içindeki ürün tezinin uygulanabilir öncelik sırasıdır.

Ana ilke:

**EXAM ASSIST büyümeden önce çekirdeğinde daha iyi olmalı.**

Yani:
- önce daha güvenilir
- sonra daha faydalı
- sonra daha derin
- en son daha geniş

Bu dosya özellikle şu soruya cevap verir:

**Şimdi ne yapılmalı, sonra ne yapılmalı, ne daha sonra kalmalı, ne ise şu anda yapılmamalı?**

---

## NOW

Bu alan, ürünün bugün en fazla değer üreten ve en az sapma riski taşıyan işleri kapsar.

### 1. Onboarding'i net ve hafif hale getirmek

Hedef:
- kullanıcı ilk kullanımda kaybolmasın
- ne yapacağını hemen anlasın
- ilk değer çok hızlı gelsin

Odak:
- takvim yükleme
- ders seçimi
- kısa kalibrasyon
- günlük hedef
- dashboard'a temiz geçiş

Başarı ölçütü:
- kullanıcı "nereden başlayacağımı anlamadım" dememeli

### 2. PDF exam import'u çok güvenilir hale getirmek

Hedef:
- gerçek üniversite PDF'lerinden kullanılabilir aday ders listesi çıkarmak
- sadece kullanıcıya ait dersleri seçilebilir hale getirmek

Odak:
- farklı tablo yapıları
- başlık farkları
- bölüm adı / ders adı ayrımı
- saat/tarih ayrımı
- daha çok gerçek fixture ile test

Başarı ölçütü:
- bu özellik ürünün imzası haline gelmeli

### 3. Home'u gerçekten "bugün ne yapıyorum?" ekranı yapmak

Hedef:
- Home uzun dashboard gibi değil, yön veren merkez gibi çalışsın

Odak:
- bugünün odağı
- yaklaşan sınavlar
- ilk çalışma bloğu
- kısa not / hızlı giriş
- gereksiz büyük hero alanlarını azaltmak

Başarı ölçütü:
- Home açıldığında kullanıcı hemen aksiyona geçebilmeli

### 4. Planning engine güvenilirliğini korumak ve sıkılaştırmak

Hedef:
- ürünün yönlendirmesi güvenilir hissettirsin

Odak:
- capacity
- urgency
- sleep
- planning runtime
- import edilmiş verilerin engine ile doğru bağlanması
- fake precision'dan kaçınmak

Başarı ölçütü:
- kullanıcı öneriyi "mantıklı" bulmalı

### 5. Profili çekirdeği güçlendiren bağlam katmanına dönüştürmek

Hedef:
- profil form olarak değil, karar desteği olarak değer üretsin

Odak:
- isim
- üniversite
- bölüm
- dil
- import sırasında hafif sıralama sinyalleri

Önemli kural:
- profil sert filtre olmayacak
- sadece bağlam ve sıralama sinyali olacak

### 6. Türkçe-first, dost canlısı, premium ürün tonu

Hedef:
- ürün teknik ya da soğuk değil, sakin ve yönlendirici hissettirsin

Odak:
- onboarding dili
- Home başlıkları
- import akışı
- açıklama katmanı

Başarı ölçütü:
- ürün bir model çıktısı gibi değil, rehber gibi hissettirmeli

---

## NEXT

Bu alan, çekirdeği bozmadan ürünü "planner"dan "study product"a taşıyacak ikinci dalgadır.

### 1. Kaynaklar sekmesini gerçek çalışma alanına çevirmek

Hedef:
- yüklenen notlar ve PDF'ler sadece saklanmasın
- kullanıcı bunlarla gerçekten çalışabilsin

Odak:
- ders bazlı kaynak alanı
- kaynakları derslere bağlama
- okunabilir/çalışılabilir yapı

### 2. AI destekli kaynak özetleme ve çalışma yardımı

Hedef:
- uygulama içindeki en güçlü premium farkı üretmek

İlk sürüm:
- özet çıkarma
- önemli kavramları ayıklama
- mini soru üretimi
- hızlı tekrar akışı

Önemli ilke:
- AI katmanı çekirdeği güçlendirmeli
- sahte "smart" görünmemeli

### 3. İç not defteri

Hedef:
- kullanıcı başka uygulamaya kaçmadan not tutabilsin

İlk sürüm:
- hızlı metin notu
- ders bazlı not
- seansla ilişkili not
- pinned note

Not:
- çizim/kalem/renk ikinci aşama işi

### 4. Daily briefing

Hedef:
- ürün sınav haftası dışında da açılmaya devam etsin

İçerik:
- bugün hangi ders önde
- hangi sınav yaklaşıyor
- bugünün gerçekçi çalışma başlangıcı ne

Bu özellik retention için güçlü adaydır.

### 5. Vize / final / quiz ayrımı

Hedef:
- akademik bağlamı daha doğru modellemek

İlk sürüm:
- exam type tagging
- filtreleme
- plan ekranında anlamlı bağlam

---

## LATER

Bu alan değerlidir ama çekirdek ürün iyice oturmadan yapılmamalıdır.

### 1. Sınav geçmişi ve not geçmişi

İlk versiyon:
- sınav adı
- tür
- alınan not
- tarih

Sonraki versiyon:
- etki oranları
- harf notu mantığı

### 2. Ödev / proje bağlamı

Hedef:
- ürün sınav merkezli kalırken dönem akışına biraz daha yaklaşsın

Ama dikkat:
- bu alan ürünü genel task manager'a çevirmemeli

### 3. Gelişmiş profil

Olası alanlar:
- program dili
- akademik tercihler
- uzun vadeli hedefler
- çalışma ritmi tercihleri

Ama bunlar önce çekirdeğe bağlanabiliyorsa eklenmeli.

### 4. Gelişmiş reminder sistemi

İçerik:
- yerel hatırlatıcılar
- çalışma blokları
- sınav sabahı uyarıları

### 5. Üniversiteye özel akademik mantık

Örnek:
- grading systems
- vize/final hesapları
- daha resmi bağlam

Bu değerli ama operasyonel olarak ağırdır.

---

## NEVER

Bu alan "asla olmaz" anlamına gelmez.
Ama mevcut ürün stratejisinde şu anda yapılmaması gereken şeyleri anlatır.

### 1. Sosyal-first ürün yönü

Şu an yapılmamalı:
- arkadaş ekleme
- sosyal feed
- topluluk yapısı
- sosyal etkileşim odaklı ekranlar

Sebep:
- çekirdek ürün problemini çözmez
- scope'u dağıtır

### 2. Grup sohbeti / ekran paylaşımı / sesli sohbet

Şu an yapılmamalı:
- grup odaları
- voice chat
- screen share
- collaborative study rooms

Sebep:
- teknik maliyet yüksek
- bakım yükü büyük
- çekirdek ürün avantajıyla ilgisi zayıf

### 3. Genel productivity app'e dönüşmek

Şu an yapılmamalı:
- rastgele task manager özellikleri
- not almadan bağımsız docs platformu
- her kullanıcı tipine hitap etmeye çalışma

EXAM ASSIST'in avantajı:
- öğrenci bağlamı
- sınav odaklı çalışma mantığı

Bu odak korunmalı.

### 4. Gösteriş için AI

Şu an yapılmamalı:
- boş chatbot hissi
- AI diye eklenmiş yüzeysel katmanlar
- kullanıcıya değer vermeyen "akıllı" görünüm

AI sadece gerçek çalışma değerini artırıyorsa eklenmeli.

---

## Priority rule

Bir özellik önerildiğinde şu sıraya göre düşünülmeli:

1. Güvenilirliği artırıyor mu?
2. Kullanıcının nereden başlayacağını netleştiriyor mu?
3. Kullanıcıyı gerçekten çalışmaya başlatıyor mu?
4. Dönem boyunca kullanım ihtimalini artırıyor mu?
5. Ürünün çekirdek odağını koruyor mu?

Eğer cevaplar güçlü ise iyi adaydır.

Eğer özellik:
- havalı görünüyor
- ama çekirdeği dağıtıyorsa
şimdilik yapılmamalıdır.

---

## Bugünkü en doğru ürün önceliği

Bugün en doğru stratejik yön:

**PDF'den giren öğrenci akışını kusursuzlaştırmak, Home'u yönlendirici hale getirmek ve kaynakları gerçek çalışma alanına dönüştürmek.**

Bu üçlü, EXAM ASSIST'i:
- sıradan planner olmaktan çıkarır
- dönem boyunca yaşayan ürüne yaklaştırır
- sınav haftasında çok güçlü hale getirir

---

## Final roadmap rule

EXAM ASSIST:
- önce daha güvenilir olmalı
- sonra daha faydalı olmalı
- sonra daha akıllı olmalı
- en son daha geniş olmalı

Doğru büyüme sırası budur.

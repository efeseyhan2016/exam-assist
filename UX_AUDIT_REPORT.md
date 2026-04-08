# EXAM ASSIST — Kullanıcı Gözüyle UX Denetim Raporu

Bu rapor EXAM ASSIST'in mevcut canlı halini (exam-assist.vercel.app) bir kullanıcı gözüyle değerlendirir. Product Strategy dokümanındaki vizyon ile bugünkü gerçeklik arasındaki mesafeyi ölçer, güçlü noktaları korur, zayıf noktaları isimlendirir.

Bu bir övgü belgesi değildir. Bu bir UX denetimdir.

---

## 1. İlk Açılış: 0–5 Saniye

Kullanıcı siteyi açtığında karanlık bir ekranda "EXAM ASSIST" yazısı ve üç tane yanıp sönen nokta görüyor. Bu bir loading shell — client-side JS yüklenene kadar görünen şey bu.

**İyi olan:** Temiz, minimal, premium hissi veriyor. Marka ismini hemen gösteriyor.

**Sorunlu olan:** Loading süresi kullanıcının internet hızına bağlı. Yavaş bir bağlantıda bu ekran 3–5 saniye kalabilir ve bu sürede kullanıcıya hiçbir bilgi verilmiyor. Ürünün ne olduğu, ne yapacağı, neden beklediği belli değil. İlk kez gelen biri "bu site bozuk mu?" diye düşünebilir.

**Strateji dokümanıyla mesafe:** Strateji "3 dakikada PDF'ten çalışmaya" diyor. Ama ilk 5 saniyede kullanıcı henüz ürünün ne olduğunu bile bilmiyor. Landing/splash anında bir satırlık value prop eksik.

---

## 2. Auth Ekranı

Kullanıcı ya giriş yapıyor ya kaydoluyor. İsim, e-posta, şifre veya PIN seçenekleri var.

**İyi olan:** PIN ile local auth seçeneği akıllı — öğrenci hızlı girmek ister. Cloud sync opsiyonel olması doğru karar.

**Sorunlu olan:** Auth ekranı kullanıcıya ürünün ne yaptığını hiç anlatmıyor. "Sınav haftanda neye odaklanman gerektiğini gösteren kişisel çalışma alanın" meta description'da var ama ekranda yok. Kullanıcı kaydolurken motivasyonu sıfır — neden bu uygulamaya güvenmeli? Neden verilerini vermeli?

**Öneri:** Auth ekranının yanına veya üstüne 1–2 cümlelik value prop + belki bir visual hint eklenebilir. "Sınav programını yükle, neye odaklanman gerektiğini gör." Bu tek cümle bile dönüşümü artırır.

---

## 3. Onboarding: 4 Adım

Bu, ürünün en kritik anı. İlk 3 dakika burada geçiyor.

### Adım 1: İsim Doğrulama
Kısa, hızlı, sorunsuz. "İsmini doğrula, sonra doğrudan sınavlarını içe aktar." doğru ton.

### Adım 2: Sınav Programı İçe Aktarma (PDF)
Bu adım ürünün imza anı — strateji dokümanının "PDF-to-study-plan in 90 seconds" dediği şey.

**İyi olan:** PDF yükleme, otomatik sınav çıkarma, aday seçimi, filtreleme/sıralama. Teknik altyapı orada. Bu gerçekten diğer ürünlerin yapmadığı bir şey.

**Sorunlu olan:**
- Kullanıcı "hangi PDF'i yükleyeyim?" sorusuna net bir cevap alamıyor. Üniversitenin sınav takvimi mi? Kendi not aldığı dosya mı? Ekranda örnek bir screenshot veya "Üniversitenin sınav programı PDF'ini sürükle" gibi net bir yönlendirme yok.
- PDF parse başarısız olursa hata mesajları teknik: "PDF şifreli görünüyor", "Bu dosya okunabilir bir PDF gibi görünmüyor." Bunlar doğru ama soğuk. "Bu PDF'i okuyamadık. Farklı bir format deneyebilir misin?" daha insani olur.
- PDF'siz alternatif yol belirsiz. Her öğrencinin elinde düzgün bir PDF yok. Manuel ekleme seçeneği onboarding içinde yeterince görünür değil.

### Adım 3: Kalibrasyon
Her ders için 3 soru: zorluk, kaynak hazırlığı, hazırlık durumu. "orta / zor / kolay" gibi seçenekler.

**İyi olan:** Hızlı, 3 soru yeterli, gereksiz derinliğe girmiyor. Animasyonlar güzel.

**Sorunlu olan:** Bu adımın neden önemli olduğu kullanıcıya anlatılmıyor. "Bu cevaplar öncelik sıranı belirleyecek" gibi bir açıklama varsa da yeterince belirgin değil. Kullanıcı rastgele tıklayabilir — bu da modelin başlangıç kalitesini düşürür.

### Adım 4: Günlük Hedef
Çalışma hedefi seçimi. "Hemen değişebilir" notu güzel — baskı hissettirmiyor.

**Genel onboarding değerlendirmesi:** Yapısal olarak sağlam. Ama duygusal olarak zayıf. Kullanıcı 4 adımı bitirdiğinde "tamam, bilgilerimi girdim" hissediyor — ama "vay, bu uygulama beni anlıyor" hissetmiyor. Onboarding'in son adımında veya dashboard'a geçişte bir "tebrikler + ilk öneriniz" anı eksik.

---

## 4. Dashboard: Ana Kabuk

Sidebar + içerik alanı. Masaüstünde sidebar sabit, mobilde compact nav.

### Sidebar

**İyi olan:**
- "EXAM ASSIST" logosu + mavi nokta: premium, tutarlı marka hissi.
- Çalışma serisi (streak): motivasyonel ama abartılı değil. Amber renk, ateş ikonu — doğru dozda.
- "Günaydın, Efe" gibi kişiselleştirilmiş selamlama: sıcak, premium.
- "Anlık durum" kutusu: sıradaki sınav, bugün çalışılan, öncelikli ders — tek bakışta üç kritik bilgi. Bu çok güçlü.
- Keyboard shortcuts (Cmd+1..6): power user dostu.

**Sorunlu olan:**
- 6 navigasyon öğesi var: Ana Ekran, Öncelikler, Seanslar, Takvim, Kaynaklar, Profil. Bu sayı şu an uygun ama sınırda. Bir tane daha eklenirse kalabalık hissettirir.
- "Hesabı sıfırla" butonu sidebar'ın altında, "Çıkış Yap"ın hemen yanında. Bu tehlikeli bir yerleşim — yanlışlıkla sıfırlama riski var. En azından bir onay diyalogu olmalı (varsa bile, butonların bu kadar yakın olması UX açısından riskli).
- Mobilde compact nav iki sütun grid. 6 öğe = 3 satır. Bu biraz fazla yer kaplıyor. Tab bar formatı daha iyi olabilir.

---

## 5. Ana Ekran (Home)

Bu, kullanıcının her gün gördüğü ilk ekran. Ürünün "günlük döngü" vaat ettiği yer burası.

### Sıradaki Sınav Hero Kartı
Gradient arka plan, radial glow, büyük başlık, geri sayım (gün/saat/dakika/saniye).

**İyi olan:** Görsel olarak etkileyici. Sınavın ismini ve tarihini hemen gösteriyor. Geri sayım gerçek bir duygusal baskı hissi yaratıyor — ama panik değil, farkındalık seviyesinde. "Bu tarihi yakın tut. Haftanın temposunu belirleyen ilk sınav bu." kopyası mükemmel.

**Sorunlu olan:** Saniye sayacı gerekli mi? Gerçek bir işlevi yok, ama sürekli hareket eden bir element olarak dikkat dağıtabilir. Gün ve saat yeterli olabilir.

### Yaklaşan Sınavlar Dock'u
Carousel formatında, tab'larla geçiş, < 48 saat kaldığında rose glow animasyonu.

**İyi olan:** Carousel yapısı birden fazla sınavı yönetilebilir kılıyor. Acil durum vurgusu (rose glow) doğru seviyede — alarm değil ama fark ettiriyor.

**Sorunlu olan:** Carousel UX'i her zaman risklidir. Kullanıcı 2. veya 3. sınavı görmezden gelebilir çünkü kaydırma gerektiriyor. Eğer 3'ten az sınav varsa carousel yerine yan yana kart daha iyi olabilir.

### Haftalık Takvim
7 günlük compact strip, seçili günün detayları, sınav/deadline ikonları.

**İyi olan:** Haftalık görünüm günlük planlama için yeterli. "Takvime git" linki daha derin erişim sağlıyor.

**Sorunlu olan:** 7 günlük strip mobilde çok küçük olabilir. Günlerin üstündeki sınav/deadline ikonları yeterince belirgin mi? Bu alan biraz daha test istiyor.

### "Bugün Yap" Bölümü
Sol: seans formu. Sağ: çalışma hedefi + planlama odağı.

**İyi olan:** Bu bölüm strateji dokümanındaki "günlük döngü"nün tam karşılığı. Seans ekleme formu hızlı erişimde. Quick duration butonları (30m, 45m, 60m, 90m) akıllı. Reflection seçenekleri ("İyi geçti / Yüzeyde kaldı / Takıldım") basit ve güçlü.

**Sorunlu olan:**
- Form biraz kalabalık. Ders seçimi, süre, konu, reflection, notlar — hepsi aynı anda görünüyor. Opsiyonel alanlar (konu, notlar) collapse edilebilir.
- "Seansı Kaydet" butonundan sonra ne oluyor? Kullanıcıya "kaydedildi" geri bildirimi yeterince belirgin mi? Öncelik sıralamasının güncellendiği görsel olarak hissettiriliyor mu?

### Planlama Odağı Kartı
En riskli ders, açıklama, durum badge'i, kalan çalışma, müsait süre.

**İyi olan:** Bu kart ürünün zekasını en görünür şekilde sergileyen yer. "Durum: Öne al" gibi etiketler net. Kalan çalışma vs müsait süre karşılaştırması gerçekten faydalı.

**Sorunlu olan:** "Kalan çalışma: 12 saat" ve "Müsait süre: 8 saat" gibi rakamlar nasıl hesaplanıyor? Kullanıcı buna güvenebilir mi? Strateji dokümanı "trustworthy logic over fake precision" diyor — ama bu rakamlar kesin görünüyor. Eğer model güvenilir değilse, bu kartın güvenilirliği de düşer.

---

## 6. Öncelikler Ekranı

Risk sıralamasına göre dersler: birinci öncelik (lead card), sıradakiler (2-4), bekleme sırası.

**İyi olan:**
- Hiyerarşi çok net: bir tane "en önemli" ders, sonra 3 takip, sonra geri kalan. Kullanıcı kararsızlık yaşamaz.
- Risk etiketleri ("Öne al", "Yakın takip", "Gündemde tut", "Stabil") Türkçe, net, jargonsuz.
- Lead card'daki metrik grid (durum, kalan çalışma, müsait süre) karar vermeye yardımcı.

**Sorunlu olan:**
- Bu ekranın Home'daki planlama odağı kartıyla ilişkisi ne? Aynı bilgiyi iki yerde göstermek kafa karıştırabilir. Home'daki kart özet, buradaki detay — ama bu fark kullanıcıya anlatılmıyor.
- Bekleme sırası kartının "Henüz baskısı düşük dersler" açıklaması güzel ama kullanıcı bunları tamamen görmezden gelebilir. Bir reminder mekanizması yok.

---

## 7. Seanslar Ekranı

Çalışma seansı ekleme formu + geçmiş seanslar listesi + streak kartı.

**İyi olan:**
- Home'daki formla aynı form burada da var — tutarlılık.
- Seans geçmişi son 20 seans, en yeni en üstte. Konu, süre, reflection, tarih hepsi görünüyor.
- Streak kartı motivasyonel ama basit: "{streak} gün üst üste çalıştın." Yeterli.

**Sorunlu olan:**
- Aynı seans formu iki yerde (Home + Seanslar). Kullanıcı hangisini kullanmalı? Bu bir convenience feature mi yoksa navigasyon kararsızlığı mı?
- Seans geçmişinde analitik yok. Haftalık toplam, ders bazlı dağılım, trend gibi görselleştirmeler eksik. Kullanıcı sadece listeye bakıyor — ama "bu hafta geçen haftadan daha az mı çalıştım?" sorusuna cevap yok.
- Silme butonu hover'da görünüyor (rose-400). Mobilde hover yok — silme erişimi sorunlu olabilir.

---

## 8. Takvim Ekranı

Manuel tarih ekleme formu + import + zaman çizelgesi + sınav carousel'i.

**İyi olan:**
- .ics export özelliği akıllı — öğrenci Google Calendar'a aktarabilir.
- Manuel ekleme formu basit: başlık, tarih, tür (sınav/deadline), notlar.
- CSV/Excel/ICS import desteği.

**Sorunlu olan:**
- Bu ekran ile onboarding'deki PDF import arasındaki ilişki belirsiz. Kullanıcı yeni bir sınav eklemek istediğinde buraya mı gelmeli, yoksa tekrar PDF mı yüklemeli?
- Zaman çizelgesi sadece liste formatında. Görsel takvim (ay/hafta grid) yok. "Takvim" adlı bir ekranda takvim görünümü beklenir.
- Carousel burada da var (Yaklaşan Sınavlar ile aynı). Home, Takvim ve belki Öncelikler'de aynı carousel'in tekrarı bilgi tekrarı yaratıyor.

---

## 9. Kaynaklar Ekranı

Ders bazlı kaynak kütüphanesi. Subject tab'ları, PDF yükleme, notlar.

**İyi olan:**
- Ders bazlı tab yapısı mantıklı. Her dersin kendi alanı var.
- Risk badge'leri tab'larda görünüyor — öncelik bilgisi her yerde tutarlı.
- Not sistemi (yeni eklenen): subject-bound notlar, pin desteği, Cmd+Enter ile hızlı kaydetme.

**Sorunlu olan:**
- PDF yükledikten sonra ne oluyor? Kullanıcı PDF'in analiz edildiğini, konu haritası çıkarıldığını, çalışma rehberi oluşturulduğunu görüyor mu? Yoksa sadece bir dosya listesi mi? Strateji dokümanındaki "AI resource digestion" henüz yok — ama mevcut haliyle bile kullanıcıya "bu PDF'i yüklemen bir şeyleri değiştirdi" hissi verilmeli.
- Boş durum mesajı: "Kütüphaneyi kullanmak için önce onboarding'de en az bir ders ekle." Bu doğru ama soğuk. "Henüz bir kütüphane kurulmadı" + onboarding'e yönlendirme butonu daha iyi olur.

---

## 10. Profil Ekranı

İsim, dil, üniversite, bölüm, sınıf, bilinen diller.

**İyi olan:**
- Üniversite ve bölüm autocomplete listesi: Türk üniversiteleri önceden yüklü.
- Dil seçimi (Türkçe/English): gelecek için zemin hazırlıyor.

**Sorunlu olan:**
- Bu ekran şu an çok basit. Sorun değil — ama gelecekte burada ne olacağı belli olmalı. "Çalışma profilini güncel tut" açıklaması doğru ama kullanıcı "bunu güncel tutmam neden önemli?" sorusuna cevap alamıyor.

---

## 11. Genel Görsel Dil Değerlendirmesi

### Güçlü Yönler
- Glassmorphism tutarlı ve premium hissettiriyor. Frosted glass kartlar, subtle border'lar, backdrop blur — hepsi uyumlu.
- Renk paleti disiplinli: sky-300/400 (ana), emerald (başarı), rose (uyarı), amber (streak). Fazla renk yok.
- Typography hiyerarşisi net: eyebrow → heading → description pattern'i her ekranda aynı.
- Animasyonlar ölçülü: slideUp + fadeIn, abartılı değil.
- Dark theme öğrenci kullanıcı için doğru tercih (gece çalışma).

### Zayıf Yönler
- Kartların border-radius'u 28px — bu çok yuvarlak. Premium hissi veriyor ama bazı yerlerde "balon" etkisi yaratıyor. 20px daha dengeli olabilir.
- Glassmorphism her kartta aynı seviyede. Hiyerarşik derinlik farkı yok — lead card ile secondary card arasında görsel ağırlık farkı daha belirgin olabilir.
- Metin kontrastı: slate-300/400 üzerine white/[0.045] arka plan — küçük fontlarda okunabilirlik sınırda olabilir. Özellikle description metinlerinde.

---

## 12. Strateji Dokümanı vs Mevcut Durum: Boşluk Analizi

| Strateji Vaadi | Mevcut Durum | Boşluk Seviyesi |
|---|---|---|
| "3 dakikada PDF'ten çalışmaya" | PDF import var, çalışıyor | Düşük — polish gerekiyor |
| Günlük döngü (2-3 dk) | Home screen + seans formu var | Orta — briefing eksik |
| Haftalık döngü (5-10 dk) | Kısmi — resource coverage yok | Yüksek |
| Sınav haftası modu | Proximity logic kısmen var | Yüksek — ton değişimi yok |
| AI resource digestion | Yok | Çok yüksek — premium katman |
| Session reflection → forward planning | Reflection var, forward planning yok | Yüksek |
| Learning profile kartları | Study mode var, kullanıcıya görünmüyor | Orta |
| Davranış analitiği | Veri toplanıyor, gösterilmiyor | Yüksek |
| Daily briefing | Planlama odağı kartı var, briefing formatında değil | Orta |
| Streak | Var, çalışıyor | Düşük |
| Not sistemi | Yeni eklendi, çalışıyor | Düşük |

---

## 13. En Kritik 5 İyileştirme (Öncelik Sırasıyla)

### 1. Daily Briefing'i Gerçek Bir Briefing Yapmak
Home ekranında "Planlama Odağı" kartı var ama bu bir briefing değil, bir veri kartı. Strateji dokümanındaki vizyon şu: "Bugün MAN201 için 45 dakika ayır, sonra MAN411'e geç." Mevcut kart bunu söylemiyor — sadece "en riskli ders" ve metrikleri gösteriyor. Bir cümlelik doğal dilde öneri, kartın üstüne eklenebilir.

### 2. Onboarding Bitişinde "İlk Öneri" Anı
Kullanıcı 4 adımı bitirdiğinde dashboard'a düşüyor ama "şimdi ne yapmalıyım?" sorusu cevapsız kalıyor. Onboarding bitişinde veya dashboard'un ilk açılışında bir welcome state: "İlk önerimiz: [ders adı] ile başla, 30 dakika yeterli." Bu tek cümle, ürünün zekasını ilk anda kanıtlar.

### 3. Seans Sonrası Geri Bildirim Döngüsü
Kullanıcı seans kaydedip reflection seçtiğinde ne oluyor? Şu an: form sıfırlanıyor, geçmişe ekleniyor. Eksik olan: "Bu seans öncelik sıranı güncelledi. MAN201 artık 2. sıraya düştü." Bir mikro-feedback, kullanıcıya "eylemlerimin karşılığı var" hissini verir.

### 4. Takvim Ekranına Görsel Takvim
"Takvim" adlı ekranda takvim görünümü yok — sadece liste. En azından basit bir ay grid'i (sınavlar ve deadline'lar işaretli) kullanıcının zamansal farkındalığını artırır.

### 5. Kaynak Yükleme Sonrası Değer Gösterimi
PDF yüklendiğinde kullanıcıya ne değiştiğini göstermek gerekiyor. En azından: "Bu kaynaktan 12 konu tespit edildi" veya "Bu ders için kapsam %40'a yükseldi." AI olmadan bile, deterministik bilgi bile değer hissi yaratır.

---

## 14. Korunması Gereken En Güçlü 5 Şey

1. **Sıradaki Sınav hero kartı.** Duygusal çapa doğru çalışıyor. Geri sayım + kopya ("Bu tarihi yakın tut") doğru ton.

2. **Risk sıralaması sistemi.** "Öne al / Yakın takip / Gündemde tut / Stabil" — bu etiketler Türkçe, net, jargonsuz. Değiştirmeyin.

3. **Sidebar'daki "Anlık durum" kutusu.** Üç satırda üç kritik bilgi. Bu, uygulamanın en verimli bilgi yoğunluğu noktası.

4. **Seans reflection seçenekleri.** "İyi geçti / Yüzeyde kaldı / Takıldım" — basit, 3 saniye, güçlü sinyal. Bunu karmaşıklaştırmayın.

5. **Glassmorphism görsel dili.** Tutarlı, premium, sakin. Kartlar, border'lar, blur — hepsi uyumlu. Bu görsel dil ürünün kimliği haline gelmiş.

---

## 15. Sonuç

EXAM ASSIST'in mevcut hali, stratejide anlatılan ürünün yaklaşık %40-50'si. Ama bu %40-50, doğru %40-50. Temel yapı sağlam: onboarding akışı, sidebar navigasyonu, risk sıralaması, seans kaydı, streak, sınav geri sayımı — bunların hepsi çalışıyor ve doğru yerde.

Eksik olan, ürünün "akıllı hissettiren" katmanı. Mevcut halde EXAM ASSIST bir dashboard — bilgiyi gösteriyor. Strateji dokümanındaki vizyon ise bir operating system — ne yapılacağını söylüyor. Bu fark, "bilgi gösterimi"nden "eylem önerisi"ne geçişle kapanır.

En kısa yol: daily briefing'i gerçek bir cümleye dönüştürmek. "MAN201'e bugün 45 dakika ayır" — bu tek cümle, EXAM ASSIST'i dashboard'dan operating system'e taşıyan ilk adım.

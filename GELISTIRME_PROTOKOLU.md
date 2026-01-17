# 📜 Geliştirme Protokolü ve Proje Anayasası

> **"Kod, sadece bilgisayarlar için değil, insanlar (ve gelecekteki ben) için yazılır."**

Bu belge, **SrhtOcl** projesinin teknik standartlarını, mimari kararlarını ve çalışma kültürünü tanımlayan, değişmez referans noktasıdır. Yeni bir güne başladığında veya kaybolduğunu hissettiğinde pusulan burasıdır.

---

## 1. 🏗️ Mimari Felsefe

Projemiz **"Separation of Concerns" (İlgi Alanlarının Ayrımı)** ilkesine sıkı sıkıya bağlıdır.

### Katmanlar

1. **UI (Görünüm):** `src/pages` ve `src/components`.
    * **Kural:** "Aptal" olmalılar. Verinin nereden geldiğini bilmezler. Sadece `hook`tan gelen veriyi gösterirler. İçlerinde karmaşık `useEffect` veya `fetch` zincirleri BULUNAMAZ.
2. **Logic (Mantık):** `src/hooks`.
    * **Kural:** UI'ın "Beyni"dir. State yönetimi, veri çekme tetiklemeleri buradadır.
3. **Service (Servis):** `src/services`.
    * **Kural:** Dış dünya (Firebase, API) ile konuşan elçidir. UI veya Hook bilmez, sadece saf veri (JSON/Object) döndürür.

---

## 2. 📝 Kodlama Standartları (Context Protocol)

En büyük düşmanımız **bağlam kaybıdır**. Bunu önlemek için her dosya "ben kimim ve ne yaparım" sorusuna cevap vermelidir.

### Dosya Başlığı (Zorunlu)

Her kod dosyasının (`.jsx`, `.js`) en tepesinde şu JSDoc bloğu **Türkçe** olarak bulunmak zorundadır:

```javascript
/**
 * @file [Dosya Adı]
 * @description [Dosyanın amacı, ne yaptığı ve proje içindeki rolü.]
 * @date [Oluşturma/Son Düzenleme Tarihi]
 * @author [Yazar]
 * 
 * @dependencies
 * - [Kritik bağımlılıklar, örn: useProfile hook]
 * 
 * @notes
 * - [Gelecekteki geliştiriciye (kendine) notlar, uyarılar]
 */
```

### Yorum Satırları

* **Fonksiyonlar:** Karmaşık her fonksiyonun üzerinde ne aldığı (`@param`) ve ne döndüğü (`@returns`) yazılmalıdır.
* **İç Yorumlar:** "Nasıl" yaptığını değil, **"Neden"** yaptığını açıkla. Kod zaten "nasıl"ı gösterir.

---

## 3. 📂 Dizin Yapısı ve İsimlendirme

* `src/pages/`: Rota (URL) karşılığı olan ana sayfalar. (Örn: `gallery.jsx`)
* `src/components/`: Tekrar kullanılabilir parçalar. (Örn: `post-images.jsx`)
* `src/hooks/`: `use` ile başlayan mantık dosyaları. (Örn: `useGallery.js`)
* **İsimlendirme:**
  * Dosyalar: `kebab-case` (küçük harf, tireli). Örn: `edit-profile.jsx`
  * Bileşenler: `PascalCase`. Örn: `const EditProfile = ...`

---

## 4. 🔄 Çalışma Döngüsü (Workflow)

Yeni bir güne başlarken veya bir göreve dönerken:

1. **Konumu Belirle:** `MONITOR.md` dosyasını aç ve "Büyük Resim"e bak.
2. **Detaylandır:** `task.md` dosyasındaki tikleri kontrol et.
3. **Bağlamı Yükle:** Çalışacağın dosyanın başındaki `@description` bloğunu oku.
4. **Uygula:** Kodunu yaz.

---

## 6. 📊 Monitör Protokolü (Büyük Resim)

Kodun içinde kaybolmamak ve "kör" hissetmemek için, projenin **üst düzey** durumunu özetleyen bir dashboard dosyamız vardır: **`MONITOR.md`**.

* **Amaç:** Koda bakmadan projenin sağlığını, mimarisini ve ilerleyişini anlamak.
* **İçerik:** Modül Durumları, Mimari Özet, Kritik Değişiklikler.
* **Güncelleme Kuralı:** Her büyük refaktör veya özellik eklemesinden sonra güncellenir.

---

**Son Güncelleme:** 17 Ocak 2026
**Durum:** Yürürlükte ✅

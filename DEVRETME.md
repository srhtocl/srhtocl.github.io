# 📘 Proje Teknik El Kitabı (src: srhtocl)

Bu belge, projenin mevcut teknik yapısını, kritik dosyalarını ve nasıl çalıştığını özetler.

## 🏗️ Mimari Yapı

Proje **Serverless (Sunucusuz)** mimari üzerine kuruludur.

- **Frontend:** React + Vite (GitHub Pages üzerinde barınır).
- **Backend:** Firebase Cloud Functions (Google Cloud üzerinde çalışır).
- **Veritabanı:** Firebase Firestore (NoSQL).
- **Bildirimler:** Firebase Cloud Messaging (FCM).

---

## 🔑 Kritik Dosyalar ve Görevleri

### 1. Frontend (Arayüz)

* **`src/pages/message.jsx` (Ziyaretçi Ekranı):**
  - Anonim kullanıcıya çerezle (`Cookies`) otomatik ID (`19ba4...`) atar.
  - Mesajları listeler ve yeni mesaj gönderir (`setDocument`).
  - **Önemli:** Açılışta kullanıcının Token'ını alıp veritabanına kaydeder (`requestForToken`).
- **`src/pages/response.jsx` (Admin Ekranı):**
  - Sadece Admin giriş yapmışsa açılır.
  - Admin'in telefonunu `admin_device` sabit ID'si ile kaydeder.
  - Ziyaretçiye cevap yazar (`user: admin` etiketiyle).
- **`src/services/notification.js`:**
  - Bildirim izinlerini ister.
  - FCM Token'ı alır ve Firestore'a (`tokens/userId`) yazar.
  - **VAPID Key** (Public Key) burada tanımlıdır.
- **`public/firebase-messaging-sw.js`:**
  - **Gizli Kahraman.** Site kapalıyken arka planda çalışır.
  - Google'dan gelen sinyali yakalayıp telefonun bildirim çubuğuna basar.

### 2. Backend (Arka Plan - `functions/`)

* **`functions/index.js`:**
  - Sürekli `srhtocl` veritabanını izler (`onUpdate`).
  - Yeni mesaj geldiğinde kimin yazdığına bakar:
    - **Admin yazdıysa:** Mesajın sahibi olan ziyaretçinin Token'ını bulur ve ona bildirim atar.
    - **Ziyaretçi yazdıysa:** `admin_device` Token'ını bulur ve Admine bildirim atar.
  - *Not: Mesaj içeriği `data` alanından okunur.*

---

## 🛠️ Nasıl Güncellenir? (Deploy) (ALTIN KOMUTLAR)

**1. Sitenin Görüntüsünü (Frontend) Güncellemek İçin:**

```cmd
npm run build
npm run deploy
```

*(Bu komut GitHub Pages'teki siteyi yeniler)*

**2. Arka Plan Kodunu (Backend) Güncellemek İçin:**

```cmd
firebase deploy --only functions
```

*(Bu komut Google sunucusundaki "Nöbetçi" kodu yeniler)*

---

## ⚠️ Bilinen Sınırlar ve İpuçları

1. **Tek Admin Cihazı:** Admin paneline en son hangi cihazdan girilirse bildirimler ORAYA gider. Önceki cihazlar bildirim almayı durdurur.
2. **Veritabanı Kuralları:** `tokens` koleksiyonuna yazma izni açık olmalıdır. (Firebase Console -> Rules).
3. **Çift Tıklama Koruması:** Butonlarda `sending` kilidi vardır, işlem bitmeden tekrar basılamaz.

---

## 🚀 Sırada Ne Olabilir?

- **Resim Yükleme (Image Upload):** Firebase Storage kullanılarak yapılabilir.
- **Admin Çoklu Cihaz:** `admin_device` yerine `admin_tokens` dizisi kullanılarak yapılabilir.

*İyi kodlamalar!* 💻

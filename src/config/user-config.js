/**
 * @file user-config.js
 * @description Uygulama genelinde kullanılan statik konfigürasyon.
 * Profil bilgileri ve içerik verisi için kaynak Firestore'dur — bu dosyada tutulmaz.
 */
export const userConfig = {
    // Admin Firebase UID — UI seviyesinde admin menüsünü göster/gizle için kullanılır.
    // Asıl yetki kontrolü Firestore Security Rules'da (sunucu tarafında) yapılmaktadır.
    adminUID: import.meta.env.VITE_ADMIN_UID,
};

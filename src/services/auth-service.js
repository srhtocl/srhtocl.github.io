/**
 * @file auth-service.js
 * @description Firebase Authentication işlemleri için servis katmanı.
 * UI ve Context'ten bağımsız olarak sadece auth işlemleriyle ilgilenir.
 * 
 * @date 2026-01-18
 * @author [AI Assistant]
 */

import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';

/**
 * Kullanıcı oturum durumundaki değişiklikleri dinler.
 * 
 * @param {Function} callback - Kullanıcı durumu değiştiğinde çalışacak fonksiyon (user) => void
 * @returns {Function} Unsubscribe fonksiyonu
 */
export const subscribeToAuthChanges = (callback) => {
    return onAuthStateChanged(auth, callback);
};

/**
 * Kullanıcının oturumunu kapatır.
 * 
 * @returns {Promise<void>}
 */
export const logoutUser = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Servis Hatası (Logout):", error);
        throw error;
    }
};

/**
 * Mevcut kullanıcıyı döndürür.
 * @returns {Object|null} Firebase User objesi
 */
export const getCurrentUser = () => {
    return auth.currentUser;
};

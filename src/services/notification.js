import { messaging, db } from "./firebase";
import { getToken } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";

export const requestForToken = async (userId) => {
    if (!('Notification' in window)) {
        console.log("This browser does not support desktop notification");
        return null;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const token = await getToken(messaging, {
                vapidKey: "BBhWNZ1gSMzdcK2Tr4OhE2wu6m9YtlHVoZ72xsxHFVmDRQEOheC_nXvBKIhPEsW1UHZ2FL9j5GNr57g8VTrgNqw"
            });

            if (token) {
                console.log('FCM Token Alındı:', token);
                await saveTokenToDatabase(userId, token);
                return token;
            }
        }
    } catch (err) {
        console.log('Token alma hatası:', err);
    }
    return null;
};

import { getDocumentsByUsername, insertDocument } from "./db-methods";

const saveTokenToDatabase = async (userId, token) => {
    if (!userId) return;
    try {
        if (userId === 'admin_device') {
            // Admin token goes to 'admin' collection
            const tokenRef = doc(db, "admin", "notifications");
            await setDoc(tokenRef, { token: token, updatedAt: new Date() }, { merge: true });
        } else {
            // Visitor token: We must find the ACTUAL document ID first
            const response = await getDocumentsByUsername(userId);

            if (response.success && response.data) {
                // Document exists -> Update it
                const docId = response.data.id;
                const userChatRef = doc(db, "chats", docId);
                await setDoc(userChatRef, { fcmToken: token, tokenUpdatedAt: new Date() }, { merge: true });
            } else {
                // CAUTION: Document does NOT exist (e.g. fresh user who hasn't sent a message yet but granted permission)
                // We must create the document properly so useChat can find it later.
                // It must have the 'user' field matched to the cookie ID.
                console.log("Kullanıcı dökümanı yok, yeni oluşturuluyor...", userId);
                await insertDocument({
                    user: userId,
                    messages: [],
                    fcmToken: token,
                    tokenUpdatedAt: new Date()
                });
            }
        }
    } catch (error) {
        console.error("Token kaydetme hatası:", error);
    }
}

export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        return false;
    }
    // Basic request without saving token (legacy/fallback)
    const permission = await Notification.requestPermission();
    return permission === 'granted';
};

export const sendNotification = async (title, body) => {
    if (!('Notification' in window) || Notification.permission !== "granted") return;

    try {
        // Try Service Worker first (Required for Android/PWA)
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            if (registration && 'showNotification' in registration) {
                await registration.showNotification(title, {
                    body,
                    icon: "/favicon.ico"
                });
                return;
            }
        }

        // Fallback for Desktop/Standard
        new Notification(title, {
            body,
            icon: "/favicon.ico",
        });

    } catch (error) {
        console.warn("Bildirim hatası (Önemsiz):", error);
    }
};

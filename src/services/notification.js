import { messaging, db } from "./firebase";
import { getToken } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";

export const requestForToken = async (userId) => {
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

const saveTokenToDatabase = async (userId, token) => {
    if (!userId) return;
    try {
        const tokenRef = doc(db, "tokens", userId);
        await setDoc(tokenRef, { token: token, updatedAt: new Date() }, { merge: true });
    } catch (error) {
        console.error("Token kaydetme hatası:", error);
    }
}

export const requestNotificationPermission = async () => {
    // Basic request without saving token (legacy/fallback)
    const permission = await Notification.requestPermission();
    return permission === 'granted';
};

export const sendNotification = async (title, body) => {
    if (Notification.permission !== "granted") return;

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

export const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
        console.log("This browser does not support desktop notification");
        return false;
    }

    if (Notification.permission === "granted") {
        return true;
    }

    if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        return permission === "granted";
    }

    return false;
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

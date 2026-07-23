// Last Updated: 2026-07-23 (Migrated to Firebase Functions V2)
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
admin.initializeApp();

/**
 * Firestore'da "chats/{userId}" dokümanı güncellendiğinde tetiklenir.
 *
 * - Ziyaretçi mesaj yazdı → Admin'e bildirim gönder
 * - Admin cevapladı → Ziyaretçiye bildirim gönder
 *
 * V2 avantajları: daha düşük cold start, daha iyi kaynak yönetimi,
 * bölge parametresi desteği, otomatik retry.
 */
exports.sendNotificationOnMessage = onDocumentUpdated(
    {
        document: "chats/{userId}",
        region: "europe-west1" // Firebase projenizin bulunduğu bölgeyle eşleştirin
    },
    async (event) => {
        const newData = event.data.after.data();
        const oldData = event.data.before.data();

        // Yeni mesaj eklenmemişse çık
        if (!newData.messages || newData.messages.length <= (oldData.messages?.length ?? 0)) {
            return null;
        }

        // En son mesajı al
        const newMsg = newData.messages[newData.messages.length - 1];

        // Doküman ID'si Auto-ID olduğu için gerçek visitor ID "user" alanında
        const userId = newData.user;

        console.log("Yeni mesaj tespit edildi. Gonderen:", newMsg.user, "Chat Sahibi:", userId);

        try {
            if (newMsg.user === "admin") {
                // SENARYO 1: Admin cevapladı → Ziyaretçiye bildirim gönder
                const token = newData.fcmToken;

                if (!token) {
                    console.log("Bu kullanicinin tokeni yok (fcmToken eksik):", userId);
                    return null;
                }

                await admin.messaging().send({
                    token,
                    notification: {
                        title: "Admin'den Cevap Var!",
                        body: newMsg.data
                    },
                    webpush: {
                        fcmOptions: {
                            link: "https://srhtocl.github.io/#/message"
                        }
                    }
                });

                console.log("Ziyaretciye bildirim gonderildi.");

            } else {
                // SENARYO 2: Ziyaretçi mesaj yazdı → Admin'e bildirim gönder
                const adminTokenDoc = await admin
                    .firestore()
                    .collection("admin")
                    .doc("notifications")
                    .get();

                if (!adminTokenDoc.exists) {
                    console.log("Admin tokeni bulunamadi (admin/notifications).");
                    return null;
                }

                const token = adminTokenDoc.data().token;
                if (!token) return null;

                await admin.messaging().send({
                    token,
                    notification: {
                        title: "Yeni Anonim Mesaj!",
                        body: newMsg.data
                    },
                    webpush: {
                        fcmOptions: {
                            link: `https://srhtocl.github.io/#/response/${userId}`
                        }
                    }
                });

                console.log("Admine bildirim gonderildi.");
            }
        } catch (error) {
            console.error("Bildirim gonderilemedi:", error);
        }

        return null;
    }
);

const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendNotificationOnMessage = functions.firestore
    .document("srhtocl/{userId}")
    .onUpdate(async (change, context) => {
        const newData = change.after.data();
        const oldData = change.before.data();

        // Check if a new message was actually added
        if (newData.messages.length <= oldData.messages.length) return null;

        // Get the latest message
        const newMsg = newData.messages[newData.messages.length - 1];

        // CRITICAL FIX: The document ID (context.params.userId) is an Auto-ID.
        // The real Visitor ID is stored in the 'user' field inside the document.
        const userId = newData.user;

        console.log("Yeni mesaj tespit edildi. Gonderen:", newMsg.user, "Chat Sahibi:", userId);

        // Prepare Notification Payload
        // Note: click_action/icon might need adjustment depending on device/browser handling
        let payload = {
            notification: {
                title: "Yeni Mesaj!",
                body: newMsg.data, // DÜZELTME: 'text' değil 'data' olmalı
            },
            // Data payload is often crucial for PWA click handling
            data: {
                click_action: "https://srhtocl.github.io/srhtocl/",
                url: "https://srhtocl.github.io/srhtocl/"
            }
        };

        try {
            if (newMsg.user === "admin") {
                // SCENARIO 1: Admin replied -> Notify The Visitor

                // Fetch visitor's token from 'tokens/{userId}'
                const userTokenDoc = await admin.firestore().collection("tokens").doc(userId).get();
                if (!userTokenDoc.exists) {
                    console.log("Bu kullanicinin tokeni yok:", userId);
                    return null;
                }

                const token = userTokenDoc.data().token;
                if (token) {
                    // Update payload for visitor
                    payload.notification.title = "Admin'den Cevap Var!";
                    payload.data.url = "https://srhtocl.github.io/srhtocl/#/message";

                    await admin.messaging().send({
                        token: token,
                        notification: payload.notification,
                        webpush: {
                            fcmOptions: {
                                link: payload.data.url
                            }
                        }
                    });
                    console.log("Ziyaretciye bildirim gonderildi.");
                }

            } else {
                // SCENARIO 2: Visitor wrote -> Notify Admin

                // Fetch Admin's token from 'tokens/admin_device'
                const adminTokenDoc = await admin.firestore().collection("tokens").doc("admin_device").get();
                if (!adminTokenDoc.exists) {
                    console.log("Admin tokeni bulunamadi.");
                    return null;
                }

                const token = adminTokenDoc.data().token;
                if (token) {
                    // Update payload for Admin
                    payload.notification.title = "Yeni Anonim Mesaj!";
                    // Redirect admin specifically to that user's chat
                    payload.data.url = `https://srhtocl.github.io/srhtocl/#/response/${userId}`;

                    await admin.messaging().send({
                        token: token,
                        notification: payload.notification,
                        webpush: {
                            fcmOptions: {
                                link: payload.data.url
                            }
                        }
                    });
                    console.log("Admine bildirim gonderildi.");
                }
            }
        } catch (error) {
            console.error("Bildirim gonderilemedi:", error);
        }
    });

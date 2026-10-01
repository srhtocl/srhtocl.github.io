import { useState, useEffect, useRef, useCallback } from "react";
import Cookies from "js-cookie";
import { getDocumentById, setDocument, appendMessage, subscribeToMessages } from "../services/db-methods";
import { requestForToken } from "../services/notification";
import toast from "react-hot-toast";

// --- Sabitler ---
const MAX_MESSAGE_LENGTH = 2000;
const MAX_MESSAGE_COUNT = 200;
const MIN_MESSAGE_INTERVAL_MS = 3000; // firestore.rules'taki spam sınırıyla aynı

/**
 * Kullanıcı girdisini temizler.
 * - Kontrol karakterlerini siler (null byte, vs.)
 * - Baştaki/sondaki boşlukları keser
 * - Uzunluğu sınırlar
 */
const sanitizeInput = (text) => {
    return text
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u001F\u007F]/g, '') // Kontrol karakterleri
        .trim()
        .substring(0, MAX_MESSAGE_LENGTH);
};

/**
 * Tahmin edilemeyen ziyaretçi kimliği üretir (128 bit, hex).
 * Doküman ID'si bu değerle aynı olduğundan kimliği bilen sohbeti okuyup
 * yazabilir; eskiden kullanılan zaman damgası tahmin edilebiliyordu.
 * crypto.getRandomValues, randomUUID'nin aksine HTTPS olmayan yerel ağ
 * adreslerinde (vite --host) de çalışır.
 */
const VISITOR_ID_PATTERN = /^[0-9a-f]{32}$/;

const generateVisitorId = () => {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
};

export const useChat = (targetUserId = null) => {
    const [messages, setMessages] = useState([]);
    const [metadata, setMetadata] = useState(null);
    const [user, setUser] = useState(targetUserId);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // Permission state is managed here to be accessible by UI
    const [notificationPermission, setNotificationPermission] = useState(
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );

    const initialLoadComplete = useRef(false);

    useEffect(() => {
        let unsubscribe = null;

        const initialize = async () => {
            let currentUser = user;

            // SCENARIO 1: Visitor Mode (No targetUserId passed)
            if (!targetUserId) {
                currentUser = Cookies.get('user');

                // Eski (zaman damgası tabanlı, tahmin edilebilir) kimlikler
                // yenisiyle değiştirilir; firestore.rules de artık yalnızca
                // bu biçimdeki kimliklerle sohbet oluşturulmasına izin veriyor.
                if (currentUser && !VISITOR_ID_PATTERN.test(currentUser)) {
                    currentUser = undefined;
                }

                if (!currentUser) {
                    // Generate new ID — doküman ID'si de bu değerle aynı olacak (bkz. firestore.rules)
                    currentUser = generateVisitorId();
                    Cookies.set('user', currentUser, { expires: 7 });

                    const res = await setDocument(currentUser, { user: currentUser, messages: [] });
                    if (!res.success) {
                        toast.error("Bağlantı hatası: Kullanıcı oluşturulamadı.");
                        console.error(res.error);
                    }
                } else {
                    Cookies.set('user', currentUser, { expires: 7 });

                    // Admin sohbeti silmiş olabilir: doküman yoksa "create" kuralı
                    // messages alanını şart koşuyor, o yüzden önce varlığını kontrol
                    // edip ona göre payload'ı belirliyoruz. Doküman zaten varsa
                    // messages alanına hiç dokunmuyoruz (mevcut mesajlar silinmesin).
                    const existing = await getDocumentById(currentUser);
                    const payload = existing.success
                        ? { user: currentUser }
                        : { user: currentUser, messages: [] };

                    const setRes = await setDocument(currentUser, payload);
                    if (!setRes.success) {
                        toast.error("Bağlantı hatası: Kullanıcı oluşturulamadı.");
                        console.error(setRes.error);
                    }
                }

                // Only request automatically if ALREADY granted
                if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                    requestForToken(currentUser);
                }
            }
            // SCENARIO 2: Admin Mode (targetUserId passed) is handled by just setting user state

            setUser(currentUser);

            // Subscribe
            unsubscribe = subscribeToMessages(currentUser, (data) => {
                if (data) {
                    if (data.messages) setMessages(data.messages);
                    if (data.metadata) setMetadata(data.metadata);
                }
                setLoading(false);
                initialLoadComplete.current = true;
            });
        };

        initialize();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [targetUserId]);

    const sendMessage = useCallback(async (text, asAdmin = false) => {
        const sanitized = sanitizeInput(text);

        if (!sanitized || sending || !user) return;

        // Uzunluk kontrolü
        if (sanitized.length > MAX_MESSAGE_LENGTH) {
            toast.error(`Mesaj çok uzun. Maksimum ${MAX_MESSAGE_LENGTH} karakter.`);
            return;
        }

        // Mesaj sayısı kontrolü
        if (!asAdmin && messages.length >= MAX_MESSAGE_COUNT) {
            toast.error("Bu konuşma maksimum mesaj sayısına ulaştı.");
            return;
        }

        // Spam sınırı (asıl kontrol firestore.rules'ta, bu sadece kullanıcıya erken uyarı)
        if (!asAdmin) {
            const lastOwn = [...messages].reverse().find((m) => m.user === user);
            if (lastOwn && Date.now() - lastOwn.time < MIN_MESSAGE_INTERVAL_MS) {
                toast.error("Çok hızlı gönderiyorsunuz, birkaç saniye bekleyin.");
                return;
            }
        }

        setSending(true);

        const newMessage = {
            user: asAdmin ? "admin" : user,
            time: (new Date()).getTime(),
            data: sanitized
        };

        // Optimistic UI Update
        setMessages((prev) => [...prev, newMessage]);

        // Send to DB
        const response = await appendMessage(user, newMessage, { asVisitor: !asAdmin });

        if (!response.success) {
            setMessages((prev) => prev.filter((m) => m !== newMessage));
            toast.error(
                response.error?.code === "permission-denied"
                    ? "Mesaj gönderilemedi. Birkaç saniye bekleyip tekrar deneyin."
                    : "Mesaj gönderilemedi! Lütfen internet bağlantınızı kontrol edin."
            );
            console.error("Send Error:", response.error);
        } else {
            // Success Logic
            if (!asAdmin && !targetUserId && typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
                await requestForToken(user);
                setNotificationPermission(Notification.permission);
            }
        }

        setSending(false);
    }, [messages, sending, user, targetUserId]);

    const enableNotifications = async () => {
        if (!user) return;
        if (typeof Notification === 'undefined') {
            toast.error("Tarayıcınız bildirimleri desteklemiyor.");
            return;
        }

        const token = await requestForToken(targetUserId || user);

        setNotificationPermission(Notification.permission);
        if (token) toast.success("Bildirimler açıldı!");
        return token;
    };

    return {
        user,
        messages,
        metadata,
        loading,
        sending,
        sendMessage,
        notificationPermission,
        enableNotifications
    };
};

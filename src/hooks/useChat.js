import { useState, useEffect, useRef, useCallback } from "react";
import Cookies from "js-cookie";
import { insertDocument, setDocument, subscribeToMessages } from "../services/db-methods";
import { requestForToken } from "../services/notification";
import toast from "react-hot-toast";

// --- Sabitler ---
const MAX_MESSAGE_LENGTH = 2000;
const MAX_MESSAGE_COUNT = 200;

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

                if (!currentUser) {
                    // Generate new ID
                    currentUser = (new Date()).getTime().toString(16);
                    Cookies.set('user', currentUser, { expires: 7 });

                    const res = await insertDocument({ user: currentUser, messages: [] });
                    if (!res.success) {
                        toast.error("Bağlantı hatası: Kullanıcı oluşturulamadı.");
                        console.error(res.error);
                    }
                } else {
                    Cookies.set('user', currentUser, { expires: 7 });

                    // If admin deleted the chat but visitor returns, recreate the document
                    const setRes = await setDocument(currentUser, { user: currentUser });

                    if (!setRes.success && setRes.error?.code === 'NOT_FOUND') {
                        await insertDocument({ user: currentUser, messages: [] });
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

        setSending(true);

        const newMessage = {
            user: asAdmin ? "admin" : user,
            time: (new Date()).getTime(),
            data: sanitized
        };

        const updatedMessages = [...messages, newMessage];

        // Optimistic UI Update
        setMessages(updatedMessages);

        const payload = { user: user, messages: updatedMessages };

        // Send to DB
        const response = await setDocument(user, payload);

        if (!response.success) {
            toast.error("Mesaj gönderilemedi! Lütfen internet bağlantınızı kontrol edin.");
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

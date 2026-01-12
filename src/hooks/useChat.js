import { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { insertDocument, setDocument, subscribeToMessages } from "../services/db-methods";
import { requestForToken } from "../services/notification";
import toast from "react-hot-toast";

export const useChat = (targetUserId = null) => {
    const [messages, setMessages] = useState([]);
    const [user, setUser] = useState(targetUserId);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // Permission state is managed here to be accessible by UI
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

    // Ref to track if we've loaded initial messages (useful for notification logic if we move it back here later)
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
                }

                // Only request automatically if ALREADY granted
                if (Notification.permission === 'granted') {
                    requestForToken(currentUser);
                }
            }
            // SCENARIO 2: Admin Mode (targetUserId passed) is handled by just setting user state

            setUser(currentUser);

            // Subscribe
            unsubscribe = subscribeToMessages(currentUser, (data) => {
                if (data && data.messages) {
                    setMessages(data.messages);
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

    const sendMessage = async (text, asAdmin = false) => {
        if (!text.trim() || sending || !user) return;

        setSending(true);

        const newMessage = {
            user: asAdmin ? "admin" : user,
            time: (new Date()).getTime(),
            data: text.trim()
        };

        const updatedMessages = [...messages, newMessage];

        // Optimistic UI Update
        setMessages(updatedMessages);

        // Send to DB
        const response = await setDocument(user, { user: user, messages: updatedMessages });

        if (!response.success) {
            // Revert optimistic update (Optional, currently simple override next render)
            toast.error("Mesaj gönderilemedi! Lütfen internet bağlantınızı kontrol edin.");
            console.error("Send Error:", response.error);
            // We could remove the failed message from state here if we wanted strictly consistent UI
        } else {
            // Success Logic
            if (!asAdmin && !targetUserId && Notification.permission !== 'granted') {
                await requestForToken(user);
                setNotificationPermission(Notification.permission);
            }
        }

        setSending(false);
    };

    const enableNotifications = async () => {
        if (!user) return;
        const token = await requestForToken(targetUserId || user); // Admin uses specific ID usually, but here 'user' is the chat ID. 
        // Wait, for Admin, we usually register 'admin_device'. 
        // Logic split:
        // If Visitor: user = chatID.
        // If Admin viewing a chat: user = chatID (the visitor's ID). Admin TOKEN should be registered separately (e.g. in Layout or Header).

        // Actually, enableNotifications in this hook context is mostly for the Visitor. 
        // Admin enables notifications globally elsewhere (Header/Dashboard).
        // But let's keep it robust.

        setNotificationPermission(Notification.permission);
        if (token) toast.success("Bildirimler açıldı!");
        return token;
    };

    return {
        user,
        messages,
        loading,
        sending,
        sendMessage,
        notificationPermission,
        enableNotifications
    };
};

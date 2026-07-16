import React, { useEffect, useState, useRef } from "react";
import { deleteDocument, subscribeToAllMessages } from "../services/db-methods";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { FiMessageSquare, FiTrash2, FiBellOff, FiMonitor, FiSmartphone, FiTablet, FiGlobe } from "react-icons/fi";
import { requestForToken } from "../services/notification";
import toast from "react-hot-toast";

function AllMessage() {
    const [messages, setMessages] = useState([]);
    const [notificationPermission, setNotificationPermission] = useState(
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );
    const authContext = useAuth();
    const navigate = useNavigate();

    const totalMsgRef = useRef(0);
    const firstLoad = useRef(true);

    useEffect(() => {
        if (!messages) return;

        const currentTotal = messages.reduce((acc, curr) => acc + (curr.messages ? curr.messages.length : 0), 0);

        if (firstLoad.current) {
            // Only set non-zero if messages exist, to avoid initial 0 flickering if data comes later
            if (messages.length > 0) {
                totalMsgRef.current = currentTotal;
                firstLoad.current = false;
            }
            return;
        }

        // Update ref for deletions or new messages without triggering local notification
        // Relying on Backend FCM for notifications now.
        totalMsgRef.current = currentTotal;

    }, [messages]);

    useEffect(() => {
        if (!authContext.user) {
            navigate("/");
            return;
        }

        const unsubscribe = subscribeToAllMessages((data) => {
            setMessages(data);
        });

        // Check if permission is already granted, if so, ensure token is up to date
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            requestForToken("admin_device");
        }

        return () => unsubscribe();
    }, [authContext.user, navigate]);

    const handleEnableNotifications = async () => {
        if (typeof Notification === 'undefined') {
            toast.error("Tarayıcınız bildirimleri desteklemiyor.");
            return;
        }
        // This triggers the browser prompt and saves to 'admin_device'
        const token = await requestForToken("admin_device");
        setNotificationPermission(Notification.permission);
        if (token) {
            toast.success("Bildirimler açıldı!");
        }
    };

    const handleDelete = async (e, docId) => {
        e.preventDefault(); // Prevent Link navigation
        e.stopPropagation(); // Stop event bubbling

        if (window.confirm("Bu mesajı silmek istediğinize emin misiniz?")) {
            const response = await deleteDocument(docId);

            if (response.success) {
                toast.success("Mesaj silindi.");
                // Optimistic UI update
                setMessages(prev => prev.filter(msg => msg.docId !== docId));
            } else {
                toast.error("Silme işlemi başarısız!");
                console.error(response.error);
            }
        }
    };

    return (
        <div className="relative flex flex-col w-full h-[100dvh] overflow-hidden bg-slate-50">

            {/* Background Atmosphere */}
            <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-slate-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-100 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>

            {/* Notification Permission Banner / Button */}
            {notificationPermission !== 'granted' && (
                <div className="absolute top-4 left-4 z-50">
                    <button
                        onClick={handleEnableNotifications}
                        className="flex items-center gap-2 bg-white/80 backdrop-blur-md shadow-lg border border-slate-200 px-3 py-2 rounded-full text-slate-600 text-sm hover:bg-white hover:text-blue-600 transition-all animate-pulse"
                        title="Bildirimleri Aç"
                    >
                        <FiBellOff size={16} />
                        <span>Bildirimleri Aç</span>
                    </button>
                </div>
            )}

            {/* List Container */}
            <div className="flex-1 overflow-y-auto px-4 py-6 z-10 space-y-3 pt-24 pb-24">
                {authContext.user ? (
                    messages.length > 0 ? (
                        messages.map((message) => {
                            const hasMessages = message.messages && message.messages.length > 0;
                            const lastMsg = hasMessages ? message.messages.at(-1) : null;
                            const isAdmin = hasMessages ? lastMsg.user === "admin" : false;

                            return (
                                <Link
                                    to={`/response/${message.user}`}
                                    key={message.docId || message.user}
                                    className="group block bg-white/80 backdrop-blur-md border border-slate-100/50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-98"
                                >
                                    {/* Card Header: User & Delete Action */}
                                    <div className="bg-slate-50/80 px-4 py-2 flex justify-between items-start border-b border-slate-100/50">
                                        <div className="flex flex-col truncate pr-2">
                                            <h3 className="text-slate-800 font-bold font-['Ubuntu'] text-sm truncate">
                                                {message.user}
                                            </h3>
                                            {message.metadata && (
                                                <div className="flex gap-2 text-[10px] text-slate-500 mt-1.5 font-['Ubuntu'] flex-wrap">
                                                    {message.metadata.os && (
                                                        <span className="flex items-center gap-1 bg-slate-100/80 px-2 py-0.5 rounded-full text-slate-600 border border-slate-200/50" title="İşletim Sistemi">
                                                            <FiMonitor size={10} /> {message.metadata.os}
                                                        </span>
                                                    )}
                                                    {message.metadata.browser && (
                                                        <span className="flex items-center gap-1 bg-slate-100/80 px-2 py-0.5 rounded-full text-slate-600 border border-slate-200/50" title="Tarayıcı">
                                                            <FiGlobe size={10} /> {message.metadata.browser}
                                                        </span>
                                                    )}
                                                    {message.metadata.deviceType && (
                                                        <span className="flex items-center gap-1 bg-slate-100/80 px-2 py-0.5 rounded-full text-slate-600 border border-slate-200/50" title="Cihaz Türü">
                                                            {message.metadata.deviceType === "Mobil" ? <FiSmartphone size={10} /> : message.metadata.deviceType === "Tablet" ? <FiTablet size={10} /> : <FiMonitor size={10} />} 
                                                            {message.metadata.deviceType}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={(e) => handleDelete(e, message.docId)}
                                            className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all shrink-0"
                                            title="Mesajı Sil"
                                        >
                                            <FiTrash2 size={16} />
                                        </button>
                                    </div>

                                    {/* Card Body: Message */}
                                    <div className="p-4">
                                        <p className={`text-sm truncate font-['Ubuntu'] leading-relaxed ${hasMessages ? 'text-slate-600' : 'text-slate-400 italic'}`}>
                                            {hasMessages ? (
                                                <>
                                                    {isAdmin && <span className="font-medium text-slate-800">Siz: </span>}
                                                    {lastMsg.data}
                                                </>
                                            ) : (
                                                "Henüz mesaj göndermedi (Sadece Ziyaret)"
                                            )}
                                        </p>
                                    </div>

                                    {/* Card Footer: Date */}
                                    <div className="bg-slate-50/50 px-4 py-2 border-t border-slate-100/50 flex justify-end">
                                        <span className="text-[10px] text-slate-400 font-['Ubuntu']">
                                            {hasMessages && lastMsg.time ? (
                                                new Date(lastMsg.time).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
                                            ) : message.metadata?.lastUpdate ? (
                                                new Date(message.metadata.lastUpdate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
                                            ) : null}
                                        </span>
                                    </div>
                                </Link>
                            )
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 font-['Ubuntu'] gap-4 mt-20">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                                <FiMessageSquare size={32} />
                            </div>
                            <p>Henüz mesaj yok.</p>
                        </div>
                    )
                ) : (
                    <div className="flex items-center justify-center h-full text-red-400">
                        <p>Yetkisiz Erişim</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AllMessage;

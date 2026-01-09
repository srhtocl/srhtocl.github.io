import React, { useEffect, useState, useRef } from "react";
import { deleteDocument, subscribeToAllMessages } from "../services/db-methods";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { FiMessageSquare, FiTrash2 } from "react-icons/fi";
import { requestNotificationPermission, sendNotification } from "../services/notification";

function AllMessage() {
    const [messages, setMessages] = useState([]);
    const authContext = useAuth();
    const navigate = useNavigate();

    const totalMsgRef = useRef(0);
    const firstLoad = useRef(true);

    useEffect(() => {
        requestNotificationPermission();
    }, []);

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

        if (currentTotal > totalMsgRef.current) {
            sendNotification("Anonim Mesaj!", "Yeni bir mesaj aldınız.");
            totalMsgRef.current = currentTotal;
        } else {
            // Update ref for deletions or initial setup
            totalMsgRef.current = currentTotal;
        }
    }, [messages]);

    useEffect(() => {
        if (!authContext.user) {
            navigate("/");
            return;
        }

        const unsubscribe = subscribeToAllMessages((data) => {
            setMessages(data);
        });

        return () => unsubscribe();
    }, [authContext.user, navigate]);

    const handleDelete = async (e, docId) => {
        e.preventDefault(); // Prevent Link navigation
        e.stopPropagation(); // Stop event bubbling

        if (window.confirm("Bu mesajı silmek istediğinize emin misiniz?")) {
            await deleteDocument(docId);
            // Optimistic UI update
            setMessages(prev => prev.filter(msg => msg.docId !== docId));
        }
    };

    return (
        <div className="relative flex flex-col w-full h-[100dvh] overflow-hidden bg-slate-50">

            {/* Background Atmosphere */}
            <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-slate-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-100 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>

            {/* List Container */}
            <div className="flex-1 overflow-y-auto px-4 py-6 z-10 space-y-3 pt-24 pb-24">
                {authContext.user ? (
                    messages.length > 0 ? (
                        messages.map((message) => {
                            if (!message.messages || !message.messages[0]) return null;

                            const lastMsg = message.messages.at(-1);
                            const isAdmin = lastMsg.user === "admin";

                            return (
                                <Link
                                    to={`/response/${message.user}`}
                                    key={message.docId || message.user}
                                    className="group block bg-white/80 backdrop-blur-md border border-slate-100/50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-98"
                                >
                                    {/* Card Header: User & Delete Action */}
                                    <div className="bg-slate-50/80 px-4 py-2 flex justify-between items-center border-b border-slate-100/50">
                                        <h3 className="text-slate-800 font-bold font-['Ubuntu'] text-sm truncate">
                                            {message.user}
                                        </h3>

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
                                        <p className="text-slate-600 text-sm truncate font-['Ubuntu'] leading-relaxed">
                                            {isAdmin && <span className="font-medium text-slate-800">Siz: </span>}
                                            {lastMsg.data}
                                        </p>
                                    </div>

                                    {/* Card Footer: Date */}
                                    {lastMsg.time && (
                                        <div className="bg-slate-50/50 px-4 py-2 border-t border-slate-100/50 flex justify-end">
                                            <span className="text-[10px] text-slate-400 font-['Ubuntu']">
                                                {new Date(lastMsg.time).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    )}
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

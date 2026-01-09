import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MessageField from "../components/message-field";
import { setDocument, subscribeToMessages } from "../services/db-methods";
import { FiSend } from "react-icons/fi";
import { useAuth } from "../context/auth-context";
import { requestNotificationPermission, sendNotification } from "../services/notification";

export default function Response() {
    const { userid } = useParams();
    const navigate = useNavigate();
    const authContext = useAuth();
    const lastMsgCount = useRef(0);

    // Redirect if not admin/logged in
    useEffect(() => {
        if (!authContext.user) navigate("/");
    }, [authContext.user, navigate]);

    const [draft, setDraft] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    // Subscribe to real-time messages
    useEffect(() => {
        if (!userid) return;

        const unsubscribe = subscribeToMessages(userid, (data) => {
            if (data && data.messages) {
                setMessages(data.messages);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userid]);

    // Notification Logic
    useEffect(() => {
        if (loading) {
            lastMsgCount.current = messages.length;
            return;
        }
        if (messages.length > lastMsgCount.current) {
            const newMsg = messages[messages.length - 1];
            if (newMsg && newMsg.user !== "admin") {
                sendNotification("Yeni Cevap!", newMsg.data);
            }
            lastMsgCount.current = messages.length;
        }
    }, [messages, loading]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!draft.trim()) return;

        const updatedMessages = [...messages, { user: "admin", time: (new Date()).getTime(), data: draft.trim() }];

        // Optimistic update
        setMessages(updatedMessages);
        setDraft("");

        // Send to DB
        await setDocument(userid, { user: userid, messages: updatedMessages });
    };

    return (
        <div className="fixed inset-0 flex flex-col w-full h-full overflow-hidden bg-slate-50 overscroll-none">

            {/* Background Atmosphere */}
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-slate-300 rounded-full mix-blend-multiply filter blur-[60px] opacity-20 animate-blob pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-gray-300 rounded-full mix-blend-multiply filter blur-[60px] opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto z-10 w-full max-w-2xl mx-auto px-4 custom-scrollbar pb-4 pt-4">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <MessageField messages={messages} />
                )}
            </div>

            {/* Input Area */}
            <div className="flex-none z-20 w-full max-w-2xl mx-auto p-4 bg-slate-50/50 backdrop-blur-md border-t border-white/50">
                <form
                    className="flex items-center gap-2 bg-white rounded-2xl shadow-lg border border-slate-200 p-2 transition-all focus-within:ring-2 focus-within:ring-slate-300/50"
                    onSubmit={handleSubmit}
                >
                    <input
                        className="flex-auto bg-transparent border-none outline-none px-4 py-3 text-slate-700 placeholder-slate-400 font-['Ubuntu'] min-w-0"
                        type="text"
                        value={draft}
                        placeholder="Bir cevap yaz..."
                        onChange={(e) => setDraft(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={!draft.trim()}
                        className="flex-none flex items-center justify-center w-12 h-12 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                    >
                        <FiSend size={20} className={draft.trim() ? "translate-x-0.5" : ""} />
                    </button>
                </form>
            </div>

        </div>
    );
}

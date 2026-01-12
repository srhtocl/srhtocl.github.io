import React, { useState } from "react";
import MessageField from "../components/message-field";
import { FiSend, FiBellOff } from "react-icons/fi";
import { useChat } from "../hooks/useChat";


export default function Message() {
    const [draft, setDraft] = useState("");

    // Use Custom Hook
    const {
        user,
        messages,
        loading,
        sending,
        sendMessage,
        notificationPermission,
        enableNotifications
    } = useChat();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!draft.trim() || sending) return;

        await sendMessage(draft);
        setDraft("");
    };

    return (
        <div className="fixed inset-0 flex flex-col w-full h-full overflow-hidden bg-slate-50 overscroll-none">

            {/* Background Atmosphere */}
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-slate-300 rounded-full mix-blend-multiply filter blur-[60px] opacity-20 animate-blob pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-gray-300 rounded-full mix-blend-multiply filter blur-[60px] opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>


            {/* Notification Permission Banner / Button */}
            {/* Show only if permission is NOT granted (default or denied) */}
            {notificationPermission !== 'granted' && !loading && (
                <div className="absolute top-4 right-4 z-50">
                    <button
                        onClick={enableNotifications}
                        className="flex items-center gap-2 bg-white/80 backdrop-blur-md shadow-lg border border-slate-200 px-3 py-2 rounded-full text-slate-600 text-sm hover:bg-white hover:text-blue-600 transition-all animate-pulse"
                        title="Bildirimleri Aç"
                    >
                        <FiBellOff size={16} />
                        <span>Bildirimleri Aç</span>
                    </button>
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto z-10 w-full max-w-2xl mx-auto px-4 custom-scrollbar pb-4 pt-16">
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
                        placeholder="Bir mesaj bırak..."
                        onChange={(e) => setDraft(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={!draft.trim() || sending}
                        className="flex-none flex items-center justify-center w-12 h-12 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                    >
                        {sending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiSend size={20} className={draft.trim() ? "translate-x-0.5" : ""} />}
                    </button>
                </form>
            </div>

        </div>
    );
}
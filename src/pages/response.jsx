import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MessageField from "../components/message-field";
import { FiSend, FiInfo, FiX, FiMonitor, FiSmartphone, FiTablet, FiGlobe, FiCpu, FiHardDrive, FiBattery, FiBatteryCharging, FiMapPin, FiWifi, FiClock, FiLink, FiServer } from "react-icons/fi";
import { useAuth } from "../context/auth-context";
import { requestForToken } from "../services/notification";
import { useChat } from "../hooks/useChat";

export default function Response() {
    const { userid } = useParams();
    const navigate = useNavigate();
    const authContext = useAuth();

    // Redirect if not admin
    useEffect(() => {
        if (!authContext.user) navigate("/");
        else requestForToken("admin_device");
    }, [authContext.user, navigate]);


    const {
        messages,
        metadata,
        loading,
        sending,
        sendMessage
    } = useChat(userid);

    const [draft, setDraft] = useState("");
    const [showInfo, setShowInfo] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Send as Admin
        await sendMessage(draft, true);
        setDraft("");
    };

    return (
        <div className="fixed inset-0 flex flex-col w-full h-full overflow-hidden bg-slate-50 overscroll-none">

            {/* Background Atmosphere */}
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-slate-300 rounded-full mix-blend-multiply filter blur-[60px] opacity-20 animate-blob pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-gray-300 rounded-full mix-blend-multiply filter blur-[60px] opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto z-10 w-full max-w-2xl mx-auto px-4 custom-scrollbar pb-4 pt-16 relative">
                
                {/* Clean Top Bar */}
                <div className="absolute top-4 left-4 right-4 bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm rounded-xl px-4 py-2 flex justify-between items-center z-20">
                    <span className="text-sm font-bold text-slate-800 font-['Ubuntu'] truncate flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        {userid}
                    </span>
                    {metadata && (
                        <button 
                            onClick={() => setShowInfo(true)}
                            className="p-1.5 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 hover:text-blue-600 transition-colors"
                            title="Kullanıcı Detayları"
                        >
                            <FiInfo size={16} />
                        </button>
                    )}
                </div>

                {/* Modal for Details */}
                {showInfo && metadata && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-200">
                            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="font-bold text-slate-800 font-['Ubuntu'] flex items-center gap-2">
                                    <FiInfo className="text-blue-500" />
                                    Kullanıcı Profili
                                </h3>
                                <button onClick={() => setShowInfo(false)} className="p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-full transition-colors">
                                    <FiX size={18} />
                                </button>
                            </div>
                            
                            <div className="p-5 overflow-y-auto max-h-[70vh] custom-scrollbar space-y-6">
                                {/* Last Update */}
                                {metadata.lastUpdate && (
                                    <p className="text-[11px] text-slate-400 text-center font-['Ubuntu']">
                                        Son Güncelleme: {new Date(metadata.lastUpdate).toLocaleString('tr-TR')}
                                    </p>
                                )}

                                {/* Grid Categories */}
                                <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 font-['Ubuntu']">
                                    
                                    {/* Cihaz & Tarayıcı */}
                                    <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <span className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1"><FiMonitor/> Cihaz & Tarayıcı</span>
                                        {metadata.os && <span className="flex items-center gap-2 text-xs"><FiMonitor size={14} className="text-slate-400"/> {metadata.os}</span>}
                                        {metadata.browser && <span className="flex items-center gap-2 text-xs"><FiGlobe size={14} className="text-slate-400"/> {metadata.browser}</span>}
                                        {metadata.deviceType && <span className="flex items-center gap-2 text-xs">
                                            {metadata.deviceType === "Mobil" ? <FiSmartphone size={14} className="text-slate-400"/> : metadata.deviceType === "Tablet" ? <FiTablet size={14} className="text-slate-400"/> : <FiMonitor size={14} className="text-slate-400"/>} 
                                            {metadata.deviceType}
                                        </span>}
                                    </div>

                                    {/* Donanım */}
                                    <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <span className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1"><FiCpu/> Donanım</span>
                                        {metadata.screen && <span className="flex items-center gap-2 text-xs"><FiMonitor size={14} className="text-slate-400"/> {metadata.screen}</span>}
                                        {metadata.cpuCores && metadata.cpuCores !== "Bilinmiyor" && <span className="flex items-center gap-2 text-xs"><FiCpu size={14} className="text-slate-400"/> {metadata.cpuCores} Çekirdek</span>}
                                        {metadata.memory && metadata.memory !== "Bilinmiyor" && <span className="flex items-center gap-2 text-xs"><FiHardDrive size={14} className="text-slate-400"/> ~{metadata.memory} GB</span>}
                                        {metadata.battery && metadata.battery !== "Bilinmiyor" && <span className="flex items-center gap-2 text-xs">
                                            {metadata.battery.includes("Şarjda") ? <FiBatteryCharging size={14} className="text-green-500"/> : <FiBattery size={14} className="text-slate-400"/>}
                                            {metadata.battery}
                                        </span>}
                                    </div>

                                    {/* Ağ & Konum */}
                                    <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 col-span-2">
                                        <span className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1"><FiMapPin/> Ağ & Konum</span>
                                        <div className="flex flex-col gap-2">
                                            {metadata.location && metadata.location !== "Bilinmiyor" && <span className="flex items-start gap-2 text-xs"><FiMapPin size={14} className="text-slate-400 shrink-0 mt-0.5"/> <span>{metadata.location}</span></span>}
                                            {metadata.isp && metadata.isp !== "Bilinmiyor" && <span className="flex items-start gap-2 text-xs"><FiServer size={14} className="text-slate-400 shrink-0 mt-0.5"/> <span>{metadata.isp}</span></span>}
                                            {metadata.network && metadata.network !== "Bilinmiyor" && <span className="flex items-center gap-2 text-xs"><FiWifi size={14} className="text-slate-400"/> {metadata.network}</span>}
                                        </div>
                                    </div>

                                    {/* Oturum */}
                                    <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 col-span-2">
                                        <span className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1"><FiClock/> Oturum</span>
                                        <div className="flex flex-col gap-2">
                                            {metadata.timeZone && metadata.timeZone !== "Bilinmiyor" && <span className="flex items-center gap-2 text-xs"><FiClock size={14} className="text-slate-400 shrink-0"/> <span>{metadata.timeZone}</span></span>}
                                            {metadata.language && <span className="flex items-center gap-2 text-xs"><FiGlobe size={14} className="text-slate-400 shrink-0"/> {metadata.language.toUpperCase()}</span>}
                                            {metadata.referrer && <span className="flex items-start gap-2 text-xs"><FiLink size={14} className="text-slate-400 shrink-0 mt-0.5"/> <span className="break-all">{metadata.referrer}</span></span>}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="pt-2">
                        <MessageField messages={messages} isAdmin={true} />
                    </div>
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

/**
 * @file home.jsx
 * @description Kişisel ana sayfa. Profil resmi, biyografi ve mesaj sayfasına yönlendirme içerir.
 * Profil resmi için Lightbox (Tam ekran) ve mesaj için FAB (Floating Action Button) özellikleri vardır.
 * 
 * @dependencies
 * - src/services/firebase (Firestore profil verisi)
 * - react-icons/fi (İkonlar)
 * 
 * @date 2026-01-18
 * @author [AI Assistant]
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiMessageSquare, FiX } from "react-icons/fi";
import { useProfileContext } from "../context/profile-context";
import { useAuth } from "../context/auth-context";

export default function Home() {
    const { profile } = useProfileContext();
    const { user } = useAuth();
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    return (
        <section className="relative flex flex-col w-full h-full justify-center items-center overflow-hidden bg-gradient-to-br from-slate-50 via-gray-100 to-slate-200">

            {/* Background Atmosphere */}
            <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-slate-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob"></div>
            <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-gray-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-[20%] left-[20%] w-[70vw] h-[70vw] bg-slate-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-30 animate-blob animation-delay-4000"></div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center max-w-4xl">

                {/* Profile Section - Clickable for Lightbox */}
                <div className="mb-10 relative group cursor-pointer" onClick={() => setIsLightboxOpen(true)}>
                    {/* Glowing effect */}
                    <div className="absolute -inset-4 bg-white/50 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition duration-700"></div>

                    <div className="relative w-40 h-40 md:w-56 md:h-56 p-1 border-4 border-white/50 rounded-full shadow-2xl transform transition-transform duration-500 group-hover:scale-105">
                        <img
                            className="w-full h-full rounded-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
                            src={profile.photoURL || null}
                            alt={profile.displayName || undefined}
                        />
                    </div>
                </div>

                {/* Typography Section */}
                {profile.bio && (
                    <div className="space-y-6">
                        <p className="text-2xl md:text-3xl text-slate-700 font-['Marck_Script'] tracking-wide max-w-2xl mx-auto leading-relaxed drop-shadow-sm select-none">
                            {profile.bio}
                        </p>
                    </div>
                )}

            </div>

            {/* FAB - Sadece giriş yapılmamışsa göster */}
            {!user && (
                <div className="fixed bottom-0 left-0 w-full z-30 p-4 pointer-events-none">
                    <div className="w-full max-w-2xl mx-auto flex justify-end pointer-events-none">
                        <div className="p-2 pointer-events-auto">
                            <Link
                                to="/message"
                                className="flex items-center justify-center w-12 h-12 bg-white text-slate-800 border border-slate-200 rounded-xl shadow-md hover:bg-slate-50 transition-all active:scale-95"
                                aria-label="Mesaj Gönder"
                            >
                                <FiMessageSquare size={20} />
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox Modal */}
            {/* Lightbox Modal - Full Immersive */}
            {isLightboxOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-500"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    <button
                        className="absolute top-4 right-4 p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-md backdrop-blur-md transition-all z-50 hover:rotate-90 duration-300"
                        onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(false); }}
                    >
                        <FiX size={20} />
                    </button>

                    <img
                        src={profile.photoURL || null}
                        alt="Profile Full"
                        className="w-screen h-screen object-contain animate-in zoom-in-50 slide-in-from-bottom-10 duration-500 ease-out select-none"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

        </section>
    )
}